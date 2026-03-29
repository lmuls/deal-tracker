package com.lmuls.dealtracker.controller;

import com.lmuls.dealtracker.api.model.*;
import com.lmuls.dealtracker.service.DealService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DealController.class)
class DealControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean DealService dealService;

    @Test
    void listActiveDealsReturns200() throws Exception {
        var deal = activeDeal();
        when(dealService.listActiveDeals()).thenReturn(List.of(deal));

        mockMvc.perform(get("/api/v1/deals/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Spring Sale"));
    }

    @Test
    void listDealsWithFiltersReturns200() throws Exception {
        var page = new DealPageResponse()
                .content(List.of(activeDeal()))
                .totalElements(1L).totalPages(1).page(0).size(20);
        when(dealService.listDeals(true, null, null, 0, 20)).thenReturn(page);

        mockMvc.perform(get("/api/v1/deals").param("active", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void listSiteDealsReturns200() throws Exception {
        UUID siteId = UUID.randomUUID();
        var page = new DealPageResponse()
                .content(List.of())
                .totalElements(0L).totalPages(0).page(0).size(20);
        when(dealService.listSiteDeals(siteId, 0, 20)).thenReturn(page);

        mockMvc.perform(get("/api/v1/sites/{id}/deals", siteId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    private DealResponse activeDeal() {
        return new DealResponse()
                .id(UUID.randomUUID())
                .siteId(UUID.randomUUID())
                .siteName("Shop")
                .type(DealType.SALE_EVENT)
                .title("Spring Sale")
                .confidence(Confidence.HIGH)
                .detectionLayer(DetectionLayer.STRUCTURED_DATA)
                .active(true);
    }
}
