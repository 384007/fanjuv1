#!/usr/bin/env node
/**
 * scripts/audit-links.mjs
 *
 * Scans all internal href values from:
 *   1. app/**\/*.tsx  (JSX href="..." and href={`...`} literals)
 *   2. public/llms.txt  (lines containing ": /...")
 *   3. scripts/generate-sitemaps.mjs  (URL paths)
 *
 * Then checks each URL against the Next.js app/ route tree and public/ files.
 * For dynamic routes, validates that the slug exists in the known data source.
 * Exits with code 1 (fails the build) if any internal 404s are found.
 *
 * Usage:
 *   node scripts/audit-links.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs"
import { join, dirname, relative } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const APP_DIR = join(ROOT, "app")
const PUBLIC_DIR = join(ROOT, "public")

// ─── 0. Known data slugs (mirrors lib/seo-data.ts and lib/product-features.ts) ─

const KNOWN_SLUGS = {
  city: [
    "shenzhen","guangzhou","shanghai","beijing","hangzhou","chengdu",
    "xiamen","changsha","nanjing","suzhou","wuhan","chongqing",
    "xian","qingdao","zhengzhou","foshan","dongguan","zhuhai","tianjin","ningbo",
    "new-york","san-francisco","los-angeles","vancouver","toronto",
    "london","tokyo","sydney","melbourne","singapore","hong-kong","taipei",
  ],
  category: [
    "singles-dinner","curated-dinner","business-dinner","founder-dinner",
    "weekend-dinner","stranger-dinner","chinese-social-dining",
    "student-dinner","newcomer-dinner",
  ],
  question: [
    "what-is-fanju","how-to-join-dinner","is-fanju-safe",
    "which-cities-open-first","singles-dinner-worth-it",
    "business-dinner-vs-networking","what-to-prepare-before-dinner",
    "does-fanju-show-real-counts",
  ],
  guide: [
    "mainland-city-dinner-guide","singles-dinner-guide","business-dinner-guide",
    "weekend-dinner-guide","newcomer-dinner-guide","curated-dinner-guide",
    "host-recruitment-guide",
  ],
  feature: [
    "one-link-invite","rsvp-tracking","guest-list","text-blast","date-poll",
    "guest-questions","chip-in","photo-album","public-events","singles-matching",
  ],
}

// Map route patterns to their data source key
// Pattern: array of segments where "*" is a dynamic segment
// dataKey: key in KNOWN_SLUGS, position: which wildcard index (0-based) is the slug
const DYNAMIC_ROUTE_VALIDATORS = [
  { pattern: ["city", "*"],           dataKey: "city",     slugIndex: 0 },
  { pattern: ["category", "*"],       dataKey: "category", slugIndex: 0 },
  { pattern: ["city", "*", "*"],      dataKey: "city",     slugIndex: 0, secondDataKey: "category", secondSlugIndex: 1 },
  { pattern: ["q", "*"],              dataKey: "question", slugIndex: 0 },
  { pattern: ["guides", "*"],         dataKey: "guide",    slugIndex: 0 },
  { pattern: ["features", "*"],       dataKey: "feature",  slugIndex: 0 },
  { pattern: ["en", "city", "*"],     dataKey: "city",     slugIndex: 0 },
  { pattern: ["en", "category", "*"], dataKey: "category", slugIndex: 0 },
  { pattern: ["en", "city", "*", "*"],dataKey: "city",     slugIndex: 0, secondDataKey: "category", secondSlugIndex: 1 },
  { pattern: ["en", "q", "*"],        dataKey: "question", slugIndex: 0 },
  { pattern: ["en", "guides", "*"],   dataKey: "guide",    slugIndex: 0 },
  { pattern: ["en", "features", "*"], dataKey: "feature",  slugIndex: 0 },
]

// ─── 1. Build the set of valid routes from app/ ───────────────────────────────

/**
 * Walk the app/ directory and collect all routes that have a page.tsx.
 * Dynamic segments like [slug] are treated as wildcards.
 */
