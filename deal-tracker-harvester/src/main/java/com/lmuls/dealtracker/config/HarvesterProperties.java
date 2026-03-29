package com.lmuls.dealtracker.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "harvester")
@Getter
@Setter
public class HarvesterProperties {

    /** Base directory for raw HTML snapshot files. */
    private String snapshotDir = "/data/snapshots";

    /** Maximum number of HTTP fetch attempts per site per harvest cycle. */
    private int maxRetries = 3;

    /** Wait time before the first retry; doubles with each subsequent attempt. */
    private Duration initialBackoff = Duration.ofSeconds(2);

    private double backoffMultiplier = 2.0;

    /** How long to cache a domain's robots.txt before re-fetching. */
    private Duration robotsCacheTtl = Duration.ofHours(24);

    /** Per-request HTTP timeout. */
    private Duration httpTimeout = Duration.ofSeconds(15);

    private String userAgent = "DealTrackerBot/1.0";
}
