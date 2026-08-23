package com.lmuls.dealtracker.repository;

import com.lmuls.dealtracker.entity.DealFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface DealFeedbackRepository extends JpaRepository<DealFeedback, UUID> {

    boolean existsByTrackedSite_IdAndNormalizedTitle(UUID trackedSiteId, String normalizedTitle);

    @Transactional
    @Modifying
    @Query("DELETE FROM DealFeedback df WHERE df.trackedSite.id = :siteId AND df.normalizedTitle = :normTitle")
    void deleteByTrackedSiteIdAndNormalizedTitle(
            @Param("siteId") UUID siteId,
            @Param("normTitle") String normTitle);

    @Query("SELECT df.normalizedTitle FROM DealFeedback df WHERE df.trackedSite.id = :siteId")
    Set<String> findNormalizedTitlesByTrackedSiteId(@Param("siteId") UUID siteId);

    List<DealFeedback> findByTrackedSite_IdIn(Collection<UUID> trackedSiteIds);
}
