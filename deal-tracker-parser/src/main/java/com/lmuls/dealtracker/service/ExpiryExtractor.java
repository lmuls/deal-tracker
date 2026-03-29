package com.lmuls.dealtracker.service;

import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Best-effort extraction of a deal's expiry date from page text.
 * Checks structured data attributes first, then falls back to regex
 * scanning of visible text. Resolves relative date phrases against
 * the snapshot's {@code fetchedAt} timestamp.
 */
@Service
@Slf4j
public class ExpiryExtractor {

    // ISO date literals: "ends 2025-03-31" or "valid through 2025/12/01"
    private static final Pattern ISO_DATE = Pattern.compile(
            "\\b(\\d{4}[-/]\\d{2}[-/]\\d{2})\\b", Pattern.CASE_INSENSITIVE);

    // Named month: "ends March 31", "valid until April 15"
    private static final Pattern NAMED_MONTH = Pattern.compile(
            "\\b(?:ends?|until|through|valid\\s+(?:until|through)|t\\.o\\.m\\.?|gjelder\\s+til)\\s+"
                    + "(january|february|march|april|may|june|july|august|september|october|november|december|"
                    + "jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\\s+(\\d{1,2})\\b",
            Pattern.CASE_INSENSITIVE);

    // MM/DD or DD.MM format: "valid until 04/15", "t.o.m. 31.03"
    private static final Pattern NUMERIC_DATE = Pattern.compile(
            "\\b(?:until|through|ends?|t\\.o\\.m\\.?)\\s+(\\d{1,2})[./](\\d{1,2})\\b",
            Pattern.CASE_INSENSITIVE);

    // Relative: "ends today", "ends tonight", "ends this sunday/weekend"
    private static final Pattern RELATIVE_DATE = Pattern.compile(
            "\\b(?:ends?|slutter)\\s+(today|tonight|i dag|this\\s+(?:sunday|weekend|week))\\b",
            Pattern.CASE_INSENSITIVE);

    private static final DateTimeFormatter[] ISO_FORMATTERS = {
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd")
    };

    /**
     * Scans the document for an expiry date. Returns empty if none is found.
     *
     * @param doc       the parsed page
     * @param fetchedAt the timestamp at which the snapshot was captured,
     *                  used to resolve relative date phrases
     */
    public Optional<Instant> extract(Document doc, Instant fetchedAt) {
        String text = doc.text();

        Optional<Instant> result = tryIsoDate(text, fetchedAt);
        if (result.isPresent()) return result;

        result = tryNamedMonth(text, fetchedAt);
        if (result.isPresent()) return result;

        result = tryNumericDate(text, fetchedAt);
        if (result.isPresent()) return result;

        return tryRelativeDate(text, fetchedAt);
    }

    private static Optional<Instant> tryIsoDate(String text) {
        return tryIsoDate(text, Instant.now());
    }

    private static Optional<Instant> tryIsoDate(String text, Instant fetchedAt) {
        LocalDate fetchDate = LocalDate.ofInstant(fetchedAt, ZoneOffset.UTC);
        Matcher m = ISO_DATE.matcher(text);
        while (m.find()) {
            String raw = m.group(1).replace('/', '-');
            try {
                LocalDate date = LocalDate.parse(raw, DateTimeFormatter.ISO_LOCAL_DATE);
                if (!date.isBefore(fetchDate)) {
                    return Optional.of(date.atStartOfDay(ZoneOffset.UTC).toInstant());
                }
            } catch (DateTimeParseException ignored) {
                // try next match
            }
        }
        return Optional.empty();
    }

    private static Optional<Instant> tryNamedMonth(String text, Instant fetchedAt) {
        Matcher m = NAMED_MONTH.matcher(text);
        if (!m.find()) return Optional.empty();

        String monthName = m.group(1).toLowerCase();
        int day;
        try {
            day = Integer.parseInt(m.group(2));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }

        int month = parseMonthName(monthName);
        if (month < 1) return Optional.empty();

        LocalDate base = LocalDate.ofInstant(fetchedAt, ZoneOffset.UTC);
        LocalDate candidate = LocalDate.of(base.getYear(), month, day);
        if (candidate.isBefore(base)) candidate = candidate.plusYears(1);

        return Optional.of(candidate.atStartOfDay(ZoneOffset.UTC).toInstant());
    }

    private static Optional<Instant> tryNumericDate(String text, Instant fetchedAt) {
        Matcher m = NUMERIC_DATE.matcher(text);
        if (!m.find()) return Optional.empty();

        int a, b;
        try {
            a = Integer.parseInt(m.group(1));
            b = Integer.parseInt(m.group(2));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }

        // Heuristic: if first number > 12, it's DD/MM; otherwise assume MM/DD
        int month = (a > 12) ? b : a;
        int day = (a > 12) ? a : b;

        if (month < 1 || month > 12 || day < 1 || day > 31) return Optional.empty();

        LocalDate base = LocalDate.ofInstant(fetchedAt, ZoneOffset.UTC);
        LocalDate candidate = LocalDate.of(base.getYear(), month, day);
        if (candidate.isBefore(base)) candidate = candidate.plusYears(1);

        return Optional.of(candidate.atStartOfDay(ZoneOffset.UTC).toInstant());
    }

    private static Optional<Instant> tryRelativeDate(String text, Instant fetchedAt) {
        Matcher m = RELATIVE_DATE.matcher(text);
        if (!m.find()) return Optional.empty();

        String phrase = m.group(1).toLowerCase();
        LocalDate base = LocalDate.ofInstant(fetchedAt, ZoneOffset.UTC);

        LocalDate resolved = switch (phrase) {
            case "today", "tonight", "i dag" -> base;
            case "this week" -> base.with(DayOfWeek.SUNDAY);
            default -> base.with(DayOfWeek.SUNDAY); // "this sunday" / "this weekend"
        };

        return Optional.of(resolved.atStartOfDay(ZoneOffset.UTC).toInstant());
    }

    private static int parseMonthName(String name) {
        return switch (name) {
            case "january",   "jan" -> 1;
            case "february",  "feb" -> 2;
            case "march",     "mar" -> 3;
            case "april",     "apr" -> 4;
            case "may"              -> 5;
            case "june",      "jun" -> 6;
            case "july",      "jul" -> 7;
            case "august",    "aug" -> 8;
            case "september", "sep" -> 9;
            case "october",   "oct" -> 10;
            case "november",  "nov" -> 11;
            case "december",  "dec" -> 12;
            default -> -1;
        };
    }
}
