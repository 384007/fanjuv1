#!/usr/bin/env node
/**
 * scripts/sync-articles-to-d1.mjs
 *
 * Fast bulk sync: content/seo-ready/*.md → D1 (one SQL file) + R2 (concurrent uploads)
 *
 * Usage:
 *   node scripts/sync-articles-to-d1.mjs [--dry-run] [--skip-r2] [--limit=N] [--concurrency=20]
 */

import { readdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import { spawnSync, spawn } from "node:child_process"

const ROOT = process.cwd()
const READY_DIR = join(ROOT, "content/seo-ready")
const DB_NAME = "fanju-seo-prod"
const R2_BUCKET = "fanju-articles-prod"
const WORKER_CONFIG = "workers/fanju-seo/wrangler.toml"
const MIN_SCORE = 90

const DRY_RUN = process.argv.includes("--dry-run")
const SKIP_R2 = process.argv.includes("--skip-r2")
const LIMIT = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "9999")
const CONCURRENCY = parseInt(process.argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1] ?? "20")

// ── Frontmatter parser ────────────────────────────────────────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: raw }
  const meta = {}
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)\s*$/)
    if (!m) continue
    let value = m[2].trim()
    const q = value[0]
    if ((q === '"' || q === "'") && value.endsWith(q)) value = value.slice(1, -1)
    meta[m[1]] = value.trim()
  }
  return { meta, body: match[2].trim() }
}

// ── Markdown → HTML ───────────────────────────────────────────────────────────

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function markdownToHtml(md) {
  const cleaned = md
    .replace(/\n## (Draft Quality Check|AI-readable summary|Summary for AI Search Engines|Related Fanju Pages?|相关页面)[^\n]*\n[\s\S]*?(?=\n## |\n# |$)/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .trim()

  const lines = cleaned.split("\n")
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (hMatch) { out.push(`<h${Math.min(hMatch[1].length,6)}>${esc(hMatch[2].trim())}</h${Math.min(hMatch[1].length,6)}>`); i++; continue }
    if (/^[-*] /.test(line)) {
      const items = []
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(`<li>${esc(lines[i].replace(/^[-*] /,"").trim())}</li>`); i++ }
      out.push(`<ul>${items.join("")}</ul>`); continue
    }
    if (/^\d+\. /.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(`<li>${esc(lines[i].replace(/^\d+\. /,"").trim())}</li>`); i++ }
      out.push(`<ol>${items.join("")}</ol>`); continue
    }
    if (line.trim() === "" || line.trim() === "---") { i++; continue }
    const parts = []
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !/^[-*] /.test(lines[i]) && !/^\d+\. /.test(lines[i]) && lines[i].trim() !== "---") { parts.push(lines[i]); i++ }
    if (parts.length) out.push(`<p>${esc(parts.join(" ").trim())}</p>`)
  }
  return out.join("\n")
}

function sqlStr(s) { return `'${String(s ?? "").replace(/'/g, "''")}'` }

// ── Concurrent R2 uploads ─────────────────────────────────────────────────────

