package com.lmuls.dealtracker.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CheckIntervalParserTest {

    @ParameterizedTest(name = "''{0}'' -> {1}m")
    @CsvSource({
            "1 hour,   60",
            "2 hours,  120",
            "6 hours,  360",
            "1 minute, 5",    // enforced minimum
            "4 minutes,5",    // enforced minimum
            "5 minutes,5",
            "30 minutes,30",
            "90 minutes,90",
            "PT1H,     60",
            "PT30M,    30",
            "PT2H,     120",
    })
    void parsesValidIntervals(String input, long expectedMinutes) {
        Duration result = CheckIntervalParser.parse(input);
        assertThat(result).isEqualTo(Duration.ofMinutes(expectedMinutes));
    }

    @Test
    void rejectsUnrecognisedFormat() {
        assertThatThrownBy(() -> CheckIntervalParser.parse("every day"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsNullInput() {
        assertThatThrownBy(() -> CheckIntervalParser.parse(null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsBlankInput() {
        assertThatThrownBy(() -> CheckIntervalParser.parse("  "))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
