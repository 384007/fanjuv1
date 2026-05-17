CREATE TABLE IF NOT EXISTS articles (
  slug TEXT PRIMARY KEY,
  lang TEXT NOT NULL,
  city_slug TEXT,
  topic_slug TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  canonical_path TEXT NOT NULL,
  alternate_path TEXT,
  r2_key TEXT NOT NULL,
  body_html TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  quality_score INTEGER DEFAULT 100,
  prompt_id TEXT,
  prompt_hash TEXT,
  profile_hash TEXT,
  body_hash TEXT,
  provider TEXT,
  model TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_lang_status
ON articles(lang, status);

CREATE INDEX IF NOT EXISTS idx_articles_city_topic
ON articles(city_slug, topic_slug);

CREATE INDEX IF NOT EXISTS idx_articles_updated
ON articles(updated_at);
