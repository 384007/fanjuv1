// Submit latest Cloudflare-published article URLs to indexing/link platforms.

import { execFileSync } from "child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")

const SITE_ROOT = (process.env.SITE_URL || "https://fanju.app").replace(/\/$/, "")
const DEFAULT_INDEXNOW_KEY = "e425652261cb6c96a73b030ea9c77e4c"
const CLOUDFLARE_ACCOUNT_ID = clean(process.env.CLOUDFLARE_ACCOUNT_ID)
const CLOUDFLARE_API_TOKEN = cleanToken(process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_AUTH_TOKEN)
const CLOUDFLARE_D1_DATABASE_ID = clean(process.env.CLOUDFLARE_D1_DATABASE_ID || "58d63133-adeb-4efd-b9eb-a9b056271ca5")
const LIMIT = Math.max(1, Number.parseInt(process.env.URL_LIMIT || "20", 10))
const DRY_RUN = process.env.DRY_RUN === "1"
const REQUESTED_URLS = parseRequestedUrls(process.env.URLS || process.env.SUBMIT_URLS || "")
const RUN_ID = clean(process.env.RUN_ID || new Date().toISOString().replace(/[:.]/g, "-"))
const PROOF_FILE = join(ROOT, process.env.PROOF_FILE || `data/seo/external-publish-proof-${RUN_ID}.json`)

const PLATFORMS = new Set(
  clean(process.env.PLATFORMS || "all")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean),
)

function clean(value = "") {
  return String(value || "").trim()
}

function cleanToken(value = "") {
  return clean(value).replace(/^Bearer\s+/i, "")
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeUrl(url) {
  return String(url || "").trim().replace(/\/$/, "")
}

function parseRequestedUrls(value = "") {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function slugFromUrlOrPath(value = "") {
  const input = String(value || "").trim()
  if (!input) return ""
  if (/^https?:\/\//i.test(input)) {
    try {
      return new URL(input).pathname.replace(/^\/+|\/+$/g, "")
    } catch {
      return input.replace(/^\/+|\/+$/g, "")
    }
  }
  return input.replace(/^\/+|\/+$/g, "")
}

function titleFromSlug(slug = "") {
  return String(slug || "")
    .split("/")
    .filter(Boolean)
    .slice(-2)
    .join(" ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
}
function normalizePath(path = "") {
  let value = String(path || "").trim()
  if (!value) return ""
  if (/^https?:\/\//i.test(value)) {
    try {
      value = new URL(value).pathname
    } catch {
      return ""
    }
  }
  value = value.startsWith("/") ? value : `/${value}`
  return value.endsWith("/") && value.length > 1 ? value.slice(0, -1) : value
}

function canonicalMatches(url, canonical = "") {
  if (!canonical) return false
  try {
    const expected = new URL(url)
    const actual = new URL(canonical, SITE_ROOT)
    return actual.origin === expected.origin && normalizePath(actual.pathname) === normalizePath(expected.pathname)
  } catch {
    return false
  }

}

function shouldRun(platform) {
  return PLATFORMS.has("all") || PLATFORMS.has(platform.toLowerCase())
}

async function d1Query(sql, params = []) {
  if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
    return d1QueryWithWrangler(sql, params)
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    },
  )
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.success === false) {
    throw new Error(`D1 query failed ${res.status}: ${JSON.stringify(json)}`)
  }
  return json?.result?.[0]?.results || []
}

