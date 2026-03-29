CREATE TABLE fetch_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_site_id UUID NOT NULL REFERENCES tracked_sites(id),
    status VARCHAR NOT NULL,
    content_hash VARCHAR,
    http_status INTEGER,
    error_message TEXT,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
