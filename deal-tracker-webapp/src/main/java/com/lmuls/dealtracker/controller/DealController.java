package com.lmuls.dealtracker.controller;

import com.lmuls.dealtracker.api.DealsApi;
import com.lmuls.dealtracker.api.model.DealPageResponse;
import com.lmuls.dealtracker.api.model.DealResponse;
import com.lmuls.dealtracker.service.DealService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DealController implements DealsApi {

    private final DealService dealService;

    @Override
    public ResponseEntity<List<DealResponse>> listActiveDeals() {
        return ResponseEntity.ok(dealService.listActiveDeals());
    }

    @Override
    public ResponseEntity<DealPageResponse> listDeals(
            Boolean active, String confidence, String type, Integer page, Integer size) {
        return ResponseEntity.ok(dealService.listDeals(active, confidence, type, page, size));
    }

    @Override
    public ResponseEntity<DealPageResponse> listSiteDeals(UUID id, Integer page, Integer size) {
        return ResponseEntity.ok(dealService.listSiteDeals(id, page, size));
    }
}
