package com.lmuls.dealtracker.util;

import java.util.Locale;

public final class TitleNormalizer {

    private TitleNormalizer() {}

    public static String normalize(String title) {
        if (title == null) return "";
        return title.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }
}
