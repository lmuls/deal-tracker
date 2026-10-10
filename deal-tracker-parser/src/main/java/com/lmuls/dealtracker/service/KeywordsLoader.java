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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

/**
 * Loads deal-keywords.yml at startup and compiles every keyword and pattern
 * into a regex once. Provides per-locale category → patterns maps to the
 * {@link com.lmuls.dealtracker.detector.CampaignDetector}.
 */
@Service
@Slf4j
public class KeywordsLoader {

    private static final int FLAGS = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE;

    private final Resource keywordsResource;
    private final ObjectMapper yamlObjectMapper;

    private Map<String, Map<String, List<Pattern>>> compiled = Map.of();

    public KeywordsLoader(
            @Value("classpath:deal-keywords.yml") Resource keywordsResource,
            @Qualifier("yamlObjectMapper") ObjectMapper yamlObjectMapper) {
        this.keywordsResource = keywordsResource;
        this.yamlObjectMapper = yamlObjectMapper;
    }

    @PostConstruct
    public void load() throws IOException {
        KeywordsConfig config = yamlObjectMapper.readValue(keywordsResource.getInputStream(), KeywordsConfig.class);
        Map<String, Map<String, List<Pattern>>> result = new HashMap<>();
        config.getLocales().forEach((locale, categories) -> {
            Map<String, List<Pattern>> byCategory = new HashMap<>();
            categories.forEach((name, cat) -> byCategory.put(name, compile(cat)));
            result.put(locale, byCategory);
        });
        compiled = result;
        log.info("Loaded deal-keywords.yml — {} locale(s): {}", compiled.size(), compiled.keySet());
    }

    /**
     * Returns category → compiled patterns for the given locale, falling back to "en".
     */
    public Map<String, List<Pattern>> getForLocale(String locale) {
        Map<String, List<Pattern>> result = compiled.get(locale);
        if (result != null) return result;
        return compiled.getOrDefault("en", Map.of());
    }

    /** Patterns first (they carry discount values), then keywords as whole-word matches. */
    private static List<Pattern> compile(KeywordsConfig.CategoryKeywords cat) {
        List<Pattern> patterns = new ArrayList<>();
        for (String raw : cat.getPatterns()) {
            try {
                patterns.add(Pattern.compile(raw, FLAGS));
            } catch (PatternSyntaxException e) {
                log.warn("Skipping invalid pattern in deal-keywords.yml: {}", raw);
            }
        }
        for (String kw : cat.getKeywords()) {
            patterns.add(Pattern.compile(
                    "(?<![\\p{L}\\p{N}])" + Pattern.quote(kw) + "(?![\\p{L}\\p{N}])", FLAGS));
        }
        return patterns;
    }
}
