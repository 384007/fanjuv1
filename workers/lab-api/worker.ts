/**
 * Fanju AI SEO Lab — admin API worker.
 * All routes are gated by ADMIN_TOKEN (Bearer header or admin_token cookie).
 * Article bodies live in GitHub; D1 only stores task / status metadata.
 */

export interface Env {
  FANJU_DB: D1Database
  FANJU_LAB_R2: R2Bucket
  PUBLISH_QUEUE: Queue
  SEO_QUEUE: Queue
  REWRITE_QUEUE: Queue
  ADMIN_TOKEN: string
  MODAL_BASE_URL: string
}

type ModalCookieResult = {
  valid?: boolean
  configured?: boolean
  auth_type?: "cookie" | "api-key" | "unknown"
  error?: string | null
}

type ModalCookieReport = Record<string, ModalCookieResult>

type GenerateBody = {
  topic?: string
  lang?: "zh" | "en"
  article_id?: string
}

type GenerateResult = {
  article_id?: string
  github_path?: string
  preview?: string
  error?: string
}

type SeoCheckBody = {
  article_id?: string
  github_path?: string
}

type SeoReport = {
  score?: number
  issues?: unknown
  verdict?: string
  [key: string]: unknown
}

type QueueMessage = {
  body: unknown
  ack: () => void
  retry: () => void
}

type QueueBatch = {
  queue: string
  messages: QueueMessage[]
}

function unauthorized() {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  })
}

function ok(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

function verifyAuth(request: Request, env: Env): boolean {
  const authHeader = request.headers.get("Authorization")
  if (authHeader === `Bearer ${env.ADMIN_TOKEN}`) return true
  const cookie = request.headers.get("Cookie") ?? ""
  const token = cookie.split(";").find((c) => c.trim().startsWith("admin_token="))
  if (token && token.split("=")[1]?.trim() === env.ADMIN_TOKEN) return true
  return false
}

function shortId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12)
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/\s+/g, " ")
    .replace(/[A-Za-z0-9_+/=-]{32,}/g, "[redacted]")
    .slice(0, 180)
}

function safeSlug(value: string, fallback: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
  return slug || fallback
}

async function callModal<T>(env: Env, path: string, body: unknown): Promise<T> {
  if (!env.MODAL_BASE_URL) {
    throw new Error("MODAL_BASE_URL not set")
  }

  const res = await fetch(`${env.MODAL_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.ADMIN_TOKEN}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Modal ${path} failed with ${res.status}`)
  }
  return res.json() as Promise<T>
}

function normalizeCookieResult(platform: string, result: ModalCookieResult | undefined) {
  const configured = result?.configured ?? false
  const valid = configured && Boolean(result?.valid)
  return {
    platform,
    valid,
    session_valid: valid,
    configured,
    cookie_configured: configured,
    auth_type: result?.auth_type ?? "unknown",
    error: result?.error ? safeError(result.error) : null,
  }
}

async function upsertGeneratedArticle(
  env: Env,
  body: GenerateBody,
  result: GenerateResult,
): Promise<{ articleId: string; githubPath: string }> {
  const articleId = result.article_id || body.article_id || shortId()
  const topic = (body.topic || "Untitled topic").trim()
  const githubPath = result.github_path || ""
  if (!githubPath) throw new Error("Modal generate did not return github_path")

  const slugBase = safeSlug(topic, "topic")
  const slug = `lab-${slugBase}-${articleId}`
  await env.FANJU_DB.prepare(
    `INSERT INTO lab_articles (id, title, slug, lang, topic, github_path, status)
     VALUES (?, ?, ?, ?, ?, ?, 'draft')
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       slug = excluded.slug,
       lang = excluded.lang,
       topic = excluded.topic,
       github_path = excluded.github_path,
       status = 'draft',
       updated_at = datetime('now')`,
  )
    .bind(articleId, topic.slice(0, 180), slug, body.lang ?? "zh", topic, githubPath)
    .run()
  return { articleId, githubPath }
}

