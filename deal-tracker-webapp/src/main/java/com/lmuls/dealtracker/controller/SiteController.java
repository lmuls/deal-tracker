package com.lmuls.dealtracker.controller;

import com.lmuls.dealtracker.api.SitesApi;
import com.lmuls.dealtracker.api.model.CreateSiteRequest;
import com.lmuls.dealtracker.api.model.SiteDetailResponse;
import com.lmuls.dealtracker.api.model.SiteResponse;
import com.lmuls.dealtracker.api.model.UpdateSiteRequest;
import com.lmuls.dealtracker.service.SiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SiteController implements SitesApi {

    private final SiteService siteService;

    @Override
    public ResponseEntity<List<SiteResponse>> listSites() {
        return ResponseEntity.ok(siteService.listSites());
    }

    @Override
    public ResponseEntity<SiteResponse> createSite(CreateSiteRequest createSiteRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(siteService.createSite(createSiteRequest));
    }

    @Override
    public ResponseEntity<SiteDetailResponse> getSite(UUID id) {
        return ResponseEntity.ok(siteService.getSite(id));
    }

    @Override
    public ResponseEntity<SiteResponse> updateSite(UUID id, UpdateSiteRequest updateSiteRequest) {
        return ResponseEntity.ok(siteService.updateSite(id, updateSiteRequest));
    }

    @Override
    public ResponseEntity<Void> deleteSite(UUID id) {
        siteService.deleteSite(id);
        return ResponseEntity.noContent().build();
    }
}
