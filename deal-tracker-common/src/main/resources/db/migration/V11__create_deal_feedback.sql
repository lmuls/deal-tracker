CREATE TABLE deal_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_site_id UUID NOT NULL REFERENCES tracked_sites(id) ON DELETE CASCADE,
    normalized_title VARCHAR NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    deal_type VARCHAR NOT NULL,
    confidence VARCHAR NOT NULL,
    detection_layer VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tracked_site_id, normalized_title)
);
