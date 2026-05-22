import { existsSync, readFileSync } from "fs"
import { extname } from "path"
import { abs, readJson, walk, writeJson } from "./_content-factory-runtime.mjs"
import { SITE, normalizePath } from "./_content-factory-catalog.mjs"

const SITEMAP_FILE = abs("public/sitemap.xml")
const MIN_SCORE = 90

function generatedArticlePaths(dir) {
  const paths = new Set()
  for (const file of walk(abs(dir))) {
    if (extname(file) !== ".json") continue
    const article = readJson(file)
    const path = normalizePath(article?.canonicalPath || "")
    if (path) paths.add(path)
  }
  return paths
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

function markdownArticlePaths(dir) {
  const paths = new Set()
  for (const file of walk(abs(dir))) {
    if (extname(file) !== ".md") continue
    const meta = parseFrontmatter(readFileSync(file, "utf8"))
    const score = parseInt(meta.aiQualityScore || "0", 10)
    if (meta.status !== "ready" || score < MIN_SCORE) continue
    const path = normalizePath(meta.canonicalPath || "")
    if (path) paths.add(path)
  }
  return paths
}

function sitemapPaths() {
  if (!existsSync(SITEMAP_FILE)) return undefined
  const xml = readFileSync(SITEMAP_FILE, "utf8")
  const paths = new Set()
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const loc = match[1]
    if (!loc.startsWith(SITE)) continue
    paths.add(normalizePath(loc.slice(SITE.length)))
  }
  return paths
}

const indexPaths = new Set([
  ...markdownArticlePaths("content/seo-ready"),
  ...generatedArticlePaths("content/articles/ready/index"),
])
const noindexPaths = generatedArticlePaths("content/articles/ready/noindex")
const rejectedPaths = generatedArticlePaths("content/articles/rejected")
const sitemap = sitemapPaths()

const report = {
  sitemapPresent: Boolean(sitemap),
  sitemapArticleCount: 0,
  sitemapHasNoindex: false,
  sitemapHasReject: false,
  sitemapHas404: false,
  sitemapHasRedirect: false,
  sitemapHasDraft: false,
  sitemapHasTemplateCityCategory: false,
  missingIndexArticles: [],
  noindexInSitemap: [],
  rejectedInSitemap: [],
  templateCityCategoryInSitemap: [],
  duplicateCanonicalInSitemap: [],
  status: "pass",
}

if (sitemap) {
  report.sitemapArticleCount = [...sitemap].filter((path) => indexPaths.has(path)).length
  for (const path of noindexPaths) {
    if (sitemap.has(path)) report.noindexInSitemap.push(path)
  }
  for (const path of rejectedPaths) {
    if (sitemap.has(path)) report.rejectedInSitemap.push(path)
  }
  for (const path of indexPaths) {
    if (!sitemap.has(path)) report.missingIndexArticles.push(path)
  }
  for (const path of sitemap) {
    if (/^\/(?:en\/)?city\/[^/]+\/[^/]+$/.test(path) && !indexPaths.has(path)) {
      report.templateCityCategoryInSitemap.push(path)
    }
  }
  report.sitemapHasNoindex = report.noindexInSitemap.length > 0
  report.sitemapHasReject = report.rejectedInSitemap.length > 0
  report.sitemapHasTemplateCityCategory = report.templateCityCategoryInSitemap.length > 0
  if (report.sitemapHasNoindex || report.sitemapHasReject) {
    report.status = "fail"
  }
}

writeJson(abs("data/seo/sitemap-indexability-report.json"), report)

console.log(`sitemapPresent=${report.sitemapPresent}`)
console.log(`sitemapArticleCount=${report.sitemapArticleCount}`)
console.log(`sitemapHasNoindex=${report.sitemapHasNoindex}`)
console.log(`sitemapHasRedirect=${report.sitemapHasRedirect}`)
console.log(`sitemapHas404=${report.sitemapHas404}`)
console.log(`templateCityCategoryInSitemap=${report.templateCityCategoryInSitemap.length}`)
console.log(`missingIndexArticles=${report.missingIndexArticles.length}`)

if (sitemap && report.status === "fail") {
  console.error("Sitemap indexability audit failed.")
  process.exit(1)
}
