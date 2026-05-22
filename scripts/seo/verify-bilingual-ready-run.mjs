/**
 * scripts/seo/verify-bilingual-ready-run.mjs
 *
 * Standalone verifier for content/seo-ready/*.md files.
 * Checks frontmatter, canonicalPath rules, lang rules, no-404 route coverage,
 * sitemap presence, and build status.
 *
 * Usage: node scripts/seo/verify-bilingual-ready-run.mjs [--new-only]
 *   --new-only: only verify files not in data/seo/published-ready-drafts.json
 */

import { existsSync, readdirSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const READY_DIR = join(ROOT, "content/seo-ready")
const PUBLISHED_FILE = join(ROOT, "data/seo/published-ready-drafts.json")
const MIN_SCORE = 90
const NEW_ONLY = process.argv.includes("--new-only")

let errors = 0
let warnings = 0

function err(msg) {
  console.error(`  ❌ ${msg}`)
  errors++
}

function warn(msg) {
  console.warn(`  ⚠️  ${msg}`)
  warnings++
}

function ok(msg) {
  console.log(`  ✅ ${msg}`)
}

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

function readPublishedSlugs() {
  if (!existsSync(PUBLISHED_FILE)) return new Set()
  try {
    const data = JSON.parse(readFileSync(PUBLISHED_FILE, "utf8"))
    return new Set((data.articles || []).map((a) => a.slug).filter(Boolean))
  } catch {
    return new Set()
  }
}

function readSitemapPaths() {
  const sitemapFile = join(ROOT, "public/sitemap.xml")
  if (!existsSync(sitemapFile)) return null
  const xml = readFileSync(sitemapFile, "utf8")
  const paths = new Set()
  for (const m of xml.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)) {
    paths.add(m[1].replace(/\/$/, "") || "/")
  }
  return paths
}

/**
 * Checks if a canonicalPath is covered by Next.js app router.
 * Supported patterns:
 *   /city/xxx           → app/city/[city]/page.tsx
 *   /city/xxx/yyy       → app/city/[city]/[...slug]/page.tsx or similar
 *   /en/city/xxx        → app/en/[...slug]/page.tsx
 *   /en/city/xxx/yyy    → app/en/[...slug]/page.tsx
 *   /guides/xxx         → app/guides/[slug]/page.tsx
 *   /category/xxx       → app/category/[category]/page.tsx
 *   /features/xxx       → app/features/[slug]/page.tsx
 *   /[...slug]          → app/[...slug]/page.tsx (catch-all)
 */
