package com.lmuls.dealtracker.scheduler;

import com.lmuls.dealtracker.entity.TrackedSite;
import com.lmuls.dealtracker.entity.User;
import com.lmuls.dealtracker.repository.TrackedSiteRepository;
import com.lmuls.dealtracker.service.HarvestService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HarvestSchedulerTest {

    @Mock
    private TrackedSiteRepository trackedSiteRepository;

    @Mock
    private HarvestService harvestService;

    @InjectMocks
    private HarvestScheduler scheduler;

    @Test
    void harvestsSitesThatAreDue() {
        TrackedSite overdueSite = siteWithLastChecked("1 hour", Instant.now().minusSeconds(7200));
        when(trackedSiteRepository.findByActiveTrue()).thenReturn(List.of(overdueSite));

        scheduler.scheduledHarvest();

        verify(harvestService).harvest(overdueSite);
    }

    @Test
    void skipsRecentlyCheckedSites() {
        TrackedSite recentSite = siteWithLastChecked("1 hour", Instant.now().minusSeconds(60));
        when(trackedSiteRepository.findByActiveTrue()).thenReturn(List.of(recentSite));

        scheduler.scheduledHarvest();

        verifyNoInteractions(harvestService);
    }

    @Test
    void harvesNeverCheckedSiteImmediately() {
        TrackedSite neverChecked = siteWithLastChecked("1 hour", null);
        when(trackedSiteRepository.findByActiveTrue()).thenReturn(List.of(neverChecked));

        scheduler.scheduledHarvest();

        verify(harvestService).harvest(neverChecked);
    }

    @Test
    void skipsAndLogsWhenCheckIntervalIsInvalid() {
        TrackedSite badSite = siteWithLastChecked("bad format", null);
        when(trackedSiteRepository.findByActiveTrue()).thenReturn(List.of(badSite));

        // Should not throw
        scheduler.scheduledHarvest();

        verifyNoInteractions(harvestService);
    }

    @Test
    void continuesHarvestingOtherSitesAfterOneThrows() {
        TrackedSite failingSite = siteWithLastChecked("1 hour", Instant.now().minusSeconds(7200));
        TrackedSite goodSite = siteWithLastChecked("1 hour", Instant.now().minusSeconds(7200));

        when(trackedSiteRepository.findByActiveTrue()).thenReturn(List.of(failingSite, goodSite));
        doThrow(new RuntimeException("network error")).when(harvestService).harvest(failingSite);

        scheduler.scheduledHarvest();

        verify(harvestService).harvest(goodSite);
    }

    private TrackedSite siteWithLastChecked(String interval, Instant lastCheckedAt) {
        return TrackedSite.builder()
                .id(UUID.randomUUID())
                .user(User.builder().id(UUID.randomUUID()).email("test@example.com").build())
                .url("http://example.com/deals")
                .name("Test")
                .checkInterval(interval)
                .lastCheckedAt(lastCheckedAt)
                .build();
    }
}
