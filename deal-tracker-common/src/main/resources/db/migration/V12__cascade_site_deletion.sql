-- Deleting a tracked site must remove everything harvested/parsed for it.
-- Without ON DELETE actions, any site that had been fetched at least once
-- could not be deleted due to foreign key violations.

ALTER TABLE fetch_log
    DROP CONSTRAINT fetch_log_tracked_site_id_fkey,
    ADD CONSTRAINT fetch_log_tracked_site_id_fkey
        FOREIGN KEY (tracked_site_id) REFERENCES tracked_sites(id) ON DELETE CASCADE;

ALTER TABLE snapshots
    DROP CONSTRAINT snapshots_tracked_site_id_fkey,
    ADD CONSTRAINT snapshots_tracked_site_id_fkey
        FOREIGN KEY (tracked_site_id) REFERENCES tracked_sites(id) ON DELETE CASCADE,
    DROP CONSTRAINT snapshots_fetch_log_id_fkey,
    ADD CONSTRAINT snapshots_fetch_log_id_fkey
        FOREIGN KEY (fetch_log_id) REFERENCES fetch_log(id) ON DELETE CASCADE;

ALTER TABLE deals
    DROP CONSTRAINT deals_tracked_site_id_fkey,
    ADD CONSTRAINT deals_tracked_site_id_fkey
        FOREIGN KEY (tracked_site_id) REFERENCES tracked_sites(id) ON DELETE CASCADE,
    DROP CONSTRAINT deals_snapshot_id_fkey,
    ADD CONSTRAINT deals_snapshot_id_fkey
        FOREIGN KEY (snapshot_id) REFERENCES snapshots(id) ON DELETE CASCADE,
    DROP CONSTRAINT deals_previous_deal_id_fkey,
    ADD CONSTRAINT deals_previous_deal_id_fkey
        FOREIGN KEY (previous_deal_id) REFERENCES deals(id) ON DELETE SET NULL;

ALTER TABLE notifications
    DROP CONSTRAINT notifications_deal_id_fkey,
    ADD CONSTRAINT notifications_deal_id_fkey
        FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE;
