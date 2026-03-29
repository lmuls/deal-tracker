package com.lmuls.dealtracker.controller;

import com.lmuls.dealtracker.api.PreferencesApi;
import com.lmuls.dealtracker.api.model.PreferencesResponse;
import com.lmuls.dealtracker.api.model.UpdatePreferencesRequest;
import com.lmuls.dealtracker.service.PreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PreferenceController implements PreferencesApi {

    private final PreferenceService preferenceService;

    @Override
    public ResponseEntity<PreferencesResponse> getPreferences() {
        return ResponseEntity.ok(preferenceService.getPreferences());
    }

    @Override
    public ResponseEntity<PreferencesResponse> updatePreferences(UpdatePreferencesRequest req) {
        return ResponseEntity.ok(preferenceService.updatePreferences(req));
    }
}