async function r2UploadConcurrent(items) {
  let done = 0
  const total = items.length

  async function upload({ key, content }) {
    const tmpFile = join(ROOT, `.tmp-r2-${Date.now()}-${Math.random().toString(36).slice(2)}.html`)
    writeFileSync(tmpFile, content, "utf8")
    try {
      await new Promise((resolve, reject) => {
        const proc = spawn("npx", [
          "wrangler", "r2", "object", "put", `${R2_BUCKET}/${key}`,
          "--file", tmpFile,
          "--content-type", "text/html; charset=utf-8",
          "--config", WORKER_CONFIG,
        ], { stdio: "pipe" })
        proc.on("close", (code) => code === 0 ? resolve() : reject(new Error(`R2 upload failed: ${key}`)))
      })
    } finally {
      try { unlinkSync(tmpFile) } catch {}
    }
    done++
    if (done % 50 === 0) process.stdout.write(`\r[r2] ${done}/${total} uploaded...`)
  }

  // Run in batches of CONCURRENCY
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    await Promise.allSettled(items.slice(i, i + CONCURRENCY).map(upload))
  }
  process.stdout.write(`\r[r2] ${done}/${total} uploaded\n`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

const files = readdirSync(READY_DIR).filter((f) => f.endsWith(".md"))
console.log(`[sync] ${files.length} markdown files, processing up to ${LIMIT}${DRY_RUN ? " [DRY RUN]" : ""}`)

const sqlStatements = []
const r2Items = []
let skipped = 0

for (const file of files.slice(0, LIMIT)) {
  try {
    const raw = readFileSync(join(READY_DIR, file), "utf8")
    const { meta, body } = parseFrontmatter(raw)

    const score = parseInt(meta.aiQualityScore ?? "0", 10)
    if (meta.status !== "ready" || score < MIN_SCORE) { skipped++; continue }

    const canonicalPath = (meta.canonicalPath ?? "").replace(/^"|"$/g, "")
    if (!canonicalPath.includes("/city/")) { skipped++; continue }

    const slug = (meta.slug ?? file.replace(/\.md$/, "")).replace(/^"|"$/g, "")
    const alternatePath = (meta.alternatePath ?? "").replace(/^"|"$/g, "")
    const lang = (meta.lang ?? "zh").replace(/^"|"$/g, "")
    const title = (meta.title ?? slug).replace(/^"|"$/g, "")
    const description = (meta.description ?? "").replace(/^"|"$/g, "")
    const citySlug = canonicalPath.match(/\/city\/([^/]+)/)?.[1] ?? ""
    const topicSlug = canonicalPath.split("/").at(-1) ?? ""
    const r2Key = `articles/${slug}.html`
    const now = new Date().toISOString()

    sqlStatements.push(
      `INSERT INTO articles (slug,lang,city_slug,topic_slug,title,description,canonical_path,alternate_path,r2_key,body_html,status,quality_score,published_at,created_at,updated_at) VALUES (${sqlStr(slug)},${sqlStr(lang)},${sqlStr(citySlug)},${sqlStr(topicSlug)},${sqlStr(title)},${sqlStr(description)},${sqlStr(canonicalPath)},${sqlStr(alternatePath)},${sqlStr(r2Key)},NULL,'ready',${score},${sqlStr(now)},${sqlStr(now)},${sqlStr(now)}) ON CONFLICT(slug) DO UPDATE SET title=excluded.title,description=excluded.description,canonical_path=excluded.canonical_path,alternate_path=excluded.alternate_path,r2_key=excluded.r2_key,status='ready',quality_score=excluded.quality_score,updated_at=${sqlStr(now)}`
    )

    r2Items.push({ key: r2Key, content: markdownToHtml(body) })
  } catch (err) {
    console.error(`[sync] parse error ${file}: ${err.message}`)
  }
}

console.log(`[sync] ${sqlStatements.length} articles to sync, ${skipped} skipped`)

// ── 1. Bulk D1 insert (one SQL file, one wrangler call) ──────────────────────

if (sqlStatements.length && !DRY_RUN) {
  const sqlFile = join(ROOT, `.tmp-d1-bulk-${Date.now()}.sql`)
  writeFileSync(sqlFile, sqlStatements.join(";\n") + ";", "utf8")
  console.log(`[d1] executing ${sqlStatements.length} statements in one batch...`)
  try {
    const result = spawnSync(
      "npx",
      ["wrangler", "d1", "execute", DB_NAME, "--config", WORKER_CONFIG, "--remote", "--file", sqlFile],
      { stdio: "inherit" },
    )
    if (result.status !== 0) { console.error("[d1] batch failed"); process.exit(1) }
    console.log("[d1] ✅ bulk insert done")
  } finally {
    try { unlinkSync(sqlFile) } catch {}
  }
} else if (DRY_RUN) {
  console.log(`[dry-run] would execute ${sqlStatements.length} D1 statements`)
}

// ── 2. Concurrent R2 uploads ─────────────────────────────────────────────────

if (!SKIP_R2 && r2Items.length && !DRY_RUN) {
  console.log(`[r2] uploading ${r2Items.length} articles with concurrency=${CONCURRENCY}...`)
  await r2UploadConcurrent(r2Items)
  console.log("[r2] ✅ uploads done")
} else if (SKIP_R2) {
  console.log("[r2] skipped (--skip-r2)")
} else if (DRY_RUN) {
  console.log(`[dry-run] would upload ${r2Items.length} R2 objects`)
}

console.log(`\n✅ sync complete: ${sqlStatements.length} articles`)
