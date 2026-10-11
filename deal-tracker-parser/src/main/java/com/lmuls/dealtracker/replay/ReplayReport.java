package com.lmuls.dealtracker.replay;

import com.lmuls.dealtracker.entity.Deal;
import com.lmuls.dealtracker.service.DealLifecycle;

import java.util.List;

/**
 * Plain-text, diff-friendly rendering of a replay timeline. Used both for the
 * CLI output and as the golden file format in the replay regression test, so
 * keep it deterministic.
 */
public final class ReplayReport {

    private ReplayReport() {}

    public static String render(List<ReplayEvent> events) {
        StringBuilder sb = new StringBuilder();
        for (ReplayEvent e : events) {
            DealLifecycle.Transition t = e.transition();
            sb.append(e.fetchedAt()).append("  ")
                    .append(String.format("%-8s", t == null ? "ERROR" : t.kind())).append(' ')
                    .append(e.file());
            if (t != null && t.current() != null) sb.append("  ").append(describe(t.current()));
            if (t != null && !t.ended().isEmpty()) {
                sb.append("  (ended: ")
                        .append(String.join(", ", t.ended().stream().map(Deal::getTitle).toList()))
                        .append(')');
            }
            sb.append('\n');
        }
        long triggers = events.stream().filter(ReplayEvent::triggers).count();
        sb.append("-- ").append(events.size()).append(" snapshot(s), ")
                .append(triggers).append(" trigger(s)\n");
        return sb.toString();
    }

    private static String describe(Deal d) {
        StringBuilder sb = new StringBuilder()
                .append('"').append(d.getTitle()).append("\" ")
                .append(d.getType()).append(' ').append(d.getConfidence());
        if (d.getDiscountValue() != null) sb.append(" discount=").append(d.getDiscountValue());
        if (d.getExpiresAt() != null) sb.append(" expires=").append(d.getExpiresAt());
        return sb.toString();
    }
}
