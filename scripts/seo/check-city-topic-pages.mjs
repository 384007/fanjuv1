// Strict post-build checks for Fanju city topic SEO pages.
// Runs against BASE_URL when provided, otherwise serves the static export in out/.

import { createServer } from "http"
import { execFileSync } from "child_process"
import { existsSync, readFileSync } from "fs"
import { dirname, extname, join, normalize } from "path"
import { fileURLToPath } from "url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..")
const OUT_DIR = join(ROOT, "out")
const READY_DIR = join(ROOT, "content/seo-ready")
const PROMPT_BANK_FILE = join(ROOT, "data/seo/random-prompt-bank.jsonl")
const SITEMAP_FILE = join(ROOT, "public/sitemap.xml")
const ROBOTS_FILE = join(ROOT, "public/robots.txt")
const SITE_URL = "https://fanju.app"
const READY_MIN_SCORE = 90
const DEFAULT_REQUIRED_ROUTES = [
  "/en/city/seattle/third-place-dinner",
  "/en/city/kuala-lumpur/local-dinner",
]
const PROMPT_BANK_EXISTING_LIMIT = Number.parseInt(process.env.SEO_CITY_TOPIC_PROMPT_BANK_LIMIT || "20", 10)

const REQUIRED_LOCAL_TERMS = {
  "/en/city/seattle/third-place-dinner": [
    "Seattle",
    "Capitol Hill",
    "Ballard",
    "Fremont",
    "Queen Anne",
    "South Lake Union",
    "rainy evening",
    "remote work",
    "coffee shop",
    "third place",
    "small-table dinner",
  ],
  "/en/city/kuala-lumpur/local-dinner": [
    "Kuala Lumpur",
    "KLCC",
    "Bangsar",
    "Bukit Bintang",
    "TTDI",
    "Chinatown",
    "Mont Kiara",
    "mamak",
    "kopitiam",
    "halal",
    "local dinner",
    "expat/local mixed table",
  ],
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function stripTags(value = "") {
  return decodeHtml(String(value).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
}

function titleCaseSlug(slug = "") {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function topicBase(topicName = "", topicSlug = "", lang = "en") {
  const value = topicName || (lang === "en" ? titleCaseSlug(topicSlug) : topicSlug.replace(/-/g, ""))
  return lang === "en" ? value.replace(/\s+dinner$/i, "").trim() || value : value.replace(/饭局$/, "").trim() || value
}

function primaryKeywordFor(route, meta = {}, prompt = null) {
  const isEn = route.startsWith("/en/")
  const parts = route.split("/").filter(Boolean)
  const citySlug = parts[0] === "en" ? parts[2] : parts[1]
  const topicSlug = parts[0] === "en" ? parts[3] : parts[2]
  if (meta.primaryKeyword) return meta.primaryKeyword
  if (prompt?.locale === "en") return `${prompt.cityNameLocalized} ${topicBase(prompt.topicNameLocalized, topicSlug, "en")} Dinner`
  if (prompt?.locale === "zh") return `${prompt.cityNameLocalized}${topicBase(prompt.topicNameLocalized, topicSlug, "zh")}饭局`
  const city = isEn ? titleCaseSlug(citySlug) : ""
  const topic = topicBase("", topicSlug, isEn ? "en" : "zh")
  return isEn ? `${city} ${topic} Dinner` : meta.title?.split(/[：:|｜-]/)[0] || topic
}

function routeExpectation(route, meta = {}, prompt = null) {
  const isEn = route.startsWith("/en/")
  const parts = route.split("/").filter(Boolean)
  const citySlug = parts[0] === "en" ? parts[2] : parts[1]
  const topicSlug = parts[0] === "en" ? parts[3] : parts[2]
  const city = prompt?.cityNameLocalized || (isEn ? titleCaseSlug(citySlug) : (meta.primaryKeyword || meta.title || "").slice(0, 8))
  const topic = prompt?.topicNameLocalized || (isEn ? titleCaseSlug(topicSlug) : topicSlug.replace(/-/g, ""))
  const primaryKeyword = primaryKeywordFor(route, meta, prompt)
  return { route, isEn, city, topic, topicBase: topicBase(topic, topicSlug, isEn ? "en" : "zh"), primaryKeyword }
}

function parseFrontmatter(raw = "") {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const meta = {}
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.*)\s*$/)
    if (!m) continue
    let value = m[2].trim()
    const quote = value[0]
    if ((quote === "\"" || quote === "'") && value.endsWith(quote)) value = value.slice(1, -1)
    meta[m[1]] = value.replace(/\\"/g, "\"").trim()
  }
  return meta
}