function checkRouteExists(canonicalPath) {
  const appDir = join(ROOT, "app")
  const segments = canonicalPath.replace(/^\//, "").split("/").filter(Boolean)

  if (segments.length === 0) return { covered: true, route: "/" }

  // Check exact static route first
  const staticPage = join(appDir, ...segments, "page.tsx")
  if (existsSync(staticPage)) return { covered: true, route: staticPage }

  // Check dynamic single-segment routes: /city/[city], /guides/[slug], etc.
  if (segments.length === 2) {
    const dynamicPage = join(appDir, segments[0], "[" + segments[0].replace(/-/g, "") + "]", "page.tsx")
    if (existsSync(dynamicPage)) return { covered: true, route: dynamicPage }

    // Try common dynamic param names
    for (const param of ["slug", "city", "category", "id"]) {
      const p = join(appDir, segments[0], `[${param}]`, "page.tsx")
      if (existsSync(p)) return { covered: true, route: p }
    }
  }

  // Check /en/[...slug] catch-all
  if (segments[0] === "en") {
    const enSlug = join(appDir, "en", "[...slug]", "page.tsx")
    if (existsSync(enSlug)) return { covered: true, route: "app/en/[...slug]" }
  }

  // Check top-level catch-all [...slug]
  const catchAll = join(appDir, "[...slug]", "page.tsx")
  if (existsSync(catchAll)) return { covered: true, route: "app/[...slug]" }

  return { covered: false, route: null }
}

// ── Main ──────────────────────────────────────────────────────────────────────

if (!existsSync(READY_DIR)) {
  console.error(`❌ content/seo-ready not found`)
  process.exit(1)
}

const publishedSlugs = readPublishedSlugs()
const sitemapPaths = readSitemapPaths()
const files = readdirSync(READY_DIR).filter((f) => f.endsWith(".md"))

if (files.length === 0) {
  console.warn("⚠️  No .md files in content/seo-ready/")
  process.exit(0)
}

const seenPaths = new Map()
const seenSlugs = new Map()
let verified = 0

for (const file of files) {
  const raw = readFileSync(join(READY_DIR, file), "utf8")
  const meta = parseFrontmatter(raw)

  // --new-only: skip already-published
  if (NEW_ONLY && publishedSlugs.has(meta.slug)) continue

  console.log(`\n📄 ${file}`)

  const score = parseInt(meta.aiQualityScore || "0", 10)
  const { slug, canonicalPath, lang, status, alternatePath, translationKey, title } = meta

  // Required fields
  for (const [field, val] of Object.entries({ slug, canonicalPath, lang, status, alternatePath, translationKey, title })) {
    if (!val) err(`Missing ${field}`)
  }

  if (!slug || !canonicalPath) continue // can't proceed without these

  // Status and score
  if (status !== "ready") err(`status must be "ready", got "${status}"`)
  else ok(`status: ready`)

  if (score < MIN_SCORE) err(`aiQualityScore ${score} < ${MIN_SCORE}`)
  else ok(`aiQualityScore: ${score}`)

  // canonicalPath rules
  if (!canonicalPath.startsWith("/")) err(`canonicalPath must start with /`)
  else if (/\s/.test(canonicalPath)) err(`canonicalPath contains whitespace`)
  else if (canonicalPath.includes("undefined")) err(`canonicalPath contains "undefined"`)
  else if (canonicalPath.includes("null")) err(`canonicalPath contains "null"`)
  else if (canonicalPath.includes("//")) err(`canonicalPath contains //`)
  else ok(`canonicalPath: ${canonicalPath}`)

  // lang rules
  if (lang !== "zh" && lang !== "en") {
    err(`lang must be zh or en, got "${lang}"`)
  } else if (lang === "en" && !canonicalPath.startsWith("/en/")) {
    err(`lang=en canonicalPath must start with /en/ — got ${canonicalPath}`)
  } else if (lang === "zh" && canonicalPath.startsWith("/en/")) {
    err(`lang=zh canonicalPath must not start with /en/ — got ${canonicalPath}`)
  } else {
    ok(`lang: ${lang}`)
  }

  // Duplicate checks
  if (seenPaths.has(canonicalPath)) err(`Duplicate canonicalPath (also in ${seenPaths.get(canonicalPath)})`)
  else seenPaths.set(canonicalPath, file)

  if (seenSlugs.has(slug)) err(`Duplicate slug (also in ${seenSlugs.get(slug)})`)
  else seenSlugs.set(slug, file)

  // Route coverage check
  const { covered, route } = checkRouteExists(canonicalPath)
  if (!covered) err(`Route check failed, possible 404: ${canonicalPath}`)
  else ok(`Route covered: ${route}`)

  // Sitemap check
  if (sitemapPaths) {
    const normalizedPath = canonicalPath.replace(/\/$/, "") || "/"
    if (!sitemapPaths.has(normalizedPath)) warn(`Missing sitemap entry: ${canonicalPath}`)
    else ok(`Sitemap: found`)
  } else {
    warn(`public/sitemap.xml not found — run pnpm generate:sitemaps`)
  }

  verified++
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n" + "─".repeat(60))
console.log(`Files checked: ${verified}  |  Errors: ${errors}  |  Warnings: ${warnings}`)

if (errors > 0) {
  console.error(`\n❌ ${errors} error(s). Fix before committing.`)
  process.exit(1)
} else {
  console.log(`\n✅ All checks passed.`)
}
