/**
 * scripts/seo/run-bilingual-ready-drafts.mjs
 *
 * Atomic bilingual SEO ready generation pipeline.
 * Generates ≥3 ZH + ≥3 EN ready articles in one run.
 * Fails hard (exit 1) if any constraint is not met.
 * Must be run before commit — never commits itself.
 */

import { execSync } from "child_process"
import { existsSync, readdirSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const READY_DIR = join(ROOT, "content/seo-ready")
const PUBLISHED_FILE = join(ROOT, "data/seo/published-ready-drafts.json")
const PUBLISHED_DIR = join(ROOT, "content/seo-published")
const CN_DRAFTS_FILE = "dist/seo/generated-drafts-cn.json"
const EN_DRAFTS_FILE = "dist/seo/generated-drafts-en.json"
const EXACT_ZH = 3
const EXACT_EN = 3
const EXACT_TOTAL = 6
const MIN_SCORE = 90

function fail(msg) {
  console.error(`\n❌ FATAL: ${msg}`)
  process.exit(1)
}

function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`)
  try {
    execSync(cmd, { stdio: "inherit", cwd: ROOT, ...opts })
  } catch {
    fail(`Command failed: ${cmd}`)
  }
}

function readyFiles() {
  if (!existsSync(READY_DIR)) return []
  return readdirSync(READY_DIR).filter((f) => f.endsWith(".md"))
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

function readPublishedSlugsAndPaths() {
  const slugs = new Set()
  const paths = new Set()
  if (!existsSync(PUBLISHED_FILE)) return { slugs, paths }
  try {
    const data = JSON.parse(readFileSync(PUBLISHED_FILE, "utf8"))
    for (const a of data.articles || []) {
      if (a.slug) slugs.add(a.slug)
      if (a.canonicalPath) paths.add(a.canonicalPath)
    }
  } catch { /* ignore parse errors */ }
  return { slugs, paths }
}

function fileSlugs(dir) {
  if (!existsSync(dir)) return new Set()
  return new Set(readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")))
}

function readSitemapPaths() {
  const sitemapFile = join(ROOT, "public/sitemap.xml")
  if (!existsSync(sitemapFile)) return new Set()
  const xml = readFileSync(sitemapFile, "utf8")
  const paths = new Set()
  for (const m of xml.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)) {
    paths.add(m[1].replace(/\/$/, "") || "/")
  }
  return sitemapFile ? paths : new Set()
}

// ── Step 1: snapshot before ───────────────────────────────────────────────────
const beforeFiles = new Set(readyFiles())
console.log(`\n📸 Before: ${beforeFiles.size} ready file(s)`)

// ── Step 2: opportunities ─────────────────────────────────────────────────────
run("pnpm seo:opportunities")

// ── Step 3: generate ZH ───────────────────────────────────────────────────────
console.log("\n🇨🇳 Generating ZH articles...")
run(
  [
    `LANG=zh`,
    `LIMIT=3`,
    `MIN_SCORE=${MIN_SCORE}`,
    `MAX_TOKENS=2600`,
    `TIMEOUT_MS=60000`,
    `RATE_DELAY_MS=8000`,
    `MAX_PER_CITY_PER_RUN=1`,
    `RANDOMIZE_OPPORTUNITIES=1`,
    `AI_PROVIDER_ORDER="groq,nvidia,cerebras,gemini,openrouter,cloudflare"`,
    `GENERATED_DRAFTS_FILE="${CN_DRAFTS_FILE}"`,
    `PUBLISHED_FILE="data/seo/published-ready-drafts.json"`,
    `pnpm seo:drafts:router`,
  ].join(" ")
)

// ── Step 4: fix ZH quality ────────────────────────────────────────────────────
run(`GENERATED_DRAFTS_FILE="${CN_DRAFTS_FILE}" pnpm seo:fix-drafts`)

// ── Step 5: promote ZH ───────────────────────────────────────────────────────
run(`GENERATED_DRAFTS_FILE="${CN_DRAFTS_FILE}" MIN_SCORE=${MIN_SCORE} pnpm seo:promote-ready`)

// ── Step 6: generate EN ───────────────────────────────────────────────────────
console.log("\n🇬🇧 Generating EN articles...")
run(
  [
    `LANG=en`,
    `LIMIT=3`,
    `MIN_SCORE=${MIN_SCORE}`,
    `MAX_TOKENS=3200`,
    `TIMEOUT_MS=60000`,
    `RATE_DELAY_MS=8000`,
    `MAX_PER_CITY_PER_RUN=1`,
    `RANDOMIZE_OPPORTUNITIES=1`,
    `AI_PROVIDER_ORDER="groq,nvidia,cerebras,gemini,openrouter,cloudflare"`,
    `GENERATED_DRAFTS_FILE="${EN_DRAFTS_FILE}"`,
    `PUBLISHED_FILE="data/seo/published-ready-drafts.json"`,
    `pnpm seo:drafts:router:en`,
  ].join(" ")
)

// ── Step 7: fix EN quality ────────────────────────────────────────────────────
run(`GENERATED_DRAFTS_FILE="${EN_DRAFTS_FILE}" pnpm seo:fix-drafts`)

// ── Step 8: promote EN ───────────────────────────────────────────────────────
run(`GENERATED_DRAFTS_FILE="${EN_DRAFTS_FILE}" MIN_SCORE=${MIN_SCORE} pnpm seo:promote-ready`)

// ── Step 9: diff new files ────────────────────────────────────────────────────
const afterFiles = new Set(readyFiles())
const newFiles = [...afterFiles].filter((f) => !beforeFiles.has(f))
console.log(`\n📋 New ready files (${newFiles.length}): ${newFiles.join(", ")}`)

// ── Step 10: validate new articles ───────────────────────────────────────────
const { slugs: publishedSlugs, paths: publishedPaths } = readPublishedSlugsAndPaths()
const publishedDirSlugs = fileSlugs(PUBLISHED_DIR)

const newArticles = []
const seenSlugs = new Set()
const seenPaths = new Set()

for (const file of newFiles) {
  const raw = readFileSync(join(READY_DIR, file), "utf8")
  const meta = parseFrontmatter(raw)

  // Required fields
  for (const field of ["slug", "canonicalPath", "alternatePath", "translationKey", "lang", "title", "status", "aiQualityScore"]) {
    if (!meta[field]) fail(`Missing ${field} in ${file}`)
  }

  const { slug, canonicalPath, lang, status, aiQualityScore, alternatePath, translationKey, title } = meta
  const score = parseInt(aiQualityScore, 10)

  if (status !== "ready") fail(`${file}: status must be "ready", got "${status}"`)
  if (score < MIN_SCORE) fail(`${file}: aiQualityScore ${score} < ${MIN_SCORE}`)
  if (!canonicalPath.startsWith("/")) fail(`${file}: canonicalPath must start with /`)
  if (/\s/.test(canonicalPath)) fail(`${file}: canonicalPath contains whitespace`)
  if (canonicalPath.includes("undefined") || canonicalPath.includes("null")) fail(`${file}: canonicalPath contains undefined/null`)
  if (canonicalPath.includes("//")) fail(`${file}: canonicalPath contains //`)
  if (lang !== "zh" && lang !== "en") fail(`${file}: lang must be zh or en, got "${lang}"`)
  if (lang === "en" && !canonicalPath.startsWith("/en/")) fail(`lang=en canonicalPath must start with /en/ — got ${canonicalPath}`)
  if (lang === "zh" && canonicalPath.startsWith("/en/")) fail(`lang=zh canonicalPath must not start with /en/ — got ${canonicalPath}`)

  // No duplicates within this run
  if (seenSlugs.has(slug)) fail(`Duplicate slug detected: ${slug}`)
  if (seenPaths.has(canonicalPath)) fail(`Duplicate canonicalPath detected: ${canonicalPath}`)
  seenSlugs.add(slug)
  seenPaths.add(canonicalPath)

  // No collision with existing published
  if (publishedSlugs.has(slug)) fail(`Slug already in published-ready-drafts.json: ${slug}`)
  if (publishedPaths.has(canonicalPath)) fail(`canonicalPath already in published-ready-drafts.json: ${canonicalPath}`)
  if (publishedDirSlugs.has(slug)) fail(`Slug already in content/seo-published: ${slug}`)

  // Must not have overwritten a pre-existing file
  if (beforeFiles.has(file)) fail(`Ready file already existed before run: ${file}`)

  newArticles.push({ file, slug, canonicalPath, lang, score, alternatePath, translationKey, title })
}

