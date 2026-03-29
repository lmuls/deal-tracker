package com.lmuls.dealtracker.detector;

import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DetectionLayer;
import com.lmuls.dealtracker.model.DealDetection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.URL;
import java.util.List;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

class DomPatternDetectorTest {

    private DomPatternDetector detector;

    @BeforeEach
    void setUp() {
        detector = new DomPatternDetector();
    }

    @Test
    void detectsElementWithPromoClass() throws IOException {
        Document doc = loadHtml("html/dom-pattern.html");
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);

        assertThat(results).isNotEmpty();
        assertThat(results).allMatch(d -> d.detectionLayer() == DetectionLayer.DOM_PATTERN);
    }

    @Test
    void givesHighConfidenceToHeaderElement() throws IOException {
        Document doc = loadHtml("html/dom-pattern.html");
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);

        // The promo-banner inside <header> should get HIGH
        assertThat(results).anyMatch(d ->
                d.confidence() == Confidence.HIGH
                && d.title().toLowerCase().contains("free shipping"));
    }

    @Test
    void givesMediumConfidenceToGenericPromoElement() {
        String html = """
                <html><body>
                <main>
                  <div class="discount-badge">20% off selected items</div>
                </main>
                </body></html>""";
        Document doc = Jsoup.parse(html);
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).confidence()).isEqualTo(Confidence.MEDIUM);
    }

    @Test
    void detectsDataAttributePattern() {
        String html = """
                <html><body>
                <section data-campaign="flash-sale">Flash sale — 50% off today!</section>
                </body></html>""";
        Document doc = Jsoup.parse(html);
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);

        assertThat(results).isNotEmpty();
        assertThat(results).anyMatch(d -> d.title().contains("Flash sale"));
    }

    @Test
    void returnsEmptyForPageWithNoPromoElements() throws IOException {
        Document doc = loadHtml("html/no-deals.html");
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);
        assertThat(results).isEmpty();
    }

    @Test
    void skipsElementsWithBlankText() {
        String html = """
                <html><body>
                <div class="promo-banner">   </div>
                </body></html>""";
        Document doc = Jsoup.parse(html);
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);
        assertThat(results).isEmpty();
    }

    private static Document loadHtml(String resourcePath) throws IOException {
        URL url = DomPatternDetectorTest.class.getClassLoader().getResource(resourcePath);
        assertThat(url).as("Test HTML resource not found: " + resourcePath).isNotNull();
        return Jsoup.parse(url.openStream(), "UTF-8", "");
    }
}
