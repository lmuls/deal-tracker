ALTER TABLE deals
    ADD COLUMN first_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN n_observations   INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN previous_deal_id UUID REFERENCES deals(id);

CREATE INDEX idx_deals_tracked_site_active ON deals(tracked_site_id, active);
CREATE INDEX idx_deals_previous_deal_id ON deals(previous_deal_id);
