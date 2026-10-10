package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.config.ParserProperties;
import com.lmuls.dealtracker.detector.CampaignDetector;
import com.lmuls.dealtracker.entity.Deal;
import com.lmuls.dealtracker.entity.Snapshot;
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
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

/**
 * Runs campaign detection for a single snapshot and keeps the site's active
 * deals in sync: a new campaign inserts a row, an ongoing one is touched, a
 * changed one is superseded, and one that is no longer on the page is ended.
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
    private final CampaignDetector campaignDetector;
    private final ExpiryExtractor expiryExtractor;
    private final DealRepository dealRepository;
    private final SnapshotRepository snapshotRepository;

    /**
     * Parses the given snapshot: reads HTML from disk, detects the current
     * campaign (if any), and persists deals + updated snapshot status.
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

            Optional<DealDetection> detection = campaignDetector.detect(doc, locale)
                    .map(d -> d.expiresAt() != null ? d
                            : expiryExtractor.extract(doc, snapshot.getFetchedAt())
                                    .map(d::withExpiresAt).orElse(d));
            log.info("Snapshot {} — {}", snapshot.getId(),
                    detection.map(d -> "campaign detected: " + d.title()).orElse("no campaign"));

            persistResults(snapshot, detection);
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

    private static String normaliseTitle(String title) {
        if (title == null) return "";
        return title.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    @Transactional
    protected void persistResults(Snapshot snapshot, Optional<DealDetection> detection) {
        List<Deal> activeSiteDeals =
                dealRepository.findByTrackedSiteIdAndActiveTrue(snapshot.getTrackedSite().getId());

        Deal current = detection.map(d -> upsertDeal(snapshot, d, activeSiteDeals)).orElse(null);

        // Anything else still active is no longer on the page: the campaign has ended.
        for (Deal deal : activeSiteDeals) {
            if (deal != current && Boolean.TRUE.equals(deal.getActive())) {
                deal.setActive(false);
                dealRepository.save(deal);
            }
        }
        snapshot.setStatus(SnapshotStatus.PARSED);
        snapshotRepository.save(snapshot);
    }

    /**
     * Matches the detection against the site's active deals by normalised title.
     * No match creates a new deal; an unchanged match bumps its observation count; a
     * changed match supersedes the old deal with a new versioned row referencing it.
     * Returns the deal that represents the detection after this snapshot.
     */
    private Deal upsertDeal(Snapshot snapshot, DealDetection d, List<Deal> activeSiteDeals) {
        Deal match = findActiveMatch(activeSiteDeals, d.title());

        if (match == null) return insertNewDeal(snapshot, d, null);
        if (contentEquals(d, match)) {
            touchExistingDeal(snapshot, match);
            return match;
        }
        match.setActive(false);
        dealRepository.save(match);
        return insertNewDeal(snapshot, d, match);
    }

    private static Deal findActiveMatch(List<Deal> candidates, String title) {
        String key = normaliseTitle(title);
        return candidates.stream()
                .filter(c -> normaliseTitle(c.getTitle()).equals(key))
                .max(Comparator.comparing(Deal::getLastSeenAt))
                .orElse(null);
    }

    private static boolean contentEquals(DealDetection d, Deal existing) {
        // Description is display-only; rewording the banner is not a new campaign.
        return Objects.equals(d.type(), existing.getType())
                && Objects.equals(d.discountValue(), existing.getDiscountValue());
    }

    private Deal insertNewDeal(Snapshot snapshot, DealDetection d, Deal previousDeal) {
        Instant now = Instant.now();
        return dealRepository.save(Deal.builder()
                .snapshot(snapshot)
                .trackedSite(snapshot.getTrackedSite())
                .type(d.type())
                .title(d.title())
                .description(d.description())
                .discountValue(d.discountValue())
                .confidence(d.confidence())
                .detectionLayer(d.detectionLayer())
                .expiresAt(d.expiresAt())
                .active(true)
                .firstSeenAt(now)
                .lastSeenAt(now)
                .nObservations(1)
                .previousDeal(previousDeal)
                .build());
    }

    private void touchExistingDeal(Snapshot snapshot, Deal existing) {
        existing.setLastSeenAt(Instant.now());
        existing.setNObservations(existing.getNObservations() + 1);
        existing.setSnapshot(snapshot);
        dealRepository.save(existing);
    }

    @Transactional
    protected void markFailed(Snapshot snapshot) {
        snapshot.setStatus(SnapshotStatus.PARSE_FAILED);
        snapshotRepository.save(snapshot);
    }
}