function d1QueryWithWrangler(sql, params = []) {
  if (params.length) {
    for (const value of params) {
      sql = sql.replace("?", Number.isFinite(Number(value)) ? String(Number(value)) : `'${String(value).replaceAll("'", "''")}'`)
    }
  }

  const output = execFileSync(
    "wrangler",
    ["d1", "execute", "fanju-seo-prod", "--remote", "--command", sql, "--json"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" } },
  )
  const start = output.indexOf("[")
  const end = output.lastIndexOf("]")
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Could not parse wrangler D1 output: ${output.slice(0, 500)}`)
  }
  const payload = JSON.parse(output.slice(start, end + 1))
  return payload?.[0]?.results || []
}

async function fetchLatestUrls() {
  const rows = await d1Query(
    `SELECT slug, title, updated_at
     FROM articles
     WHERE status='ready'
       AND (body_html IS NOT NULL OR r2_key IS NOT NULL)
       AND slug NOT LIKE '%/test'
     ORDER BY updated_at DESC
     LIMIT ?`,
    [LIMIT],
  )

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    url: `${SITE_ROOT}/${String(row.slug).replace(/^\/+/, "")}`,
    updatedAt: row.updated_at,
  }))
}

async function fetchRequestedEntries() {
  const entries = []
  const seen = new Set()
  for (const requested of REQUESTED_URLS) {
    const slug = slugFromUrlOrPath(requested)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    const rows = await d1Query(
      `SELECT slug, title, updated_at
       FROM articles
       WHERE slug = ?
         AND status='ready'
       LIMIT 1`,
      [slug],
    )
    const row = rows[0] || {}
    entries.push({
      slug,
      title: row.title || titleFromSlug(slug),
      url: `${SITE_ROOT}/${slug}`,
      updatedAt: row.updated_at || "",
      source: row.slug ? "d1" : "requested",
    })
  }
  return entries
}

async function loadSitemapUrls() {
  const sitemapUrl = `${SITE_ROOT}/sitemap.xml`
  try {
    const res = await fetch(sitemapUrl, { redirect: "follow" })
    const text = await res.text()
    if (!res.ok) return { ok: false, status: res.status, urls: new Set(), error: text.slice(0, 300) }
    const urls = new Set([...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => normalizeUrl(m[1])))
    return { ok: true, status: res.status, urls, error: "" }
  } catch (err) {
    const local = join(ROOT, "public/sitemap.xml")
    if (existsSync(local)) {
      const text = readFileSync(local, "utf8")
      const urls = new Set([...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => normalizeUrl(m[1])))
      return { ok: true, status: "local", urls, error: "" }
    }
    return { ok: false, status: 0, urls: new Set(), error: err?.message || String(err) }
  }
}

async function verifyUrl(url, sitemapUrls) {
  const head = await fetch(url, { method: "HEAD", redirect: "follow" }).catch((err) => ({ status: 0, ok: false, headers: new Headers(), error: err?.message || String(err) }))
  let contentType = head.headers?.get?.("content-type") || ""
  let html
  let getStatus
  let getOk
  try {
    const get = await fetch(url, { method: "GET", redirect: "follow" })
    getStatus = get.status
    getOk = get.ok
    contentType = get.headers.get("content-type") || contentType
    html = await get.text()
  } catch (err) {
    return {
      url,
      status: head.status || 0,
      ok: false,
      contentType,
      canonical: "",
      canonicalOk: false,
      sitemapIncluded: sitemapUrls.has(normalizeUrl(url)),
      error: err?.message || String(err),
    }
  }
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1]
    || ""
  const sitemapIncluded = sitemapUrls.has(normalizeUrl(url))
  return {
    url,
    status: getStatus || head.status,
    headStatus: head.status,
    ok: Boolean(getOk && getStatus === 200),
    contentType,
    canonical,
    canonicalOk: canonicalMatches(url, canonical),
    sitemapIncluded,
    error: head.error || "",
  }

}

async function submitIndexNow(urls) {
  const key = clean(process.env.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY)
  if (!key) return { platform: "IndexNow", skipped: "INDEXNOW_KEY is not configured" }

  const payload = {
    host: new URL(SITE_ROOT).hostname,
    key,
    keyLocation: clean(process.env.INDEXNOW_KEY_LOCATION) || `${SITE_ROOT}/${key}.txt`,
    urlList: urls,
  }

  if (DRY_RUN) return { platform: "IndexNow", dryRun: true, urlCount: urls.length, firstUrl: urls[0] }

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  const result = { platform: "IndexNow", status: res.status, ok: res.ok, body: text.slice(0, 500) }
  if (!res.ok && [400, 403, 422, 429].includes(res.status)) {
    result.nonFatal = true
    result.warning = "IndexNow submission was attempted but rejected by IndexNow; keeping verified article publishing flow alive."
  }
  return result
}

async function runPlatform(platform, fn) {
  if (!shouldRun(platform)) return null
  try {
    return await fn()
  } catch (err) {
    return {
      platform,
      ok: false,
      error: err?.message || String(err),
      nonFatal: process.env.STRICT_PUBLISH !== "1",
    }
  }
}

async function submitBaidu(urls) {
  const token = clean(process.env.BAIDU_API || process.env.BAIDU_TOKEN || process.env.BAIDU_PUSH_TOKEN)
  const api = token.startsWith("http")
    ? token
    : token
      ? `https://data.zz.baidu.com/urls?site=${encodeURIComponent(SITE_ROOT)}&token=${encodeURIComponent(token)}`
      : ""

  if (!api) return { platform: "Baidu", skipped: "BAIDU_API, BAIDU_TOKEN, or BAIDU_PUSH_TOKEN is not configured" }
  if (DRY_RUN) return { platform: "Baidu", dryRun: true, urlCount: urls.length, firstUrl: urls[0] }

  const res = await fetch(api, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: urls.join("\n"),
  })
  const text = await res.text()
  let payload = null
  try {
    payload = JSON.parse(text)
  } catch {
    // keep raw body below
  }
  if (payload?.error === 400 && /over quota/i.test(payload?.message || "")) {
    return { platform: "Baidu", status: res.status, ok: true, quotaExhausted: true, body: text.slice(0, 1000) }
  }
  return { platform: "Baidu", status: res.status, ok: res.ok, body: text.slice(0, 1000) }
}

