package com.lmuls.dealtracker.detector;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DealType;
import com.lmuls.dealtracker.model.DealDetection;
import com.lmuls.dealtracker.service.KeywordsLoader;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.net.URL;
import java.util.Locale;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class CampaignDetectorTest {

    private CampaignDetector detector;

    @BeforeEach
    void setUp() throws Exception {
        KeywordsLoader loader = new KeywordsLoader(
                new ClassPathResource("deal-keywords.yml"), new ObjectMapper(new YAMLFactory()));
        loader.load();
        detector = new CampaignDetector(loader);
    }

    @Test
    void detectsSaleEventInHero() throws IOException {
        DealDetection d = detect("html/campaign-black-friday.html", Locale.ENGLISH).orElseThrow();

        assertThat(d.type()).isEqualTo(DealType.SALE_EVENT);
        assertThat(d.title()).isEqualTo("Black Friday");
        assertThat(d.discountValue()).isNull();
        assertThat(d.confidence()).isEqualTo(Confidence.MEDIUM);
    }

    @Test
    void detectsPercentageCampaignInAnnouncementBarIgnoringProductTiles() throws IOException {
        DealDetection d = detect("html/campaign-percent.html", Locale.ENGLISH).orElseThrow();

        assertThat(d.type()).isEqualTo(DealType.PERCENTAGE_OFF);
        assertThat(d.title()).isEqualTo("Up to 50% off");
        assertThat(d.discountValue()).isEqualTo("50%");
    }

    @Test
    void ignoresNavFooterProductCardsCookieBannersAndSmallPromos() throws IOException {
        assertThat(detect("html/noise-only.html", Locale.ENGLISH)).isEmpty();
    }

    @Test
    void detectsNorwegianCampaign() throws IOException {
        DealDetection d = detect("html/norwegian.html", Locale.forLanguageTag("no")).orElseThrow();

        assertThat(d.type()).isEqualTo(DealType.SALE_EVENT);
        assertThat(d.title()).isEqualTo("Vårsalg");
        assertThat(d.discountValue()).isEqualTo("30%");
        assertThat(d.confidence()).isEqualTo(Confidence.HIGH);
    }

    @Test
    void returnsEmptyForPageWithNoDeals() throws IOException {
        assertThat(detect("html/no-deals.html", Locale.ENGLISH)).isEmpty();
    }

    @Test
    void pageTitleCountsAsStrongSignal() {
        Document doc = Jsoup.parse(
                "<html><head><title>Cyber Monday deals</title></head><body><p>Hi</p></body></html>");

        DealDetection d = detector.detect(doc, Locale.ENGLISH).orElseThrow();
        assertThat(d.title()).isEqualTo("Cyber Monday");
        assertThat(d.confidence()).isEqualTo(Confidence.HIGH);
    }

    @Test
    void keywordsMatchWholeWordsOnly() {
        Document doc = Jsoup.parse(
                "<html><body><h1>Our flash salesman of the month</h1></body></html>");

        assertThat(detector.detect(doc, Locale.ENGLISH)).isEmpty();
    }

    @Test
    void fallsBackToEnglishForUnknownLocale() throws IOException {
        assertThat(detect("html/campaign-black-friday.html", Locale.GERMAN)).isPresent();
    }

    private Optional<DealDetection> detect(String resourcePath, Locale locale) throws IOException {
        URL url = CampaignDetectorTest.class.getClassLoader().getResource(resourcePath);
        assertThat(url).as("Test HTML resource not found: " + resourcePath).isNotNull();
        return detector.detect(Jsoup.parse(url.openStream(), "UTF-8", ""), locale);
    }
}
