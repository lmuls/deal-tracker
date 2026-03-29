package com.lmuls.dealtracker.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class ExpiryExtractorTest {

    private ExpiryExtractor extractor;
    private static final Instant FETCH_TIME =
            LocalDate.of(2025, 3, 15).atStartOfDay(ZoneOffset.UTC).toInstant();

    @BeforeEach
    void setUp() {
        extractor = new ExpiryExtractor();
    }

    @Test
    void extractsIsoDate() {
        Document doc = page("Sale ends 2025-04-30");
        Optional<Instant> result = extractor.extract(doc, FETCH_TIME);
        assertThat(result).isPresent();
        assertThat(LocalDate.ofInstant(result.get(), ZoneOffset.UTC))
                .isEqualTo(LocalDate.of(2025, 4, 30));
    }

    @Test
    void extractsNamedMonthDate() {
        Document doc = page("Offer valid until March 31");
        Optional<Instant> result = extractor.extract(doc, FETCH_TIME);
        assertThat(result).isPresent();
        assertThat(LocalDate.ofInstant(result.get(), ZoneOffset.UTC))
                .isEqualTo(LocalDate.of(2025, 3, 31));
    }

    @Test
    void resolvesRelativeTodayToFetchDate() {
        Document doc = page("Ends today — don't miss out!");
        Optional<Instant> result = extractor.extract(doc, FETCH_TIME);
        assertThat(result).isPresent();
        assertThat(LocalDate.ofInstant(result.get(), ZoneOffset.UTC))
                .isEqualTo(LocalDate.of(2025, 3, 15));
    }

    @Test
    void resolvesThisSundayToNextSunday() {
        Document doc = page("Sale ends this Sunday");
        Optional<Instant> result = extractor.extract(doc, FETCH_TIME);
        assertThat(result).isPresent();
        // 2025-03-15 is a Saturday, so "this sunday" = 2025-03-16
        assertThat(LocalDate.ofInstant(result.get(), ZoneOffset.UTC).getDayOfWeek())
                .isEqualTo(java.time.DayOfWeek.SUNDAY);
    }

    @Test
    void returnsEmptyForPageWithNoDates() {
        Document doc = page("Big sale going on now!");
        Optional<Instant> result = extractor.extract(doc, FETCH_TIME);
        assertThat(result).isEmpty();
    }

    @Test
    void skipsPastIsoDates() {
        // ISO date is before the fetch date — should not be returned
        Document doc = page("Sale ended on 2025-01-01");
        Optional<Instant> result = extractor.extract(doc, FETCH_TIME);
        assertThat(result).isEmpty();
    }

    private static Document page(String bodyText) {
        return Jsoup.parse("<html><body><p>" + bodyText + "</p></body></html>");
    }
}