function collectRoutes(dir, base = "") {
  const routes = new Set()
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      // Skip special Next.js dirs
      if (entry.startsWith("_") || entry === "api") continue
      const segment = entry.startsWith("[") ? "*" : entry
      const childBase = base === "" ? `/${segment}` : `${base}/${segment}`
      const childRoutes = collectRoutes(full, childBase)
      for (const r of childRoutes) routes.add(r)
    } else if (entry === "page.tsx" || entry === "page.ts" || entry === "page.jsx" || entry === "page.js") {
      routes.add(base === "" ? "/" : base)
    }
  }
  return routes
}

const appRoutes = collectRoutes(APP_DIR)

/**
 * Validate a dynamic URL against known data slugs.
 * Returns { valid: boolean, reason?: string }
 */
function validateDynamicSlug(urlParts) {
  for (const validator of DYNAMIC_ROUTE_VALIDATORS) {
    const { pattern, dataKey, slugIndex, secondDataKey, secondSlugIndex } = validator
    if (pattern.length !== urlParts.length) continue

    // Check static parts match
    const wildcardPositions = []
    let patternMatches = true
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === "*") {
        wildcardPositions.push(i)
      } else if (pattern[i] !== urlParts[i]) {
        patternMatches = false
        break
      }
    }
    if (!patternMatches) continue

    // Pattern matched — now validate the slug(s)
    const slug = urlParts[wildcardPositions[slugIndex]]
    const knownSlugs = KNOWN_SLUGS[dataKey]
    if (!knownSlugs.includes(slug)) {
      return { valid: false, reason: `slug "${slug}" not found in ${dataKey} data source` }
    }

    // Validate second dynamic segment if present (e.g. city×category)
    if (secondDataKey !== undefined && secondSlugIndex !== undefined) {
      const slug2 = urlParts[wildcardPositions[secondSlugIndex]]
      const knownSlugs2 = KNOWN_SLUGS[secondDataKey]
      if (!knownSlugs2.includes(slug2)) {
        return { valid: false, reason: `slug "${slug2}" not found in ${secondDataKey} data source` }
      }
    }

    return { valid: true }
  }
  return null // no dynamic validator matched — fall through to static check
}

/**
 * Check if a URL path is covered by the app routes.
 * Handles dynamic segments (wildcards) with data-source validation.
 */
function isValidRoute(urlPath) {
  // Strip trailing slash for comparison
  const normalized = urlPath.replace(/\/$/, "") || "/"

  // Direct match (static route)
  if (appRoutes.has(normalized)) return { valid: true }

  // Split into parts for dynamic matching
  const urlParts = normalized.split("/").filter(Boolean)

  // Try dynamic slug validation first
  const dynamicResult = validateDynamicSlug(urlParts)
  if (dynamicResult !== null) {
    if (!dynamicResult.valid) return dynamicResult
    // Slug is valid — now confirm the route pattern exists in app/
    for (const route of appRoutes) {
      if (!route.includes("*")) continue
      const routeParts = route.split("/").filter(Boolean)
      if (routeParts.length !== urlParts.length) continue
      const match = routeParts.every((part, i) => part === "*" || part === urlParts[i])
      if (match) return { valid: true }
    }
    return { valid: false, reason: `no matching app/ route pattern for ${normalized}` }
  }

  // Check against wildcard routes (non-validated dynamic)
  for (const route of appRoutes) {
    if (!route.includes("*")) continue
    const routeParts = route.split("/")
    const urlParts2 = normalized.split("/")
    if (routeParts.length !== urlParts2.length) continue
    const match = routeParts.every((part, i) => part === "*" || part === urlParts2[i])
    if (match) return { valid: true }
  }

  // Check public/ files (e.g. /sitemap.xml, /robots.txt, /llms.txt)
  const publicPath = join(PUBLIC_DIR, normalized)
  if (existsSync(publicPath) && statSync(publicPath).isFile()) return { valid: true }

  return { valid: false, reason: "no matching route or public file" }
}

// ─── 2. Collect all internal hrefs from app/**/*.tsx ─────────────────────────

function walkTsx(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue
      files.push(...walkTsx(full))
    } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      files.push(full)
    }
  }
  return files
}

const tsxFiles = walkTsx(APP_DIR)

// Also scan components/ and lib/ for href patterns
const COMPONENTS_DIR = join(ROOT, "components")
const LIB_DIR = join(ROOT, "lib")
if (existsSync(COMPONENTS_DIR)) tsxFiles.push(...walkTsx(COMPONENTS_DIR))
if (existsSync(LIB_DIR)) tsxFiles.push(...walkTsx(LIB_DIR))

