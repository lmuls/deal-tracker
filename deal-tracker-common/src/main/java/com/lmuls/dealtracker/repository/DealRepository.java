package com.lmuls.dealtracker.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lmuls.dealtracker.entity.Deal;
import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DealType;

public interface DealRepository extends JpaRepository<Deal, UUID> {

    List<Deal> findByTrackedSiteIdOrderByDetectedAtDesc(UUID trackedSiteId);

    Page<Deal> findByTrackedSiteIdOrderByDetectedAtDesc(UUID trackedSiteId, Pageable pageable);

    List<Deal> findByActiveTrue();

    List<Deal> findByActiveTrueOrderByDetectedAtDesc();

    List<Deal> findByTrackedSiteIdAndActiveTrue(UUID trackedSiteId);

    List<Deal> findByDetectedAtAfterOrderByDetectedAtAsc(Instant after);

    /**
     * Filtered paginated query — all parameters are optional (null = no filter applied).
     */
    @Query("SELECT d FROM Deal d WHERE " +
           "(:active IS NULL OR d.active = :active) AND " +
           "(:confidence IS NULL OR d.confidence = :confidence) AND " +
           "(:type IS NULL OR d.type = :type) " +
           "ORDER BY d.detectedAt DESC")
    Page<Deal> findWithFilters(
            @Param("active") Boolean active,
            @Param("confidence") Confidence confidence,
            @Param("type") DealType type,
            Pageable pageable);
}
