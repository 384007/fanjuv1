// scripts/seo/check-live-article-content.mjs
//
// Check specific live article URLs for rendered HTML content, public spam
// phrases, basic article structure, stylesheet presence, and internal-link health.
//
// Environment:
//   URLS                comma-separated absolute URLs or paths
//   BASE_URL            default origin for paths. Default: https://fanju.app
//   TIMEOUT_MS          per article request timeout. Default: 20000
//   LINK_TIMEOUT_MS     per internal-link request timeout. Default: 12000
//   MAX_INTERNAL_LINKS  max internal hrefs to check per page. Default: 80

const BASE_URL = (process.env.BASE_URL || "https://fanju.app").replace(/\/$/, "")
const BASE_HOSTNAME = new URL(BASE_URL).hostname.replace(/^www\./, "")
const TIMEOUT_MS = Math.max(1000, Number.parseInt(process.env.TIMEOUT_MS || "20000", 10))
const LINK_TIMEOUT_MS = Math.max(1000, Number.parseInt(process.env.LINK_TIMEOUT_MS || "12000", 10))
const MAX_INTERNAL_LINKS = Math.max(1, Number.parseInt(process.env.MAX_INTERNAL_LINKS || "80", 10))
const URLS = (process.env.URLS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const BAD_PUBLIC_PATTERNS = [
  /本站/i,
  /联系QQ/i,
  /本地联系/i,
  /站长/i,
  /广告合作/i,
  /域名出售/i,
  /\bQQ\b/i,
  /\bIntro paragraph mentioning\b/i,
  /\bReturn valid JSON\b/i,
  /\bBody requirements\b/i,
  /\bmarkdown skeleton\b/i,
  /"body"\s*:/i,
  /"description"\s*:/i,
  /开头段落/,
  /正文要求/,
  /只返回合法 JSON/,
]

function buildUrl(raw) {
  if (/^https?:\/\//i.test(raw)) return raw
  const path = raw.startsWith("/") ? raw : `/${raw}`
  return `${BASE_URL}${path}`
}

function stripPrivateHtml(html = "") {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
}

function htmlText(html = "") {
  return stripPrivateHtml(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tagText(html = "", tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi")
  return [...stripPrivateHtml(html).matchAll(pattern)]
    .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
}

function badPhraseHits(text = "") {
  const hits = []
  for (const pattern of BAD_PUBLIC_PATTERNS) {
    if (pattern.test(text)) hits.push(String(pattern))
  }
  return hits
}

function minVisibleText(url = "") {
  return /\/en\//.test(url) ? 1800 : 900
}

function extractHrefs(html = "") {
  const hrefs = []
  const re = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = re.exec(html)) !== null) {
    const href = String(match[1] || "").trim()
    if (href) hrefs.push(href)
  }
  return [...new Set(hrefs)]
}

function isSkippableHref(href = "") {
  return (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:") ||
    href.startsWith("data:")
  )
}

function toInternalUrl(href = "") {
  if (isSkippableHref(href)) return null

  if (href.startsWith("/")) return `${BASE_URL}${href}`

  try {
    const url = new URL(href)
    const hostname = url.hostname.replace(/^www\./, "")
    if (hostname === BASE_HOSTNAME || hostname === "fanju.app") return url.toString()
  } catch {
    return null
  }

  return null
}

async function checkInternalLink(href) {
  const url = toInternalUrl(href)
  if (!url) return null

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(LINK_TIMEOUT_MS),
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache",
        "user-agent": "fanju-internal-link-check/1.0",
      },
    })

    if (response.status < 200 || response.status >= 400) {
      return { href, url, status: response.status }
    }
    return null
  } catch (err) {
    return {
      href,
      url,
      status: 0,
      error: `${err.name || "Error"}:${String(err.message || err).slice(0, 160)}`,
    }
  }
}

async function checkInternalLinks(html = "") {
  const hrefs = extractHrefs(html)
    .filter((href) => toInternalUrl(href))
    .slice(0, MAX_INTERNAL_LINKS)

  const bad = []
  for (const href of hrefs) {
    const issue = await checkInternalLink(href)
    if (issue) bad.push(issue)
  }

  return { checked: hrefs.length, bad }
}

async function checkOne(raw) {
  const url = buildUrl(raw)
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      "cache-control": "no-cache",
      pragma: "no-cache",
      "user-agent": "fanju-live-article-content-check/1.0",
    },
  })
  const html = await response.text()
  const publicHtml = stripPrivateHtml(html)
  const text = htmlText(html)
  const h1 = tagText(html, "h1")
  const h2 = tagText(html, "h2")
  const p = tagText(html, "p")
  const styleNodes =
    (html.match(/<link\b[^>]*rel=["']?stylesheet/gi) || []).length +
    (html.match(/<style\b/gi) || []).length
  const internalLinks = await checkInternalLinks(html)
  const result = {
    url,
    status: response.status,
    bytes: Buffer.byteLength(html),
    title: (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim(),
    h1: h1[0] || "",
    h1Count: h1.length,
    h2Count: h2.length,
    pCount: p.length,
    textLength: text.length,
    styleNodes,
    internalLinksChecked: internalLinks.checked,
    badInternalLinks: internalLinks.bad,
    badHits: badPhraseHits(publicHtml),
    issues: [],
  }

  if (response.status !== 200) result.issues.push(`http-${response.status}`)
  if (!result.h1) result.issues.push("missing-h1")
  if (result.h2Count < 3) result.issues.push(`too-few-h2:${result.h2Count}`)
  if (result.pCount < 5) result.issues.push(`too-few-p:${result.pCount}`)
  if (result.textLength < minVisibleText(url)) result.issues.push(`visible-text-too-short:${result.textLength}`)
  if (styleNodes < 1) result.issues.push("missing-stylesheet")
  if (result.badHits.length) result.issues.push(`bad-public-phrase:${result.badHits.join(",")}`)
  if (result.badInternalLinks.length) {
    result.issues.push(
      `bad-internal-links:${result.badInternalLinks
        .map((x) => `${x.href}->${x.status || x.error}`)
        .join("|")}`,
    )
  }

  return result
}

if (!URLS.length) {
  console.error("Missing URLS. Example: URLS=/city/a,/en/city/b pnpm seo:article:live:check")
  process.exit(1)
}

const results = []
for (const url of URLS) {
  try {
    const result = await checkOne(url)
    results.push(result)
    console.log(JSON.stringify(result))
  } catch (err) {
    const result = {
      url: buildUrl(url),
      status: 0,
      bytes: 0,
      title: "",
      h1: "",
      h1Count: 0,
      h2Count: 0,
      pCount: 0,
      textLength: 0,
      styleNodes: 0,
      internalLinksChecked: 0,
      badInternalLinks: [],
      badHits: [],
      issues: [`fetch-error:${err.name || "Error"}:${String(err.message || err).slice(0, 160)}`],
    }
    results.push(result)
    console.log(JSON.stringify(result))
  }
}

const failures = results.filter((result) => result.issues.length)
console.log(`Checked ${results.length} live article URL(s), failures ${failures.length}.`)
if (failures.length) process.exit(1)
