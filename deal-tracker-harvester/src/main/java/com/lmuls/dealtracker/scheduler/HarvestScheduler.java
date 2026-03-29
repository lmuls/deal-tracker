package com.lmuls.dealtracker.scheduler;

import com.lmuls.dealtracker.entity.TrackedSite;
import com.lmuls.dealtracker.repository.TrackedSiteRepository;
import com.lmuls.dealtracker.service.HarvestService;
import com.lmuls.dealtracker.util.CheckIntervalParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class HarvestScheduler {

    private final TrackedSiteRepository trackedSiteRepository;
    private final HarvestService harvestService;

    /**
     * Runs every 60 seconds. Loads all active sites and dispatches a harvest
     * for each site that is due based on its configured check interval.
     * Uses fixedDelay so the next tick only starts after the current one
     * completes, preventing pile-up if harvesting takes longer than expected.
     */
    @Scheduled(fixedDelay = 60_000)
    public void scheduledHarvest() {
        List<TrackedSite> sites = trackedSiteRepository.findByActiveTrue();
        Instant now = Instant.now();
        log.debug("Harvest tick — checking {} active site(s)", sites.size());

        for (TrackedSite site : sites) {
            try {
                Duration interval = CheckIntervalParser.parse(site.getCheckInterval());
                Instant dueAfter = (site.getLastCheckedAt() == null)
                        ? Instant.EPOCH
                        : site.getLastCheckedAt().plus(interval);

                if (now.isAfter(dueAfter)) {
                    log.info("Harvesting site {} ({})", site.getId(), site.getUrl());
                    harvestService.harvest(site);
                }
            } catch (IllegalArgumentException e) {
                log.warn("Skipping site {} — unparseable checkInterval '{}': {}",
                        site.getId(), site.getCheckInterval(), e.getMessage());
            } catch (Exception e) {
                log.error("Unhandled error harvesting site {}", site.getId(), e);
            }
        }
    }
}
