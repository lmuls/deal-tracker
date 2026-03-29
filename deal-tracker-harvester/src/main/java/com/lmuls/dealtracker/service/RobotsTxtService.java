package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.config.HarvesterProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class RobotsTxtService {

    private final HttpClient httpClient;
    private final HarvesterProperties properties;

    private record CacheEntry(Set<String> disallowedPaths, Instant cachedAt) {}

    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    /**
     * Returns true if the harvester is allowed to fetch the given URL
     * according to the site's robots.txt. Defaults to {@code true} if
     * robots.txt cannot be fetched.
     */
    public boolean isAllowed(String url) {
        String origin = extractOrigin(url);
        String path = extractPath(url);

        CacheEntry entry = cache.get(origin);
        if (entry == null || Instant.now().isAfter(entry.cachedAt().plus(properties.getRobotsCacheTtl()))) {
            entry = fetchAndCache(origin);
        }

        return entry.disallowedPaths().stream().noneMatch(path::startsWith);
    }

    private CacheEntry fetchAndCache(String origin) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(origin + "/robots.txt"))
                    .header("User-Agent", properties.getUserAgent())
                    .timeout(properties.getHttpTimeout())
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            Set<String> disallowed = (response.statusCode() == 200)
                    ? parseDisallowedPaths(response.body())
                    : Set.of();

            CacheEntry entry = new CacheEntry(disallowed, Instant.now());
            cache.put(origin, entry);
            return entry;
        } catch (Exception e) {
            log.warn("Could not fetch robots.txt for {} — defaulting to allow: {}", origin, e.getMessage());
            CacheEntry entry = new CacheEntry(Set.of(), Instant.now());
            cache.put(origin, entry);
            return entry;
        }
    }

    private Set<String> parseDisallowedPaths(String content) {
        Set<String> disallowed = new HashSet<>();
        boolean inRelevantBlock = false;

        for (String rawLine : content.split("[\r\n]+")) {
            String line = rawLine.trim();

            // Strip inline comments
            int commentIdx = line.indexOf('#');
            if (commentIdx >= 0) line = line.substring(0, commentIdx).trim();

            if (line.isEmpty()) {
                inRelevantBlock = false; // blank line ends a user-agent block
                continue;
            }

            if (line.toLowerCase().startsWith("user-agent:")) {
                String agent = line.substring("user-agent:".length()).trim();
                inRelevantBlock = agent.equals("*");
            } else if (inRelevantBlock && line.toLowerCase().startsWith("disallow:")) {
                String path = line.substring("disallow:".length()).trim();
                if (!path.isEmpty()) disallowed.add(path);
            }
        }

        return disallowed;
    }

    @Scheduled(fixedRate = 3_600_000)
    void evictExpiredEntries() {
        Instant now = Instant.now();
        cache.entrySet().removeIf(e ->
                now.isAfter(e.getValue().cachedAt().plus(properties.getRobotsCacheTtl())));
    }

    private static String extractOrigin(String url) {
        URI uri = URI.create(url);
        int port = uri.getPort();
        return uri.getScheme() + "://" + uri.getHost() + (port != -1 ? ":" + port : "");
    }

    private static String extractPath(String url) {
        String path = URI.create(url).getPath();
        return (path == null || path.isEmpty()) ? "/" : path;
    }
}
