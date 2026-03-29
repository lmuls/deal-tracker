package com.lmuls.dealtracker.detector;

import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DealType;
import com.lmuls.dealtracker.enums.DetectionLayer;
import com.lmuls.dealtracker.model.DealDetection;
import com.lmuls.dealtracker.model.KeywordsConfig.CategoryKeywords;
import com.lmuls.dealtracker.service.KeywordsLoader;
import lombok.RequiredArgsConstructor;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.TextNode;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Layer 3 — scans all visible text for regex patterns and keywords loaded
 * from deal-keywords.yml. Base confidence LOW; boosted to MEDIUM when the
 * same page also has urgency markers, or HIGH when multiple distinct
 * pattern categories match.
 */
@Component
@RequiredArgsConstructor
public class TextPatternDetector implements DealDetector {

    private static final String URGENCY_CATEGORY = "urgency";

    private final KeywordsLoader keywordsLoader;

    @Override
    public List<DealDetection> detect(Document htmlDoc, Locale locale) {
        String langTag = locale.toLanguageTag().toLowerCase(Locale.ROOT);
        // Use just the primary language subtag for lookup
        String lang = langTag.contains("-") ? langTag.substring(0, langTag.indexOf('-')) : langTag;

        Map<String, CategoryKeywords> categories = keywordsLoader.getForLocale(lang);
        if (categories.isEmpty()) return List.of();

        String visibleText = extractVisibleText(htmlDoc);
        String lowerText = visibleText.toLowerCase(Locale.ROOT);

        boolean urgencyPresent = hasUrgency(categories.get(URGENCY_CATEGORY), lowerText);

        List<DealDetection> results = new ArrayList<>();
        int distinctCategoryMatches = 0;

        for (Map.Entry<String, CategoryKeywords> entry : categories.entrySet()) {
            if (URGENCY_CATEGORY.equals(entry.getKey())) continue;

            CategoryKeywords cat = entry.getValue();
            List<String> matches = findMatches(cat, lowerText);
            if (matches.isEmpty()) continue;

            distinctCategoryMatches++;
            DealType type = categoryToDealType(entry.getKey(), matches);
            String title = matches.get(0);
            if (title.length() > 120) title = title.substring(0, 120);

            results.add(new DealDetection(
                    type, title, null, extractDiscountValue(matches),
                    Confidence.LOW, DetectionLayer.TEXT_PATTERN, null));
        }

        // Confidence boosting
        if (distinctCategoryMatches > 1 || urgencyPresent) {
            Confidence boosted = (distinctCategoryMatches > 1 && urgencyPresent)
                    ? Confidence.HIGH : Confidence.MEDIUM;
            results = results.stream()
                    .map(d -> d.withConfidence(boosted))
                    .toList();
        }

        return results;
    }

    private List<String> findMatches(CategoryKeywords cat, String lowerText) {
        List<String> matches = new ArrayList<>();

        for (String kw : cat.getKeywords()) {
            if (lowerText.contains(kw.toLowerCase(Locale.ROOT))) {
                matches.add(kw);
            }
        }

        for (String rawPattern : cat.getPatterns()) {
            try {
                Pattern p = Pattern.compile(rawPattern, Pattern.CASE_INSENSITIVE);
                var m = p.matcher(lowerText);
                if (m.find()) matches.add(m.group());
            } catch (Exception ignored) {
                // skip invalid regex patterns
            }
        }

        return matches;
    }

    private boolean hasUrgency(CategoryKeywords urgency, String lowerText) {
        if (urgency == null) return false;
        return urgency.getKeywords().stream()
                .anyMatch(kw -> lowerText.contains(kw.toLowerCase(Locale.ROOT)));
    }

    private static String extractVisibleText(Document doc) {
        StringBuilder sb = new StringBuilder();
        for (Element el : doc.getAllElements()) {
            for (TextNode tn : el.textNodes()) {
                String t = tn.text().trim();
                if (!t.isBlank()) sb.append(t).append(' ');
            }
        }
        return sb.toString();
    }

    private static DealType categoryToDealType(String category, List<String> matches) {
        return switch (category) {
            case "percentage_discount" -> DealType.PERCENTAGE_OFF;
            case "coupon" -> DealType.COUPON;
            case "sale_event" -> DealType.SALE_EVENT;
            case "promotional" -> {
                String joined = String.join(" ", matches).toLowerCase(Locale.ROOT);
                if (joined.contains("shipping") || joined.contains("frakt") || joined.contains("levering")) {
                    yield DealType.FREE_SHIPPING;
                }
                if (joined.contains("bogo") || joined.contains("buy one") || joined.contains("kjøp 2")) {
                    yield DealType.BOGO;
                }
                yield DealType.OTHER;
            }
            default -> DealType.OTHER;
        };
    }

    private static String extractDiscountValue(List<String> matches) {
        // If a match looks like a percentage or amount, surface it as the discount value
        for (String m : matches) {
            if (m.matches(".*\\d+%.*") || m.matches(".*[\\$£€]\\s*\\d+.*")) {
                return m;
            }
        }
        return null;
    }
}
