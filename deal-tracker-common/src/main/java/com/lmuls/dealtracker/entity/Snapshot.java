package com.lmuls.dealtracker.entity;

import com.lmuls.dealtracker.enums.SnapshotStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "snapshots")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Snapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tracked_site_id", nullable = false)
    private TrackedSite trackedSite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fetch_log_id", nullable = false)
    private FetchLog fetchLog;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SnapshotStatus status;

    @Column(name = "content_hash", nullable = false)
    private String contentHash;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "fetched_at", nullable = false)
    private Instant fetchedAt;
}
