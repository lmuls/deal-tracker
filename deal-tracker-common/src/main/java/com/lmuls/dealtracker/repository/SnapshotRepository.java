package com.lmuls.dealtracker.repository;

import com.lmuls.dealtracker.entity.Snapshot;
import com.lmuls.dealtracker.enums.SnapshotStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SnapshotRepository extends JpaRepository<Snapshot, UUID> {

    List<Snapshot> findByStatus(SnapshotStatus status);

    List<Snapshot> findByTrackedSiteIdOrderByFetchedAtDesc(UUID trackedSiteId);
}
