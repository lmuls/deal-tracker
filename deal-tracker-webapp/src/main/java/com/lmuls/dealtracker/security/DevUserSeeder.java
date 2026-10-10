package com.lmuls.dealtracker.security;

import com.lmuls.dealtracker.entity.User;
import com.lmuls.dealtracker.entity.UserPreference;
import com.lmuls.dealtracker.repository.UserPreferenceRepository;
import com.lmuls.dealtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Ensures the user injected by {@link DevAuthBypassFilter} exists in the database,
 * so code resolving the current user (e.g. UserContext) works as for a real login.
 *
 * Uses the same guards as the filter.
 */
@Slf4j
@Component
@Profile("!prod")
@ConditionalOnProperty(name = "app.dev.bypass-auth", havingValue = "true")
@RequiredArgsConstructor
public class DevUserSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.findByEmail(DevAuthBypassFilter.DEV_USER).isPresent()) {
            return;
        }

        // Random password: the dev user is only reachable through the bypass filter
        User user = userRepository.save(User.builder()
                .email(DevAuthBypassFilter.DEV_USER)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .build());

        userPreferenceRepository.save(UserPreference.builder().user(user).build());

        log.warn("Auth bypass enabled: created dev user {}", DevAuthBypassFilter.DEV_USER);
    }
}
