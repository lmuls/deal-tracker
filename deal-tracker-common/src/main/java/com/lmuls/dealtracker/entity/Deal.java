package com.lmuls.dealtracker.entity;

import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DealType;
import com.lmuls.dealtracker.enums.DetectionLayer;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deals")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private Snapshot snapshot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tracked_site_id", nullable = false)
    private TrackedSite trackedSite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DealType type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "discount_value")
    private String discountValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Confidence confidence;

    @Enumerated(EnumType.STRING)
    @Column(name = "detection_layer", nullable = false)
    private DetectionLayer detectionLayer;

    @Column(name = "detected_at", nullable = false, updatable = false)
    private Instant detectedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @PrePersist
    protected void onCreate() {
        if (detectedAt == null) detectedAt = Instant.now();
    }
}
