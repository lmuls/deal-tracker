package com.lmuls.dealtracker.detector;

import com.lmuls.dealtracker.model.DealDetection;
import org.jsoup.nodes.Document;

import java.util.List;
import java.util.Locale;

/**
 * Common interface for all detection layers.
 * Implementations must be side-effect-free and thread-safe.
 */
public interface DealDetector {

    List<DealDetection> detect(Document htmlDoc, Locale locale);
}