const hrefPattern = /href=["'`](\/[^"'`\s?#]*)/g

const sourceLinks = new Map() // url -> Set<sourceFile>

for (const file of tsxFiles) {
  const content = readFileSync(file, "utf8")
  let match
  while ((match = hrefPattern.exec(content)) !== null) {
    const url = match[1]
    if (!sourceLinks.has(url)) sourceLinks.set(url, new Set())
    sourceLinks.get(url).add(relative(ROOT, file))
  }
}

// ─── 3. Collect URLs from public/llms.txt ────────────────────────────────────

const llmsTxtPath = join(PUBLIC_DIR, "llms.txt")
if (existsSync(llmsTxtPath)) {
  const llmsContent = readFileSync(llmsTxtPath, "utf8")
  // Match lines like "Some label: /path/to/page" — capture the path
  // Only match paths that are complete (not template patterns like /city/{city-slug})
  const llmsPattern = /:\s*(\/[^\s,\n{]+)/g
  let match
  while ((match = llmsPattern.exec(llmsContent)) !== null) {
    const url = match[1]
    // Skip template placeholders like /{city-slug} or paths ending with /
    if (url.includes("{") || url.includes("}")) continue
    // Skip bare directory paths that are just prefixes (e.g. /city/, /q/)
    if (url.endsWith("/")) continue
    if (!sourceLinks.has(url)) sourceLinks.set(url, new Set())
    sourceLinks.get(url).add("public/llms.txt")
  }
}

// ─── 4. Collect URLs from generate-sitemaps.mjs ──────────────────────────────

const sitemapScriptPath = join(__dirname, "generate-sitemaps.mjs")
if (existsSync(sitemapScriptPath)) {
  const sitemapContent = readFileSync(sitemapScriptPath, "utf8")
  // Match string literals that look like paths: "/some/path"
  const sitemapPattern = /["'`](\/[a-z0-9\-/]+)["'`]/g
  let match
  while ((match = sitemapPattern.exec(sitemapContent)) !== null) {
    const url = match[1]
    // Only include paths that look like real routes (not format strings)
    if (url.includes("{") || url.length < 2) continue
    if (!sourceLinks.has(url)) sourceLinks.set(url, new Set())
    sourceLinks.get(url).add("scripts/generate-sitemaps.mjs")
  }
}

// ─── 5. Skip-list: external paths, API routes, anchors, known dynamic ────────

const SKIP_PREFIXES = [
  "/_next",
  "/api/",
  "//",
]

const SKIP_EXACT = new Set([
  "/",
  "/?lang=en",
])

// Paths that are intentionally dynamic (no static page needed)
const KNOWN_DYNAMIC_PREFIXES = [
  "/d/",       // demo event pages
]

function shouldSkip(url) {
  if (SKIP_EXACT.has(url)) return true
  if (SKIP_PREFIXES.some((p) => url.startsWith(p))) return true
  if (KNOWN_DYNAMIC_PREFIXES.some((p) => url.startsWith(p))) return true
  // Skip URLs with query strings or fragments (already stripped by regex, but just in case)
  if (url.includes("?") || url.includes("#")) return true
  return false
}

// ─── 6. Run the audit ────────────────────────────────────────────────────────

const errors = []

for (const [url, sources] of sourceLinks) {
  if (shouldSkip(url)) continue
  const result = isValidRoute(url)
  if (!result.valid) {
    errors.push({ url, sources: [...sources], reason: result.reason })
  }
}

// ─── 7. Report ───────────────────────────────────────────────────────────────

if (errors.length === 0) {
  console.log(`✅  audit-links: all ${sourceLinks.size} internal URLs resolve correctly.`)
  process.exit(0)
} else {
  console.error(`\n❌  audit-links: found ${errors.length} internal URL(s) with no matching route:\n`)
  for (const { url, sources, reason } of errors) {
    console.error(`  404  ${url}${reason ? `  (${reason})` : ""}`)
    for (const src of sources) {
      console.error(`       ↳ ${src}`)
    }
  }
  console.error(
    `\nFix: create the missing app/ routes or update the links to point to existing pages.\n`,
  )
  process.exit(1)
}
