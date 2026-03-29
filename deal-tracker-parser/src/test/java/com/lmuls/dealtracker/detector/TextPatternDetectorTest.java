package com.lmuls.dealtracker.detector;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DealType;
import com.lmuls.dealtracker.enums.DetectionLayer;
import com.lmuls.dealtracker.model.DealDetection;
import com.lmuls.dealtracker.service.KeywordsLoader;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.net.URL;
import java.util.List;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

class TextPatternDetectorTest {

    private TextPatternDetector detector;

    @BeforeEach
    void setUp() throws Exception {
        ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
        KeywordsLoader loader = new KeywordsLoader(
                new ClassPathResource("deal-keywords.yml"), yamlMapper);
        loader.load();
        detector = new TextPatternDetector(loader);
    }

    @Test
    void detectsFreeShippingKeyword() throws IOException {
        Document doc = loadHtml("html/text-pattern.html");
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);

        assertThat(results).anyMatch(d ->
                d.type() == DealType.FREE_SHIPPING
                && d.detectionLayer() == DetectionLayer.TEXT_PATTERN);
    }

    @Test
    void detectsCouponCode() throws IOException {
        Document doc = loadHtml("html/text-pattern.html");
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);

        assertThat(results).anyMatch(d -> d.type() == DealType.COUPON);
    }

    @Test
    void detectsBogo() {
        // Use inline HTML with only BOGO text to avoid free-shipping taking priority
        Document doc = Jsoup.parse(
                "<html><body><p>Buy one get one free on all accessories!</p></body></html>");
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);

        assertThat(results).anyMatch(d -> d.type() == DealType.BOGO);
    }

    @Test
    void boostsConfidenceWhenUrgencyPresent() throws IOException {
        // text-pattern.html has "ends tonight" urgency marker
        Document doc = loadHtml("html/text-pattern.html");
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);

        // With urgency present, confidence should be at least MEDIUM
        assertThat(results).allMatch(d -> d.confidence() != Confidence.LOW);
    }

    @Test
    void detectsNorwegianKeywords() throws IOException {
        Document doc = loadHtml("html/norwegian.html");
        List<DealDetection> results = detector.detect(doc, Locale.forLanguageTag("no"));

        assertThat(results).isNotEmpty();
        assertThat(results).anyMatch(d -> d.type() == DealType.SALE_EVENT);
        assertThat(results).anyMatch(d -> d.type() == DealType.FREE_SHIPPING);
    }

    @Test
    void returnsEmptyForPageWithNoDeals() throws IOException {
        Document doc = loadHtml("html/no-deals.html");
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);
        assertThat(results).isEmpty();
    }

    @Test
    void fallsBackToEnglishForUnknownLocale() throws IOException {
        Document doc = loadHtml("html/text-pattern.html");
        // Use a locale with no keywords file
        List<DealDetection> results = detector.detect(doc, Locale.GERMAN);
        // Should fall back to English and still find deals
        assertThat(results).isNotEmpty();
    }

    private static Document loadHtml(String resourcePath) throws IOException {
        URL url = TextPatternDetectorTest.class.getClassLoader().getResource(resourcePath);
        assertThat(url).as("Test HTML resource not found: " + resourcePath).isNotNull();
        return Jsoup.parse(url.openStream(), "UTF-8", "");
    }
}
