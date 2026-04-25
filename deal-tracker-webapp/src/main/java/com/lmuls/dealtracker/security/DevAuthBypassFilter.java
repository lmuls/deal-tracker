package com.lmuls.dealtracker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Injects a pre-authenticated dev user into the security context for every request,
 * bypassing the login flow entirely.
 *
 * Only active when BOTH conditions hold:
 *   1. Spring profile is NOT "prod"  (@Profile guard)
 *   2. app.dev.bypass-auth=true      (property guard)
 *
 * Activate by running with SPRING_PROFILES_ACTIVE=dev and APP_DEV_BYPASS_AUTH=true
 * (or set app.dev.bypass-auth: true in application-dev.yaml temporarily).
 */
@Component
@Profile("!prod")
@ConditionalOnProperty(name = "app.dev.bypass-auth", havingValue = "true")
public class DevAuthBypassFilter extends OncePerRequestFilter {

    private static final String DEV_USER = "dev@dealtracker.local";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            var auth = new UsernamePasswordAuthenticationToken(
                    DEV_USER, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        chain.doFilter(request, response);
    }
}
