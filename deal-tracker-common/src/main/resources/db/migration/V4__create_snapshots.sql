CREATE TABLE snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracked_site_id UUID NOT NULL REFERENCES tracked_sites(id),
    fetch_log_id UUID NOT NULL REFERENCES fetch_log(id),
    status VARCHAR NOT NULL,
    content_hash VARCHAR NOT NULL,
    file_path VARCHAR NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL
);
