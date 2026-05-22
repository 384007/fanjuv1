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

import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"

const BASE_URL = (process.env.BASE_URL || "https://fanju.app").replace(/\/$/, "")
const BASE_HOSTNAME = new URL(BASE_URL).hostname.replace(/^www\./, "")
const TIMEOUT_MS = Math.max(1000, Number.parseInt(process.env.TIMEOUT_MS || "20000", 10))
const LINK_TIMEOUT_MS = Math.max(1000, Number.parseInt(process.env.LINK_TIMEOUT_MS || "12000", 10))
const MAX_INTERNAL_LINKS = Math.max(1, Number.parseInt(process.env.MAX_INTERNAL_LINKS || "80", 10))
const MANIFEST_FILE = join(process.cwd(), "data/seo/route-manifest.json")
const READY_DIR = join(process.cwd(), "content/seo-ready")
const REQUIRE_SOURCE_MATCH = process.env.REQUIRE_SOURCE_MATCH === "1"
const ZH_CITY_LOCALIZED_COUNTRIES = new Set(["CN", "HK", "MO", "TW"])
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

let routeManifestEntries = null
let expectedSourceByPath = null

function parseFrontmatter(raw = "") {
  const match = String(raw || "").match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const meta = {}
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)\s*$/)
    if (!m) continue
    let value = m[2].trim()
    const quote = value[0]
    if ((quote === "\"" || quote === "'") && value.endsWith(quote)) {
      value = value.slice(1, -1)
      value = quote === "\""
        ? value.replace(/\\"/g, "\"")
        : value.replace(/\\'/g, "'")
      value = value.replace(/\\\\/g, "\\")
    }
    meta[m[1]] = value.trim()
  }
  return meta
}

function bodyWithoutFrontmatter(raw = "") {
  const match = String(raw || "").match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/)
  return match ? match[1].trim() : String(raw || "").trim()
}

function markdownH1(body = "") {
  return String(body || "").match(/^#\s+(.+)$/m)?.[1]?.trim() || ""
}

function comparableText(value = "") {
  return String(value || "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/[^\s)]+/gi, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
}

function loadExpectedSources() {
  if (expectedSourceByPath) return expectedSourceByPath
  expectedSourceByPath = new Map()
  if (!existsSync(READY_DIR)) return expectedSourceByPath
  for (const file of readdirSync(READY_DIR).filter((f) => f.endsWith(".md"))) {
    const raw = readFileSync(join(READY_DIR, file), "utf8")
    const meta = parseFrontmatter(raw)
    const canonicalPath = normalizePath(meta.canonicalPath || "")
    const score = Number.parseInt(meta.aiQualityScore || "0", 10)
    if (!canonicalPath || meta.status !== "ready" || score < 90) continue
    const body = bodyWithoutFrontmatter(raw)
    expectedSourceByPath.set(canonicalPath, {
      file,
      h1: comparableText(markdownH1(body) || meta.title || ""),
      title: comparableText(meta.title || ""),
    })
  }
  return expectedSourceByPath
}

function loadRouteManifestEntries() {
  if (routeManifestEntries) return routeManifestEntries
  routeManifestEntries = []
  if (!existsSync(MANIFEST_FILE)) return routeManifestEntries
  try {
    const payload = JSON.parse(readFileSync(MANIFEST_FILE, "utf8"))
    routeManifestEntries = Array.isArray(payload.entries) ? payload.entries : []
  } catch {
    routeManifestEntries = []
  }
  return routeManifestEntries
}

function normalizePath(path = "") {
  const value = String(path || "").trim()
  if (!value) return ""
  const pathname = value.startsWith("/") ? value : `/${value}`
  return pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname
}

function routeMetaForUrl(url = "") {
  let pathname = ""
  try {
    pathname = normalizePath(new URL(url).pathname)
  } catch {
    pathname = normalizePath(url)
  }
  if (!pathname || pathname.startsWith("/en/")) return null
  return loadRouteManifestEntries().find((entry) => normalizePath(entry.route) === pathname && entry.locale === "zh") || null
}

function expectedSourceForUrl(url = "") {
  const pathname = (() => {
    try {
      return normalizePath(new URL(url).pathname)
    } catch {
      return normalizePath(url)
    }
  })()
  return loadExpectedSources().get(pathname) || null
}

function addLatinAlias(aliases, value = "") {
  const alias = String(value || "").trim().toLowerCase()
  if (!alias || /[\u4e00-\u9fff]/.test(alias)) return
  aliases.add(alias)
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function zhLatinCityAliasHits(url = "", haystack = "") {
  const meta = routeMetaForUrl(url)
  const countryCode = String(meta?.countryCode || "").toUpperCase()
  if (!meta || !ZH_CITY_LOCALIZED_COUNTRIES.has(countryCode)) return []

  const aliases = new Set()
  addLatinAlias(aliases, meta.citySlug)
  addLatinAlias(aliases, String(meta.citySlug || "").replace(/-/g, " "))
  addLatinAlias(aliases, String(meta.citySlug || "").replace(/-/g, ""))
  addLatinAlias(aliases, meta.cityNameEn)

  const text = String(haystack || "").toLowerCase()
  return [...aliases].filter((alias) => new RegExp(`(^|[^a-z])${escapeRegExp(alias)}([^a-z]|$)`, "i").test(text))
}

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
  const expectedSource = expectedSourceForUrl(url)
  const zhCityAliases = zhLatinCityAliasHits(url, `${result.title}\n${result.h1}\n${h2.join("\n")}\n${text.slice(0, 3000)}`)

  if (response.status !== 200) result.issues.push(`http-${response.status}`)
  if (!result.h1) result.issues.push("missing-h1")
  if (result.h2Count < 3) result.issues.push(`too-few-h2:${result.h2Count}`)
  if (result.pCount < 5) result.issues.push(`too-few-p:${result.pCount}`)
  if (result.textLength < minVisibleText(url)) result.issues.push(`visible-text-too-short:${result.textLength}`)
  if (styleNodes < 1) result.issues.push("missing-stylesheet")
  if (result.badHits.length) result.issues.push(`bad-public-phrase:${result.badHits.join(",")}`)
  if (REQUIRE_SOURCE_MATCH && !expectedSource) result.issues.push("missing-local-source-article")
  if (expectedSource && comparableText(result.h1) !== expectedSource.h1) {
    result.issues.push(`source-h1-mismatch:${expectedSource.file}`)
  }
  if (zhCityAliases.length) result.issues.push(`pinyin-city-name-in-zh-live-text:${zhCityAliases.join("|")}`)
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
