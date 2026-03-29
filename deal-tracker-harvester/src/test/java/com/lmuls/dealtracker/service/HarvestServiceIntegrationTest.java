package com.lmuls.dealtracker.service;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.lmuls.dealtracker.TestcontainersConfig;
import com.lmuls.dealtracker.entity.TrackedSite;
import com.lmuls.dealtracker.entity.User;
import com.lmuls.dealtracker.enums.FetchStatus;
import com.lmuls.dealtracker.enums.SnapshotStatus;
import com.lmuls.dealtracker.repository.FetchLogRepository;
import com.lmuls.dealtracker.repository.SnapshotRepository;
import com.lmuls.dealtracker.repository.TrackedSiteRepository;
import com.lmuls.dealtracker.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestcontainersConfig.class)
class HarvestServiceIntegrationTest {

    @Autowired
    private HarvestService harvestService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TrackedSiteRepository trackedSiteRepository;

    @Autowired
    private FetchLogRepository fetchLogRepository;

    @Autowired
    private SnapshotRepository snapshotRepository;

    private WireMockServer wireMock;
    private User testUser;

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMock.start();

        testUser = userRepository.save(User.builder().email("test@example.com").build());

        // Allow all paths by default
        wireMock.stubFor(get(urlEqualTo("/robots.txt"))
                .willReturn(aResponse().withStatus(404)));
    }

    @AfterEach
    void tearDown() {
        snapshotRepository.deleteAll();
        fetchLogRepository.deleteAll();
        trackedSiteRepository.deleteAll();
        userRepository.deleteAll();
        wireMock.stop();
    }

    @Test
    void persistsSnapshotWhenNewContentFetched() {
        wireMock.stubFor(get(urlEqualTo("/deals"))
                .willReturn(aResponse().withStatus(200).withBody("<html>Big sale!</html>")));

        TrackedSite site = trackedSiteRepository.save(TrackedSite.builder()
                .user(testUser)
                .url(baseUrl() + "/deals")
                .name("Test Site")
                .checkInterval("1 hour")
                .build());

        harvestService.harvest(site);

        var fetchLogs = fetchLogRepository.findByTrackedSiteIdOrderByFetchedAtDesc(site.getId());
        assertThat(fetchLogs).hasSize(1);
        assertThat(fetchLogs.get(0).getStatus()).isEqualTo(FetchStatus.SUCCESS);

        var snapshots = snapshotRepository.findByTrackedSiteIdOrderByFetchedAtDesc(site.getId());
        assertThat(snapshots).hasSize(1);
        assertThat(snapshots.get(0).getStatus()).isEqualTo(SnapshotStatus.PENDING_PARSE);
        assertThat(snapshots.get(0).getFilePath()).isNotNull();

        TrackedSite updated = trackedSiteRepository.findById(site.getId()).orElseThrow();
        assertThat(updated.getLastContentHash()).isNotNull();
        assertThat(updated.getLastCheckedAt()).isNotNull();
    }

    @Test
    void recordsUnchangedWhenContentHashMatches() {
        String html = "<html>Same content</html>";

        wireMock.stubFor(get(urlEqualTo("/deals"))
                .willReturn(aResponse().withStatus(200).withBody(html)));

        // Pre-compute hash to simulate previously-seen content
        String hash = sha256(html);
        TrackedSite site = trackedSiteRepository.save(TrackedSite.builder()
                .user(testUser)
                .url(baseUrl() + "/deals")
                .name("Test Site")
                .checkInterval("1 hour")
                .lastContentHash(hash)
                .build());

        harvestService.harvest(site);

        var fetchLogs = fetchLogRepository.findByTrackedSiteIdOrderByFetchedAtDesc(site.getId());
        assertThat(fetchLogs).hasSize(1);
        assertThat(fetchLogs.get(0).getStatus()).isEqualTo(FetchStatus.UNCHANGED);

        assertThat(snapshotRepository.findByTrackedSiteIdOrderByFetchedAtDesc(site.getId())).isEmpty();
    }

    @Test
    void recordsFailureOnHttpError() {
        wireMock.stubFor(get(urlEqualTo("/deals"))
                .willReturn(aResponse().withStatus(503)));

        TrackedSite site = trackedSiteRepository.save(TrackedSite.builder()
                .user(testUser)
                .url(baseUrl() + "/deals")
                .name("Test Site")
                .checkInterval("1 hour")
                .build());

        harvestService.harvest(site);

        var fetchLogs = fetchLogRepository.findByTrackedSiteIdOrderByFetchedAtDesc(site.getId());
        assertThat(fetchLogs).hasSize(1);
        assertThat(fetchLogs.get(0).getStatus()).isEqualTo(FetchStatus.FAILED);
        assertThat(fetchLogs.get(0).getHttpStatus()).isEqualTo(503);
    }

    @Test
    void recordsFailureWhenBlockedByRobotsTxt() {
        wireMock.stubFor(get(urlEqualTo("/robots.txt"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withBody("User-agent: *\nDisallow: /deals\n")));

        TrackedSite site = trackedSiteRepository.save(TrackedSite.builder()
                .user(testUser)
                .url(baseUrl() + "/deals")
                .name("Test Site")
                .checkInterval("1 hour")
                .build());

        harvestService.harvest(site);

        var fetchLogs = fetchLogRepository.findByTrackedSiteIdOrderByFetchedAtDesc(site.getId());
        assertThat(fetchLogs).hasSize(1);
        assertThat(fetchLogs.get(0).getStatus()).isEqualTo(FetchStatus.FAILED);
        assertThat(fetchLogs.get(0).getErrorMessage()).contains("robots.txt");
    }

    private String baseUrl() {
        return "http://localhost:" + wireMock.port();
    }

    private static String sha256(String content) {
        try {
            byte[] hash = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
