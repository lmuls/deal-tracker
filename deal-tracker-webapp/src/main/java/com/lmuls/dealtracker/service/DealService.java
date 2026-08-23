package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.api.model.DealPageResponse;
import com.lmuls.dealtracker.api.model.DealResponse;
import com.lmuls.dealtracker.entity.Deal;
import com.lmuls.dealtracker.entity.DealFeedback;
import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DealType;
import com.lmuls.dealtracker.repository.DealFeedbackRepository;
import com.lmuls.dealtracker.repository.DealRepository;
import com.lmuls.dealtracker.repository.TrackedSiteRepository;
import com.lmuls.dealtracker.util.TitleNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DealService {

    private final DealRepository dealRepository;
    private final TrackedSiteRepository siteRepository;
    private final DealFeedbackRepository feedbackRepository;
    private final UserContext userContext;

    @Transactional(readOnly = true)
    public List<DealResponse> listActiveDeals() {
        return dealRepository.findByActiveTrueOrderByDetectedAtDesc().stream()
                .map(d -> DtoMapper.toDealResponse(d, Set.of()))
                .toList();
    }

    @Transactional(readOnly = true)
    public DealPageResponse listDeals(Boolean active, String confidence, String type, int page, int size) {
        Confidence confEnum = confidence != null ? Confidence.valueOf(confidence) : null;
        DealType typeEnum = type != null ? DealType.valueOf(type) : null;

        Page<Deal> result = dealRepository.findWithFilters(active, confEnum, typeEnum, PageRequest.of(page, size));

        List<UUID> siteIds = result.getContent().stream()
                .map(d -> d.getTrackedSite().getId()).distinct().toList();
        Set<String> blockedKeys = feedbackRepository.findByTrackedSite_IdIn(siteIds).stream()
                .map(f -> f.getTrackedSite().getId() + "::" + f.getNormalizedTitle())
                .collect(Collectors.toSet());

        return toPageResponse(result, page, size, blockedKeys);
    }

    @Transactional(readOnly = true)
    public DealPageResponse listSiteDeals(UUID siteId, int page, int size) {
        if (!siteRepository.existsById(siteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found: " + siteId);
        }
        Page<Deal> result = dealRepository.findByTrackedSiteIdOrderByDetectedAtDesc(siteId, PageRequest.of(page, size));
        Set<String> blocked = feedbackRepository.findNormalizedTitlesByTrackedSiteId(siteId);
        Set<String> blockedKeys = blocked.stream()
                .map(t -> siteId + "::" + t)
                .collect(Collectors.toSet());
        return toPageResponse(result, page, size, blockedKeys);
    }

    @Transactional
    public void markInvalid(UUID dealId) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal not found"));
        requireOwnership(deal);

        String normTitle = TitleNormalizer.normalize(deal.getTitle());
        UUID siteId = deal.getTrackedSite().getId();

        if (!feedbackRepository.existsByTrackedSite_IdAndNormalizedTitle(siteId, normTitle)) {
            feedbackRepository.save(DealFeedback.builder()
                    .trackedSite(deal.getTrackedSite())
                    .normalizedTitle(normTitle)
                    .user(userContext.getCurrentUser())
                    .originalDeal(deal)
                    .dealType(deal.getType().name())
                    .confidence(deal.getConfidence().name())
                    .detectionLayer(deal.getDetectionLayer().name())
                    .build());
        }

        List<Deal> toDeactivate = dealRepository.findByTrackedSiteIdOrderByDetectedAtDesc(siteId).stream()
                .filter(d -> normTitle.equals(TitleNormalizer.normalize(d.getTitle())))
                .filter(Deal::getActive)
                .toList();
        toDeactivate.forEach(d -> d.setActive(false));
        dealRepository.saveAll(toDeactivate);
    }

    @Transactional
    public void restore(UUID dealId) {
        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deal not found"));
        requireOwnership(deal);

        String normTitle = TitleNormalizer.normalize(deal.getTitle());
        UUID siteId = deal.getTrackedSite().getId();

        feedbackRepository.deleteByTrackedSiteIdAndNormalizedTitle(siteId, normTitle);

        List<Deal> toReactivate = dealRepository.findByTrackedSiteIdOrderByDetectedAtDesc(siteId).stream()
                .filter(d -> normTitle.equals(TitleNormalizer.normalize(d.getTitle())))
                .toList();
        toReactivate.forEach(d -> d.setActive(true));
        dealRepository.saveAll(toReactivate);
    }

    private void requireOwnership(Deal deal) {
        UUID currentUserId = userContext.getCurrentUser().getId();
        if (!deal.getTrackedSite().getUser().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private static DealPageResponse toPageResponse(Page<Deal> dealPage, int page, int size, Set<String> blockedKeys) {
        return new DealPageResponse()
                .content(dealPage.getContent().stream()
                        .map(d -> DtoMapper.toDealResponse(d, blockedKeys))
                        .toList())
                .totalElements(dealPage.getTotalElements())
                .totalPages(dealPage.getTotalPages())
                .page(page)
                .size(size);
    }
}
