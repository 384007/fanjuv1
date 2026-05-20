// Submit latest Cloudflare-published article URLs to indexing/link platforms.

import { execFileSync } from "child_process"

const SITE_ROOT = (process.env.SITE_URL || "https://fanju.app").replace(/\/$/, "")
const CLOUDFLARE_ACCOUNT_ID = clean(process.env.CLOUDFLARE_ACCOUNT_ID)
const CLOUDFLARE_API_TOKEN = cleanToken(process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_AUTH_TOKEN)
const CLOUDFLARE_D1_DATABASE_ID = clean(process.env.CLOUDFLARE_D1_DATABASE_ID || "58d63133-adeb-4efd-b9eb-a9b056271ca5")
const LIMIT = Math.max(1, Number.parseInt(process.env.URL_LIMIT || "20", 10))
const DRY_RUN = process.env.DRY_RUN === "1"
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

function normalizeUrl(url) {
  return String(url || "").trim().replace(/\/$/, "")
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
    ["d1", "execute", "fanju-seo-prod", "--remote", "--command", sql],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
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

async function verifyUrl(url) {
  const res = await fetch(url, { method: "HEAD", redirect: "follow" })
  return { url, status: res.status, ok: res.ok, contentType: res.headers.get("content-type") || "" }
}

async function submitIndexNow(urls) {
  const key = clean(process.env.INDEXNOW_KEY)
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
    posted.push({ status: res.status, ok: res.ok, uri: body?.uri, body })
  }

  return { platform: "Bluesky", ok: posted.every((item) => item.ok), posted }
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

const entries = await fetchLatestUrls()
const urls = entries.map((entry) => normalizeUrl(entry.url))

console.log(`Collected ${urls.length} latest Cloudflare article URLs.`)
for (const entry of entries) console.log(`- ${entry.url} | ${entry.title}`)

const checks = await Promise.all(urls.map(verifyUrl))
console.log("HTTP checks:")
for (const check of checks) console.log(`- ${check.status} ${check.url} ${check.contentType}`)

const bad = checks.filter((check) => !check.ok)
if (bad.length) {
  console.error(`Refusing to submit ${bad.length} non-OK URLs.`)
  process.exit(1)
}

const results = (await Promise.all([
  runPlatform("indexnow", () => submitIndexNow(urls)),
  runPlatform("baidu", () => submitBaidu(urls)),
  runPlatform("gist", () => publishGist(entries)),
  runPlatform("devto", () => publishDevto(entries)),
  runPlatform("bluesky", () => publishBluesky(entries)),
  runPlatform("wordpress", () => publishWordPress(entries)),
])).filter(Boolean)

console.log("Submission results:")
for (const result of results) console.log(JSON.stringify(result, null, 2))

if (process.env.STRICT_PUBLISH === "1" && results.some((result) => result.ok === false && !result.nonFatal)) process.exit(1)
