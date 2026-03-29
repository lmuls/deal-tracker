CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    notify_email BOOLEAN NOT NULL DEFAULT true,
    notify_in_app BOOLEAN NOT NULL DEFAULT true,
    email_frequency VARCHAR NOT NULL DEFAULT 'INSTANT'
);
