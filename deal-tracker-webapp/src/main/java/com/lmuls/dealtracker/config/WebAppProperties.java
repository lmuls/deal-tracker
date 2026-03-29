package com.lmuls.dealtracker.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "webapp")
@Getter
@Setter
public class WebAppProperties {

    /** How often the notification dispatch job runs (milliseconds). */
    private long dispatchIntervalMs = 30_000;

    /** Email address used when auto-creating the default single-user account. */
    private String defaultUserEmail = "admin@dealtracker.local";

    /** Cron for the daily digest email job (default: 08:00 every day). */
    private String dailyDigestCron = "0 0 8 * * *";
}
