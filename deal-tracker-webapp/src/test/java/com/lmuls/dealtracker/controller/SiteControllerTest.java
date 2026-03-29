package com.lmuls.dealtracker.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jackson.autoconfigure.JacksonAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lmuls.dealtracker.api.model.CreateSiteRequest;
import com.lmuls.dealtracker.api.model.SiteResponse;
import com.lmuls.dealtracker.api.model.UpdateSiteRequest;
import com.lmuls.dealtracker.service.SiteService;

@WebMvcTest(SiteController.class)
@Import(JacksonAutoConfiguration.class) // This forces the default JSON mapper to exist
class SiteControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean SiteService siteService;

    @TestConfiguration
    static class TestConfig {
        @Bean
        public ObjectMapper objectMapper() {
            return new ObjectMapper();
        }
    }

    @Test
    void listSitesReturns200() throws Exception {
        var site = new SiteResponse().id(UUID.randomUUID()).url("https://example.com")
                .name("Example").checkInterval("1 hour").active(true)
                .activeDealsCount(0).hasActiveDeal(false);
        when(siteService.listSites()).thenReturn(List.of(site));

        mockMvc.perform(get("/api/v1/sites"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].url").value("https://example.com"));
    }

    @Test
    void createSiteReturns201() throws Exception {
        var req = new CreateSiteRequest().url(new URI("https://shop.com")).name("Shop").checkInterval("1 hour");
        var resp = new SiteResponse().id(UUID.randomUUID()).url("https://shop.com")
                .name("Shop").checkInterval("1 hour").active(true)
                .activeDealsCount(0).hasActiveDeal(false);
        when(siteService.createSite(any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/sites")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.url").value("https://shop.com"));
    }

    @Test
    void getSiteNotFoundReturns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(siteService.getSite(id))
                .thenThrow(new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND));

        mockMvc.perform(get("/api/v1/sites/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateSiteReturns200() throws Exception {
        UUID id = UUID.randomUUID();
        var req = new UpdateSiteRequest().name("New Name");
        var resp = new SiteResponse().id(id).name("New Name").checkInterval("1 hour")
                .active(true).activeDealsCount(0).hasActiveDeal(false);
        when(siteService.updateSite(eq(id), any())).thenReturn(resp);

        mockMvc.perform(put("/api/v1/sites/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Name"));
    }

    @Test
    void deleteSiteReturns204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(siteService).deleteSite(id);

        mockMvc.perform(delete("/api/v1/sites/{id}", id))
                .andExpect(status().isNoContent());
    }
}