function readyArticleIndex() {
  const out = new Map()
  if (!existsSync(READY_DIR)) return out
  const names = execFileSync("find", [READY_DIR, "-maxdepth", "1", "-type", "f", "-name", "*.md"], { encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
  for (const file of names) {
    const raw = readFileSync(file, "utf8")
    const meta = parseFrontmatter(raw)
    const score = Number.parseInt(meta.aiQualityScore || "0", 10)
    if (meta.status !== "ready" || score < READY_MIN_SCORE || !meta.canonicalPath) continue
    out.set(meta.canonicalPath, { file, meta })
  }
  return out
}

function promptBankExpectations(existingRoutes) {
  const out = new Map()
  if (!existsSync(PROMPT_BANK_FILE) || PROMPT_BANK_EXISTING_LIMIT <= 0) return out
  const lines = readFileSync(PROMPT_BANK_FILE, "utf8").split(/\r?\n/).filter(Boolean)
  for (const line of lines) {
    if (out.size >= PROMPT_BANK_EXISTING_LIMIT) break
    let prompt
    try {
      prompt = JSON.parse(line)
    } catch {
      continue
    }
    if (!prompt.route || !/^\/(?:en\/)?city\/[^/]+\/[^/]+$/.test(prompt.route)) continue
    if (!existingRoutes.has(prompt.route) || out.has(prompt.route)) continue
    out.set(prompt.route, routeExpectation(prompt.route, {}, prompt))
  }
  return out
}

function changedReadyRoutes(index) {
  try {
    const output = execFileSync("git", ["diff", "--name-only", "--diff-filter=AM", "origin/main...HEAD", "--", "content/seo-ready"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
    return output
      .split(/\r?\n/)
      .filter((file) => file.endsWith(".md"))
      .map((file) => {
        const raw = readFileSync(join(ROOT, file), "utf8")
        return parseFrontmatter(raw).canonicalPath
      })
      .filter((route) => route && index.has(route))
  } catch {
    return []
  }
}

function requestedRoutes(index) {
  const explicit = (process.env.SEO_CITY_TOPIC_URLS || "")
    .split(",")
    .map((route) => route.trim())
    .filter(Boolean)
  const routes = new Set([...DEFAULT_REQUIRED_ROUTES, ...explicit, ...changedReadyRoutes(index)])
  const promptExpectations = promptBankExpectations(new Set(index.keys()))
  for (const route of promptExpectations.keys()) routes.add(route)

  const expectations = new Map()
  for (const route of routes) {
    const item = index.get(route)
    expectations.set(route, promptExpectations.get(route) || routeExpectation(route, item?.meta || {}))
  }
  return expectations
}

function staticFileForRoute(route) {
  const clean = decodeURIComponent(route.split("?")[0].replace(/^\/+/, ""))
  const candidates = [
    join(OUT_DIR, `${clean}.html`),
    join(OUT_DIR, clean, "index.html"),
    join(OUT_DIR, clean),
  ]
  return candidates.find((file) => existsSync(file) && (extname(file) === ".html" || extname(file) === "")) || ""
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8"
  if (file.endsWith(".xml")) return "application/xml; charset=utf-8"
  if (file.endsWith(".txt")) return "text/plain; charset=utf-8"
  return "application/octet-stream"
}

function startStaticServer() {
  if (!existsSync(OUT_DIR)) throw new Error(`Missing static export directory: ${OUT_DIR}`)
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", "http://localhost")
    const route = url.pathname === "/" ? "/index" : url.pathname
    const file = staticFileForRoute(route)
    if (!file) {
      res.writeHead(404)
      res.end("Not found")
      return
    }
    const normalized = normalize(file)
    if (!normalized.startsWith(normalize(OUT_DIR))) {
      res.writeHead(403)
      res.end("Forbidden")
      return
    }
    res.writeHead(200, { "content-type": contentType(file) })
    res.end(readFileSync(file))
  })
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      resolve({ server, baseUrl: `http://127.0.0.1:${address.port}` })
    })
  })
}

function extractAttr(html, pattern) {
  return decodeHtml(html.match(pattern)?.[1] || "")
}

