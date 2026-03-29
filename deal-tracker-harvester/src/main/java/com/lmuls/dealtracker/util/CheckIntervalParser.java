package com.lmuls.dealtracker.util;

import java.time.Duration;
import java.time.format.DateTimeParseException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class CheckIntervalParser {

    private static final Pattern PATTERN =
            Pattern.compile("(\\d+)\\s*(minute|hour|day)s?", Pattern.CASE_INSENSITIVE);

    private static final Duration MINIMUM = Duration.ofMinutes(5);

    private CheckIntervalParser() {}

    /**
     * Parses a check interval string into a {@link Duration}.
     * Accepts ISO-8601 (e.g. {@code "PT1H"}) and plain English
     * (e.g. {@code "1 hour"}, {@code "30 minutes"}, {@code "2 days"}).
     * A minimum of 5 minutes is enforced to prevent aggressive crawling.
     *
     * @throws IllegalArgumentException if the string cannot be parsed
     */
    public static Duration parse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Interval string must not be blank");
        }

        // Try ISO-8601 first (e.g. PT1H, PT30M)
        try {
            Duration d = Duration.parse(raw.trim());
            return enforce(d);
        } catch (DateTimeParseException ignored) {
            // fall through to plain-English parsing
        }

        Matcher m = PATTERN.matcher(raw.trim());
        if (!m.matches()) {
            throw new IllegalArgumentException("Cannot parse interval: '" + raw + "'");
        }

        long quantity = Long.parseLong(m.group(1));
        Duration duration = switch (m.group(2).toLowerCase()) {
            case "minute" -> Duration.ofMinutes(quantity);
            case "hour"   -> Duration.ofHours(quantity);
            case "day"    -> Duration.ofDays(quantity);
            default       -> throw new IllegalArgumentException("Unknown unit in interval: " + raw);
        };

        return enforce(duration);
    }

    private static Duration enforce(Duration d) {
        return d.compareTo(MINIMUM) < 0 ? MINIMUM : d;
    }
}
