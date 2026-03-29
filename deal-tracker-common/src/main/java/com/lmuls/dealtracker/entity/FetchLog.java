package com.lmuls.dealtracker.entity;

import com.lmuls.dealtracker.enums.FetchStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "fetch_log")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FetchLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tracked_site_id", nullable = false)
    private TrackedSite trackedSite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FetchStatus status;

    @Column(name = "content_hash")
    private String contentHash;

    @Column(name = "http_status")
    private Integer httpStatus;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "fetched_at", nullable = false, updatable = false)
    private Instant fetchedAt;

    @PrePersist
    protected void onCreate() {
        if (fetchedAt == null) fetchedAt = Instant.now();
    }
}
