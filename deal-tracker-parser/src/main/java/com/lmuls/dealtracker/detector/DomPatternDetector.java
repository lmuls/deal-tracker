package com.lmuls.dealtracker.detector;

import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DealType;
import com.lmuls.dealtracker.enums.DetectionLayer;
import com.lmuls.dealtracker.model.DealDetection;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Layer 2 — scans the DOM for elements whose CSS class, ID, or data-*
 * attributes suggest promotional content. Extracts visible text from matches.
 * Base confidence MEDIUM; boosted to HIGH for priority locations (header/nav).
 */
@Component
public class DomPatternDetector implements DealDetector {

    private static final Set<String> TARGET_PATTERNS = Set.of(
            "sale", "promo", "promotion", "discount", "offer", "deal", "banner",
            "coupon", "campaign", "clearance", "special-offer", "hero-offer",
            "site-wide", "sitewide"
    );

    private static final Set<String> PRIORITY_PARENTS = Set.of("header", "nav", "body");

    @Override
    public List<DealDetection> detect(Document htmlDoc, Locale locale) {
        List<DealDetection> results = new ArrayList<>();

        for (Element el : htmlDoc.getAllElements()) {
            if (!hasTargetAttribute(el)) continue;

            String text = el.ownText().isBlank() ? el.text() : el.ownText();
            text = text.trim();
            if (text.isBlank() || text.length() < 5) continue;

            String title = text.length() > 120 ? text.substring(0, 120) : text;
            Confidence confidence = isPriority(el) ? Confidence.HIGH : Confidence.MEDIUM;

            results.add(new DealDetection(
                    DealType.OTHER, title, text, null,
                    confidence, DetectionLayer.DOM_PATTERN, null));
        }
        return results;
    }

    private static boolean hasTargetAttribute(Element el) {
        String cls = el.attr("class").toLowerCase(Locale.ROOT);
        String id = el.attr("id").toLowerCase(Locale.ROOT);

        boolean matched = TARGET_PATTERNS.stream().anyMatch(p -> cls.contains(p) || id.contains(p));
        if (matched) return true;

        // Also check data-* attributes
        return el.attributes().asList().stream()
                .filter(a -> a.getKey().startsWith("data-"))
                .anyMatch(a -> TARGET_PATTERNS.stream()
                        .anyMatch(p -> a.getValue().toLowerCase(Locale.ROOT).contains(p)));
    }

    private static boolean isPriority(Element el) {
        Element parent = el.parent();
        return parent != null
                && PRIORITY_PARENTS.contains(parent.tagName().toLowerCase(Locale.ROOT));
    }
}