async function publishGist(entries) {
  const token = clean(process.env.GIST_TOKEN)
  if (!token) return { platform: "GitHub Gist", skipped: "GIST_TOKEN is not configured" }

  const content = [
    "# Fanju app / 饭局app latest city articles",
    "",
    ...entries.map((entry) => `- [${entry.title}](${entry.url})`),
    "",
    `Updated: ${new Date().toISOString()}`,
  ].join("\n")

  if (DRY_RUN) return { platform: "GitHub Gist", dryRun: true, urlCount: entries.length, firstUrl: entries[0]?.url }

  const res = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      description: "Fanju app / 饭局app latest city article links",
      public: true,
      files: {
        "fanju-latest-city-articles.md": { content },
      },
    }),
  })
  const body = await res.json().catch(async () => ({ raw: await res.text() }))
  return { platform: "GitHub Gist", status: res.status, ok: res.ok, url: body?.html_url, body }
}

function linkListMarkdown(entries) {
  return entries.map((entry) => `- [${entry.title}](${entry.url})`).join("\n")
}

function roundupTitle(entries = []) {
  const batchTime = entries[0]?.updatedAt ? new Date(entries[0].updatedAt) : new Date()
  const stamp = Number.isNaN(batchTime.getTime())
    ? new Date().toISOString().slice(0, 16).replace("T", " ")
    : batchTime.toISOString().slice(0, 16).replace("T", " ")
  return `Latest Fanju app / 饭局app city dinner guides - ${stamp} UTC`
}

function roundupMarkdown(entries) {
  return [
    "Fanju has published a new batch of city dinner guides for people searching for the Fanju app, 饭局app, dinner buddies, founder dinners, student dinners, and small-table social dining.",
    "",
    linkListMarkdown(entries),
    "",
    "Each page is live on fanju.app and points to a city-specific dinner intent.",
  ].join("\n")
}

async function publishDevto(entries) {
  const apiKey = clean(process.env.DEVTO_API_KEY)
  if (!apiKey) return { platform: "DEV.to", skipped: "DEVTO_API_KEY is not configured" }

  const canonical = entries[0]?.url || SITE_ROOT
  const payload = {
    article: {
      title: roundupTitle(entries),
      body_markdown: roundupMarkdown(entries),
      published: process.env.PUBLISH_LIVE !== "0",
      canonical_url: canonical,
      tags: ["community", "social", "dining", "city"],
    },
  }

  if (DRY_RUN) return { platform: "DEV.to", dryRun: true, canonical, urlCount: entries.length }

  const res = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(async () => ({ raw: await res.text() }))
  if (!res.ok && res.status === 422 && String(body?.error || "").includes("Canonical url has already been taken")) {
    return { platform: "DEV.to", status: res.status, ok: true, alreadyPublished: true, body }
  }
  if (!res.ok && res.status === 422 && /title has already been used/i.test(String(body?.error || body?.raw || ""))) {
    return { platform: "DEV.to", status: res.status, ok: true, duplicateTitleWindow: true, body }
  }
  return { platform: "DEV.to", status: res.status, ok: res.ok, url: body?.url, body }
}

