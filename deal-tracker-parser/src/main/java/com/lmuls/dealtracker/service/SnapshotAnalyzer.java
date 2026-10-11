package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.detector.CampaignDetector;
import com.lmuls.dealtracker.model.DealDetection;
import lombok.RequiredArgsConstructor;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Locale;
import java.util.Optional;

/**
 * The side-effect-free part of parsing: locale detection, campaign detection
 * and expiry extraction for one page. Shared by {@link ParseService} and the
 * snapshot replay so both see exactly the same detections.
 */
@Service
@RequiredArgsConstructor
public class SnapshotAnalyzer {

    private final CampaignDetector campaignDetector;
    private final ExpiryExtractor expiryExtractor;

    public Optional<DealDetection> analyze(Document doc, Instant fetchedAt) {
        Locale locale = detectLocale(doc);
        return campaignDetector.detect(doc, locale)
                .map(d -> d.expiresAt() != null ? d
                        : expiryExtractor.extract(doc, fetchedAt)
                                .map(d::withExpiresAt).orElse(d));
    }

    static Locale detectLocale(Document doc) {
        String lang = doc.selectFirst("html") != null
                ? doc.selectFirst("html").attr("lang")
                : "";
        if (lang == null || lang.isBlank()) return Locale.ENGLISH;
        // Use the primary language subtag only (e.g. "no" from "no-nb")
        String primary = lang.split("[-_]")[0].toLowerCase(Locale.ROOT);
        return Locale.forLanguageTag(primary);
    }
}
