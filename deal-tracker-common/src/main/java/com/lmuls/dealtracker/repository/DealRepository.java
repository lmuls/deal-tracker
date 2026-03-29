package com.lmuls.dealtracker.repository;

import com.lmuls.dealtracker.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DealRepository extends JpaRepository<Deal, UUID> {

    List<Deal> findByTrackedSiteIdOrderByDetectedAtDesc(UUID trackedSiteId);

    List<Deal> findByActiveTrue();

    List<Deal> findByTrackedSiteIdAndActiveTrue(UUID trackedSiteId);
}