function extractAll(html, pattern) {
  return [...html.matchAll(pattern)].map((m) => decodeHtml(m[1] || ""))
}

function extractJsonLd(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  const nodes = []
  for (const script of scripts) {
    const raw = decodeHtml(script[1])
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      throw new Error(`invalid JSON-LD: ${err.message}`, { cause: err })
    }
    const queue = Array.isArray(parsed) ? [...parsed] : [parsed]
    while (queue.length) {
      const node = queue.shift()
      if (!node || typeof node !== "object") continue
      nodes.push(node)
      if (Array.isArray(node["@graph"])) queue.push(...node["@graph"])
    }
  }
  return nodes
}

function hasType(nodes, type) {
  return nodes.some((node) => Array.isArray(node["@type"]) ? node["@type"].includes(type) : node["@type"] === type)
}

function countOccurrences(text, needle) {
  if (!needle) return 0
  return (text.toLowerCase().match(new RegExp(escapeRegExp(needle.toLowerCase()), "g")) || []).length
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function completeSentence(value = "", isEn = true) {
  return isEn ? /[.!?]["')\]]?$/.test(value.trim()) : /[。！？]["')\]]?$/.test(value.trim())
}

function weakEnding(value = "", isEn = true) {
  const text = value.trim().toLowerCase()
  if (/[，,;；:]$/.test(text)) return true
  if (isEn && /\b(and|or|but|because|with|for|to|of|in|at|from|through|while|where|that|which)$/.test(text)) return true
  if (!isEn && /(和|与|以及|但是|因为|如果|为了|通过|关于|以及|而|并且)$/.test(text)) return true
  return false
}

function localTermHits(route, bodyText, expected) {
  const exact = REQUIRED_LOCAL_TERMS[route]
  if (exact) return exact.filter((term) => bodyText.toLowerCase().includes(term.toLowerCase()))
  const generic = [
    expected.city,
    "neighborhood",
    "district",
    "venue",
    "restaurant",
    "public",
    "table",
    "host",
    "evening",
    "work",
    "street",
    "transit",
    "餐厅",
    "街区",
    "同桌",
    "主理人",
    "本地",
  ]
  return generic.filter((term) => term && bodyText.toLowerCase().includes(term.toLowerCase()))
}

async function checkRoute(baseUrl, route, expected, seenMeta, sitemap, robots) {
  const res = await fetch(`${baseUrl}${route}`, { redirect: "manual" })
  const issues = []
  if (res.status !== 200) issues.push(`HTTP ${res.status}`)
  const html = await res.text()
  const title = extractAttr(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  const description = extractAttr(html, /<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i)
    || extractAttr(html, /<meta\b[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i)
  const canonical = extractAttr(html, /<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
  const h1s = extractAll(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi).map(stripTags)
  const h2s = extractAll(html, /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi).map(stripTags)
  const paragraphs = extractAll(html, /<p\b[^>]*>([\s\S]*?)<\/p>/gi).map(stripTags).filter(Boolean)
  const firstParagraph = paragraphs[0] || ""
  const bodyText = stripTags(html)
  const nodes = extractJsonLd(html)
  const article = nodes.find((node) => Array.isArray(node["@type"]) ? node["@type"].includes("Article") : node["@type"] === "Article")
  const breadcrumb = nodes.find((node) => node["@type"] === "BreadcrumbList")
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)]
    .map((m) => m[1])
    .filter((href) => href.startsWith("/") && !href.startsWith("//") && href !== route)
  const uniqueLinks = new Set(links)
  const cityCount = countOccurrences(bodyText, expected.city)
  const topicNeedle = expected.isEn ? expected.topicBase : expected.topic
  const topicCount = countOccurrences(bodyText, topicNeedle)
  const localHits = localTermHits(route, bodyText, expected)

  if (!title) issues.push("missing title")
  if (title && (!title.toLowerCase().includes(expected.city.toLowerCase()) || !title.toLowerCase().includes(expected.topicBase.toLowerCase()))) issues.push(`title missing city/topic: ${title}`)
  if (!description) issues.push("missing description")
  if (description && !completeSentence(description, expected.isEn)) issues.push(`description incomplete: ${description}`)
  if (h1s.length !== 1) issues.push(`expected one H1, found ${h1s.length}`)
  if (h1s[0] && (!h1s[0].toLowerCase().includes(expected.city.toLowerCase()) || !h1s[0].toLowerCase().includes(expected.topicBase.toLowerCase()))) issues.push(`H1 missing city/topic: ${h1s[0]}`)
  if (!h2s.some((h2) => h2.toLowerCase().includes(expected.city.toLowerCase()) && h2.toLowerCase().includes(expected.topicBase.toLowerCase()))) issues.push("no H2 contains city/topic")
  if (!firstParagraph) issues.push("missing first paragraph")
  if (firstParagraph && (!completeSentence(firstParagraph, expected.isEn) || weakEnding(firstParagraph, expected.isEn))) issues.push(`first paragraph incomplete: ${firstParagraph}`)
  if (!hasType(nodes, "Article")) issues.push("missing Article JSON-LD")
  if (!hasType(nodes, "BreadcrumbList")) issues.push("missing BreadcrumbList JSON-LD")
  if (!hasType(nodes, "Organization")) issues.push("missing Organization JSON-LD")
  if (!hasType(nodes, "WebSite")) issues.push("missing WebSite JSON-LD")
  for (const field of ["headline", "description", "datePublished", "dateModified", "author", "publisher", "mainEntityOfPage", "inLanguage"]) {
    if (article && !article[field]) issues.push(`Article JSON-LD missing ${field}`)
  }
  if (article?.headline && !article.headline.toLowerCase().includes(expected.primaryKeyword.toLowerCase())) issues.push("Article headline missing primary keyword")
  if (!breadcrumb?.itemListElement || breadcrumb.itemListElement.length < 4) issues.push("BreadcrumbList needs Home, Cities, City, current page")
  if (cityCount < 5) issues.push(`city appears ${cityCount} times`)
  if (topicCount < 5) issues.push(`topic appears ${topicCount} times`)
  if (localHits.length < 5) issues.push(`local anchors ${localHits.length}/5`)
  if (uniqueLinks.size < 5) issues.push(`internal links ${uniqueLinks.size}/5`)
  if (canonical !== `${SITE_URL}${route}`) issues.push(`canonical mismatch: ${canonical}`)
  if (!sitemap.includes(`<loc>${SITE_URL}${route}</loc>`)) issues.push("sitemap missing route")
  if (!/Sitemap:\s*https:\/\/fanju\.app\/sitemap-index\.xml/i.test(robots)) issues.push("robots missing sitemap")
  if (/Disallow:\s*\/\s*$/im.test(robots)) issues.push("robots disallows public pages")

  const titleKey = title.toLowerCase()
  const descKey = description.toLowerCase()
  if (seenMeta.titles.has(titleKey)) issues.push("duplicate checked title")
  if (seenMeta.descriptions.has(descKey)) issues.push("duplicate checked description")
  seenMeta.titles.add(titleKey)
  seenMeta.descriptions.add(descKey)

  return { route, issues }
}

async function main() {
  const index = readyArticleIndex()
  const expectations = requestedRoutes(index)
  if (!existsSync(SITEMAP_FILE)) throw new Error(`Missing ${SITEMAP_FILE}`)
  if (!existsSync(ROBOTS_FILE)) throw new Error(`Missing ${ROBOTS_FILE}`)
  const sitemap = readFileSync(SITEMAP_FILE, "utf8")
  const robots = readFileSync(ROBOTS_FILE, "utf8")
  const externalBase = process.env.BASE_URL?.replace(/\/$/, "")
  const local = externalBase ? null : await startStaticServer()
  const baseUrl = externalBase || local.baseUrl
  const seenMeta = { titles: new Set(), descriptions: new Set() }
  const failures = []

  console.log(`City topic SEO check: routes=${expectations.size} base=${baseUrl}`)
  try {
    for (const [route, expected] of expectations.entries()) {
      const result = await checkRoute(baseUrl, route, expected, seenMeta, sitemap, robots)
      if (result.issues.length) failures.push(result)
      else console.log(`  OK ${route}`)
    }
  } finally {
    if (local) await new Promise((resolve) => local.server.close(resolve))
  }

  if (failures.length) {
    console.error("\nCity topic SEO check failed:")
    for (const failure of failures) {
      console.error(`- ${failure.route}`)
      for (const issue of failure.issues) console.error(`  - ${issue}`)
    }
    process.exit(1)
  }
  console.log("City topic SEO check passed.")
}

main().catch((err) => {
  console.error(err?.stack || err?.message || String(err))
  process.exit(1)
})
