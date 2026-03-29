package com.lmuls.dealtracker.service;

import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.lmuls.dealtracker.config.HarvesterProperties;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.time.Duration;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;

class RobotsTxtServiceTest {

    private WireMockServer wireMock;
    private RobotsTxtService robotsTxtService;

    @BeforeEach
    void setUp() {
        wireMock = new WireMockServer(WireMockConfiguration.wireMockConfig().dynamicPort());
        wireMock.start();

        HarvesterProperties props = new HarvesterProperties();
        props.setRobotsCacheTtl(Duration.ofMinutes(10));
        props.setHttpTimeout(Duration.ofSeconds(5));
        props.setUserAgent("DealTrackerBot-Test/1.0");

        robotsTxtService = new RobotsTxtService(HttpClient.newHttpClient(), props);
    }

    @AfterEach
    void tearDown() {
        wireMock.stop();
    }

    @Test
    void allowsPathNotListedInRobotsTxt() {
        wireMock.stubFor(get(urlEqualTo("/robots.txt"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withBody("User-agent: *\nDisallow: /admin\n")));

        assertThat(robotsTxtService.isAllowed(baseUrl() + "/products")).isTrue();
    }

    @Test
    void blocksDisallowedPath() {
        wireMock.stubFor(get(urlEqualTo("/robots.txt"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withBody("User-agent: *\nDisallow: /admin\n")));

        assertThat(robotsTxtService.isAllowed(baseUrl() + "/admin/dashboard")).isFalse();
    }

    @Test
    void allowsWhenRobotsTxtReturns404() {
        wireMock.stubFor(get(urlEqualTo("/robots.txt"))
                .willReturn(aResponse().withStatus(404)));

        assertThat(robotsTxtService.isAllowed(baseUrl() + "/deals")).isTrue();
    }

    @Test
    void allowsWhenRobotsTxtFetchFails() {
        // No stub — connection refused scenario simulated by a non-existent port
        assertThat(robotsTxtService.isAllowed("http://localhost:1/deals")).isTrue();
    }

    @Test
    void ignoresDisallowForOtherUserAgents() {
        wireMock.stubFor(get(urlEqualTo("/robots.txt"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withBody("User-agent: Googlebot\nDisallow: /\n")));

        assertThat(robotsTxtService.isAllowed(baseUrl() + "/deals")).isTrue();
    }

    @Test
    void cachesRobotsTxtBetweenCalls() {
        wireMock.stubFor(get(urlEqualTo("/robots.txt"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withBody("User-agent: *\nDisallow: /secret\n")));

        robotsTxtService.isAllowed(baseUrl() + "/page1");
        robotsTxtService.isAllowed(baseUrl() + "/page2");

        wireMock.verify(1, getRequestedFor(urlEqualTo("/robots.txt")));
    }

    private String baseUrl() {
        return "http://localhost:" + wireMock.port();
    }
}
