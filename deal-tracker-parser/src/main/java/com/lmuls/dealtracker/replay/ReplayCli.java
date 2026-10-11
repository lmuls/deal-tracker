package com.lmuls.dealtracker.replay;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.lmuls.dealtracker.detector.CampaignDetector;
import com.lmuls.dealtracker.service.DealLifecycle;
import com.lmuls.dealtracker.service.ExpiryExtractor;
import com.lmuls.dealtracker.service.KeywordsLoader;
import com.lmuls.dealtracker.service.SnapshotAnalyzer;
import org.springframework.core.io.ClassPathResource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

/**
 * Offline historical run over stored snapshots — no Spring context, no DB.
 * <p>
 * Usage: {@code ReplayCli <dir>} where {@code dir} is either a single site's
 * snapshot directory or the snapshot root (one sub-directory per site).
 */
public final class ReplayCli {

    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            System.err.println("Usage: ReplayCli <site-snapshot-dir | snapshot-root>");
            System.exit(2);
        }
        Path dir = Path.of(args[0]);
        SnapshotReplayer replayer = createReplayer();

        if (!SnapshotReplayer.snapshotFiles(dir).isEmpty()) {
            System.out.print(ReplayReport.render(replayer.replaySite(dir)));
            return;
        }
        List<Path> sites;
        try (Stream<Path> children = Files.list(dir)) {
            sites = children.filter(Files::isDirectory).sorted().toList();
        }
        for (Path site : sites) {
            System.out.println("== " + site.getFileName());
            System.out.println(ReplayReport.render(replayer.replaySite(site)));
        }
    }

    public static SnapshotReplayer createReplayer() throws Exception {
        KeywordsLoader keywords = new KeywordsLoader(
                new ClassPathResource("deal-keywords.yml"), new ObjectMapper(new YAMLFactory()));
        keywords.load();
        return new SnapshotReplayer(
                new SnapshotAnalyzer(new CampaignDetector(keywords), new ExpiryExtractor()),
                new DealLifecycle());
    }
}
