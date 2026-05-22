/**
 * recover-missing-from-d1.mjs
 * Fetch articles from D1 that are missing local markdown files and write them back.
 * Run before `pnpm build` to ensure all published D1 articles are in the repo.
 */
import { writeFileSync, readdirSync } from "fs"
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
  "SELECT slug, title, description, body_html, lang, canonical_path, alternate_path, source_path, quality_score FROM articles WHERE status='ready' ORDER BY published_at DESC"
)

// Get existing markdown files (by source_path or slug-derived filename)
const existing = new Set(readdirSync(CONTENT_DIR).map((f) => f.replace(/\.md$/, "")))

let recovered = 0

function decodeHtml(value = "") {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}

function htmlToSourceMarkdown(html = "") {
  const blocks = []
  const normalized = String(html || "")
    .replace(/\r\n/g, "\n")
    .replace(/<\/?(?:article|strong|em)\b[^>]*>/gi, "")

  const blockRe = /<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/gi
  let match
  while ((match = blockRe.exec(normalized)) !== null) {
    const tag = match[1].toLowerCase()
    const text = decodeHtml(match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    if (!text) continue
    if (tag === "p" && /^#{1,6}\s+/.test(text)) {
      blocks.push(text)
    } else if (tag.startsWith("h")) {
      const level = Math.max(1, Math.min(6, Number.parseInt(tag.slice(1), 10) || 2))
      blocks.push(`${"#".repeat(level)} ${text}`)
    } else if (tag === "li") {
      blocks.push(`- ${text}`)
    } else {
      blocks.push(text)
    }
  }

  if (blocks.length) return blocks.join("\n\n").trim()
  return decodeHtml(normalized.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

function yamlString(value = "") {
  return `"${String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ").trim()}"`
}

function translationKeyFor(row) {
  const canonicalPath = row.canonical_path || ""
  const parts = canonicalPath.split("/").filter(Boolean)
  const offset = parts[0] === "en" ? 1 : 0
  if (parts[offset] === "city" && parts[offset + 1] && parts[offset + 2]) {
    return `${parts[offset + 1]}-${parts[offset + 2]}`
  }
  return (row.slug || canonicalPath || "recovered").replace(/^\/?/, "").replace(/\//g, "-")
}

for (const row of rows) {
  // Derive filename from source_path or canonical_path
  const sourcePath = row.source_path || ""
  const filename = sourcePath
    ? sourcePath.replace(/^content\/seo-ready\//, "").replace(/\.md$/, "")
    : row.canonical_path.replace(/^\//, "").replace(/\//g, "-")

  if (existing.has(filename)) continue

  const lang = row.lang || (row.canonical_path?.startsWith("/en/") ? "en" : "zh")
  const canonicalPath = row.canonical_path || ""
  const alternatePath = row.alternate_path || ""
  const score = Math.trunc(Number(row.quality_score) || 100)
  const markdownBody = htmlToSourceMarkdown(row.body_html || "")

  const md = [
    "---",
    `slug: ${yamlString(filename)}`,
    `canonicalPath: ${yamlString(canonicalPath)}`,
    alternatePath ? `alternatePath: ${yamlString(alternatePath)}` : null,
    `translationKey: ${yamlString(translationKeyFor(row))}`,
    `lang: ${yamlString(lang)}`,
    `title: ${yamlString(row.title || "")}`,
    lang === "zh" ? `titleZh: ${yamlString(row.title || "")}` : null,
    `description: ${yamlString(row.description || "")}`,
    `pageType: ${yamlString("city_article")}`,
    `priorityScore: 70`,
    `aiQualityScore: ${score}`,
    `status: ${yamlString("ready")}`,
    `renderMode: ${yamlString("source")}`,
    `recoveredFromD1: ${yamlString("true")}`,
    "---",
    "",
    markdownBody,
  ]
    .filter((l) => l !== null)
    .join("\n")

  const outPath = join(CONTENT_DIR, `${filename}.md`)
  writeFileSync(outPath, md, "utf8")
  console.log(`✅ Recovered: ${filename}.md (${canonicalPath})`)
  recovered++
}

console.log(`D1 recovery: ${recovered} missing articles restored, ${rows.length - recovered} already present`)
