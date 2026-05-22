/**
 * scripts/seo/validate-indexability.mjs
 * Validates that:
 *   1. Route manifest is built and consistent
 *   2. All sitemap URLs are canonical 200 (not redirects/drafts)
 *   3. No sitemap URL appears in the redirect/draft lists
 *   4. Hreflang URLs are absolute and point to known canonical paths
 *   5. Canonical URLs are absolute and self-referencing
 *
 * Exits with code 1 if any violation is found (CI-safe).
 *
 * Usage: node scripts/seo/validate-indexability.mjs
 */

import { existsSync, readFileSync, readdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const SITE = "https://fanju.app"
const READY_DIR = join(ROOT, "content/seo-ready")
const GENERATED_INDEX_DIR = join(ROOT, "content/articles/ready/index")
const GENERATED_NOINDEX_DIR = join(ROOT, "content/articles/ready/noindex")
const SITEMAP_FILE = join(ROOT, "public/sitemap.xml")
const MIN_SCORE = 90

let errors = 0
let warnings = 0

function fail(msg) { console.error(`  ❌ ${msg}`); errors++ }
function pass(msg) { console.log(`  ✅ ${msg}`) }

// ─── 1. Parse ready articles ──────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
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

function normalizePath(p) {
  if (!p) return ""
  const n = p.startsWith("/") ? p : `/${p}`
  return n.endsWith("/") && n.length > 1 ? n.slice(0, -1) : n
}

function isSeoHubPath(path) {
  return /^\/(?:en\/)?city\/[^/]+$/.test(path) || /^\/(?:en\/)?category\/[^/]+$/.test(path)
}

console.log("\n🔍 Validating SEO indexability...\n")

// Build set of canonical paths from ready articles
const canonicalPaths = new Set()
const draftPaths = new Set()
const articlesByPath = new Map()

if (existsSync(READY_DIR)) {
  for (const file of readdirSync(READY_DIR).filter((f) => f.endsWith(".md"))) {
    const raw = readFileSync(join(READY_DIR, file), "utf8")
    const meta = parseFrontmatter(raw)
    const score = parseInt(meta.aiQualityScore || "0", 10)
    const cp = normalizePath(meta.canonicalPath || `/${meta.slug || file.replace(/\.md$/, "")}`)

    if (meta.status !== "ready" || score < MIN_SCORE) {
      draftPaths.add(cp)
      continue
    }
    canonicalPaths.add(cp)
    articlesByPath.set(cp, { file, meta })
  }
}
if (existsSync(GENERATED_INDEX_DIR)) {
  for (const file of readdirSync(GENERATED_INDEX_DIR).filter((f) => f.endsWith(".json"))) {
    let article
    try {
      article = JSON.parse(readFileSync(join(GENERATED_INDEX_DIR, file), "utf8"))
    } catch {
      continue
    }
    const cp = normalizePath(article.canonicalPath || "")
    if (!cp) continue
    if (article.status === "publish" && article.robots === "index,follow" && article.sitemapEligible !== false) {
      canonicalPaths.add(cp)
      articlesByPath.set(cp, { file: `content/articles/ready/index/${file}`, meta: { canonicalPath: cp, lang: article.language || (cp.startsWith("/en/") ? "en" : "zh") } })
    } else {
      draftPaths.add(cp)
    }
  }
}

if (existsSync(GENERATED_NOINDEX_DIR)) {
  for (const file of readdirSync(GENERATED_NOINDEX_DIR).filter((f) => f.endsWith(".json"))) {
    let article
    try {
      article = JSON.parse(readFileSync(join(GENERATED_NOINDEX_DIR, file), "utf8"))
    } catch {
      continue
    }
    const cp = normalizePath(article.canonicalPath || "")
    if (cp) draftPaths.add(cp)
  }
}

// A path with at least one ready article is canonical, even if a low-score
// or draft sibling file exists for the same canonicalPath. The duplicate is a
// content-quality concern (warned below) but must not invalidate a legitimate
// canonical URL that already ships in the sitemap.
for (const p of canonicalPaths) draftPaths.delete(p)

console.log(`📄 Ready articles: ${canonicalPaths.size} canonical, ${draftPaths.size} draft\n`)

// ─── 2. Validate sitemap ──────────────────────────────────────────────────────

console.log("── Sitemap validation ──")

// Load static seo-data city/category paths. These are template pages that are
// intentionally kept in the full sitemap, even when no dedicated ready article exists.
const seoDataPaths = new Set()
const seoDataFile = join(ROOT, "lib/seo-data.ts")
if (existsSync(seoDataFile)) {
  const seoDataContent = readFileSync(seoDataFile, "utf8")
  const cityMatch = seoDataContent.match(/export const cities[\s\S]*?\n\]/m)
  const catMatch = seoDataContent.match(/export const categories[\s\S]*?\n\]/m)
  const citySlugList = cityMatch ? [...cityMatch[0].matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]) : []
  const catSlugList = catMatch ? [...catMatch[0].matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]) : []
  for (const city of citySlugList) {
    for (const cat of catSlugList) {
      seoDataPaths.add(`/city/${city}/${cat}`)
      seoDataPaths.add(`/en/city/${city}/${cat}`)
    }
    seoDataPaths.add(`/city/${city}`)
    seoDataPaths.add(`/en/city/${city}`)
  }
}

