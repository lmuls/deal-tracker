package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.config.ParserProperties;
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
import java.util.List;
import java.util.Optional;

/**
 * Runs campaign detection for a single snapshot and keeps the site's active
 * deals in sync by persisting the {@link DealLifecycle} transition.
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
    private final SnapshotAnalyzer snapshotAnalyzer;
    private final DealLifecycle dealLifecycle;
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
            Optional<DealDetection> detection = snapshotAnalyzer.analyze(doc, snapshot.getFetchedAt());
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

    @Transactional
    protected void persistResults(Snapshot snapshot, Optional<DealDetection> detection) {
        List<Deal> activeSiteDeals =
                dealRepository.findByTrackedSiteIdAndActiveTrue(snapshot.getTrackedSite().getId());
        DealLifecycle.Transition transition =
                dealLifecycle.apply(snapshot, detection, activeSiteDeals, Instant.now());
        dealRepository.saveAll(transition.toSave());

        snapshot.setStatus(SnapshotStatus.PARSED);
        snapshotRepository.save(snapshot);
    }

    @Transactional
    protected void markFailed(Snapshot snapshot) {
        snapshot.setStatus(SnapshotStatus.PARSE_FAILED);
        snapshotRepository.save(snapshot);
    }
}
