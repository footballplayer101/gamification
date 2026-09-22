CREATE TABLE IF NOT EXISTS event_state (
  id INTEGER PRIMARY KEY CHECK (id=1),
  as_of TEXT,
  updated_at TIMESTAMPTZ,
  recommended_url TEXT NOT NULL DEFAULT '',
  learners JSONB NOT NULL DEFAULT '[]'::jsonb,
  file_hash TEXT,
  revision INTEGER NOT NULL DEFAULT 0
);
INSERT INTO event_state (id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS request_limits (
  key TEXT PRIMARY KEY,
  bucket BIGINT NOT NULL,
  hits INTEGER NOT NULL
);
