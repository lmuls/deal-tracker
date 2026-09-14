package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.TestcontainersConfig;
import com.lmuls.dealtracker.entity.Deal;
import com.lmuls.dealtracker.entity.FetchLog;
import com.lmuls.dealtracker.entity.Snapshot;
import com.lmuls.dealtracker.entity.TrackedSite;
import com.lmuls.dealtracker.entity.User;
import com.lmuls.dealtracker.enums.FetchStatus;
import com.lmuls.dealtracker.enums.SnapshotStatus;
import com.lmuls.dealtracker.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.io.IOException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestcontainersConfig.class)
class ParseServiceIntegrationTest {

    @TempDir
    static Path tempSnapshotDir;

    @DynamicPropertySource
    static void configureSnapshotDir(DynamicPropertyRegistry registry) {
        registry.add("parser.snapshot-dir", tempSnapshotDir::toString);
    }

    @Autowired ParseService parseService;
    @Autowired UserRepository userRepository;
    @Autowired TrackedSiteRepository trackedSiteRepository;
    @Autowired FetchLogRepository fetchLogRepository;
    @Autowired SnapshotRepository snapshotRepository;
    @Autowired DealRepository dealRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = userRepository.save(User.builder().email("parser-test@example.com").passwordHash("test-hash").build());
    }

    @AfterEach
    void tearDown() {
        dealRepository.deleteAll();
        snapshotRepository.deleteAll();
        fetchLogRepository.deleteAll();
        trackedSiteRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void persistsDealsForSnapshotWithStructuredData() throws IOException {
        Snapshot snapshot = createSnapshotFromHtml("html/structured-data.html");

        parseService.parse(snapshot);

        var deals = dealRepository.findByTrackedSiteIdOrderByDetectedAtDesc(snapshot.getTrackedSite().getId());
        assertThat(deals).isNotEmpty();

        var updated = snapshotRepository.findById(snapshot.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(SnapshotStatus.PARSED);
    }

    @Test
    void persistsDealsForSnapshotWithDomPatterns() throws IOException {
        Snapshot snapshot = createSnapshotFromHtml("html/dom-pattern.html");

        parseService.parse(snapshot);

        var deals = dealRepository.findByTrackedSiteIdOrderByDetectedAtDesc(snapshot.getTrackedSite().getId());
        assertThat(deals).isNotEmpty();
    }

    @Test
    void persistsDealsForSnapshotWithTextPatterns() throws IOException {
        Snapshot snapshot = createSnapshotFromHtml("html/text-pattern.html");

        parseService.parse(snapshot);

        var deals = dealRepository.findByTrackedSiteIdOrderByDetectedAtDesc(snapshot.getTrackedSite().getId());
        assertThat(deals).isNotEmpty();
    }

    @Test
    void marksSnapshotParsedEvenWhenNoDealsDetected() throws IOException {
        Snapshot snapshot = createSnapshotFromHtml("html/no-deals.html");

        parseService.parse(snapshot);

        var updated = snapshotRepository.findById(snapshot.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(SnapshotStatus.PARSED);
        assertThat(dealRepository.findByTrackedSiteIdOrderByDetectedAtDesc(
                snapshot.getTrackedSite().getId())).isEmpty();
    }

    @Test
    void marksSnapshotParseFailedWhenFileIsMissing() {
        TrackedSite site = trackedSiteRepository.save(TrackedSite.builder()
                .user(testUser)
                .url("http://example.com")
                .name("Test")
                .checkInterval("1 hour")
                .build());

        FetchLog log = fetchLogRepository.save(FetchLog.builder()
                .trackedSite(site)
                .status(FetchStatus.SUCCESS)
                .contentHash("abc")
                .httpStatus(200)
                .fetchedAt(Instant.now())
                .build());

        Snapshot snapshot = snapshotRepository.save(Snapshot.builder()
                .trackedSite(site)
                .fetchLog(log)
                .status(SnapshotStatus.PENDING_PARSE)
                .contentHash("abc")
                .filePath("nonexistent/" + UUID.randomUUID() + ".html")
                .fetchedAt(Instant.now())
                .build());

        parseService.parse(snapshot);

        var updated = snapshotRepository.findById(snapshot.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(SnapshotStatus.PARSE_FAILED);
    }

    // ── Cross-snapshot versioning ────────────────────────────────────────────

    @Test
    void newDealRecordsFirstAndLastSeenAndSingleObservation() throws IOException {
        TrackedSite site = createTrackedSite();
        Snapshot snapshot = createSnapshotFromHtml("html/versioning-v1.html", site);

        parseService.parse(snapshot);

        Deal deal = soleLoyaltyDeal(site);
        assertThat(deal.getFirstSeenAt()).isEqualTo(deal.getLastSeenAt());
        assertThat(deal.getNObservations()).isEqualTo(1);
        assertThat(deal.getPreviousDeal()).isNull();
        assertThat(deal.getActive()).isTrue();
    }

    @Test
    void unchangedReobservationBumpsObservationCountInsteadOfInserting() throws IOException {
        TrackedSite site = createTrackedSite();
        Snapshot first = createSnapshotFromHtml("html/versioning-v1.html", site);
        parseService.parse(first);
        Deal original = soleLoyaltyDeal(site);
        Instant originalFirstSeenAt = original.getFirstSeenAt();

        Snapshot second = createSnapshotFromHtml("html/versioning-v1.html", site);
        parseService.parse(second);

        Deal updated = soleLoyaltyDeal(site);
        assertThat(updated.getId()).isEqualTo(original.getId());
        assertThat(updated.getNObservations()).isEqualTo(2);
        assertThat(updated.getFirstSeenAt()).isEqualTo(originalFirstSeenAt);
        assertThat(updated.getLastSeenAt()).isAfterOrEqualTo(originalFirstSeenAt);
        assertThat(updated.getSnapshot().getId()).isEqualTo(second.getId());
        assertThat(updated.getActive()).isTrue();
    }

    @Test
    void changedContentSupersedesOldDealWithVersionedReference() throws IOException {
        TrackedSite site = createTrackedSite();
        Snapshot first = createSnapshotFromHtml("html/versioning-v1.html", site);
        parseService.parse(first);
        Deal original = soleLoyaltyDeal(site);

        Snapshot second = createSnapshotFromHtml("html/versioning-v2.html", site);
        parseService.parse(second);

        var deals = dealRepository.findByTrackedSiteIdOrderByDetectedAtDesc(site.getId());
        assertThat(deals).hasSize(2);

        Deal originalReloaded = dealRepository.findById(original.getId()).orElseThrow();
        assertThat(originalReloaded.getActive()).isFalse();

        Deal newVersion = deals.stream()
                .filter(d -> !d.getId().equals(original.getId()))
                .findFirst().orElseThrow();
        assertThat(newVersion.getActive()).isTrue();
        assertThat(newVersion.getPreviousDeal().getId()).isEqualTo(original.getId());
        assertThat(newVersion.getNObservations()).isEqualTo(1);
        assertThat(newVersion.getFirstSeenAt()).isEqualTo(newVersion.getLastSeenAt());
        assertThat(newVersion.getDiscountValue()).isEqualTo("15");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Deal soleLoyaltyDeal(TrackedSite site) {
        var deals = dealRepository.findByTrackedSiteIdAndActiveTrue(site.getId());
        assertThat(deals).hasSize(1);
        return deals.get(0);
    }

    private TrackedSite createTrackedSite() {
        return trackedSiteRepository.save(TrackedSite.builder()
                .user(testUser)
                .url("http://example.com")
                .name("Test Site")
                .checkInterval("1 hour")
                .build());
    }

    private Snapshot createSnapshotFromHtml(String resourcePath) throws IOException {
        return createSnapshotFromHtml(resourcePath, createTrackedSite());
    }

    private Snapshot createSnapshotFromHtml(String resourcePath, TrackedSite site) throws IOException {
        URL url = getClass().getClassLoader().getResource(resourcePath);
        assertThat(url).as("Test HTML resource not found: " + resourcePath).isNotNull();
        String html = new String(url.openStream().readAllBytes(), StandardCharsets.UTF_8);

        FetchLog log = fetchLogRepository.save(FetchLog.builder()
                .trackedSite(site)
                .status(FetchStatus.SUCCESS)
                .contentHash("hash-" + System.nanoTime())
                .httpStatus(200)
                .fetchedAt(Instant.now())
                .build());

        // Write HTML to temp snapshot dir, unique per snapshot so repeated
        // parses of the same site don't clobber each other's file.
        String fileName = "snapshot-" + UUID.randomUUID() + ".html";
        String relativePath = site.getId() + "/" + fileName;
        Path absolute = tempSnapshotDir.resolve(site.getId().toString());
        Files.createDirectories(absolute);
        Files.writeString(absolute.resolve(fileName), html, StandardCharsets.UTF_8);

        return snapshotRepository.save(Snapshot.builder()
                .trackedSite(site)
                .fetchLog(log)
                .status(SnapshotStatus.PENDING_PARSE)
                .contentHash("hash-" + System.nanoTime())
                .filePath(relativePath)
                .fetchedAt(Instant.now())
                .build());
    }
}
