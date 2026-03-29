CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES snapshots(id),
    tracked_site_id UUID NOT NULL REFERENCES tracked_sites(id),
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    discount_value VARCHAR,
    confidence VARCHAR NOT NULL,
    detection_layer VARCHAR NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true
);
