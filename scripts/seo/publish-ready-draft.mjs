import { execFileSync } from "child_process"
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { isDryRun, postJson, printDryRun } from "../fanju-publish-utils.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const READY_DIR = join(ROOT, "content/seo-ready")
const PUBLISHED_FILE = join(ROOT, process.env.PUBLISHED_FILE || "data/seo/published-ready-drafts.json")

const SITE_URL = (process.env.SITE_URL || "https://fanju.app").replace(/\/$/, "")
const MIN_SCORE = Number.parseInt(process.env.MIN_SCORE || "90", 10)
const MIN_BODY_CHARS = Number.parseInt(process.env.MIN_BODY_CHARS || "1200", 10)
const PUBLISH_LIVE = process.env.PUBLISH_LIVE !== "0"
const STRICT = process.env.STRICT_PUBLISH === "1"
const PUBLISH_FRESH_FIRST = process.env.PUBLISH_FRESH_FIRST === "1"

const forbiddenRe = /(Modal|NVIDIA|Gemini|Groq|Cerebras|Cloudflare|Next\.js|API|backend|后端|技术栈|model|prompt|generator|Below is|Here is|markdown draft|Verified Profiles|Rating System|Secure Communication|Emergency Contact|ID verification|background checks|payment protection|已认证|评分系统|安全通信|紧急联系人|身份认证|背景调查|支付保护)/i

function ensureDir(path) {
  mkdirSync(path, { recursive: true })
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback
  try {
    return JSON.parse(readFileSync(path, "utf8"))
  } catch {
    return fallback
  }
}

function writeJson(path, value) {
  ensureDir(dirname(path))
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf8")
}

function parseFrontmatter(md) {
  const match = md.match(/^---\n([\s\S]*?)\n---\n/)
  const fm = {}
  if (!match) return fm

  for (const line of match[1].split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    let value = m[2].trim()
    const quote = value[0]
    if ((quote === "\"" || quote === "'") && value.endsWith(quote)) {
      value = value.slice(1, -1)
      value = quote === "\""
        ? value.replace(/\\"/g, "\"")
        : value.replace(/\\'/g, "'")
      value = value.replace(/\\\\/g, "\\")
    }
    if (/^\d+$/.test(value)) value = Number.parseInt(value, 10)
    fm[key] = value
  }

  return fm
}

function bodyOnly(md) {
  return md
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/\n---\n\n## Draft Quality Check\n\n```json\n[\s\S]*?\n```\s*$/m, "")
    .trim()
}

function normalizeArticle(md, fm) {
  const body = bodyOnly(md)
  const canonicalPath = fm.canonicalPath || `/${fm.slug}`
  const canonicalUrl = `${SITE_URL}${canonicalPath}`

  return {
    slug: fm.slug,
    title: fm.title || fm.slug,
    titleZh: fm.titleZh || fm.title || fm.slug,
    canonicalPath,
    canonicalUrl,
    priorityScore: Number(fm.priorityScore || 0),
    aiQualityScore: Number(fm.aiQualityScore || 0),
    status: fm.status || "",
    body,
  }
}

function gitFileMtimeMs(relativePath, fallback) {
  try {
    const timestamp = execFileSync("git", ["log", "-1", "--format=%ct", "--", relativePath], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
    const seconds = Number.parseInt(timestamp, 10)
    return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : fallback
  } catch {
    return fallback
  }
}

function loadReadyArticles() {
  if (!existsSync(READY_DIR)) {
    console.log(`No ready dir found: ${READY_DIR}`)
    return []
  }

  return readdirSync(READY_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const relativePath = join("content/seo-ready", file)
      const path = join(READY_DIR, file)
      const md = readFileSync(path, "utf8")
      const fm = parseFrontmatter(md)
      const article = normalizeArticle(md, fm)
      const mtimeMs = statSync(path).mtimeMs
      return {
        ...article,
        file,
        path,
        mtimeMs,
        freshnessMs: gitFileMtimeMs(relativePath, mtimeMs),
      }
    })
}

function qualityOk(article) {
  const errors = []

  if (!article.slug) errors.push("missing slug")
  if (article.aiQualityScore < MIN_SCORE) errors.push(`aiQualityScore ${article.aiQualityScore} < ${MIN_SCORE}`)
  if (article.status !== "ready") errors.push(`status is ${article.status}, not ready`)
  if (article.body.length < MIN_BODY_CHARS) errors.push(`body too short: ${article.body.length} chars`)
  if (forbiddenRe.test(article.body)) errors.push("forbidden technical/safety-claim wording found")
  const isEnArticle = article.canonicalPath?.startsWith("/en/")
  if (!article.body.includes("Fanju")) errors.push("missing Fanju brand term")
  if (!isEnArticle && !article.body.includes("饭局")) errors.push("missing 饭局 brand term")
  if (!/FAQ|常见问题|问答/i.test(article.body)) errors.push("missing FAQ section")

  return errors
}

function shortText(text, max = 280) {
  const clean = String(text).replace(/\s+/g, " ").trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1)}…`
}

function articleForPlatforms(article) {
  const isEn = article.canonicalPath?.startsWith("/en/")
  const footer = isEn
    ? `Fanju is an AI social dining app and dinner gathering platform for finding dinner buddies, hosting local dinner gatherings, and building real-world social connections around shared meals.`
    : `Fanju / 饭局 是一个 AI 饭局社交和线下聚会平台，帮助用户找饭搭子、约饭、组织同城饭局，并通过真实饭桌建立线下社交关系。`
  return `${article.body}

