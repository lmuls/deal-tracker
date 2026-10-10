package com.lmuls.dealtracker.detector;

import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DealType;
import com.lmuls.dealtracker.enums.DetectionLayer;
import com.lmuls.dealtracker.model.DealDetection;
import com.lmuls.dealtracker.service.KeywordsLoader;
import lombok.RequiredArgsConstructor;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Detects whether a landing page is currently running a site-level campaign
 * (Black Friday, a seasonal sale, "up to 50% off", ...).
 * <p>
 * Only prominent regions are scanned — page title and meta descriptions,
 * the header, hero/banner/announcement bars and h1/h2 headings — and
 * navigation, footers, product cards and cookie banners are stripped out
 * first. This keeps per-product discounts and menu links from showing up
 * as campaigns.
 * <p>
 * At most one detection is produced per page, with a canonical title (the
 * event name, or the discount phrase) so it stays stable across snapshots.
 */
@Component
@RequiredArgsConstructor
public class CampaignDetector {

    private static final String SALE_EVENT = "sale_event";
    private static final String PERCENTAGE = "percentage_discount";

    /** Class/id tokens marking a promotional region worth scanning. */
    private static final Set<String> PROMINENT_TOKENS = Set.of(
            "announcement", "topbar", "top-bar", "promo", "campaign", "hero", "banner");

    /** Class/id tokens marking regions that are never campaign signals. */
    private static final Set<String> NOISE_TOKENS = Set.of(
            "product", "card", "tile", "price", "cookie", "consent", "gdpr");

    private static final Set<String> NOISE_TAGS = Set.of("nav", "footer", "script", "style", "noscript");

    private static final Set<String> STRONG_TAGS = Set.of("h1", "header");

    private static final Pattern PERCENT_VALUE = Pattern.compile("(\\d{1,2})\\s?%");

    private static final int MAX_DESCRIPTION = 200;

    private final KeywordsLoader keywordsLoader;

    private record Segment(String text, boolean strong) {}

    private record Hit(String text, Segment segment, int percent) {}

    public Optional<DealDetection> detect(Document doc, Locale locale) {
        Map<String, List<Pattern>> categories = keywordsLoader.getForLocale(locale.getLanguage());
        List<Pattern> eventPatterns = categories.getOrDefault(SALE_EVENT, List.of());
        List<Pattern> percentPatterns = categories.getOrDefault(PERCENTAGE, List.of());

        Hit event = null;
        Hit discount = null;
        for (Segment segment : prominentSegments(doc)) {
            if (event == null) event = firstHit(eventPatterns, segment);
            Hit d = bestPercentHit(percentPatterns, segment);
            if (d != null && (discount == null || d.percent() > discount.percent())) discount = d;
        }
        if (event == null && discount == null) return Optional.empty();

        Hit primary = event != null ? event : discount;
        String title = event != null ? titleCase(event.text()) : capitalise(discount.text());
        DealType type = event != null ? DealType.SALE_EVENT : DealType.PERCENTAGE_OFF;
        String discountValue = discount != null && discount.percent() > 0 ? discount.percent() + "%" : null;
        Confidence confidence = (event != null && discount != null) || primary.segment().strong()
                ? Confidence.HIGH : Confidence.MEDIUM;

        return Optional.of(new DealDetection(
                type, title, truncate(primary.segment().text()), discountValue,
                confidence, DetectionLayer.DOM_PATTERN, null));
    }

    // ── Region selection ─────────────────────────────────────────────────────

    private static List<Segment> prominentSegments(Document doc) {
        List<Segment> segments = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        Element title = doc.selectFirst("title");
        if (title != null) addSegment(segments, seen, title.text(), true);
        addSegment(segments, seen, meta(doc, "meta[property=og:title]"), true);
        addSegment(segments, seen, meta(doc, "meta[name=description]"), false);
        addSegment(segments, seen, meta(doc, "meta[property=og:description]"), false);

        if (doc.body() == null) return segments;
        for (Element el : doc.body().getAllElements()) {
            if (!isProminent(el) || isInsideNoise(el)) continue;
            Element clean = el.clone();
            clean.getAllElements().stream()
                    .filter(c -> c != clean && isNoise(c))
                    .toList()
                    .forEach(Element::remove);
            addSegment(segments, seen, clean.text(), STRONG_TAGS.contains(el.normalName()));
        }
        return segments;
    }

    private static void addSegment(List<Segment> segments, Set<String> seen, String text, boolean strong) {
        if (text == null) return;
        String normalised = text.replaceAll("\\s+", " ").trim();
        if (normalised.isEmpty() || !seen.add(normalised)) return;
        segments.add(new Segment(normalised, strong));
    }

    private static String meta(Document doc, String selector) {
        Element el = doc.selectFirst(selector);
        return el != null ? el.attr("content") : null;
    }

    private static boolean isProminent(Element el) {
        String tag = el.normalName();
        if (tag.equals("body") || tag.equals("main")) return false;
        return tag.equals("header") || tag.equals("h1") || tag.equals("h2")
                || "banner".equalsIgnoreCase(el.attr("role"))
                || tokens(el).stream().anyMatch(PROMINENT_TOKENS::contains);
    }

    private static boolean isInsideNoise(Element el) {
        for (Element e = el; e != null; e = e.parent()) {
            if (isNoise(e)) return true;
        }
        return false;
    }

    private static boolean isNoise(Element el) {
        return NOISE_TAGS.contains(el.normalName())
                || el.attr("itemtype").toLowerCase(Locale.ROOT).contains("product")
                || tokens(el).stream().anyMatch(NOISE_TOKENS::contains);
    }

    /** Whole class names and id, plus their dash/underscore-separated parts. */
    private static Set<String> tokens(Element el) {
        String raw = (el.attr("class") + " " + el.attr("id")).toLowerCase(Locale.ROOT).trim();
        if (raw.isEmpty()) return Set.of();
        Set<String> tokens = new LinkedHashSet<>();
        for (String name : raw.split("\\s+")) {
            tokens.add(name);
            tokens.addAll(Arrays.asList(name.split("[-_]")));
        }
        return tokens;
    }

    // ── Matching ─────────────────────────────────────────────────────────────

    private static Hit firstHit(List<Pattern> patterns, Segment segment) {
        for (Pattern p : patterns) {
            Matcher m = p.matcher(segment.text());
            if (m.find()) return new Hit(m.group(), segment, 0);
        }
        return null;
    }

    private static Hit bestPercentHit(List<Pattern> patterns, Segment segment) {
        Hit best = null;
        for (Pattern p : patterns) {
            Matcher m = p.matcher(segment.text());
            while (m.find()) {
                Matcher v = PERCENT_VALUE.matcher(m.group());
                int percent = v.find() ? Integer.parseInt(v.group(1)) : 0;
                if (best == null || percent > best.percent()) best = new Hit(m.group(), segment, percent);
            }
        }
        return best;
    }

    // ── Formatting ───────────────────────────────────────────────────────────

    private static String titleCase(String text) {
        return Arrays.stream(normalise(text).split(" "))
                .map(CampaignDetector::capitalise)
                .collect(Collectors.joining(" "));
    }

    private static String capitalise(String text) {
        String s = normalise(text);
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private static String normalise(String text) {
        return text.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    private static String truncate(String text) {
        return text.length() > MAX_DESCRIPTION ? text.substring(0, MAX_DESCRIPTION) : text;
    }
}