// ── Step 11: count constraints ────────────────────────────────────────────────
const zhCount = newArticles.filter((a) => a.lang === "zh").length
const enCount = newArticles.filter((a) => a.lang === "en").length
const total = newArticles.length

if (zhCount !== EXACT_ZH) fail(`Expected exactly ${EXACT_ZH} zh ready drafts, got ${zhCount}`)
if (enCount !== EXACT_EN) fail(`Expected exactly ${EXACT_EN} en ready drafts, got ${enCount}`)
if (total !== EXACT_TOTAL) fail(`Expected exactly ${EXACT_TOTAL} total ready drafts, got ${total}`)

console.log(`\n✅ Count check passed: ${zhCount} ZH + ${enCount} EN = ${total} total`)

// ── Step 12: generate sitemaps ────────────────────────────────────────────────
run("pnpm generate:sitemaps")

// ── Step 13: verify sitemap contains all new canonicalPaths ──────────────────
const sitemapPaths = readSitemapPaths()
const missingSitemap = newArticles.filter((a) => !sitemapPaths.has(a.canonicalPath))
if (missingSitemap.length > 0) {
  for (const a of missingSitemap) console.error(`Missing sitemap entry: ${a.canonicalPath}`)
  fail(`${missingSitemap.length} canonicalPath(s) missing from sitemap`)
}
console.log(`\n✅ Sitemap check passed: all ${total} canonicalPaths found`)

// ── Step 14: build ────────────────────────────────────────────────────────────
console.log("\n🔨 Running pnpm build...")
run("pnpm build")

// ── Step 15: summary ──────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(60))
console.log("✅ BILINGUAL READY GENERATION COMPLETE")
console.log("═".repeat(60))
console.log(`Generated ZH count:  ${zhCount}`)
console.log(`Generated EN count:  ${enCount}`)
console.log(`Ready total:         ${total}`)
console.log(`\nReady files:`)
for (const a of newArticles) console.log(`  [${a.lang}] ${a.file}  score=${a.score}`)
console.log(`\nCanonical paths:`)
for (const a of newArticles) console.log(`  ${a.canonicalPath}`)
console.log(`\nSitemap checked:     ✅`)
console.log(`Build passed:        ✅`)
console.log("═".repeat(60))