---

Canonical source: ${article.canonicalUrl}

${footer}
`
}

async function requireOk(platform, result) {
  const { res, body } = result

  if (res.ok) {
    console.log(`${platform} publish succeeded.`)
    const url =
      body?.url ||
      body?.html_url ||
      body?.data?.publishPost?.post?.url ||
      body?.uri ||
      body?.id ||
      ""
    if (url) console.log(url)
    return { platform, ok: true, status: res.status, url }
  }

  console.error(`${platform} publish failed: ${res.status} ${res.statusText}`)
  if (body) console.error(typeof body === "string" ? body : JSON.stringify(body, null, 2))

  if (STRICT) {
    throw new Error(`${platform} publish failed`)
  }

  return { platform, ok: false, status: res.status, error: body }
}

async function publishGist(article) {
  const token = process.env.GIST_TOKEN
  if (!token) {
    console.log("SKIP: GIST_TOKEN is not configured.")
    return null
  }

  const payload = {
    description: `Fanju / 饭局 AI SEO article: ${article.titleZh}`,
    public: process.env.GIST_PUBLIC !== "0",
    files: {
      [`fanju-${article.slug}.md`]: {
        content: articleForPlatforms(article),
      },
    },
  }

  return requireOk(
    "GitHub Gist",
    await postJson("https://api.github.com/gists", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify(payload),
    }),
  )
}

async function publishDevto(article) {
  const apiKey = process.env.DEVTO_API_KEY
  if (!apiKey) {
    console.log("SKIP: DEVTO_API_KEY is not configured.")
    return null
  }

  return requireOk(
    "DEV.to",
    await postJson("https://dev.to/api/articles", {
      method: "POST",
      headers: { "api-key": apiKey },
      body: JSON.stringify({
        article: {
          title: `${article.titleZh} | ${article.title}`,
          body_markdown: articleForPlatforms(article),
          published: PUBLISH_LIVE,
          canonical_url: article.canonicalUrl,
          tags: ["china", "social", "community", "networking"],
        },
      }),
    }),
  )
}

async function publishHashnode(article) {
  const rawToken = process.env.HASHNODE_TOKEN
  if (!rawToken) {
    console.log("SKIP: HASHNODE_TOKEN is not configured.")
    return null
  }

  const authHeader = rawToken.startsWith("Bearer ") ? rawToken : `Bearer ${rawToken}`
  const publicationId = process.env.HASHNODE_PUBLICATION_ID

  if (!publicationId) {
    console.log("SKIP: HASHNODE_PUBLICATION_ID is not configured.")
    return null
  }

  const query = `
