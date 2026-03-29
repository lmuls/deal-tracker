package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.entity.FetchLog;
import com.lmuls.dealtracker.entity.Snapshot;
import com.lmuls.dealtracker.entity.TrackedSite;
import com.lmuls.dealtracker.enums.FetchStatus;
import com.lmuls.dealtracker.enums.SnapshotStatus;
import com.lmuls.dealtracker.repository.FetchLogRepository;
import com.lmuls.dealtracker.repository.SnapshotRepository;
import com.lmuls.dealtracker.repository.TrackedSiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HarvestPersistenceService {

    private final TrackedSiteRepository trackedSiteRepository;
    private final FetchLogRepository fetchLogRepository;
    private final SnapshotRepository snapshotRepository;

    @Transactional(readOnly = true)
    public Optional<TrackedSite> loadSite(UUID siteId) {
        return trackedSiteRepository.findById(siteId);
    }

    @Transactional
    public void persistSuccess(UUID siteId, String hash, int httpStatus, String relativePath) {
        TrackedSite site = trackedSiteRepository.findById(siteId).orElseThrow();
        Instant now = Instant.now();

        FetchLog fetchLog = fetchLogRepository.save(FetchLog.builder()
                .trackedSite(site)
                .status(FetchStatus.SUCCESS)
                .contentHash(hash)
                .httpStatus(httpStatus)
                .fetchedAt(now)
                .build());

        snapshotRepository.save(Snapshot.builder()
                .trackedSite(site)
                .fetchLog(fetchLog)
                .status(SnapshotStatus.PENDING_PARSE)
                .contentHash(hash)
                .filePath(relativePath)
                .fetchedAt(now)
                .build());

        site.setLastContentHash(hash);
        site.setLastCheckedAt(now);
    }

    @Transactional
    public void persistUnchanged(UUID siteId, String hash, int httpStatus) {
        TrackedSite site = trackedSiteRepository.findById(siteId).orElseThrow();
        Instant now = Instant.now();

        fetchLogRepository.save(FetchLog.builder()
                .trackedSite(site)
                .status(FetchStatus.UNCHANGED)
                .contentHash(hash)
                .httpStatus(httpStatus)
                .fetchedAt(now)
                .build());

        site.setLastCheckedAt(now);
    }

    @Transactional
    public void persistFailed(UUID siteId, Integer httpStatus, String errorMessage) {
        TrackedSite site = trackedSiteRepository.findById(siteId).orElseThrow();

        fetchLogRepository.save(FetchLog.builder()
                .trackedSite(site)
                .status(FetchStatus.FAILED)
                .httpStatus(httpStatus)
                .errorMessage(errorMessage)
                .fetchedAt(Instant.now())
                .build());

        site.setLastCheckedAt(Instant.now());
    }
}
