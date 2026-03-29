package com.lmuls.dealtracker.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configures Spring MVC to serve the React SPA.
 *
 * Static assets (JS/CSS bundles) are served directly from the classpath at
 * {@code /static/}.  Any request that does not match an {@code /api/**}
 * path and does not resolve to a static file is forwarded to
 * {@code index.html} so that React Router can handle client-side navigation.
 *
 * The actual SPA catch-all forwarding is handled by
 * {@link com.lmuls.dealtracker.controller.SpaController}.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/");
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");
    }
}