mutation PublishPost($input: PublishPostInput!) {
  publishPost(input: $input) {
    post {
      id
      url
      title
    }
  }
}
`

  return requireOk(
    "Hashnode",
    await postJson("https://gql.hashnode.com", {
      method: "POST",
      headers: { Authorization: authHeader },
      body: JSON.stringify({
        query,
        variables: {
          input: {
            publicationId,
            title: `${article.titleZh} | ${article.title}`,
            contentMarkdown: articleForPlatforms(article),
            originalArticleURL: article.canonicalUrl,
            tags: [
              { name: "China", slug: "china" },
              { name: "Social Dining", slug: "social-dining" },
              { name: "Community", slug: "community" },
            ],
            publishedAt: PUBLISH_LIVE ? new Date().toISOString() : undefined,
          },
        },
      }),
    }),
  )
}

async function publishBluesky(article) {
  const service = process.env.BLUESKY_SERVICE || "https://bsky.social"
  const handle = process.env.BLUESKY_HANDLE
  const password = process.env.BLUESKY_APP_PASSWORD

  if (!handle || !password) {
    console.log("SKIP: BLUESKY_HANDLE and BLUESKY_APP_PASSWORD are not both configured.")
    return null
  }

  const session = await postJson(`${service}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    body: JSON.stringify({ identifier: handle, password }),
  })

  if (!session.res.ok) {
    return requireOk("Bluesky session", session)
  }

  const text = shortText(`${article.titleZh}：中国大陆城市饭局、同城聚会、饭搭子和线下社交指南。${article.canonicalUrl}`)

  return requireOk(
    "Bluesky",
    await postJson(`${service}/xrpc/com.atproto.repo.createRecord`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.body.accessJwt}` },
      body: JSON.stringify({
        repo: session.body.did,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text,
          createdAt: new Date().toISOString(),
        },
      }),
    }),
  )
}

async function publishMastodon(article) {
  const instance = (process.env.MASTODON_INSTANCE || "").replace(/\/$/, "")
  const token = process.env.MASTODON_ACCESS_TOKEN

  if (!instance || !token) {
    console.log("SKIP: MASTODON_INSTANCE and MASTODON_ACCESS_TOKEN are not both configured.")
    return null
  }

  const status = shortText(`${article.titleZh}

中国大陆城市饭局 / 同城聚会 / 饭搭子指南。
${article.canonicalUrl}`, 450)

  return requireOk(
    "Mastodon",
    await postJson(`${instance}/api/v1/statuses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, visibility: "public" }),
    }),
  )
}

const published = readJson(PUBLISHED_FILE, { articles: [] })
const publishedSlugs = new Set((published.articles || []).map((x) => x.slug))

const candidates = loadReadyArticles()
  .filter((article) => !publishedSlugs.has(article.slug))
  .map((article) => ({ article, errors: qualityOk(article) }))
  .filter(({ article, errors }) => {
    if (errors.length > 0) {
      console.log(`SKIP: ${article.slug} — ${errors.join("; ")}`)
      return false
    }
    return true
  })
  .sort((a, b) => {
    if (PUBLISH_FRESH_FIRST) {
      return b.article.freshnessMs - a.article.freshnessMs || b.article.priorityScore - a.article.priorityScore
    }
    return b.article.priorityScore - a.article.priorityScore || b.article.mtimeMs - a.article.mtimeMs
  })

if (!candidates.length) {
  console.log("No unpublished ready draft passed quality gate.")
  process.exit(0)
}

const article = candidates[0].article

if (isDryRun()) {
  printDryRun("Fanju hourly ready draft", {
    slug: article.slug,
    title: article.title,
    titleZh: article.titleZh,
    canonicalUrl: article.canonicalUrl,
    aiQualityScore: article.aiQualityScore,
    priorityScore: article.priorityScore,
    bodyChars: article.body.length,
    preview: article.body.slice(0, 900),
  })
  process.exit(0)
}

console.log(`Publishing ready draft: ${article.slug}`)
console.log(`${article.titleZh} | ${article.title}`)
console.log(article.canonicalUrl)

const platformResults = []
for (const publish of [publishGist, publishDevto, publishHashnode, publishBluesky, publishMastodon]) {
  const result = await publish(article)
  if (result) platformResults.push(result)
}

if (!platformResults.length) {
  console.log("No platform secrets configured; not marking article as published.")
  if (STRICT) process.exit(1)
  process.exit(0)
}

if (!platformResults.some((result) => result.ok)) {
  console.log("No external platform publish succeeded; not marking article as published.")
  if (STRICT) process.exit(1)
  process.exit(0)
}

published.articles = [
  {
    slug: article.slug,
    title: article.title,
    titleZh: article.titleZh,
    canonicalPath: article.canonicalPath,
    canonicalUrl: article.canonicalUrl,
    aiQualityScore: article.aiQualityScore,
    priorityScore: article.priorityScore,
    publishedAt: new Date().toISOString(),
    platforms: platformResults,
  },
  ...(published.articles || []),
].slice(0, 1000)

writeJson(PUBLISHED_FILE, published)

console.log(`Marked ${article.slug} as published in ${PUBLISHED_FILE}`)
