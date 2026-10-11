package com.lmuls.dealtracker.service;

import com.lmuls.dealtracker.entity.Deal;
import com.lmuls.dealtracker.entity.Snapshot;
import com.lmuls.dealtracker.model.DealDetection;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

/**
 * Applies one snapshot's detection to a site's active deals: a new campaign
 * inserts a deal, an ongoing one is touched, a changed one is superseded by a
 * new version referencing it, and one no longer on the page is ended.
 * <p>
 * Works purely on in-memory {@link Deal} objects and reports which ones need
 * saving, so {@link ParseService} (which persists) and the snapshot replay
 * (which does not) run exactly the same rules.
 */
@Component
public class DealLifecycle {

    public enum Kind {
        /** A campaign appeared that was not active before. */
        NEW,
        /** Same campaign as before with different details — a new deal version. */
        CHANGED,
        /** Same campaign, same details. */
        ONGOING,
        /** The previous campaign is gone and nothing replaced it. */
        ENDED,
        /** No campaign before or now. */
        NONE;

        /** True when a deal row is created, i.e. the snapshot can trigger notifications. */
        public boolean createsDeal() {
            return this == NEW || this == CHANGED;
        }
    }

    /**
     * @param current the deal representing the detection after this snapshot, or null
     * @param ended   previously active deals that stopped (not including a superseded version)
     * @param toSave  every new or modified deal, in the order it must be persisted
     */
    public record Transition(Kind kind, Deal current, List<Deal> ended, List<Deal> toSave) {}

    public Transition apply(Snapshot snapshot, Optional<DealDetection> detection,
                            List<Deal> activeSiteDeals, Instant now) {
        List<Deal> toSave = new ArrayList<>();
        Kind kind;
        Deal current = null;

        if (detection.isPresent()) {
            DealDetection d = detection.get();
            Deal match = findActiveMatch(activeSiteDeals, d.title());
            if (match == null) {
                kind = Kind.NEW;
                current = newDeal(snapshot, d, null, now);
            } else if (contentEquals(d, match)) {
                kind = Kind.ONGOING;
                current = match;
                match.setLastSeenAt(now);
                match.setNObservations(match.getNObservations() + 1);
                match.setSnapshot(snapshot);
            } else {
                kind = Kind.CHANGED;
                match.setActive(false);
                toSave.add(match);
                current = newDeal(snapshot, d, match, now);
            }
            toSave.add(current);
        } else {
            kind = Kind.NONE;
        }

        // Anything else still active is no longer on the page: the campaign has ended.
        List<Deal> ended = new ArrayList<>();
        for (Deal deal : activeSiteDeals) {
            if (deal != current && Boolean.TRUE.equals(deal.getActive())) {
                deal.setActive(false);
                ended.add(deal);
                toSave.add(deal);
            }
        }
        if (kind == Kind.NONE && !ended.isEmpty()) kind = Kind.ENDED;
        return new Transition(kind, current, ended, toSave);
    }

    private static Deal findActiveMatch(List<Deal> candidates, String title) {
        String key = normaliseTitle(title);
        return candidates.stream()
                .filter(c -> normaliseTitle(c.getTitle()).equals(key))
                .max(Comparator.comparing(Deal::getLastSeenAt))
                .orElse(null);
    }

    private static boolean contentEquals(DealDetection d, Deal existing) {
        // Description is display-only; rewording the banner is not a new campaign.
        return Objects.equals(d.type(), existing.getType())
                && Objects.equals(d.discountValue(), existing.getDiscountValue());
    }

    private static String normaliseTitle(String title) {
        if (title == null) return "";
        return title.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    private static Deal newDeal(Snapshot snapshot, DealDetection d, Deal previousDeal, Instant now) {
        return Deal.builder()
                .snapshot(snapshot)
                .trackedSite(snapshot.getTrackedSite())
                .type(d.type())
                .title(d.title())
                .description(d.description())
                .discountValue(d.discountValue())
                .confidence(d.confidence())
                .detectionLayer(d.detectionLayer())
                .expiresAt(d.expiresAt())
                .active(true)
                .firstSeenAt(now)
                .lastSeenAt(now)
                .nObservations(1)
                .previousDeal(previousDeal)
                .build();
    }
}
