/**
 * scripts/seo/build-route-manifest-v2.mjs
 * Builds a route manifest distinguishing:
 *   - canonical: indexable 200 URLs (should be in sitemap)
 *   - redirect: alias URLs that redirect to canonical (must NOT be in sitemap)
 *   - draft: content not ready (must NOT be in sitemap)
 *
 * Output: dist/seo/route-manifest-v2.json
 */

import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const READY_DIR = join(ROOT, "content/seo-ready")
const GENERATED_INDEX_DIR = join(ROOT, "content/articles/ready/index")
const GENERATED_NOINDEX_DIR = join(ROOT, "content/articles/ready/noindex")
const OUT_DIR = join(ROOT, "dist/seo")
const OUT_FILE = join(OUT_DIR, "route-manifest-v2.json")
const SITE = "https://fanju.app"
const MIN_SCORE = 90

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

function deriveAlternatePath(p) {
  return p.startsWith("/en/") ? p.slice(3) : `/en${p}`
}

// ─── Build manifest ───────────────────────────────────────────────────────────

const manifest = { canonical: [], redirect: [], draft: [] }

if (existsSync(READY_DIR)) {
  const files = readdirSync(READY_DIR).filter((f) => f.endsWith(".md"))

  // Pre-build a Set of canonical paths that are ready+scored — O(n) instead of O(n²)
  const readyCanonicalPaths = new Set()
  const fileMetas = []
  for (const file of files) {
    const raw = readFileSync(join(READY_DIR, file), "utf8")
    const meta = parseFrontmatter(raw)
    const score = parseInt(meta.aiQualityScore || "0", 10)
    const cp = normalizePath(meta.canonicalPath || `/${meta.slug || file.replace(/\.md$/, "")}`)
    fileMetas.push({ file, meta, score, cp })
    if (meta.status === "ready" && score >= MIN_SCORE) readyCanonicalPaths.add(cp)
  }

  for (const { file, meta, score, cp } of fileMetas) {
    // Draft/unready
    if (meta.status !== "ready" || score < MIN_SCORE) {
      manifest.draft.push({ path: cp, file, reason: score < MIN_SCORE ? "low_score" : "not_ready" })
      continue
    }

    // Canonical indexable URL
    manifest.canonical.push({
      path: cp,
      url: `${SITE}${cp}`,
      lang: meta.lang || "zh",
      translationKey: meta.translationKey || null,
      file,
    })

    // The alternate path is served as a fallback (same content, different lang URL)
    // It's also canonical for its own language — NOT a redirect
    const alt = deriveAlternatePath(cp)
    const altLang = cp.startsWith("/en/") ? "zh" : "en"

    // O(1) lookup instead of O(n) file scan
    if (!readyCanonicalPaths.has(alt)) {
      // Fallback render — still canonical for that language (200, self-referencing canonical)
      manifest.canonical.push({
        path: alt,
        url: `${SITE}${alt}`,
        lang: altLang,
        translationKey: meta.translationKey || null,
        file: `${file} (fallback)`,
      })
    }
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
    if (article.status !== "publish" || article.robots !== "index,follow" || article.sitemapEligible === false) {
      manifest.draft.push({ path: cp, file, reason: "not_indexable_generated_article" })
      continue
    }
    manifest.canonical.push({
      path: cp,
      url: `${SITE}${cp}`,
      lang: article.language || (cp.startsWith("/en/") ? "en" : "zh"),
      translationKey: null,
      file: `content/articles/ready/index/${file}`,
    })
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
    if (cp) manifest.draft.push({ path: cp, file: `content/articles/ready/noindex/${file}`, reason: "generated_noindex" })
  }
}

// Deduplicate canonical entries
const seen = new Set()
manifest.canonical = manifest.canonical.filter((entry) => {
  if (seen.has(entry.path)) return false
  seen.add(entry.path)
  return true
})

// ─── Write output ─────────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2), "utf8")

console.log(`✅ Route manifest v2 written to ${OUT_FILE}`)
console.log(`   Canonical: ${manifest.canonical.length}`)
console.log(`   Redirect:  ${manifest.redirect.length}`)
console.log(`   Draft:     ${manifest.draft.length}`)
