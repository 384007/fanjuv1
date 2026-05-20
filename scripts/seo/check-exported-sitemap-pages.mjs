import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { extname, join } from "path"

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, "out")
const PUBLIC_DIR = join(ROOT, "public")
const SITE = "https://fanju.app"
const OUTPUT_FILE = process.env.OUTPUT_FILE || "/private/tmp/fanju-exported-sitemap-pages.json"

const BAD_PUBLIC_PATTERNS = [
  /本站联系QQ/i,
  /联系QQ/i,
  /域名出售/i,
  /domain\s+for\s+sale/i,
  /buy\s+this\s+domain/i,
  /parked\s+domain/i,
  /\bIntro paragraph mentioning\b/i,
  /\bReturn valid JSON\b/i,
  /\bBody requirements\b/i,
  /\bmarkdown skeleton\b/i,
  /只返回合法 JSON/,
  /正文要求/,
  /提示词/,
  /路由清单/,
  /技术实现/,
  /自动化流水线/,
]

function walk(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) out.push(...walk(full))
    else if (stat.isFile()) out.push(full)
  }
  return out
}

function sitemapPaths(file) {
  if (!existsSync(file)) return []
  const xml = readFileSync(file, "utf8")
  const paths = []
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const url = new URL(match[1])
      if (url.origin === SITE) paths.push(url.pathname.replace(/\/$/, "") || "/")
    } catch {
      // malformed sitemap entries are handled by XML validators elsewhere
    }
  }
  return paths
}

function unique(items) {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b))
}

function htmlFileForPath(path) {
  const clean = path === "/" ? "/index" : path
  const candidates = [
    join(OUT_DIR, `${clean}.html`),
    join(OUT_DIR, clean, "index.html"),
  ]
  return candidates.find((file) => existsSync(file)) || ""
}

function publicFileForPath(path) {
  const clean = path.replace(/^\/+/, "")
  if (!clean) return ""
  const candidates = [join(PUBLIC_DIR, clean), join(OUT_DIR, clean)]
  return candidates.find((file) => existsSync(file)) || ""
}

function decodeEntities(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}

function parseCanonical(html) {
  const match = html.match(/<link\b(?=[^>]*\brel=["'][^"']*\bcanonical\b[^"']*["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i)
  return match ? decodeEntities(match[1]) : ""
}

function parseInternalLinks(html) {
  const links = new Set()
  for (const match of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)) {
    const href = decodeEntities(match[1]).trim()
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue
    try {
      const url = href.startsWith("http") ? new URL(href) : new URL(href, SITE)
      if (url.origin !== SITE) continue
      links.add(url.pathname.replace(/\/$/, "") || "/")
    } catch {
      // ignore invalid href; rendered link audits catch malformed source links
    }
  }
  return [...links]
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function isAssetPath(path) {
  const ext = extname(path)
  return Boolean(ext && ext !== ".html")
}

function checkPath(path, allHtmlPaths) {
  const issues = []
  const file = htmlFileForPath(path)
  if (!file) return { path, ok: false, issues: ["missing-exported-html"] }

  const html = readFileSync(file, "utf8")
  const text = visibleText(html)
  const canonical = parseCanonical(html)
  const expectedCanonical = `${SITE}${path === "/" ? "" : path}`

  if (html.length < 1500) issues.push(`tiny-html:${html.length}`)
  if (!/<h1\b/i.test(html)) issues.push("missing-h1")
  if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) issues.push("noindex-meta")
  if (!canonical) issues.push("missing-canonical")
  else if (canonical.replace(/\/$/, "") !== expectedCanonical.replace(/\/$/, "")) {
    issues.push(`canonical-mismatch:${canonical}`)
  }
  if (text.length < 500) issues.push(`thin-visible-text:${text.length}`)

  for (const pattern of BAD_PUBLIC_PATTERNS) {
    if (pattern.test(text)) issues.push(`bad-public-phrase:${String(pattern)}`)
  }

  for (const link of parseInternalLinks(html)) {
    if (link === path) continue
    if (allHtmlPaths.has(link)) continue
    if (isAssetPath(link) && publicFileForPath(link)) continue
    issues.push(`missing-internal-link:${link}`)
    if (issues.length > 25) break
  }

  return { path, file: file.replace(`${ROOT}/`, ""), ok: issues.length === 0, issues }
}

const sitemapPagePaths = unique([
  ...sitemapPaths(join(PUBLIC_DIR, "sitemap.xml")),
  ...sitemapPaths(join(PUBLIC_DIR, "product-sitemap.xml")),
])

if (!existsSync(OUT_DIR)) {
  console.error("Missing out/. Run pnpm build first.")
  process.exit(1)
}

const allHtmlPaths = new Set()
for (const file of walk(OUT_DIR)) {
  if (!file.endsWith(".html")) continue
  const rel = file.slice(OUT_DIR.length).replace(/\.html$/, "")
  allHtmlPaths.add(rel === "/index" ? "/" : rel)
}

const results = sitemapPagePaths.map((path) => checkPath(path, allHtmlPaths))
const failures = results.filter((item) => !item.ok)
const report = {
  checkedAt: new Date().toISOString(),
  checked: results.length,
  failed: failures.length,
  failures,
}

writeFileSync(OUTPUT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8")
console.log(`Exported sitemap page check: checked=${report.checked} failed=${report.failed}`)
console.log(`Report: ${OUTPUT_FILE}`)

for (const failure of failures.slice(0, 40)) {
  console.log(`FAIL ${failure.path} ${failure.issues.join("; ")}`)
}
if (failures.length > 40) console.log(`...and ${failures.length - 40} more`)

if (failures.length) process.exit(1)
console.log("OK")
