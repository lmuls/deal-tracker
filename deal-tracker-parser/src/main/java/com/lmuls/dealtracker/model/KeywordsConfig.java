package com.lmuls.dealtracker.model;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Typed model for deal-keywords.yml.
 * Structure: locales → locale code → category name → patterns/keywords.
 */
@Getter
@Setter
public class KeywordsConfig {

    private Map<String, Map<String, CategoryKeywords>> locales = new HashMap<>();

    @Getter
    @Setter
    public static class CategoryKeywords {
        private List<String> patterns = new ArrayList<>();
        private List<String> keywords = new ArrayList<>();
    }
}
