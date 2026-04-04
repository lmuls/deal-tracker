package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.api.model.PreferencesResponse;
import com.lmuls.dealtracker.api.model.UpdatePreferencesRequest;
import com.lmuls.dealtracker.entity.UserPreference;
import com.lmuls.dealtracker.enums.EmailFrequency;
import com.lmuls.dealtracker.repository.UserPreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PreferenceService {

    private final UserPreferenceRepository preferenceRepository;
    private final UserContext userContext;

    @Transactional(readOnly = true)
    public PreferencesResponse getPreferences() {
        var user = userContext.getCurrentUser();
        var prefs = preferenceRepository.findByUserId(user.getId())
                .orElseGet(() -> UserPreference.builder().user(user).build());
        return DtoMapper.toPreferencesResponse(prefs);
    }

    @Transactional
    public PreferencesResponse updatePreferences(UpdatePreferencesRequest req) {
        var user = userContext.getCurrentUser();
        var prefs = preferenceRepository.findByUserId(user.getId())
                .orElseGet(() -> UserPreference.builder().user(user).build());

        prefs.setNotifyEmail(req.getNotifyEmail());
        prefs.setNotifyInApp(req.getNotifyInApp());
        prefs.setEmailFrequency(EmailFrequency.valueOf(req.getEmailFrequency().name()));

        return DtoMapper.toPreferencesResponse(preferenceRepository.save(prefs));
    }
}
