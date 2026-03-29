package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.api.model.DealPageResponse;
import com.lmuls.dealtracker.api.model.DealResponse;
import com.lmuls.dealtracker.enums.Confidence;
import com.lmuls.dealtracker.enums.DealType;
import com.lmuls.dealtracker.repository.DealRepository;
import com.lmuls.dealtracker.repository.TrackedSiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DealService {

    private final DealRepository dealRepository;
    private final TrackedSiteRepository siteRepository;

    @Transactional(readOnly = true)
    public List<DealResponse> listActiveDeals() {
        return dealRepository.findByActiveTrueOrderByDetectedAtDesc().stream()
                .map(DtoMapper::toDealResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DealPageResponse listDeals(Boolean active, String confidence, String type, int page, int size) {
        Confidence confEnum = confidence != null ? Confidence.valueOf(confidence) : null;
        DealType typeEnum = type != null ? DealType.valueOf(type) : null;

        Page<com.lmuls.dealtracker.entity.Deal> result = dealRepository.findWithFilters(
                active, confEnum, typeEnum, PageRequest.of(page, size));

        return toPageResponse(result, page, size);
    }

    @Transactional(readOnly = true)
    public DealPageResponse listSiteDeals(UUID siteId, int page, int size) {
        if (!siteRepository.existsById(siteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found: " + siteId);
        }
        Page<com.lmuls.dealtracker.entity.Deal> result =
                dealRepository.findByTrackedSiteIdOrderByDetectedAtDesc(siteId, PageRequest.of(page, size));
        return toPageResponse(result, page, size);
    }

    private static DealPageResponse toPageResponse(
            Page<com.lmuls.dealtracker.entity.Deal> dealPage, int page, int size) {
        return new DealPageResponse()
                .content(dealPage.getContent().stream().map(DtoMapper::toDealResponse).toList())
                .totalElements(dealPage.getTotalElements())
                .totalPages(dealPage.getTotalPages())
                .page(page)
                .size(size);
    }
}
