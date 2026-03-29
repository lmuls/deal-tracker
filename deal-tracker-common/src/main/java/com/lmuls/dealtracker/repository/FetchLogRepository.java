package com.lmuls.dealtracker.repository;

import com.lmuls.dealtracker.entity.FetchLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FetchLogRepository extends JpaRepository<FetchLog, UUID> {

    List<FetchLog> findByTrackedSiteIdOrderByFetchedAtDesc(UUID trackedSiteId);
}