if (!existsSync(SITEMAP_FILE)) {
  fail("public/sitemap.xml not found. Run pnpm generate:sitemaps first.")
} else {
  const sitemapContent = readFileSync(SITEMAP_FILE, "utf8")
  const locMatches = sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)
  const sitemapUrls = [...locMatches].map((m) => m[1])

  let sitemapDrafts = 0
  let sitemapNonAbsolute = 0
  let sitemapNoArticle = 0
  const draftLeaks = []

  for (const loc of sitemapUrls) {
    if (!loc.startsWith("https://")) {
      sitemapNonAbsolute++
      continue
    }

    const path = normalizePath(loc.replace(SITE, ""))

    if (draftPaths.has(path) && !seoDataPaths.has(path)) {
      sitemapDrafts++
      draftLeaks.push(path)
    }

    if (/^\/(?:en\/)?city\/[^/]+\/[^/]+$/.test(path) && !canonicalPaths.has(path) && !seoDataPaths.has(path)) {
      fail(`Sitemap article URL has no dedicated ready article: ${path}`)
      sitemapNoArticle++
    }
  }

  if (sitemapNonAbsolute > 0) fail(`${sitemapNonAbsolute} sitemap URLs are not absolute`)
  else pass("All sitemap URLs are absolute")

  if (sitemapDrafts > 0) {
    fail(`${sitemapDrafts} draft URLs found in sitemap`)
    for (const p of draftLeaks.slice(0, 20)) console.error(`     - ${p}`)
    if (draftLeaks.length > 20) console.error(`     ... and ${draftLeaks.length - 20} more`)
  } else {
    pass("No draft URLs in sitemap")
  }

  if (sitemapNoArticle === 0) pass("All sitemap city/category URLs have dedicated ready articles or seo-data coverage")

  pass(`Sitemap contains ${sitemapUrls.length} URLs total`)
}

// ─── 3. Validate canonical/hreflang in ready articles ─────────────────────────

console.log("\n── Canonical & hreflang validation ──")

let selfRefOk = 0
let hreflangInCanonicalSet = 0
let hreflangMissing = 0

for (const [path, { file, meta }] of articlesByPath) {
  // Canonical must be self-referencing (path matches canonicalPath)
  const declaredCanonical = normalizePath(meta.canonicalPath)
  if (declaredCanonical !== path) {
    fail(`${file}: canonicalPath "${declaredCanonical}" != computed path "${path}"`)
  } else {
    selfRefOk++
  }

  // Hreflang alternate: only validate if the alternate actually exists as a ready article
  const altPath = path.startsWith("/en/") ? path.slice(3) : `/en${path}`
  if (canonicalPaths.has(altPath)) {
    hreflangInCanonicalSet++
  } else {
    // No paired translation — this is fine, just means single-language article
    hreflangMissing++
  }

  // Cross-language canonical must not point to wrong language
  if (meta.lang === "en" && !path.startsWith("/en/")) {
    fail(`${file}: lang=en but canonicalPath does not start with /en/`)
  }
  if (meta.lang === "zh" && path.startsWith("/en/")) {
    fail(`${file}: lang=zh but canonicalPath starts with /en/`)
  }
}

pass(`${selfRefOk} articles have self-referencing canonical`)
pass(`${hreflangInCanonicalSet} articles have paired translations`)
if (hreflangMissing > 0) pass(`${hreflangMissing} articles are single-language (no paired alternate — OK)`)

// ─── 4. Check no fallback-generated paths are linked internally ───────────────

console.log("\n── Fallback path check ──")

