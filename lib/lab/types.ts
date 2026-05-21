// Shared types for the Fanju AI SEO Lab admin UI and API.

export type ArticleStatus = "draft" | "ready" | "published" | "failed"

export type JobStatus = "pending" | "running" | "success" | "failed" | "skipped"

export interface LabArticle {
  id: string
  title: string
  slug: string
  lang: "zh" | "en"
  topic: string | null
  github_path: string
  status: ArticleStatus
  seo_score: number | null
  seo_report_r2: string | null
  cover_r2: string | null
  created_at: string
  updated_at: string
}

export interface LabPublishJob {
  id: string
  article_id: string
  article_title?: string
  article_slug?: string
  platform: string
  status: JobStatus
  rewrite_github_path: string | null
  published_url: string | null
  error_msg: string | null
  error_dump_r2: string | null
  attempt_count: number
  scheduled_at: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface LabPlatformAccount {
  platform: string
  display_name: string
  is_active: number
  daily_limit: number
  published_today: number
  last_reset_date: string | null
  session_valid: number
  last_check_at: string | null
  notes: string | null
}

export interface LabSeoCheck {
  id: string
  article_id: string
  title?: string
  slug?: string
  checked_at: string
  score: number
  issues: string | null
  report_r2: string | null
  verdict?: string
}

export interface LabStats {
  articles: { status: ArticleStatus; count: number }[]
  jobs: { status: JobStatus; count: number }[]
  platforms: {
    platform: string
    published_today: number
    daily_limit: number
    is_active: number
    session_valid: number
  }[]
}
