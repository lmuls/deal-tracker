package com.lmuls.dealtracker.detector;

import com.fasterxml.jackson.databind.ObjectMapper;
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

class StructuredDataDetectorTest {

    private StructuredDataDetector detector;

    @BeforeEach
    void setUp() {
        detector = new StructuredDataDetector(new ObjectMapper());
    }

    @Test
    void detectsJsonLdOffer() throws IOException {
        Document doc = loadHtml("html/structured-data.html");
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);

        assertThat(results).isNotEmpty();
        assertThat(results).anyMatch(d ->
                d.detectionLayer() == DetectionLayer.STRUCTURED_DATA
                && d.confidence() == Confidence.HIGH
                && d.title().toLowerCase().contains("spring sale"));
    }

    @Test
    void extractsValidThroughAsExpiresAt() throws IOException {
        Document doc = loadHtml("html/structured-data.html");
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);

        assertThat(results).anyMatch(d ->
                d.detectionLayer() == DetectionLayer.STRUCTURED_DATA
                && d.expiresAt() != null);
    }

    @Test
    void detectsOpenGraphSalePrice() throws IOException {
        Document doc = loadHtml("html/structured-data.html");
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);

        assertThat(results).anyMatch(d ->
                d.detectionLayer() == DetectionLayer.STRUCTURED_DATA
                && d.discountValue() != null
                && d.discountValue().contains("29.99"));
    }

    @Test
    void detectsMicrodata() {
        String html = """
                <html><body>
                <div itemscope itemtype="https://schema.org/Offer">
                  <span itemprop="name">Summer Sale Offer</span>
                  <span itemprop="price" content="19.99">$19.99</span>
                </div>
                </body></html>""";
        Document doc = Jsoup.parse(html);
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);

        assertThat(results).anyMatch(d ->
                d.detectionLayer() == DetectionLayer.STRUCTURED_DATA
                && d.confidence() == Confidence.HIGH
                && d.title().toLowerCase().contains("summer sale"));
    }

    @Test
    void returnsEmptyForPageWithNoStructuredData() throws IOException {
        Document doc = loadHtml("html/no-deals.html");
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);
        assertThat(results).isEmpty();
    }

    @Test
    void toleratesMalformedJsonLd() {
        String html = """
                <html><head>
                <script type="application/ld+json">{ not valid json }</script>
                </head><body>Content</body></html>""";
        Document doc = Jsoup.parse(html);
        // should not throw
        List<DealDetection> results = detector.detect(doc, Locale.ENGLISH);
        assertThat(results).isEmpty();
    }

    private static Document loadHtml(String resourcePath) throws IOException {
        URL url = StructuredDataDetectorTest.class.getClassLoader().getResource(resourcePath);
        assertThat(url).as("Test HTML resource not found: " + resourcePath).isNotNull();
        return Jsoup.parse(url.openStream(), "UTF-8", "");
    }
}
