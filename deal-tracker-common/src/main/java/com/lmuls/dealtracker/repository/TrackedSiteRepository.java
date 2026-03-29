package com.lmuls.dealtracker.repository;

import com.lmuls.dealtracker.entity.TrackedSite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TrackedSiteRepository extends JpaRepository<TrackedSite, UUID> {

    List<TrackedSite> findByUserId(UUID userId);

    List<TrackedSite> findByActiveTrue();
}
