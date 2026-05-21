/**
 * recover-missing-from-d1.mjs
 * Fetch articles from D1 that are missing local markdown files and write them back.
 * Run before `pnpm build` to ensure all published D1 articles are in the repo.
 */
import { execSync } from "child_process"
import { existsSync, writeFileSync, readdirSync } from "fs"
import { join } from "path"

const CONTENT_DIR = "content/seo-ready"
const CF_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const D1_DB_ID = process.env.D1_DATABASE_ID || "58d63133-adeb-4efd-b9eb-a9b056271ca5"

if (!CF_ACCOUNT || !CF_TOKEN) {
  console.log("CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN not set, skipping D1 recovery")
  process.exit(0)
}

async function d1Query(sql) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/d1/database/${D1_DB_ID}/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${CF_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql }),
    }
  )
  const json = await res.json()
  if (!json.success) throw new Error(`D1 query failed: ${JSON.stringify(json.errors)}`)
  return json.result[0].results
}

// Get all ready articles from D1
const rows = await d1Query(
  "SELECT slug, title, description, body_html, lang, canonical_path, alternate_path, source_path FROM articles WHERE status='ready' ORDER BY published_at DESC"
)

// Get existing markdown files (by source_path or slug-derived filename)
const existing = new Set(readdirSync(CONTENT_DIR).map((f) => f.replace(/\.md$/, "")))

let recovered = 0
for (const row of rows) {
  // Derive filename from source_path or canonical_path
  const sourcePath = row.source_path || ""
  const filename = sourcePath
    ? sourcePath.replace(/^content\/seo-ready\//, "").replace(/\.md$/, "")
    : row.canonical_path.replace(/^\//, "").replace(/\//g, "-")

  if (existing.has(filename)) continue

  // Convert body_html back to a minimal markdown wrapper
  // body_html is stored as HTML; we store it as-is with frontmatter
  const lang = row.lang || (row.canonical_path?.startsWith("/en/") ? "en" : "zh")
  const canonicalPath = row.canonical_path || ""
  const alternatePath = row.alternate_path || ""

  const md = [
    "---",
    `status: ready`,
    `score: 100`,
    `lang: ${lang}`,
    `canonicalPath: "${canonicalPath}"`,
    alternatePath ? `alternatePath: "${alternatePath}"` : null,
    `title: "${(row.title || "").replace(/"/g, '\\"')}"`,
    `description: "${(row.description || "").replace(/"/g, '\\"')}"`,
    `recoveredFromD1: true`,
    "---",
    "",
    row.body_html || "",
  ]
    .filter((l) => l !== null)
    .join("\n")

  const outPath = join(CONTENT_DIR, `${filename}.md`)
  writeFileSync(outPath, md, "utf8")
  console.log(`✅ Recovered: ${filename}.md (${canonicalPath})`)
  recovered++
}

console.log(`D1 recovery: ${recovered} missing articles restored, ${rows.length - recovered} already present`)
