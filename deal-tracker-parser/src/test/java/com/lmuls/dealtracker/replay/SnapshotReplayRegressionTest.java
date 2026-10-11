package com.lmuls.dealtracker.replay;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Replays each scenario under {@code src/test/resources/replay/<scenario>/}
 * (snapshots named {@code <epochMillis>.html}, as the harvester writes them)
 * and compares the timeline with the scenario's {@code expected.txt}.
 * <p>
 * To add a scenario from production, copy a site's snapshot directory in and
 * generate its golden file; after an intentional detector change, regenerate
 * and review the diff:
 * <pre>
 * ./mvnw -pl deal-tracker-parser test -Dtest=SnapshotReplayRegressionTest -Dreplay.update=true
 * </pre>
 */
class SnapshotReplayRegressionTest {

    private static final Path SOURCE_ROOT = Path.of("src/test/resources/replay");
    private static final String EXPECTED = "expected.txt";

    static Stream<String> scenarios() throws IOException, URISyntaxException {
        Path root = Path.of(SnapshotReplayRegressionTest.class.getResource("/replay").toURI());
        try (Stream<Path> dirs = Files.list(root)) {
            List<String> names = dirs.filter(Files::isDirectory)
                    .map(p -> p.getFileName().toString()).sorted().toList();
            return names.stream();
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("scenarios")
    void replayMatchesGoldenTimeline(String scenario) throws Exception {
        Path dir = Path.of(getClass().getResource("/replay/" + scenario).toURI());
        String actual = ReplayReport.render(ReplayCli.createReplayer().replaySite(dir));

        if (Boolean.getBoolean("replay.update")) {
            Files.writeString(SOURCE_ROOT.resolve(scenario).resolve(EXPECTED), actual, StandardCharsets.UTF_8);
            return;
        }
        Path expected = dir.resolve(EXPECTED);
        assertThat(expected)
                .as("Missing golden file — run with -Dreplay.update=true to create it")
                .exists();
        assertThat(actual).isEqualTo(Files.readString(expected, StandardCharsets.UTF_8));
    }
}
