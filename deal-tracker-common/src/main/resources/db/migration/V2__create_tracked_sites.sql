CREATE TABLE tracked_sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    url VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    check_interval VARCHAR NOT NULL DEFAULT '1 hour',
    active BOOLEAN NOT NULL DEFAULT true,
    last_content_hash VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
