package com.lmuls.dealtracker.replay;

import com.lmuls.dealtracker.entity.Deal;
import com.lmuls.dealtracker.entity.Snapshot;
import com.lmuls.dealtracker.model.DealDetection;
import com.lmuls.dealtracker.service.DealLifecycle;
import com.lmuls.dealtracker.service.SnapshotAnalyzer;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

/**
 * Replays a site's stored snapshots in fetch order without touching the
 * database. Only orchestrates: each snapshot goes through the same
 * {@link SnapshotAnalyzer} and {@link DealLifecycle} as
 * {@link com.lmuls.dealtracker.service.ParseService}, with the site's active
 * deals held in memory instead of loaded from and saved to the DB.
 * <p>
 * Reads the harvester's on-disk layout: one directory per site containing
 * {@code <epochMillis>.html} files. The file name is used as the fetch time
 * and as the lifecycle clock.
 */
@Component
@RequiredArgsConstructor
public class SnapshotReplayer {

    private final SnapshotAnalyzer analyzer;
    private final DealLifecycle lifecycle;

    public List<ReplayEvent> replaySite(Path siteDir) throws IOException {
        List<ReplayEvent> events = new ArrayList<>();
        List<Deal> activeDeals = new ArrayList<>();
        for (Path file : snapshotFiles(siteDir)) {
            Instant fetchedAt = fetchedAt(file);
            String html;
            try {
                html = Files.readString(file, StandardCharsets.UTF_8);
            } catch (IOException e) {
                events.add(new ReplayEvent(fetchedAt, name(file), null));
                continue;
            }
            Snapshot snapshot = Snapshot.builder().filePath(name(file)).fetchedAt(fetchedAt).build();
            Optional<DealDetection> detection = analyzer.analyze(Jsoup.parse(html), fetchedAt);
            DealLifecycle.Transition transition = lifecycle.apply(snapshot, detection, activeDeals, fetchedAt);

            activeDeals = Stream.concat(activeDeals.stream(), transition.toSave().stream())
                    .filter(d -> Boolean.TRUE.equals(d.getActive()))
                    .distinct()
                    .toList();
            events.add(new ReplayEvent(fetchedAt, name(file), transition));
        }
        return events;
    }

    /** {@code *.html} files ordered by fetch time. */
    static List<Path> snapshotFiles(Path siteDir) throws IOException {
        try (Stream<Path> files = Files.list(siteDir)) {
            return files.filter(p -> name(p).endsWith(".html"))
                    .sorted(Comparator.comparing(SnapshotReplayer::fetchedAt).thenComparing(SnapshotReplayer::name))
                    .toList();
        }
    }

    private static Instant fetchedAt(Path file) {
        String stem = name(file).replaceFirst("\\.html$", "");
        try {
            return Instant.ofEpochMilli(Long.parseLong(stem));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    "Snapshot file name must be <epochMillis>.html, got: " + file, e);
        }
    }

    private static String name(Path p) {
        return p.getFileName().toString();
    }
}
