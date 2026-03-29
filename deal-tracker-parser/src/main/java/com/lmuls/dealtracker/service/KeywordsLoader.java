package com.lmuls.dealtracker.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lmuls.dealtracker.model.KeywordsConfig;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;

/**
 * Loads and caches the deal-keywords.yml file at startup.
 * Provides per-locale keyword/pattern maps to the {@link com.lmuls.dealtracker.detector.TextPatternDetector}.
 */
@Service
@Slf4j
public class KeywordsLoader {

    private final Resource keywordsResource;
    private final ObjectMapper yamlObjectMapper;

    private KeywordsConfig config;

    public KeywordsLoader(
            @Value("classpath:deal-keywords.yml") Resource keywordsResource,
            @Qualifier("yamlObjectMapper") ObjectMapper yamlObjectMapper) {
        this.keywordsResource = keywordsResource;
        this.yamlObjectMapper = yamlObjectMapper;
    }

    @PostConstruct
    public void load() throws IOException {
        config = yamlObjectMapper.readValue(keywordsResource.getInputStream(), KeywordsConfig.class);
        log.info("Loaded deal-keywords.yml — {} locale(s): {}",
                config.getLocales().size(), config.getLocales().keySet());
    }

    /**
     * Returns category → keywords/patterns for the given locale, falling back to "en".
     */
    public Map<String, KeywordsConfig.CategoryKeywords> getForLocale(String locale) {
        Map<String, KeywordsConfig.CategoryKeywords> result = config.getLocales().get(locale);
        if (result != null) return result;
        // Fallback to English
        return config.getLocales().getOrDefault("en", Map.of());
    }
}
