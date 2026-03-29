package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.config.WebAppProperties;
import com.lmuls.dealtracker.entity.User;
import com.lmuls.dealtracker.entity.UserPreference;
import com.lmuls.dealtracker.repository.UserPreferenceRepository;
import com.lmuls.dealtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Single-user context for v1. Returns the first user in the database,
 * auto-creating a default account (with default preferences) on first use.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserContext {

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final WebAppProperties properties;

    @Transactional
    public User getDefaultUser() {
        List<User> users = userRepository.findAll();
        if (!users.isEmpty()) return users.get(0);

        log.info("No users found — creating default account: {}", properties.getDefaultUserEmail());
        User user = userRepository.save(
                User.builder().email(properties.getDefaultUserEmail()).build());

        userPreferenceRepository.save(
                UserPreference.builder().user(user).build());

        return user;
    }
}
