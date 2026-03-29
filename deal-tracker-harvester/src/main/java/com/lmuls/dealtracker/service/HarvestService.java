package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.config.HarvesterProperties;
import com.lmuls.dealtracker.entity.TrackedSite;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;

@Service
@Slf4j
@RequiredArgsConstructor
public class HarvestService {

    private final HarvesterProperties properties;
    private final HttpClient httpClient;
    private final RobotsTxtService robotsTxtService;
    private final HarvestPersistenceService persistenceService;

    /**
     * Fetches the given site's URL, checks for content changes, and persists the
     * result. HTTP I/O is intentionally kept outside any database transaction to
     * avoid holding a connection open during network operations.
     */
    public void harvest(TrackedSite site) {
        String url = site.getUrl();

        if (!robotsTxtService.isAllowed(url)) {
            log.info("Skipping {} — disallowed by robots.txt", url);
            persistenceService.persistFailed(site.getId(), null, "Blocked by robots.txt");
            return;
        }

        HttpResponse<String> response;
        try {
            response = fetchWithRetry(url);
        } catch (Exception e) {
            log.error("Fetch failed for {} after {} attempt(s): {}", url, properties.getMaxRetries(), e.getMessage());
            persistenceService.persistFailed(site.getId(), null, e.getMessage());
            return;
        }

        int httpStatus = response.statusCode();
        if (httpStatus < 200 || httpStatus >= 300) {
            log.warn("HTTP {} received for {}", httpStatus, url);
            persistenceService.persistFailed(site.getId(), httpStatus, "HTTP " + httpStatus);
            return;
        }

        String html = response.body();
        String hash = sha256(html);

        if (hash.equals(site.getLastContentHash())) {
            log.debug("Content unchanged for {}", url);
            persistenceService.persistUnchanged(site.getId(), hash, httpStatus);
            return;
        }

        String relativePath = writeToFile(site.getId(), html);
        persistenceService.persistSuccess(site.getId(), hash, httpStatus, relativePath);
        log.info("New content harvested for {} — snapshot at {}", url, relativePath);
    }

    private HttpResponse<String> fetchWithRetry(String url) throws IOException, InterruptedException {
        IOException last = null;
        for (int attempt = 0; attempt < properties.getMaxRetries(); attempt++) {
            if (attempt > 0) {
                long delayMs = (long) (properties.getInitialBackoff().toMillis()
                        * Math.pow(properties.getBackoffMultiplier(), attempt - 1));
                log.info("Retry {}/{} for {} after {}ms", attempt, properties.getMaxRetries(), url, delayMs);
                Thread.sleep(delayMs);
            }
            try {
                return httpClient.send(
                        HttpRequest.newBuilder()
                                .uri(URI.create(url))
                                .header("User-Agent", properties.getUserAgent())
                                .timeout(properties.getHttpTimeout())
                                .GET()
                                .build(),
                        HttpResponse.BodyHandlers.ofString());
            } catch (IOException e) {
                last = e;
                log.warn("Attempt {}/{} failed for {}: {}", attempt + 1, properties.getMaxRetries(), url, e.getMessage());
            }
        }
        throw last;
    }

    /**
     * Writes raw HTML to disk and returns the path relative to snapshotDir.
     * The file is written before any DB row is created so that, if the write
     * fails, no dangling Snapshot row is left behind.
     */
    private String writeToFile(java.util.UUID siteId, String html) {
        String relativePath = siteId + "/" + Instant.now().toEpochMilli() + ".html";
        Path absolute = Path.of(properties.getSnapshotDir(), relativePath);
        try {
            Files.createDirectories(absolute.getParent());
            Files.writeString(absolute, html, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Failed to write snapshot to disk: " + absolute, e);
        }
        return relativePath;
    }

    private String sha256(String content) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(content.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
