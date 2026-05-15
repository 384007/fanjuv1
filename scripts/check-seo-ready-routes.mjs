/**
 * scripts/check-seo-ready-routes.mjs
 * Validates all content/seo-ready/*.md files.
 * Rules:
 *   - status=ready
 *   - aiQualityScore >= 90
 *   - canonicalPath exists, starts with /, no whitespace
 *   - no duplicate canonicalPath
 *
 * NOT checked (intentionally):
 *   - translationKey pairing
 *   - alternatePath existence
 *   - zh/en article pairing
 */

import { existsSync, readdirSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const READY_DIR = join(ROOT, "content/seo-ready")
const MIN_SCORE = 90

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

function getAlternatePath(p) {
  return p.startsWith("/en/") ? p.slice(3) : `/en${p}`
}

if (!existsSync(READY_DIR)) {
  console.error(`❌  content/seo-ready not found at ${READY_DIR}`)
  process.exit(1)
}

const files = readdirSync(READY_DIR).filter((f) => f.endsWith(".md"))
if (files.length === 0) {
  console.warn("⚠️  No .md files in content/seo-ready/")
}

let errors = 0
const seenPaths = new Map()

for (const file of files) {
  const raw = readFileSync(join(READY_DIR, file), "utf8")
  const meta = parseFrontmatter(raw)
  const score = parseInt(meta.aiQualityScore || "0", 10)

  console.log(`\n📄 ${file}`)
  console.log(`   status: ${meta.status || "(missing)"}  score: ${score}  lang: ${meta.lang || "(none)"}`)
  console.log(`   canonicalPath: ${meta.canonicalPath || "(missing)"}`)

  if (meta.status !== "ready" || score < MIN_SCORE) {
    console.log(`   ⚠️  Not ready or score < ${MIN_SCORE} — skipped`)
    continue
  }

  if (!meta.canonicalPath) {
    console.error(`   ❌ Missing canonicalPath`)
    errors++
    continue
  }

  const cp = normalizePath(meta.canonicalPath)

  if (!cp.startsWith("/")) {
    console.error(`   ❌ canonicalPath must start with /`)
    errors++
    continue
  }

  if (/\s/.test(cp)) {
    console.error(`   ❌ canonicalPath contains whitespace`)
    errors++
    continue
  }

  if (seenPaths.has(cp)) {
    console.error(`   ❌ Duplicate canonicalPath (also in ${seenPaths.get(cp)})`)
    errors++
    continue
  }

  seenPaths.set(cp, file)
  const alt = getAlternatePath(cp)
  console.log(`   ✅ canonicalPath OK  →  alternatePath: ${alt}`)
}

console.log(`\n─── Summary ────────────────────────────────────────────────────`)
console.log(`Files: ${files.length}  |  Ready & valid: ${seenPaths.size}  |  Errors: ${errors}`)

if (errors > 0) {
  console.error(`\n❌  ${errors} error(s). Fix before building.`)
  process.exit(1)
} else {
  console.log(`\n✅  All checks passed.`)
}
