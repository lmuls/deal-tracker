package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.config.ParserProperties;
import com.lmuls.dealtracker.detector.DealDetector;
import com.lmuls.dealtracker.entity.Deal;
import com.lmuls.dealtracker.entity.Snapshot;
import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.SnapshotStatus;
import com.lmuls.dealtracker.model.DealDetection;
import com.lmuls.dealtracker.repository.DealRepository;
import com.lmuls.dealtracker.repository.SnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Orchestrates the 3-layer detection pipeline for a single snapshot.
 * <p>
 * Design notes:
 * <ul>
 *   <li>File I/O happens outside the DB transaction to avoid holding a
 *       connection while reading HTML from disk.</li>
 *   <li>All DB writes (deals + snapshot status update) are wrapped in a
 *       single transaction via {@link #persistResults}.</li>
 * </ul>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ParseService {

    private final ParserProperties properties;
    private final List<DealDetector> detectors;
    private final ExpiryExtractor expiryExtractor;
    private final DealRepository dealRepository;
    private final SnapshotRepository snapshotRepository;

    /**
     * Parses the given snapshot: reads HTML from disk, runs all detection
     * layers, merges results, and persists deals + updated snapshot status.
     */
    public void parse(Snapshot snapshot) {
        Document doc;
        try {
            doc = loadHtml(snapshot.getFilePath());
        } catch (IOException e) {
            log.error("Cannot read snapshot file for snapshot {}: {}", snapshot.getId(), e.getMessage());
            markFailed(snapshot);
            return;
        }

        try {
            Locale locale = detectLocale(doc);
            log.debug("Parsing snapshot {} with locale {}", snapshot.getId(), locale);

            List<DealDetection> detections = new ArrayList<>();
            for (DealDetector detector : detectors) {
                detections.addAll(detector.detect(doc, locale));
            }

            // Fill in expiry dates for detections that don't already have one
            detections = detections.stream()
                    .map(d -> d.expiresAt() != null ? d
                            : expiryExtractor.extract(doc, snapshot.getFetchedAt())
                                    .map(d::withExpiresAt).orElse(d))
                    .toList();

            detections = deduplicate(detections);
            log.info("Snapshot {} — {} deal(s) detected", snapshot.getId(), detections.size());

            persistResults(snapshot, detections);
        } catch (Exception e) {
            log.error("Parse failed for snapshot {}", snapshot.getId(), e);
            markFailed(snapshot);
        }
    }

    private Document loadHtml(String relativePath) throws IOException {
        Path absolute = Path.of(properties.getSnapshotDir(), relativePath);
        String html = Files.readString(absolute, StandardCharsets.UTF_8);
        return Jsoup.parse(html);
    }

    private static Locale detectLocale(Document doc) {
        String lang = doc.selectFirst("html") != null
                ? doc.selectFirst("html").attr("lang")
                : "";
        if (lang == null || lang.isBlank()) return Locale.ENGLISH;
        // Use the primary language subtag only (e.g. "no" from "no-nb")
        String primary = lang.split("[-_]")[0].toLowerCase(Locale.ROOT);
        return Locale.forLanguageTag(primary);
    }

    /**
     * Deduplicates detections by normalised title.
     * When two detections share the same title, the one with higher confidence
     * (HIGH > MEDIUM > LOW) is kept.
     */
    private static List<DealDetection> deduplicate(List<DealDetection> detections) {
        var best = new java.util.LinkedHashMap<String, DealDetection>();
        for (DealDetection d : detections) {
            String key = normaliseTitle(d.title());
            DealDetection existing = best.get(key);
            if (existing == null || confidenceOrdinal(d.confidence()) < confidenceOrdinal(existing.confidence())) {
                best.put(key, d);
            }
        }
        return List.copyOf(best.values());
    }

    private static String normaliseTitle(String title) {
        if (title == null) return "";
        return title.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    /** Lower ordinal = higher priority (HIGH=0, MEDIUM=1, LOW=2). */
    private static int confidenceOrdinal(Confidence c) {
        return switch (c) {
            case HIGH -> 0;
            case MEDIUM -> 1;
            case LOW -> 2;
        };
    }

    @Transactional
    protected void persistResults(Snapshot snapshot, List<DealDetection> detections) {
        for (DealDetection d : detections) {
            dealRepository.save(Deal.builder()
                    .snapshot(snapshot)
                    .trackedSite(snapshot.getTrackedSite())
                    .type(d.type())
                    .title(d.title())
                    .description(d.description())
                    .discountValue(d.discountValue())
                    .confidence(d.confidence())
                    .detectionLayer(d.detectionLayer())
                    .expiresAt(d.expiresAt())
                    .build());
        }
        snapshot.setStatus(SnapshotStatus.PARSED);
        snapshotRepository.save(snapshot);
    }

    @Transactional
    protected void markFailed(Snapshot snapshot) {
        snapshot.setStatus(SnapshotStatus.PARSE_FAILED);
        snapshotRepository.save(snapshot);
    }
}
