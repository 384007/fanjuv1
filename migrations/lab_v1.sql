-- migrations/lab_v1.sql
-- Fanju AI SEO Automation Lab V1
-- Adds tables for article tasks, publish jobs, platform accounts, and SEO checks.
-- Article bodies are NOT stored here - they live in the GitHub private content repo.

-- 文章任务表（不存正文，正文在 GitHub）
CREATE TABLE IF NOT EXISTS lab_articles (
  id            TEXT PRIMARY KEY,              -- nanoid
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  lang          TEXT NOT NULL DEFAULT 'zh',    -- zh | en
  topic         TEXT,
  github_path   TEXT NOT NULL,                 -- e.g. content/articles/2026/06/slug.md
  status        TEXT NOT NULL DEFAULT 'draft', -- draft|ready|published|failed
  seo_score     INTEGER,
  seo_report_r2 TEXT,                          -- R2 key for JSON report
  cover_r2      TEXT,                          -- R2 key for cover image
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 发布任务表
CREATE TABLE IF NOT EXISTS lab_publish_jobs (
  id            TEXT PRIMARY KEY,
  article_id    TEXT NOT NULL REFERENCES lab_articles(id),
  platform      TEXT NOT NULL,                 -- zhihu|csdn|juejin|...
  status        TEXT NOT NULL DEFAULT 'pending', -- pending|running|success|failed|skipped
  rewrite_github_path TEXT,                    -- 改写版 MD 在 GitHub 的路径
  published_url TEXT,
  error_msg     TEXT,
  error_dump_r2 TEXT,                          -- R2 key for HTML error dump
  attempt_count INTEGER NOT NULL DEFAULT 0,
  scheduled_at  TEXT,
  started_at    TEXT,
  finished_at   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(article_id, platform)                 -- 幂等保障
);

-- 平台账号状态表
CREATE TABLE IF NOT EXISTS lab_platform_accounts (
  platform         TEXT PRIMARY KEY,
  display_name     TEXT NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT 1,
  daily_limit      INTEGER NOT NULL DEFAULT 2,
  published_today  INTEGER NOT NULL DEFAULT 0,
  last_reset_date  TEXT,
  session_valid    BOOLEAN NOT NULL DEFAULT 0,
  last_check_at    TEXT,
  notes            TEXT
);

-- SEO 质检记录
CREATE TABLE IF NOT EXISTS lab_seo_checks (
  id            TEXT PRIMARY KEY,
  article_id    TEXT NOT NULL REFERENCES lab_articles(id),
  checked_at    TEXT NOT NULL DEFAULT (datetime('now')),
  score         INTEGER NOT NULL,
  issues        TEXT,                          -- JSON array of issue strings
  report_r2     TEXT                           -- R2 key
);

-- 插入初始平台配置
INSERT OR IGNORE INTO lab_platform_accounts (platform, display_name, daily_limit) VALUES
  ('zhihu',       '知乎',         2),
  ('csdn',        'CSDN',         3),
  ('juejin',      '掘金',         2),
  ('jianshu',     '简书',         2),
  ('weibo',       '微博',         1),
  ('xiaohongshu', '小红书',       1),
  ('douban',      '豆瓣',         1),
  ('toutiao',     '今日头条',     1),
  ('baijiahao',   '百家号',       1),
  ('bilibili',    'Bilibili',     1),
  ('devto',       'Dev.to',       2),
  ('hashnode',    'Hashnode',     2),
  ('medium',      'Medium',       1),
  ('bluesky',     'Bluesky',      2),
  ('reddit',      'Reddit',       1);

-- Indexes for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_publish_jobs_article  ON lab_publish_jobs(article_id);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_status   ON lab_publish_jobs(status);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_platform ON lab_publish_jobs(platform);
