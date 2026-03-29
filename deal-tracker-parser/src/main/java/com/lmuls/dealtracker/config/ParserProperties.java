package com.lmuls.dealtracker.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "parser")
@Getter
@Setter
public class ParserProperties {

    /** Base directory where harvester writes raw HTML snapshots. */
    private String snapshotDir = "/data/snapshots";

    /** IETF language tag used when a page has no detectable locale. */
    private String defaultLocale = "en";
}
