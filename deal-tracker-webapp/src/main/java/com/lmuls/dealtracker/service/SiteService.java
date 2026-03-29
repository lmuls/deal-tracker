package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.api.model.CreateSiteRequest;
import com.lmuls.dealtracker.api.model.SiteDetailResponse;
import com.lmuls.dealtracker.api.model.SiteResponse;
import com.lmuls.dealtracker.api.model.UpdateSiteRequest;
import com.lmuls.dealtracker.entity.TrackedSite;
import com.lmuls.dealtracker.repository.DealRepository;
import com.lmuls.dealtracker.repository.TrackedSiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SiteService {

    private final TrackedSiteRepository siteRepository;
    private final DealRepository dealRepository;
    private final UserContext userContext;

    @Transactional(readOnly = true)
    public List<SiteResponse> listSites() {
        return siteRepository.findAll().stream()
                .map(site -> {
                    long count = dealRepository.findByTrackedSiteIdAndActiveTrue(site.getId()).size();
                    return DtoMapper.toSiteResponse(site, count);
                })
                .toList();
    }

    @Transactional
    public SiteResponse createSite(CreateSiteRequest req) {
        var user = userContext.getDefaultUser();
        var site = siteRepository.save(TrackedSite.builder()
                .user(user)
                .url(req.getUrl().toString())
                .name(req.getName())
                .checkInterval(req.getCheckInterval())
                .build());
        return DtoMapper.toSiteResponse(site, 0);
    }

    @Transactional(readOnly = true)
    public SiteDetailResponse getSite(UUID id) {
        var site = findOrThrow(id);
        var activeDeals = dealRepository.findByTrackedSiteIdAndActiveTrue(id);
        return DtoMapper.toSiteDetailResponse(site, activeDeals);
    }

    @Transactional
    public SiteResponse updateSite(UUID id, UpdateSiteRequest req) {
        var site = findOrThrow(id);
        if (req.getName() != null) site.setName(req.getName());
        if (req.getCheckInterval() != null) site.setCheckInterval(req.getCheckInterval());
        if (req.getActive() != null) site.setActive(req.getActive());
        siteRepository.save(site);
        long count = dealRepository.findByTrackedSiteIdAndActiveTrue(id).size();
        return DtoMapper.toSiteResponse(site, count);
    }

    @Transactional
    public void deleteSite(UUID id) {
        findOrThrow(id);
        siteRepository.deleteById(id);
    }

    private TrackedSite findOrThrow(UUID id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found: " + id));
    }
}
