package com.lmuls.dealtracker.model;

import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DealType;
import com.lmuls.dealtracker.enums.DetectionLayer;

import java.time.Instant;

/**
 * Immutable value object produced by each detection layer.
 * The {@code expiresAt} field is nullable — best-effort only.
 */
public record DealDetection(
        DealType type,
        String title,
        String description,
        String discountValue,
        Confidence confidence,
        DetectionLayer detectionLayer,
        Instant expiresAt
) {

    /** Returns a copy of this detection with {@code expiresAt} set. */
    public DealDetection withExpiresAt(Instant expiresAt) {
        return new DealDetection(type, title, description, discountValue,
                confidence, detectionLayer, expiresAt);
    }

    /** Returns a copy of this detection with {@code confidence} set. */
    public DealDetection withConfidence(Confidence confidence) {
        return new DealDetection(type, title, description, discountValue,
                confidence, detectionLayer, expiresAt);
    }
}
