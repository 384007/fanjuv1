import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs"
import { dirname, extname, join, relative } from "path"
import { fileURLToPath } from "url"
import { normalizePath, SITE } from "./_content-factory-catalog.mjs"
import { loadCategories, loadCities } from "./_seo-data-loader.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ROOT = join(__dirname, "../..")

export function abs(...parts) {
  return join(ROOT, ...parts)
}

export function readJson(path, fallback = undefined) {
  if (!existsSync(path)) return fallback
  return JSON.parse(readFileSync(path, "utf8"))
}

export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

export function* walk(dir) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) yield* walk(full)
    else if (stat.isFile()) yield full
  }
}

export function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const meta = {}
  if (!match) return meta
  for (const line of match[1].split(/\r?\n/)) {
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

export function loadExistingArticlePaths() {
  const paths = new Map()
  for (const file of walk(abs("content/seo-ready"))) {
    if (extname(file) !== ".md") continue
    const meta = parseFrontmatter(readFileSync(file, "utf8"))
    const path = normalizePath(meta.canonicalPath || "")
    if (path) paths.set(path, relative(ROOT, file))
  }
  for (const file of walk(abs("content/articles/ready/index"))) {
    if (extname(file) !== ".json") continue
    const article = readJson(file)
    const path = normalizePath(article?.canonicalPath || "")
    if (path) paths.set(path, relative(ROOT, file))
  }
  return paths
}

function staticRouteFromPage(file) {
  if (!file.endsWith("page.tsx") && !file.endsWith("page.ts")) return ""
  const rel = relative(abs("app"), file).replace(/\\/g, "/")
  const parts = rel.split("/").slice(0, -1)
  if (parts.some((part) => part.startsWith("[") || part.startsWith("("))) return ""
  return normalizePath(`/${parts.join("/")}`)
}

export function loadValidInternalUrls() {
  const valid = new Set()
  const cities = loadCities()
  const categories = loadCategories()

  function add(path) {
    const normalized = normalizePath(path)
    if (normalized && !normalized.includes("?")) valid.add(normalized)
  }

  add("/")
  for (const file of walk(abs("app"))) add(staticRouteFromPage(file))
  for (const city of cities) {
    add(`/city/${city.slug}`)
    add(`/en/city/${city.slug}`)
    for (const category of categories) {
      add(`/city/${city.slug}/${category.slug}`)
      add(`/en/city/${city.slug}/${category.slug}`)
    }
  }
  for (const category of categories) {
    add(`/category/${category.slug}`)
    add(`/en/category/${category.slug}`)
  }
  for (const file of walk(abs("content/seo-ready"))) {
    if (extname(file) !== ".md") continue
    const meta = parseFrontmatter(readFileSync(file, "utf8"))
    const score = Number.parseInt(meta.aiQualityScore || "0", 10)
    if (meta.status === "ready" && score >= 90) add(meta.canonicalPath)
  }
  for (const file of walk(abs("content/articles/ready/index"))) {
    if (extname(file) !== ".json") continue
    const article = readJson(file)
    if (article?.status === "publish" && article?.robots === "index,follow" && article?.sitemapEligible !== false) {
      add(article.canonicalPath)
    }
  }

  const sitemap = abs("public/sitemap.xml")
  if (existsSync(sitemap)) {
    const xml = readFileSync(sitemap, "utf8")
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const loc = match[1]
      if (loc.startsWith(SITE)) add(loc.slice(SITE.length))
    }
  }

  const noindex = new Set()
  for (const file of walk(abs("content/articles/ready/noindex"))) {
    if (extname(file) !== ".json") continue
    const article = readJson(file)
    add(article?.canonicalPath || "")
    noindex.add(normalizePath(article?.canonicalPath || ""))
  }
  for (const file of walk(abs("content/articles/rejected"))) {
    if (extname(file) !== ".json") continue
    const article = readJson(file)
    noindex.add(normalizePath(article?.canonicalPath || ""))
  }
  for (const path of noindex) valid.delete(path)

  return valid
}

export function selectLinks({ language, citySlug, categorySlug, articleType, currentPath, validUrls }) {
  const isEn = language === "en"
  const candidates = [
    isEn ? "/en/categories" : "/categories",
    categorySlug ? `${isEn ? "/en" : ""}/category/${categorySlug}` : "",
    citySlug ? `${isEn ? "/en" : ""}/city/${citySlug}` : isEn ? "/en/cities" : "/cities",
    articleType === "dating-guide" ? "/fanju-vs-tinder" : "",
    articleType === "sport-dinner" ? "/how-to-find-dinner-buddies" : "",
    articleType === "business-guide" || articleType === "industry-dinner" ? "/business-dinner-networking" : "",
    articleType === "creator-guide" ? "/how-to-host-a-dinner-gathering" : "",
    "/how-to-find-dinner-buddies",
    "/how-to-host-a-dinner-gathering",
    "/what-is-fanju",
    "/social-dining",
    "/faq",
    "/create",
  ]
  const seen = new Set()
  const out = []
  for (const candidate of candidates) {
    const path = normalizePath(candidate)
    if (!path || path === currentPath || seen.has(path) || !validUrls.has(path)) continue
    seen.add(path)
    out.push(path)
    if (out.length >= 6) break
  }
  return out
}

let routeManifestEntriesCache = null

function routeManifestEntries() {
  if (routeManifestEntriesCache) return routeManifestEntriesCache
  routeManifestEntriesCache = readJson(abs("data/seo/route-manifest.json"), { entries: [] })?.entries || []
  return routeManifestEntriesCache
}

function localizedRouteAnchor(path, language = "zh") {
  const lang = language === "en" ? "en" : "zh"
  const route = normalizePath(path)
  const entry = routeManifestEntries().find((item) => item?.locale === lang && normalizePath(item.route || "") === route)
  if (!entry?.cityNameLocalized) return ""
  const city = entry.cityNameLocalized
  const topic = entry.topicNameLocalized || ""
  if (lang === "en") return topic ? `${city} ${topic}` : city
  if (!topic || entry.topicSlug === "city-overview") return `${city}饭局`
  return `${city}${topic}`
}

export function linkAnchor(path, language = "zh") {
  const zh = language !== "en"
  const localized = localizedRouteAnchor(path, language)
  if (localized) return localized
  if (path === "/categories" || path === "/en/categories") return zh ? "饭局类型" : "dinner categories"
  if (path === "/cities" || path === "/en/cities") return zh ? "全部城市" : "all cities"
  if (path === "/what-is-fanju") return zh ? "饭局是什么" : "what Fanju is"
  if (path === "/social-dining") return zh ? "饭局社交" : "social dining"
  if (path === "/faq") return zh ? "常见问题" : "FAQ"
  if (path === "/create") return zh ? "创建饭局" : "create a dinner"
  if (path === "/how-to-find-dinner-buddies") return zh ? "如何找饭搭子" : "how to find dinner buddies"
  if (path === "/how-to-host-a-dinner-gathering") return zh ? "如何组织小桌饭局" : "how to host a small dinner"
  if (path === "/business-dinner-networking") return zh ? "商务饭局交流" : "business dinner networking"
  if (path === "/fanju-vs-tinder") return zh ? "饭局和约会软件的区别" : "Fanju vs dating apps"
  const parts = path.split("/").filter(Boolean)
  const fallback = parts[parts.length - 1]?.replace(/-/g, " ") || path
  return zh ? "相关饭局页面" : fallback
}
