package com.lmuls.dealtracker.replay;

import com.lmuls.dealtracker.service.DealLifecycle;

import java.time.Instant;

/**
 * The outcome of one snapshot during a replay. {@code transition} is null
 * when the snapshot file could not be read.
 */
public record ReplayEvent(Instant fetchedAt, String file, DealLifecycle.Transition transition) {

    /** True when this snapshot would have created a deal (and so can trigger notifications). */
    public boolean triggers() {
        return transition != null && transition.kind().createsDeal();
    }
}
