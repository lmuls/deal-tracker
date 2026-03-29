package com.lmuls.dealtracker.scheduler;

import com.lmuls.dealtracker.entity.Snapshot;
import com.lmuls.dealtracker.enums.SnapshotStatus;
import com.lmuls.dealtracker.repository.SnapshotRepository;
import com.lmuls.dealtracker.service.ParseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Polls for snapshots in {@code PENDING_PARSE} state and dispatches them
 * to the parse pipeline. Uses fixedDelay so the next tick only starts
 * after all pending snapshots from the previous tick have been processed.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ParseScheduler {

    private final SnapshotRepository snapshotRepository;
    private final ParseService parseService;

    @Scheduled(fixedDelayString = "${parser.poll-interval-ms:30000}")
    public void scheduledParse() {
        List<Snapshot> pending = snapshotRepository.findByStatus(SnapshotStatus.PENDING_PARSE);
        if (pending.isEmpty()) return;

        log.debug("Parse tick — {} snapshot(s) pending", pending.size());

        for (Snapshot snapshot : pending) {
            try {
                parseService.parse(snapshot);
            } catch (Exception e) {
                log.error("Unhandled error parsing snapshot {}", snapshot.getId(), e);
            }
        }
    }
}
