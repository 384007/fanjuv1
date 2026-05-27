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
import {
  countMarkdownHeadings,
  countParagraphs,
  normalizePath,
  sourceBodyIssues,
} from "./seo/seo-ready-source-check.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const READY_DIR = join(ROOT, "content/seo-ready")
const MIN_SCORE = 90
const QUIET = process.env.SEO_READY_CHECK_VERBOSE !== "1"
  && (process.env.CI === "true" || process.env.CF_PAGES === "1" || process.env.QUIET_SEO_READY_CHECK === "1")

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

function bodyWithoutFrontmatter(raw) {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/)
  return match ? match[1].trim() : raw.trim()
}

function getAlternatePath(p) {
  return p.startsWith("/en/") ? p.slice(3) : `/en${p}`
}

if (!existsSync(READY_DIR)) {
  console.error(`❌  content/seo-ready not found at ${READY_DIR}`)
  process.exit(1)
}

const requestedFiles = (process.env.SEO_READY_FILES || "")
  .split(",")
  .map((file) => file.trim().replace(/^content\/seo-ready\//, ""))
  .filter(Boolean)
const allReadyFiles = readdirSync(READY_DIR).filter((f) => f.endsWith(".md")).sort()
const missingRequestedFiles = requestedFiles.filter((f) => !existsSync(join(READY_DIR, f)))
const files = requestedFiles.length
  ? requestedFiles.filter((f) => f.endsWith(".md") && existsSync(join(READY_DIR, f)))
  : allReadyFiles
if (files.length === 0) {
  console.warn("⚠️  No .md files in content/seo-ready/")
}

let errors = 0
let skipped = 0
const seenPaths = new Map()

if (missingRequestedFiles.length) {
  console.error(`   ❌ Missing requested SEO_READY_FILES: ${missingRequestedFiles.join(", ")}`)
  errors += missingRequestedFiles.length
}

for (const file of files) {
  const raw = readFileSync(join(READY_DIR, file), "utf8")
  const meta = parseFrontmatter(raw)
  const body = bodyWithoutFrontmatter(raw)
  const score = parseInt(meta.aiQualityScore || "0", 10)

  if (!QUIET) {
    console.log(`\n📄 ${file}`)
    console.log(`   status: ${meta.status || "(missing)"}  score: ${score}  lang: ${meta.lang || "(none)"}`)
    console.log(`   canonicalPath: ${meta.canonicalPath || "(missing)"}`)
  }

  if (meta.status !== "ready" || score < MIN_SCORE) {
    skipped++
    if (!QUIET) console.log(`   ⚠️  Not ready or score < ${MIN_SCORE} — skipped`)
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
  if (!QUIET) console.log(`   ✅ canonicalPath OK  →  alternatePath: ${alt}`)

  if (meta.renderMode === "source") {
    const sourceIssues = sourceBodyIssues(meta, body)
    if (sourceIssues.length) {
      console.error(`   ❌ Source article body failed strict checks in content/seo-ready/${file}: ${sourceIssues.join(", ")}`)
      errors += sourceIssues.length
      continue
    }
    if (!QUIET) console.log(`   ✅ source body OK  →  paragraphs: ${countParagraphs(body)}, h2: ${countMarkdownHeadings(body, 2)}`)
  }
}

console.log(`\n─── Summary ────────────────────────────────────────────────────`)
console.log(`Files: ${files.length}  |  Ready & valid: ${seenPaths.size}  |  Skipped: ${skipped}  |  Errors: ${errors}`)

if (errors > 0) {
  console.error(`\n❌  ${errors} error(s). Fix before building.`)
  process.exit(1)
} else {
  console.log(`\n✅  All checks passed.`)
}