async function publishBluesky(entries) {
  const handle = clean(process.env.BLUESKY_HANDLE)
  const password = clean(process.env.BLUESKY_APP_PASSWORD || process.env.BLUESKY_APP)
  const service = clean(process.env.BLUESKY_SERVICE) || "https://bsky.social"
  if (!handle || !password) return { platform: "Bluesky", skipped: "BLUESKY_HANDLE and BLUESKY_APP_PASSWORD/BLUESKY_APP are not configured" }

  const texts = [
    `New Fanju app city dinner guides are live:\n${entries.slice(0, 3).map((entry) => entry.url).join("\n")}`,
    `新的饭局app城市饭局文章已上线：\n${entries.slice(0, 3).map((entry) => entry.url).join("\n")}`,
  ]

  if (DRY_RUN) return { platform: "Bluesky", dryRun: true, posts: texts }

  const sessionRes = await fetch(`${service}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: handle, password }),
  })
  const session = await sessionRes.json().catch(async () => ({ raw: await sessionRes.text() }))
  if (!sessionRes.ok) return { platform: "Bluesky", status: sessionRes.status, ok: false, body: session }

  const posted = []
  for (const text of texts) {
    posted.push(await publishBlueskyPost({ service, session, text }))
  }

  return { platform: "Bluesky", ok: posted.every((item) => item.ok), posted }
}

async function publishBlueskyPost({ service, session, text }) {
  const maxAttempts = 3
  let last = null
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(`${service}/xrpc/com.atproto.repo.createRecord`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessJwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo: session.did,
          collection: "app.bsky.feed.post",
          record: {
            $type: "app.bsky.feed.post",
            text,
            createdAt: new Date().toISOString(),
          },
        }),
      })
      const body = await res.json().catch(async () => ({ raw: await res.text() }))
      last = { status: res.status, ok: res.ok, uri: body?.uri, body, attempt }
      if (res.ok) return last
      if (![429, 500, 502, 503, 504].includes(res.status)) return last
    } catch (err) {
      last = { status: 0, ok: false, error: err?.message || String(err), attempt }
    }
    if (attempt < maxAttempts) await sleep(1500 * attempt)
  }
  return last
}

async function publishWordPress(entries) {
  const wpAccessToken = clean(process.env.WORDPRESS_ACCESS_TOKEN)
  const wpSiteId = clean(process.env.WORDPRESS_SITE_ID)
  const base = clean(
    process.env.WORDPRESS_SITE_URL ||
      process.env.WORDPRESS_URL ||
      process.env.WORDPRESS_SITE ||
      process.env.WORDPRESS_BASE_URL ||
      process.env.WP_URL ||
      process.env.WP_SITE_URL ||
      process.env.WP_SITE,
  ).replace(/\/$/, "")
  const username = clean(
    process.env.WORDPRESS_USERNAME ||
      process.env.WORDPRESS_USER ||
      process.env.WORDPRESS_LOGIN ||
      process.env.WORDPRESS_EMAIL ||
      process.env.WP_USERNAME ||
      process.env.WP_USER ||
      process.env.WP_LOGIN ||
      process.env.WP_EMAIL,
  )
  const password = clean(
    process.env.WORDPRESS_APP_PASSWORD ||
      process.env.WORDPRESS_APPLICATION_PASSWORD ||
      process.env.WORDPRESS_PASSWORD ||
      process.env.WP_APP_PASSWORD ||
      process.env.WP_APPLICATION_PASSWORD ||
      process.env.WP_PASSWORD ||
      process.env.WORDPRESS,
  )
  if (wpAccessToken && wpSiteId) {
    return publishWordPressDotCom(entries, wpAccessToken, wpSiteId)
  }

  if (!base || !username || !password) {
    return {
      platform: "WordPress",
      skipped: "WordPress credentials are incomplete",
      detected: {
        accessToken: Boolean(wpAccessToken),
        siteId: Boolean(wpSiteId),
        base: Boolean(base),
        username: Boolean(username),
        password: Boolean(password),
      },
      acceptedNames: {
        wordpressCom: ["WORDPRESS_ACCESS_TOKEN", "WORDPRESS_SITE_ID", "WORDPRESS_SITE_URL"],
        base: ["WORDPRESS_SITE_URL", "WORDPRESS_URL", "WORDPRESS_SITE", "WORDPRESS_BASE_URL", "WP_URL", "WP_SITE_URL", "WP_SITE"],
        username: ["WORDPRESS_USERNAME", "WORDPRESS_USER", "WORDPRESS_LOGIN", "WORDPRESS_EMAIL", "WP_USERNAME", "WP_USER", "WP_LOGIN", "WP_EMAIL"],
        password: ["WORDPRESS_APP_PASSWORD", "WORDPRESS_APPLICATION_PASSWORD", "WORDPRESS_PASSWORD", "WP_APP_PASSWORD", "WP_APPLICATION_PASSWORD", "WP_PASSWORD", "WORDPRESS"],
      },
    }
  }

  const content = [
    "<p>Fanju has published a new batch of city dinner guides for Fanju app and 饭局app search intent.</p>",
    "<ul>",
    ...entries.map((entry) => `<li><a href="${entry.url}">${escapeHtml(entry.title)}</a></li>`),
    "</ul>",
  ].join("\n")

  if (DRY_RUN) return { platform: "WordPress", dryRun: true, urlCount: entries.length, base }

  const res = await fetch(`${base}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: roundupTitle(entries),
      content,
      status: process.env.WORDPRESS_STATUS || "publish",
      excerpt: "Latest Fanju app and 饭局app city dinner guides from fanju.app.",
    }),
  })
  const body = await res.json().catch(async () => ({ raw: await res.text() }))
  return { platform: "WordPress", status: res.status, ok: res.ok, url: body?.link, body }
}

