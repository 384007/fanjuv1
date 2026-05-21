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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!verifyAuth(request, env)) return unauthorized()

    const url = new URL(request.url)
    const path = url.pathname.replace("/api/lab", "")
    const method = request.method

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
      const [articles, jobs, platforms] = await Promise.all([
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
      ])
      return ok({
        articles: articles.results,
        jobs: jobs.results,
        platforms: platforms.results,
      })
    }

    // ─── Cookie health check (single platform) ───────────────────
    // POST /check-cookie  { platform: string }
    // Returns { platform, session_valid, last_check_at, cookie_configured }
    if (path === "/check-cookie" && method === "POST") {
      const body = (await request.json()) as { platform: string }
      const { platform } = body

      const acct = (await env.FANJU_DB.prepare(
        `SELECT platform, session_valid, last_check_at FROM lab_platform_accounts WHERE platform = ?`,
      )
        .bind(platform)
        .first()) as { platform: string; session_valid: number; last_check_at: string | null } | null

      if (!acct) return new Response(JSON.stringify({ error: "platform not found" }), { status: 404, headers: { "Content-Type": "application/json" } })

      // Trigger Modal validate-cookies if MODAL_BASE_URL is set
      if (env.MODAL_BASE_URL) {
        try {
          const modalRes = await fetch(`${env.MODAL_BASE_URL}/validate-cookies`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.ADMIN_TOKEN}`,
            },
            body: JSON.stringify({ platforms: [platform] }),
          })
          if (modalRes.ok) {
            const report = (await modalRes.json()) as Record<string, { valid: boolean }>
            const valid = report[platform]?.valid ?? false
            await env.FANJU_DB.prepare(
              `UPDATE lab_platform_accounts SET session_valid = ?, last_check_at = datetime('now') WHERE platform = ?`,
            )
              .bind(valid ? 1 : 0, platform)
              .run()
            return ok({ platform, session_valid: valid, last_check_at: new Date().toISOString(), cookie_configured: true })
          }
        } catch (_) {
          // Modal unreachable — fall through to return cached value
        }
      }

      return ok({
        platform: acct.platform,
        session_valid: !!acct.session_valid,
        last_check_at: acct.last_check_at,
        cookie_configured: true, // if row exists, assume configured
      })
    }

    // ─── Validate all cookies via Modal ──────────────────────────
    // POST /validate-all-cookies  — triggers Modal to check every active platform
    if (path === "/validate-all-cookies" && method === "POST") {
      if (!env.MODAL_BASE_URL) return ok({ skipped: true, reason: "MODAL_BASE_URL not set" })

      const { results } = await env.FANJU_DB.prepare(
        `SELECT platform FROM lab_platform_accounts WHERE is_active = 1`,
      ).all()
      const platforms = (results as { platform: string }[]).map((r) => r.platform)

      try {
        const modalRes = await fetch(`${env.MODAL_BASE_URL}/validate-cookies`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.ADMIN_TOKEN}`,
          },
          body: JSON.stringify({ platforms }),
        })
        if (!modalRes.ok) return ok({ error: "modal error", status: modalRes.status })
        const report = (await modalRes.json()) as Record<string, { valid: boolean }>

        // Batch update D1
        for (const [plat, res] of Object.entries(report)) {
          await env.FANJU_DB.prepare(
            `UPDATE lab_platform_accounts SET session_valid = ?, last_check_at = datetime('now') WHERE platform = ?`,
          )
            .bind(res.valid ? 1 : 0, plat)
            .run()
        }
        return ok({ updated: Object.keys(report).length, report })
      } catch (e) {
        return ok({ error: String(e) })
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

  async scheduled(_event: ScheduledEvent, env: Env) {
    // Reset daily counters at midnight UTC
    await env.FANJU_DB.prepare(
      `UPDATE lab_platform_accounts
       SET published_today = 0, last_reset_date = datetime('now')`,
    ).run()
  },
}
