# Cross-snapshot duplicate-Deal prevention

## Feature

Previously, `ParseService` inserted a brand-new `Deal` row for every detection on every
snapshot, so the same real-world deal got a fresh row on every re-scrape of a site. This
feature matches new detections against a site's existing deals and either updates or
versions them instead of always inserting a duplicate.

For each detection, matched against the `TrackedSite`'s active deals by normalized title:

- **No match** — insert as a new deal, recording `first_seen_at`/`last_seen_at`
  (both = now) and `n_observations = 1`.
- **Match, content unchanged** (same type/discount/description/expiry) — don't insert;
  bump `n_observations` and `last_seen_at` on the existing row instead.
- **Match, content changed** — insert a new versioned row referencing the old one via
  `previous_deal_id`, and mark the old row `active = false`.

Deactivating deals that disappear from a site entirely (not re-detected at all) is out of
scope — a separate follow-up.

## Implementation

- **Migration** `V11__add_deal_versioning.sql` adds `first_seen_at`, `last_seen_at`,
  `n_observations`, and a self-referencing `previous_deal_id` to `deals`, plus supporting
  indexes on `(tracked_site_id, active)` and `previous_deal_id`. No DB-level unique
  constraint — parsing is confirmed single-threaded/sequential, so the race it would guard
  against isn't reachable today.
- **`Deal` entity** gained the four corresponding fields; `first_seen_at`/`last_seen_at`
  are set via the existing `@PrePersist` hook (same pattern as `detected_at`).
- **`ParseService.persistResults()`** loads the site's active deals once per parse, then
  matches/inserts/updates each detection against that set (`upsertDeal`). Content equality
  deliberately excludes `confidence`/`detection_layer` — those reflect detection quality,
  not the deal itself, so a layer/confidence change alone shouldn't fork version history.
  On an unchanged re-observation, `snapshot_id` is repointed to the latest snapshot so it
  keeps meaning "last seen in," while `first_seen_at` stays fixed.
- **Tests** — `ParseServiceIntegrationTest` covers all three branches (new deal, unchanged
  re-observation, changed version) against two new HTML fixtures (`versioning-v1.html`/
  `v2.html`) crafted to avoid triggering the text-pattern detector's `% off` regex, which
  would otherwise add an unrelated second deal to the site.

## Known limitations

- Pre-migration data (deals inserted before this feature shipped) may have multiple
  `active = true` rows sharing a title for one site; matching falls back to most-recent
  `last_seen_at` as a tie-break but doesn't clean up the orphaned duplicates.
- Not verified by a local build — this environment has no JDK installed. Run
  `./mvnw -pl deal-tracker-common,deal-tracker-parser -am test` (Java 21 + Docker) before
  merging.
