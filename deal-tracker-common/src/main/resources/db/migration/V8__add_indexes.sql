-- Foreign key indexes
CREATE INDEX idx_tracked_sites_user_id        ON tracked_sites(user_id);
CREATE INDEX idx_fetch_log_tracked_site_id    ON fetch_log(tracked_site_id);
CREATE INDEX idx_snapshots_tracked_site_id    ON snapshots(tracked_site_id);
CREATE INDEX idx_snapshots_fetch_log_id       ON snapshots(fetch_log_id);
CREATE INDEX idx_deals_snapshot_id            ON deals(snapshot_id);
CREATE INDEX idx_deals_tracked_site_id        ON deals(tracked_site_id);
CREATE INDEX idx_notifications_user_id        ON notifications(user_id);
CREATE INDEX idx_notifications_deal_id        ON notifications(deal_id);

-- Query pattern indexes
CREATE INDEX idx_snapshots_status             ON snapshots(status);         -- parser polls PENDING_PARSE
CREATE INDEX idx_deals_active                 ON deals(active);             -- active deals feed
CREATE INDEX idx_deals_detected_at            ON deals(detected_at DESC);   -- newest-first ordering
CREATE INDEX idx_notifications_status         ON notifications(status);     -- unread count queries
