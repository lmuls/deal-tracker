package com.lmuls.dealtracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tracked_sites")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackedSite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String name;

    /** Stores the check interval as a string (e.g. "1 hour", "6 hours"). */
    @Column(name = "check_interval", nullable = false)
    private String checkInterval;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "last_content_hash")
    private String lastContentHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