async function persistSeoReport(env: Env, articleId: string, report: SeoReport): Promise<void> {
  const score = Number.isFinite(Number(report.score)) ? Number(report.score) : 0
  const verdict = String(report.verdict || "")
  const issues = Array.isArray(report.issues)
    ? JSON.stringify(report.issues)
    : typeof report.issues === "string"
      ? report.issues
      : JSON.stringify(report.issues ?? [])
  const status = score >= 90 && verdict !== "reject" ? "ready" : verdict === "reject" ? "failed" : "draft"

  await env.FANJU_DB.prepare(
    `INSERT INTO lab_seo_checks (id, article_id, score, issues, report_r2)
     VALUES (?, ?, ?, ?, NULL)`,
  )
    .bind(shortId(), articleId, score, issues)
    .run()

  await env.FANJU_DB.prepare(
    `UPDATE lab_articles
     SET seo_score = ?, status = ?, updated_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(score, status, articleId)
    .run()
}

async function handleSeoQueue(env: Env, body: unknown): Promise<void> {
  const msg = body as SeoCheckBody
  if (!msg.article_id || !msg.github_path) throw new Error("invalid SEO queue payload")
  const report = await callModal<SeoReport>(env, "/seo-check", {
    article_id: msg.article_id,
    github_path: msg.github_path,
  })
  await persistSeoReport(env, msg.article_id, report)
}

async function handleRewriteQueue(env: Env, body: unknown): Promise<void> {
  const msg = body as { job_id?: string; article_id?: string; platform?: string }
  if (!msg.job_id || !msg.article_id || !msg.platform) {
    throw new Error("invalid rewrite queue payload")
  }

  const article = (await env.FANJU_DB.prepare(
    `SELECT github_path FROM lab_articles WHERE id = ?`,
  )
    .bind(msg.article_id)
    .first()) as { github_path: string } | null
  if (!article?.github_path) throw new Error("article github_path not found")

  await env.FANJU_DB.prepare(
    `UPDATE lab_publish_jobs
     SET status = 'running', started_at = COALESCE(started_at, datetime('now'))
     WHERE id = ?`,
  )
    .bind(msg.job_id)
    .run()

  const result = await callModal<{ rewrite_github_path?: string }>(env, "/rewrite", {
    job_id: msg.job_id,
    article_id: msg.article_id,
    platform: msg.platform,
    github_path: article.github_path,
  })
  if (!result.rewrite_github_path) throw new Error("Modal rewrite did not return rewrite_github_path")

  await env.FANJU_DB.prepare(
    `UPDATE lab_publish_jobs
     SET rewrite_github_path = ?, status = 'pending'
     WHERE id = ?`,
  )
    .bind(result.rewrite_github_path, msg.job_id)
    .run()

  await env.PUBLISH_QUEUE.send({
    job_id: msg.job_id,
    article_id: msg.article_id,
    platform: msg.platform,
    rewrite_github_path: result.rewrite_github_path,
  })
}

async function handlePublishQueue(env: Env, body: unknown): Promise<void> {
  const msg = body as {
    job_id?: string
    article_id?: string
    platform?: string
    rewrite_github_path?: string
  }
  if (!msg.job_id || !msg.article_id || !msg.platform || !msg.rewrite_github_path) {
    throw new Error("invalid publish queue payload")
  }
  await callModal(env, "/publish", {
    job_id: msg.job_id,
    article_id: msg.article_id,
    platform: msg.platform,
    rewrite_github_path: msg.rewrite_github_path,
  })
}

async function failPublishJob(env: Env, body: unknown, error: unknown): Promise<void> {
  const msg = body as { job_id?: string }
  if (!msg.job_id) return
  await env.FANJU_DB.prepare(
    `UPDATE lab_publish_jobs
     SET status = 'failed', error_msg = ?, finished_at = datetime('now')
     WHERE id = ?`,
  )
    .bind(safeError(error), msg.job_id)
    .run()
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!verifyAuth(request, env)) return unauthorized()

    const url = new URL(request.url)
    const path = url.pathname.replace("/api/lab", "")
    const method = request.method

    // ─── Modal-backed operations ─────────────────────────────────
    if (path === "/generate" && method === "POST") {
      const body = (await request.json()) as GenerateBody
      const articleId = body.article_id || shortId()
      const payload = {
        topic: body.topic || "",
        lang: body.lang ?? "zh",
        article_id: articleId,
      }
      try {
        const result = await callModal<GenerateResult>(env, "/generate", payload)
        const saved = await upsertGeneratedArticle(env, payload, result)
        return ok({ ...result, article_id: saved.articleId, github_path: saved.githubPath })
      } catch (e) {
        return new Response(JSON.stringify({ error: safeError(e) }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    if (path === "/seo-check" && method === "POST") {
      const body = (await request.json()) as SeoCheckBody
      if (!body.article_id || !body.github_path) {
        return new Response(JSON.stringify({ error: "article_id and github_path are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }

      try {
        const report = await callModal<SeoReport>(env, "/seo-check", {
          article_id: body.article_id,
          github_path: body.github_path,
        })
        await persistSeoReport(env, body.article_id, report)
        return ok(report)
      } catch (e) {
        return new Response(JSON.stringify({ error: safeError(e) }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    // ─── Articles ─────────────────────────────────────────────────
    if (path === "/articles" && method === "GET") {
      const { results } = await env.FANJU_DB.prepare(
        `SELECT * FROM lab_articles ORDER BY created_at DESC LIMIT 100`,
      ).all()
      return ok(results)
    }

    if (path === "/articles" && method === "POST") {
      const body = (await request.json()) as {
        title: string
        slug: string
        lang?: string
        topic?: string
        github_path: string
      }
      const id = shortId()
      await env.FANJU_DB.prepare(
        `INSERT INTO lab_articles (id, title, slug, lang, topic, github_path, status)
         VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
      )
        .bind(id, body.title, body.slug, body.lang ?? "zh", body.topic ?? null, body.github_path)
        .run()

      // Enqueue SEO check
      await env.SEO_QUEUE.send({ article_id: id, github_path: body.github_path })
      return ok({ id })
    }

    // ─── Publish Jobs ─────────────────────────────────────────────
    if (path === "/publish-jobs" && method === "GET") {
      const { results } = await env.FANJU_DB.prepare(
        `SELECT j.*, a.title AS article_title, a.slug AS article_slug
         FROM lab_publish_jobs j
         JOIN lab_articles a ON j.article_id = a.id
         ORDER BY j.created_at DESC LIMIT 200`,
      ).all()
      return ok(results)
    }

    if (path === "/publish-jobs" && method === "POST") {
      const body = (await request.json()) as { article_id: string; platform: string }
      const { article_id, platform } = body

      // Idempotency check
      const existing = (await env.FANJU_DB.prepare(
        `SELECT id, status FROM lab_publish_jobs WHERE article_id = ? AND platform = ?`,
      )
        .bind(article_id, platform)
        .first()) as { id: string; status: string } | null

      if (existing && (existing.status === "success" || existing.status === "running")) {
        return ok({ skipped: true, existing })
      }

      // Daily-limit check
      const acct = (await env.FANJU_DB.prepare(
        `SELECT daily_limit, published_today, is_active
         FROM lab_platform_accounts WHERE platform = ?`,
      )
        .bind(platform)
        .first()) as { daily_limit: number; published_today: number; is_active: number } | null

      if (!acct?.is_active) return ok({ skipped: true, reason: "platform_inactive" })
      if (acct.published_today >= acct.daily_limit) {
        return ok({ skipped: true, reason: "daily_limit_reached" })
      }

      let jobId: string
      if (!existing) {
        jobId = shortId()
        await env.FANJU_DB.prepare(
          `INSERT INTO lab_publish_jobs (id, article_id, platform, status)
           VALUES (?, ?, ?, 'pending')`,
        )
          .bind(jobId, article_id, platform)
          .run()
      } else {
        jobId = existing.id
        await env.FANJU_DB.prepare(
          `UPDATE lab_publish_jobs
           SET status='pending', error_msg=NULL, attempt_count = attempt_count + 1
           WHERE id = ?`,
        )
          .bind(existing.id)
          .run()
      }

      await env.REWRITE_QUEUE.send({ job_id: jobId, article_id, platform })
      return ok({ job_id: jobId })
    }

    // PATCH /publish-jobs/:id  (Modal calls this to report progress)
    if (path.startsWith("/publish-jobs/") && method === "PATCH") {
      const id = path.split("/").pop()!
      const body = (await request.json()) as Record<string, unknown>
      const fields = Object.keys(body)
        .map((k) => `${k} = ?`)
        .join(", ")
      const values = Object.values(body)
      await env.FANJU_DB.prepare(`UPDATE lab_publish_jobs SET ${fields} WHERE id = ?`)
        .bind(...values, id)
        .run()

      // If success, increment platform counter
      if ((body as { status?: string }).status === "success") {
        const job = (await env.FANJU_DB.prepare(
          `SELECT platform FROM lab_publish_jobs WHERE id = ?`,
        )
          .bind(id)
          .first()) as { platform: string } | null
        if (job) {
          await env.FANJU_DB.prepare(
            `UPDATE lab_platform_accounts
             SET published_today = published_today + 1
             WHERE platform = ?`,
          )
            .bind(job.platform)
            .run()
        }
      }
      return ok({ ok: true })
    }

    // ─── Platform Accounts ────────────────────────────────────────
    if (path === "/platform-accounts" && method === "GET") {
      const { results } = await env.FANJU_DB.prepare(
        `SELECT * FROM lab_platform_accounts ORDER BY platform`,
      ).all()
      return ok(results)
    }

    if (path.startsWith("/platform-accounts/") && method === "PATCH") {
      const platform = path.split("/").pop()
      const body = (await request.json()) as Record<string, unknown>
      const fields = Object.keys(body)
        .map((k) => `${k} = ?`)
        .join(", ")
      const values = Object.values(body)
      await env.FANJU_DB.prepare(
        `UPDATE lab_platform_accounts SET ${fields} WHERE platform = ?`,
      )
        .bind(...values, platform)
        .run()
      return ok({ ok: true })
    }

    // ─── SEO Checks ───────────────────────────────────────────────
    if (path === "/seo-checks" && method === "GET") {
      const { results } = await env.FANJU_DB.prepare(
        `SELECT s.*, a.title, a.slug FROM lab_seo_checks s
         JOIN lab_articles a ON s.article_id = a.id
         ORDER BY s.checked_at DESC LIMIT 100`,
      ).all()
      return ok(results)
    }

    // ─── Stats (dashboard summary) ────────────────────────────────
    if (path === "/stats" && method === "GET") {
      const [articles, jobs, platforms, seo] = await Promise.all([
        env.FANJU_DB.prepare(
          `SELECT status, COUNT(*) as count FROM lab_articles GROUP BY status`,
        ).all(),
        env.FANJU_DB.prepare(
          `SELECT status, COUNT(*) as count FROM lab_publish_jobs GROUP BY status`,
        ).all(),
        env.FANJU_DB.prepare(
          `SELECT platform, published_today, daily_limit, is_active, session_valid
           FROM lab_platform_accounts`,
        ).all(),
        env.FANJU_DB.prepare(
          `SELECT ROUND(AVG(score)) as average_score, COUNT(*) as count FROM lab_seo_checks`,
        ).first(),
      ])
      return ok({
        articles: articles.results,
        jobs: jobs.results,
        platforms: platforms.results,
        seo,
      })
    }

    // ─── Cookie health check (single platform) ───────────────────
    // POST /check-cookie  { platform: string }
    // Returns Modal's configured/valid/error fields without exposing cookies.
    if (path === "/check-cookie" && method === "POST") {
      const body = (await request.json()) as { platform: string }
      const { platform } = body

      const acct = (await env.FANJU_DB.prepare(
        `SELECT platform, session_valid, last_check_at FROM lab_platform_accounts WHERE platform = ?`,
      )
        .bind(platform)
        .first()) as { platform: string; session_valid: number; last_check_at: string | null } | null

      if (!acct) return new Response(JSON.stringify({ error: "platform not found" }), { status: 404, headers: { "Content-Type": "application/json" } })

      if (env.MODAL_BASE_URL) {
        try {
          const report = await callModal<ModalCookieReport>(env, "/validate-cookies", {
            platforms: [platform],
          })
          const normalized = normalizeCookieResult(platform, report[platform])
          await env.FANJU_DB.prepare(
            `UPDATE lab_platform_accounts SET session_valid = ?, last_check_at = datetime('now') WHERE platform = ?`,
          )
            .bind(normalized.valid ? 1 : 0, platform)
            .run()
          return ok({ ...normalized, last_check_at: new Date().toISOString() })
        } catch {
          return ok({
            platform: acct.platform,
            session_valid: !!acct.session_valid,
            valid: !!acct.session_valid,
            last_check_at: acct.last_check_at,
            configured: null,
            cookie_configured: null,
            auth_type: "unknown",
            error: "Modal cookie check unavailable",
          })
        }
      }

      return ok({
        platform: acct.platform,
        session_valid: !!acct.session_valid,
        valid: !!acct.session_valid,
        last_check_at: acct.last_check_at,
        configured: null,
        cookie_configured: null,
        auth_type: "unknown",
        error: "MODAL_BASE_URL not set",
      })
    }

    // ─── Validate all cookies via Modal ──────────────────────────
    // POST /validate-all-cookies  — triggers Modal to check every active platform
    if (path === "/validate-all-cookies" && method === "POST") {
      if (!env.MODAL_BASE_URL) return ok({ skipped: true, reason: "MODAL_BASE_URL not set", report: {} })

      const { results } = await env.FANJU_DB.prepare(
        `SELECT platform FROM lab_platform_accounts WHERE is_active = 1`,
      ).all()
      const platforms = (results as { platform: string }[]).map((r) => r.platform)

      try {
        const report = await callModal<ModalCookieReport>(env, "/validate-cookies", { platforms })
        const normalizedReport: Record<string, ReturnType<typeof normalizeCookieResult>> = {}
        for (const platform of platforms) {
          normalizedReport[platform] = normalizeCookieResult(platform, report[platform])
        }

        // Batch update D1
        for (const [plat, res] of Object.entries(normalizedReport)) {
          await env.FANJU_DB.prepare(
            `UPDATE lab_platform_accounts SET session_valid = ?, last_check_at = datetime('now') WHERE platform = ?`,
          )
            .bind(res.valid ? 1 : 0, plat)
            .run()
        }
        return ok({ updated: Object.keys(normalizedReport).length, report: normalizedReport })
      } catch (e) {
        return ok({ error: safeError(e), report: {} })
      }
    }

    // ─── Cron: reset daily limits ─────────────────────────────────
    if (path === "/cron/reset-daily" && method === "POST") {
      await env.FANJU_DB.prepare(
        `UPDATE lab_platform_accounts
         SET published_today = 0, last_reset_date = datetime('now')`,
      ).run()
      return ok({ ok: true })
    }

    return new Response("not found", { status: 404 })
  },

  async queue(batch: QueueBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        if (batch.queue.includes("seo")) {
          await handleSeoQueue(env, message.body)
        } else if (batch.queue.includes("rewrite")) {
          await handleRewriteQueue(env, message.body)
        } else if (batch.queue.includes("publish")) {
          await handlePublishQueue(env, message.body)
        } else {
          throw new Error(`unknown queue ${batch.queue}`)
        }
        message.ack()
      } catch (e) {
        if (batch.queue.includes("rewrite") || batch.queue.includes("publish")) {
          await failPublishJob(env, message.body, e)
          message.ack()
        } else {
          message.retry()
        }
      }
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env) {
    // Reset daily counters at midnight UTC
    await env.FANJU_DB.prepare(
      `UPDATE lab_platform_accounts
       SET published_today = 0, last_reset_date = datetime('now')`,
    ).run()
  },
}