async function publishWordPressDotCom(entries, accessToken, siteId) {
  const content = [
    "<p>Fanju has published a new batch of city dinner guides for Fanju app and 饭局app search intent.</p>",
    "<ul>",
    ...entries.map((entry) => `<li><a href="${entry.url}">${escapeHtml(entry.title)}</a></li>`),
    "</ul>",
  ].join("\n")

  if (DRY_RUN) return { platform: "WordPress.com", dryRun: true, siteId, urlCount: entries.length }

  const res = await fetch(`https://public-api.wordpress.com/rest/v1.1/sites/${encodeURIComponent(siteId)}/posts/new`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: roundupTitle(entries),
      content,
      status: process.env.WORDPRESS_STATUS || "publish",
      excerpt: "Latest Fanju app and 饭局app city dinner guides from fanju.app.",
    }),
  })
  const body = await res.json().catch(async () => ({ raw: await res.text() }))
  return { platform: "WordPress.com", status: res.status, ok: res.ok, url: body?.URL || body?.short_URL, body }
}

function escapeHtml(input = "") {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function platformKey(platform = "") {
  const value = String(platform || "").toLowerCase()
  if (value.includes("indexnow")) return "indexnow"
  if (value.includes("baidu")) return "baidu"
  if (value.includes("gist")) return "gist"
  if (value.includes("dev")) return "devto"
  if (value.includes("blue")) return "bluesky"
  if (value.includes("wordpress")) return "wordpress"
  return value.replace(/[^a-z0-9]+/g, "") || "unknown"
}

function resultStatus(result) {
  if (!result) return { status: "skipped", reason: "platform not selected or not run" }
  if (result.skipped) return { status: "skipped", reason: result.skipped }
  if (result.dryRun) return { status: "dry-run" }
  if (result.ok === false) return { status: "failed", reason: result.error || result.body || "platform returned ok=false" }
  return { status: "success" }
}

function resultUrl(result, key) {
  if (!result) return ""
  if (result.url) return result.url
  if (key === "bluesky" && Array.isArray(result.posted)) {
    return result.posted.map((item) => item.uri).filter(Boolean).join(",")
  }
  return ""
}

function buildProof(entries, checks, results, sitemapStatus) {
  const resultByKey = new Map()
  for (const result of results) resultByKey.set(platformKey(result.platform), result)
  const keys = ["indexnow", "baidu", "gist", "devto", "bluesky", "wordpress"]
  const articles = entries.map((entry) => {
    const check = checks.find((item) => normalizeUrl(item.url) === normalizeUrl(entry.url)) || {}
    const platforms = {}
    const skipped = {}
    const errors = {}
    for (const key of keys) {
      const result = resultByKey.get(key)
      const status = resultStatus(result)
      platforms[key] = {
        ...status,
        statusCode: result?.status,
        url: resultUrl(result, key),
      }
      if (status.status === "skipped") skipped[key] = status.reason
      if (status.status === "failed") errors[key] = status.reason
    }
    return {
      articleUrl: entry.url,
      title: entry.title,
      liveHttp: {
        status: check.status || 0,
        headStatus: check.headStatus || 0,
        ok: check.ok === true,
        contentType: check.contentType || "",
      },
      canonical: {
        href: check.canonical || "",
        ok: check.canonicalOk === true,
      },
      sitemapIncluded: check.sitemapIncluded === true,
      indexnow: platforms.indexnow,
      baidu: platforms.baidu,
      gist: { ...platforms.gist, url: platforms.gist.url },
      devto: { ...platforms.devto, url: platforms.devto.url },
      bluesky: { ...platforms.bluesky, url: platforms.bluesky.url },
      wordpress: { ...platforms.wordpress, url: platforms.wordpress.url },
      skipped,
      errors,
    }
  })
  const hasSkippedOrFailed = articles.some((article) =>
    Object.keys(article.skipped).length ||
    Object.keys(article.errors).length ||
    ["indexnow", "baidu", "gist", "devto", "bluesky", "wordpress"].some((key) => article[key]?.status !== "success")
  )
  const allLive = articles.every((article) => article.liveHttp.ok && article.canonical.ok && article.sitemapIncluded)
  return {
    runId: RUN_ID,
    generatedAt: new Date().toISOString(),
    siteRoot: SITE_ROOT,
    dryRun: DRY_RUN,
    sitemap: sitemapStatus,
    fullyDistributed: allLive && !hasSkippedOrFailed,
    status: allLive ? (hasSkippedOrFailed ? "partial" : "success") : "blocked",
    articles,
    platformResults: results,
  }
}

function writeProof(proof) {
  mkdirSync(dirname(PROOF_FILE), { recursive: true })
  writeFileSync(PROOF_FILE, `${JSON.stringify(proof, null, 2)}\n`, "utf8")
  console.log(`External publish proof written: ${PROOF_FILE}`)
}

const entries = REQUESTED_URLS.length ? await fetchRequestedEntries() : await fetchLatestUrls()
const urls = entries.map((entry) => normalizeUrl(entry.url))

console.log(`Collected ${urls.length} ${REQUESTED_URLS.length ? "requested" : "latest"} Cloudflare article URLs.`)
for (const entry of entries) console.log(`- ${entry.url} | ${entry.title}`)

const sitemap = await loadSitemapUrls()
const checks = await Promise.all(urls.map((url) => verifyUrl(url, sitemap.urls)))
console.log("HTTP checks:")
for (const check of checks) console.log(`- ${check.status} ${check.url} canonical=${check.canonicalOk} sitemap=${check.sitemapIncluded} ${check.contentType}`)

const hardBad = checks.filter((check) => !check.ok || !check.canonicalOk)
const sitemapMissing = checks.filter((check) => check.ok && check.canonicalOk && !check.sitemapIncluded)
if (sitemapMissing.length) {
  console.warn(`[WARN] ${sitemapMissing.length} URL(s) are 200+canonical but not yet in sitemap (SSR dynamic routes — this is expected for new articles): ${sitemapMissing.map((c) => c.url).join(", ")}`)
}
if (hardBad.length) {
  const proof = buildProof(entries, checks, [], { ok: sitemap.ok, status: sitemap.status, error: sitemap.error || "" })
  writeProof(proof)
  console.error(`Refusing to submit ${hardBad.length} URLs that are not 200/canonical.`)
  process.exit(1)
}

async function pingGoogleSitemap() {
  const sitemaps = [`${SITE_ROOT}/sitemap-index.xml`, `${SITE_ROOT}/sitemap.xml`]
  if (DRY_RUN) return { platform: "Google", dryRun: true, sitemaps }
  const results = await Promise.all(sitemaps.map(async (sm) => {
    const res = await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sm)}`, { method: "GET", redirect: "follow" })
    return { sitemap: sm, status: res.status, ok: res.ok }
  }))
  return { platform: "Google", ok: results.every((r) => r.ok), results }
}

const results = (await Promise.all([
  runPlatform("indexnow", () => submitIndexNow(urls)),
  runPlatform("google", () => pingGoogleSitemap()),
  runPlatform("baidu", () => submitBaidu(urls)),
  runPlatform("gist", () => publishGist(entries)),
  runPlatform("devto", () => publishDevto(entries)),
  runPlatform("bluesky", () => publishBluesky(entries)),
  runPlatform("wordpress", () => publishWordPress(entries)),
])).filter(Boolean)

console.log("Submission results:")
for (const result of results) console.log(JSON.stringify(result, null, 2))

const proof = buildProof(entries, checks, results, { ok: sitemap.ok, status: sitemap.status, error: sitemap.error || "" })
writeProof(proof)

if (process.env.STRICT_PUBLISH === "1" && results.some((result) => result.ok === false && !result.nonFatal)) process.exit(1)

