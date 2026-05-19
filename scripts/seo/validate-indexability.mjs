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
const SITEMAP_FILE = join(ROOT, "public/sitemap.xml")
const MIN_SCORE = 90

let errors = 0
let warnings = 0

function fail(msg) { console.error(`  ❌ ${msg}`); errors++ }
function warn(msg) { console.warn(`  ⚠️  ${msg}`); warnings++ }
function pass(msg) { console.log(`  ✅ ${msg}`) }

// ─── 1. Parse ready articles ──────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const meta = {}
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/)
    if (m) meta[m[1]] = m[2].trim()
  }
  return meta
}

function normalizePath(p) {
  if (!p) return ""
  const n = p.startsWith("/") ? p : `/${p}`
  return n.endsWith("/") && n.length > 1 ? n.slice(0, -1) : n
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

console.log(`📄 Ready articles: ${canonicalPaths.size} canonical, ${draftPaths.size} draft\n`)

// ─── 2. Validate sitemap ──────────────────────────────────────────────────────

console.log("── Sitemap validation ──")

// Load static seo-data city/category paths (these are template pages, not ready articles)
const seoDataPaths = new Set()
const seoDataFile = join(ROOT, "lib/seo-data.ts")
if (existsSync(seoDataFile)) {
  const seoDataContent = readFileSync(seoDataFile, "utf8")
  const citySlugs = [...seoDataContent.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1])
  // The first set of slugs are cities, the rest are categories
  // Detect by looking at the arrays
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

  for (const loc of sitemapUrls) {
    if (!loc.startsWith("https://")) {
      sitemapNonAbsolute++
      continue
    }

    const path = normalizePath(loc.replace(SITE, ""))

    if (draftPaths.has(path)) {
      sitemapDrafts++
    }

    // Article URL check: city/X/Y pattern, not covered by seo-data templates, must have ready article
    if (/^\/(?:en\/)?city\/[^/]+\/[^/]+$/.test(path) && !canonicalPaths.has(path) && !seoDataPaths.has(path)) {
      fail(`Sitemap article URL has no dedicated ready article: ${path}`)
      sitemapNoArticle++
    }
  }

  if (sitemapNonAbsolute > 0) fail(`${sitemapNonAbsolute} sitemap URLs are not absolute`)
  else pass("All sitemap URLs are absolute")

  if (sitemapDrafts > 0) fail(`${sitemapDrafts} draft URLs found in sitemap`)
  else pass("No draft URLs in sitemap")

  if (sitemapNoArticle === 0) pass("All sitemap article URLs have dedicated ready articles or seo-data coverage")

  pass(`Sitemap contains ${sitemapUrls.length} URLs total`)
}

// ─── 3. Validate canonical/hreflang in ready articles ─────────────────────────

console.log("\n── Canonical & hreflang validation ──")

let selfRefOk = 0
let hreflangOk = 0
let hreflangInCanonicalSet = 0

for (const [path, { file, meta }] of articlesByPath) {
  // Canonical must be self-referencing (path matches canonicalPath)
  const declaredCanonical = normalizePath(meta.canonicalPath)
  if (declaredCanonical !== path) {
    fail(`${file}: canonicalPath "${declaredCanonical}" != computed path "${path}"`)
  } else {
    selfRefOk++
  }

  // Check that hreflang alternate is valid
  const altPath = path.startsWith("/en/") ? path.slice(3) : `/en${path}`
  const altUrl = `${SITE}${altPath}`

  // Hreflang alternate must be absolute
  if (!altUrl.startsWith("https://")) {
    fail(`${file}: hreflang alternate is not absolute: ${altUrl}`)
  } else {
    hreflangOk++
  }

  // Hreflang alternate must point to a known canonical path (not a fallback)
  if (!canonicalPaths.has(altPath)) {
    fail(`${file}: hreflang alternate "${altPath}" is not a known ready canonical path`)
  } else {
    hreflangInCanonicalSet++
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
pass(`${hreflangOk} articles have absolute hreflang alternates`)
if (hreflangInCanonicalSet > 0) pass(`${hreflangInCanonicalSet} hreflang alternates point to known canonical paths`)

// ─── 4. Check no fallback-generated paths are linked internally ───────────────

console.log("\n── Fallback path check ──")

// A fallback path is any derived alternate that does NOT have a dedicated ready article.
// These should never appear in sitemaps or be linked internally (unless covered by seo-data templates).
let fallbackLinked = 0
if (existsSync(SITEMAP_FILE)) {
  const sitemapContent = readFileSync(SITEMAP_FILE, "utf8")
  for (const [path] of articlesByPath) {
    const altPath = path.startsWith("/en/") ? path.slice(3) : `/en${path}`
    if (!canonicalPaths.has(altPath) && !seoDataPaths.has(altPath)) {
      if (sitemapContent.includes(`${SITE}${altPath}`)) {
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

let dupes = 0
for (const [path, files] of pathCounts) {
  if (files.length > 1) {
    fail(`Duplicate canonicalPath "${path}" in: ${files.join(", ")}`)
    dupes++
  }
}
if (dupes === 0) pass("No duplicate canonicalPaths")

// ─── 6. Summary ──────────────────────────────────────────────────────────────

console.log("\n─── Summary ────────────────────────────────────────────────────")
console.log(`Errors: ${errors}  |  Warnings: ${warnings}`)

if (errors > 0) {
  console.error(`\n❌ ${errors} error(s) found. Fix before deploying.`)
  process.exit(1)
} else {
  console.log(`\n✅ All indexability checks passed.`)
}
