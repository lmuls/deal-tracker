package com.lmuls.dealtracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deal_feedback")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DealFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tracked_site_id", nullable = false)
    private TrackedSite trackedSite;

    @Column(name = "normalized_title", nullable = false)
    private String normalizedTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_deal_id")
    private Deal originalDeal;

    @Column(name = "deal_type", nullable = false)
    private String dealType;

    @Column(nullable = false)
    private String confidence;

    @Column(name = "detection_layer", nullable = false)
    private String detectionLayer;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