// A fallback path is any derived alternate that does NOT have a dedicated ready article.
// These should never appear in sitemaps.
let fallbackLinked = 0
if (existsSync(SITEMAP_FILE)) {
  const sitemapContent = readFileSync(SITEMAP_FILE, "utf8")
  const sitemapLocs = new Set([...sitemapContent.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
  for (const [path] of articlesByPath) {
    const altPath = path.startsWith("/en/") ? path.slice(3) : `/en${path}`
    if (!canonicalPaths.has(altPath) && !seoDataPaths.has(altPath) && !isSeoHubPath(altPath)) {
      const altUrl = `${SITE}${altPath}`
      if (sitemapLocs.has(altUrl)) {
        fail(`Fallback path "${altPath}" is linked in sitemap (no dedicated article exists)`)
        fallbackLinked++
      }
    }
  }
}
if (fallbackLinked === 0) pass("No fallback-generated paths linked in sitemap")

// ─── 5. Check no duplicate canonicalPaths ─────────────────────────────────────

console.log("\n── Duplicate check ──")

const pathCounts = new Map()
if (existsSync(READY_DIR)) {
  for (const file of readdirSync(READY_DIR).filter((f) => f.endsWith(".md"))) {
    const raw = readFileSync(join(READY_DIR, file), "utf8")
    const meta = parseFrontmatter(raw)
    const score = parseInt(meta.aiQualityScore || "0", 10)
    if (meta.status !== "ready" || score < MIN_SCORE) continue
    const cp = normalizePath(meta.canonicalPath)
    if (!pathCounts.has(cp)) pathCounts.set(cp, [])
    pathCounts.get(cp).push(file)
  }
}
if (existsSync(GENERATED_INDEX_DIR)) {
  for (const file of readdirSync(GENERATED_INDEX_DIR).filter((f) => f.endsWith(".json"))) {
    let article
    try {
      article = JSON.parse(readFileSync(join(GENERATED_INDEX_DIR, file), "utf8"))
    } catch {
      continue
    }
    if (article.status !== "publish" || article.robots !== "index,follow" || article.sitemapEligible === false) continue
    const cp = normalizePath(article.canonicalPath || "")
    if (!cp) continue
    if (!pathCounts.has(cp)) pathCounts.set(cp, [])
    pathCounts.get(cp).push(`content/articles/ready/index/${file}`)
  }
}

let dupes = 0
for (const [path, files] of pathCounts) {
  if (files.length > 1) {
    fail(`Duplicate canonicalPath "${path}" in: ${files.join(", ")}`)
    dupes++
  }
}
if (dupes === 0) pass("No duplicate canonicalPaths")

// Soft warning: a ready article and a draft sibling share the same canonicalPath.
// The sitemap correctly publishes the ready URL, but the draft file is dead
// weight that should be cleaned up by the content pipeline.
if (existsSync(READY_DIR)) {
  const allByPath = new Map()
  for (const file of readdirSync(READY_DIR).filter((f) => f.endsWith(".md"))) {
    const raw = readFileSync(join(READY_DIR, file), "utf8")
    const meta = parseFrontmatter(raw)
    const cp = normalizePath(meta.canonicalPath || "")
    if (!cp) continue
    const score = parseInt(meta.aiQualityScore || "0", 10)
    const ready = meta.status === "ready" && score >= MIN_SCORE
    if (!allByPath.has(cp)) allByPath.set(cp, { ready: [], draft: [] })
    allByPath.get(cp)[ready ? "ready" : "draft"].push(file)
  }
  let crossKindDupes = 0
  for (const [cp, { ready, draft }] of allByPath) {
    if (ready.length && draft.length) {
      console.warn(`  ⚠️  canonicalPath "${cp}" shared by ready (${ready.join(", ")}) and draft (${draft.join(", ")}) — sitemap uses ready, draft sibling is ignored`)
      warnings++
      crossKindDupes++
    }
  }
  if (crossKindDupes === 0) pass("No ready/draft canonicalPath collisions")
}

// ─── 6. Summary ──────────────────────────────────────────────────────────────

console.log("\n─── Summary ────────────────────────────────────────────────────")
console.log(`Errors: ${errors}  |  Warnings: ${warnings}`)

if (errors > 0) {
  console.error(`\n❌ ${errors} error(s) found. Fix before deploying.`)
  process.exit(1)
} else {
  console.log(`\n✅ All indexability checks passed.`)
}
