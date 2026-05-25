import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"
import { categories, cities, guides } from "@/lib/seo-data"

const READY_DIR = join(process.cwd(), "content/seo-ready")
const GENERATED_INDEX_DIR = join(process.cwd(), "content/articles/ready/index")
const ROUTE_MANIFEST_FILE = join(process.cwd(), "data/seo/route-manifest.json")
const MIN_SCORE = 90

export type GeneratedArticle = {
  status: "publish" | "noindex" | "reject"
  language: "zh" | "en"
  slug: string
  canonicalPath: string
  canonical?: string
  robots?: "index,follow" | "noindex,follow"
  sitemapEligible?: boolean
  title: string
  metaTitle?: string
  metaDescription?: string
  h1?: string
  excerpt?: string
  primaryKeyword?: string
  secondaryKeywords?: string[]
  searchIntent?: string
  targetAudience?: string
  articleType?: string
  directAnswer?: string
  entitySummary?: {
    brand?: string
    topic?: string
    city?: string
    audience?: string
    scenario?: string
  }
  internalLinks?: { anchor: string; url: string; reason?: string }[]
  sections?: { h2: string; body: string; links?: string[] }[]
  faq?: { question: string; answer: string }[]
  schemaSuggestions?: string[]
  breadcrumbs?: { label: string; url: string }[]
  cta?: { anchor: string; url: string }
  audit?: { qualityAudit?: { score?: number } }
}

export type SeoReadyArticle = {
  slug: string
  title: string
  titleZh?: string
  description?: string
  primaryKeyword?: string
  secondaryKeywords?: string[]
  canonicalPath: string
  canonicalUrl?: string
  lang?: string
  alternatePath?: string
  translationKey?: string
  pageType?: string
  aiQualityScore: number
  priorityScore?: number
  status: string
  renderMode?: "source"
  body: string
  robots?: "index,follow" | "noindex,follow"
  sitemapEligible?: boolean
  generatedArticle?: GeneratedArticle
  allowAlternateFallback?: boolean
  publishedRunId?: string
}

export type SafeLink = {
  label: string
  href: string
}

type RouteManifestEntry = {
  route?: string
  locale?: "zh" | "en"
  citySlug?: string
  cityNameLocalized?: string
  topicSlug?: string
  topicNameLocalized?: string
}

let _routeManifestEntries: RouteManifestEntry[] | null = null

function routeManifestEntries(): RouteManifestEntry[] {
  if (_routeManifestEntries) return _routeManifestEntries
  if (!existsSync(ROUTE_MANIFEST_FILE)) {
    _routeManifestEntries = []
    return _routeManifestEntries
  }
  try {
    const payload = JSON.parse(readFileSync(ROUTE_MANIFEST_FILE, "utf8"))
    _routeManifestEntries = Array.isArray(payload.entries) ? payload.entries : []
  } catch {
    _routeManifestEntries = []
  }
  return _routeManifestEntries || []
}

function routeManifestEntryForPath(path: string, lang: "zh" | "en") {
  const normalized = pathWithoutHash(path)
  return routeManifestEntries().find((entry) => entry.locale === lang && pathWithoutHash(entry.route || "") === normalized) || null
}

function routeManifestCityName(citySlug: string, lang: "zh" | "en") {
  return routeManifestEntries().find((entry) => entry.locale === lang && entry.citySlug === citySlug)?.cityNameLocalized || ""
}

function routeManifestTopicName(topicSlug: string, lang: "zh" | "en") {
  return routeManifestEntries().find((entry) => entry.locale === lang && entry.topicSlug === topicSlug)?.topicNameLocalized || ""
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: raw }
  const meta: Record<string, string> = {}
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
  return { meta, body: match[2].trim() }
}

function parseKeywordList(value = ""): string[] {
  return value
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizePath(p: string): string {
  if (!p) return ""
  let path = p.trim()
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path)
      path = `${url.pathname}${url.hash || ""}`
    } catch {
      return ""
    }
  }
  const [pathname, hash = ""] = path.split("#", 2)
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`
  const clean = normalized.endsWith("/") && normalized.length > 1 ? normalized.slice(0, -1) : normalized
  if (!hash) return clean
  return `${clean}#${hash}`
}

let _cache: SeoReadyArticle[] | null = null
let _articleByPathCache: Map<string, SeoReadyArticle> | null = null
let _safeArticleLinksByCityCache: Map<string, SafeLink[]> | null = null
let _safeLinksForArticleCache: Map<string, SafeLink[]> | null = null

function loadAll(): SeoReadyArticle[] {
  if (_cache) return _cache

  const articles: SeoReadyArticle[] = []
  if (existsSync(READY_DIR)) {
    for (const file of readdirSync(READY_DIR).filter((f) => f.endsWith(".md"))) {
      const raw = readFileSync(join(READY_DIR, file), "utf8")
      const { meta, body } = parseFrontmatter(raw)
      const score = parseInt(meta.aiQualityScore || "0", 10)
      if (meta.status !== "ready" || score < MIN_SCORE) continue

      const slug = meta.slug || file.replace(/\.md$/, "")
      const canonicalPath = normalizePath(meta.canonicalPath || `/${slug}`)
      const alternatePath = meta.alternatePath ? normalizePath(meta.alternatePath) : undefined

      articles.push({
        slug,
        title: meta.title || slug,
        titleZh: meta.titleZh,
        description: meta.description,
        primaryKeyword: meta.primaryKeyword,
        secondaryKeywords: parseKeywordList(meta.secondaryKeywords),
        canonicalPath,
        canonicalUrl: meta.canonicalUrl,
        lang: meta.lang,
        alternatePath,
        translationKey: meta.translationKey,
        pageType: meta.pageType,
        aiQualityScore: score,
        priorityScore: meta.priorityScore ? parseInt(meta.priorityScore, 10) : undefined,
        status: meta.status,
        renderMode: meta.renderMode === "source" ? "source" : undefined,
        body,
        robots: "index,follow",
        sitemapEligible: true,
        allowAlternateFallback: true,
        publishedRunId: meta.publishedRunId,
      })
    }
  }

  if (existsSync(GENERATED_INDEX_DIR)) {
    for (const file of readdirSync(GENERATED_INDEX_DIR).filter((f) => f.endsWith(".json"))) {
      let generated: GeneratedArticle
      try {
        generated = JSON.parse(readFileSync(join(GENERATED_INDEX_DIR, file), "utf8")) as GeneratedArticle
      } catch {
        continue
      }
      if (generated.status !== "publish" || generated.robots !== "index,follow" || generated.sitemapEligible === false) continue
      const canonicalPath = normalizePath(generated.canonicalPath)
      if (!canonicalPath) continue
      const body = [
        `# ${generated.h1 || generated.title}`,
        generated.directAnswer || generated.excerpt || "",
        ...(generated.sections || []).flatMap((section) => [`## ${section.h2}`, section.body]),
      ].filter(Boolean).join("\n\n")

      articles.push({
        slug: generated.slug || file.replace(/\.json$/, ""),
        title: generated.title,
        titleZh: generated.language === "zh" ? generated.title : undefined,
        description: generated.metaDescription || generated.excerpt,
        canonicalPath,
        canonicalUrl: generated.canonical,
        lang: generated.language,
        pageType: generated.articleType,
        aiQualityScore: generated.audit?.qualityAudit?.score || 100,
        status: "ready",
        body,
        robots: generated.robots,
        sitemapEligible: generated.sitemapEligible,
        generatedArticle: generated,
        allowAlternateFallback: false,
      })
    }
  }
  return (_cache = articles)
}

/** Derive the alternate-language path from any pathname (pure computation, no file lookup). */
export function getAlternatePath(pathname: string): string {
  const normalized = normalizePath(pathname)
  if (normalized.startsWith("/en/")) {
    return normalized.slice(3) // /en/foo → /foo
  }
  return `/en${normalized}` // /foo → /en/foo
}

export function getSeoReadyArticleByPath(pathname: string): SeoReadyArticle | undefined {
  const normalized = normalizePath(pathname)
  if (!_articleByPathCache) {
    _articleByPathCache = new Map(loadAll().map((article) => [article.canonicalPath, article]))
  }
  return _articleByPathCache.get(normalized)
}

/** Returns true if a dedicated ready article exists at the given path (not fallback). */
export function hasReadyArticleAtPath(pathname: string): boolean {
  return getSeoReadyArticleByPath(pathname) !== undefined
}

/**
 * Look up article by pathname. If not found, try the alternate path.
 * Returns { article, isFallback } where isFallback=true means we're rendering
 * the alternate article at this path (no dedicated file exists for this path).
 */
export function getSeoReadyArticleByPathOrAlternate(
  pathname: string
): { article: SeoReadyArticle; isFallback: boolean } | undefined {
  const normalized = normalizePath(pathname)
  const direct = getSeoReadyArticleByPath(normalized)
  if (direct) return { article: direct, isFallback: false }

  // Try alternate path
  const altPath = getAlternatePath(normalized)
  const fallback = getSeoReadyArticleByPath(altPath)
  if (fallback?.allowAlternateFallback === false) return undefined
  if (fallback) return { article: fallback, isFallback: true }

  return undefined
}

export function getAllSeoReadyArticlePaths(): string[] {
  return loadAll().map((a) => a.canonicalPath)
}

const SAFE_STATIC_PATHS = new Set([
  "/",
  "/cities",
  "/en/cities",
  "/categories",
  "/en/categories",
  "/what-is-fanju",
  "/en/what-is-fanju",
  "/what-is-dinner-buddy",
  "/social-dining",
  "/faq",
  "/create",
  "/invite",
  "/how-to-find-dinner-buddies",
  "/how-to-host-a-dinner-gathering",
  "/business-dinner-networking",
  "/fanju-vs-tinder",
])

const citySlugs = new Set(cities.map((city) => city.slug))
const zhCategorySlugs = new Set(categories.map((category) => category.slug))
const enCategorySlugs = new Set(categories.slice(0, 12).map((category) => category.slug))
const guideSlugs = new Set(guides.map((guide) => guide.slug))

function pathWithoutHash(path: string): string {
  return normalizePath(path).split("#")[0] || ""
}

function addPath(set: Set<string>, path?: string) {
  const normalized = pathWithoutHash(path || "")
  if (normalized) set.add(normalized)
}

let _safeArticlePathCache: Set<string> | null = null

function safeArticlePathSet(): Set<string> {
  if (_safeArticlePathCache) return _safeArticlePathCache
  const paths = new Set<string>()
  for (const article of loadAll()) {
    addPath(paths, article.canonicalPath)
    if (article.allowAlternateFallback !== false) addPath(paths, article.alternatePath)
  }
  return (_safeArticlePathCache = paths)
}

export function isSafeStaticPath(path: string): boolean {
  const normalized = pathWithoutHash(path)
  if (!normalized) return false
  if (SAFE_STATIC_PATHS.has(normalized)) return true

  const city = normalized.match(/^\/(?:en\/)?city\/([^/]+)$/)?.[1]
  if (city) return citySlugs.has(city)

  const zhCategory = normalized.match(/^\/category\/([^/]+)$/)?.[1]
  if (zhCategory) return zhCategorySlugs.has(zhCategory)

  const enCategory = normalized.match(/^\/en\/category\/([^/]+)$/)?.[1]
  if (enCategory) return enCategorySlugs.has(enCategory)

  const guide = normalized.match(/^\/(?:en\/)?guides\/([^/]+)$/)?.[1]
  if (guide) return guideSlugs.has(guide)

  return false
}

export function getSafeArticlePaths(): string[] {
  return [...safeArticlePathSet()].sort()
}

export function hasSafeArticlePath(path: string): boolean {
  return safeArticlePathSet().has(pathWithoutHash(path))
}

export function isSafeInternalHref(href: string): boolean {
  const normalized = pathWithoutHash(href)
  if (!normalized) return false
  return isSafeStaticPath(normalized) || hasSafeArticlePath(normalized)
}

export function filterSafeLinkItems(items: [string, string][]): [string, string][] {
  const seen = new Set<string>()
  const safe: [string, string][] = []
  for (const [label, href] of items) {
    const normalized = normalizePath(href)
    if (!label || !isSafeInternalHref(normalized) || seen.has(normalized)) continue
    seen.add(normalized)
    safe.push([label, normalized])
  }
  return safe
}

function titleCase(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function hasCjk(value = "") {
  return /[\u4e00-\u9fff]/.test(value)
}

function articleLabel(article: SeoReadyArticle, path: string, lang: "zh" | "en") {
  const title = String(lang === "zh" ? article.titleZh || article.title : article.title || "").trim()
  if (lang === "zh" && hasCjk(title)) return title
  if (lang === "en" && title) return title
  return labelForArticlePath(path, lang)
}

export function localizedCityNameFromSlug(citySlug: string, lang: "zh" | "en") {
  const city = cities.find((item) => item.slug === citySlug)
  if (city) return lang === "en" ? city.nameEn : city.name
  const fromManifest = routeManifestCityName(citySlug, lang)
  if (fromManifest) return fromManifest
  return lang === "en" ? titleCase(citySlug) : "同城"
}

export function localizedTopicNameFromSlug(topicSlug: string, lang: "zh" | "en") {
  const category = categories.find((item) => item.slug === topicSlug)
  if (category) return lang === "en" ? category.nameEn : category.name
  const fromManifest = routeManifestTopicName(topicSlug, lang)
  if (fromManifest) return fromManifest
  return lang === "en" ? titleCase(topicSlug) : "主题饭局"
}

function cityName(citySlug: string, lang: "zh" | "en") {
  const city = cities.find((item) => item.slug === citySlug)
  if (city) return lang === "en" ? city.nameEn : city.name
  const fromManifest = routeManifestCityName(citySlug, lang)
  if (fromManifest) return fromManifest
  return lang === "en" ? titleCase(citySlug) : "同城"
}

function topicName(topicSlug: string, lang: "zh" | "en") {
  return localizedTopicNameFromSlug(topicSlug, lang)
}

function citySlugFromPath(path: string): string {
  return pathWithoutHash(path).match(/^\/(?:en\/)?city\/([^/]+)/)?.[1] || ""
}

function topicSlugFromPath(path: string): string {
  return pathWithoutHash(path).match(/^\/(?:en\/)?city\/[^/]+\/([^/]+)$/)?.[1] || ""
}

function isCityTopicPath(path: string): boolean {
  return /^\/(?:en\/)?city\/[^/]+\/[^/]+$/.test(pathWithoutHash(path))
}

function _isPathLang(path: string, lang: "zh" | "en") {
  const normalized = pathWithoutHash(path)
  return lang === "en" ? normalized.startsWith("/en/") : !normalized.startsWith("/en/")
}

function labelForArticlePath(path: string, lang: "zh" | "en") {
  const manifestEntry = routeManifestEntryForPath(path, lang)
  if (manifestEntry?.cityNameLocalized) {
    const city = manifestEntry.cityNameLocalized
    const topic = manifestEntry.topicNameLocalized || ""
    if (lang === "en") return topic ? `${city} ${topic}` : city
    if (!topic || manifestEntry.topicSlug === "city-overview") return `${city}饭局`
    return `${city}${topic}`
  }

  const citySlug = citySlugFromPath(path)
  const topicSlug = topicSlugFromPath(path)
  const city = cityName(citySlug, lang)
  const topic = topicName(topicSlug, lang)
  return lang === "en" ? `${city} ${topic}` : `${city}${topic}`
}

function defaultSafeLinks(lang: "zh" | "en"): SafeLink[] {
  return lang === "en"
    ? [
        { label: "Fanju app", href: "/en/what-is-fanju" },
        { label: "social dining app", href: "/social-dining" },
        { label: "dinner city directory", href: "/en/cities" },
        { label: "dinner categories", href: "/en/categories" },
        { label: "dinner buddy FAQ", href: "/faq" },
      ]
    : [
        { label: "饭局 app", href: "/what-is-fanju" },
        { label: "饭搭子", href: "/what-is-dinner-buddy" },
        { label: "同城饭局", href: "/cities" },
        { label: "线下饭局分类", href: "/categories" },
        { label: "饭局社交", href: "/social-dining" },
      ]
}

function addSafeLink(out: SafeLink[], seen: Set<string>, label: string, href: string, currentPath?: string) {
  const normalized = normalizePath(href)
  const current = currentPath ? pathWithoutHash(currentPath) : ""
  if (!label || pathWithoutHash(normalized) === current) return
  if (!isSafeInternalHref(normalized) || seen.has(normalized)) return
  seen.add(normalized)
  out.push({ label, href: normalized })
}

export function safeArticleLinksForCity(
  citySlug: string,
  lang: "zh" | "en",
  currentPath = "",
  limit = 6,
): SafeLink[] {
  if (!citySlug) return []
  const current = pathWithoutHash(currentPath)
  const key = `${lang}:${citySlug}`

  if (!_safeArticleLinksByCityCache) {
    _safeArticleLinksByCityCache = new Map()
    for (const article of loadAll()) {
      const path = pathWithoutHash(article.canonicalPath)
      if (!isCityTopicPath(path)) continue
      const itemLang = path.startsWith("/en/") ? "en" : "zh"
      const itemCity = citySlugFromPath(path)
      if (!itemCity) continue
      const itemKey = `${itemLang}:${itemCity}`
      const links = _safeArticleLinksByCityCache.get(itemKey) || []
      links.push({ label: articleLabel(article, path, itemLang), href: path })
      _safeArticleLinksByCityCache.set(itemKey, links)
    }
  }

  return (_safeArticleLinksByCityCache.get(key) || [])
    .filter((link) => pathWithoutHash(link.href) !== current)
    .slice(0, limit)
}

export function safeLinksForArticle(currentPath: string, article: SeoReadyArticle): SafeLink[] {
  const normalized = pathWithoutHash(currentPath || article.canonicalPath)
  const cacheKey = `${normalized}:${article.canonicalPath}`
  if (!_safeLinksForArticleCache) _safeLinksForArticleCache = new Map()
  const cached = _safeLinksForArticleCache.get(cacheKey)
  if (cached) return cached

  const lang: "zh" | "en" = normalized.startsWith("/en/") ? "en" : "zh"
  const citySlug = citySlugFromPath(normalized)
  const links: SafeLink[] = []
  const seen = new Set<string>()

  if (citySlug) {
    const cityHub = lang === "en" ? `/en/city/${citySlug}` : `/city/${citySlug}`
    addSafeLink(
      links,
      seen,
      lang === "en" ? `${cityName(citySlug, lang)} city hub` : `${cityName(citySlug, lang)}城市页`,
      cityHub,
      normalized,
    )

    for (const link of safeArticleLinksForCity(citySlug, lang, normalized, 5)) {
      addSafeLink(links, seen, link.label, link.href, normalized)
    }
  }

  for (const link of defaultSafeLinks(lang)) {
    addSafeLink(links, seen, link.label, link.href, normalized)
  }

  _safeLinksForArticleCache.set(cacheKey, links)
  return links
}

/** Returns city-only params for /city/[city] or /en/city/[city]. */
export function getSeoReadyCityParams(lang: "zh" | "en"): { city: string }[] {
  const result: { city: string }[] = []
  const seen = new Set<string>()

  function add(path: string) {
    const prefix = lang === "en" ? "/en/city/" : "/city/"
    if (!path.startsWith(prefix)) return
    const parts = path.replace(prefix, "").split("/")
    if (parts.length !== 1 || !parts[0]) return
    if (seen.has(parts[0])) return
    seen.add(parts[0])
    result.push({ city: parts[0] })
  }

  for (const a of loadAll()) {
    add(a.canonicalPath)
    if (a.allowAlternateFallback !== false) add(getAlternatePath(a.canonicalPath))
  }

  return result
}

/** Returns slug arrays for Next.js catch-all generateStaticParams.
 *  Includes both canonicalPath and derived alternatePath for non-/en/ paths. */
export function getSeoReadyStaticParamsForCatchAll(): { slug: string[] }[] {
  const slugSet = new Set<string>()
  const result: { slug: string[] }[] = []

  function add(path: string) {
    if (slugSet.has(path)) return
    slugSet.add(path)
    result.push({ slug: path.replace(/^\//, "").split("/") })
  }

  for (const a of loadAll()) {
    if (isCityCategoryPath(a.canonicalPath) || a.canonicalPath.startsWith("/en/")) continue
    add(a.canonicalPath)
    if (a.allowAlternateFallback === false) continue
    // Also add the derived alternatePath if it's not an /en/ path (it won't be, but guard anyway)
    const alt = getAlternatePath(a.canonicalPath)
    if (!alt.startsWith("/en/") && !isCityCategoryPath(alt)) add(alt)
  }

  // Also include fallback paths for /en/ articles (their zh counterpart)
  for (const a of loadAll()) {
    if (!a.canonicalPath.startsWith("/en/") || isEnCityCategoryPath(a.canonicalPath)) continue
    if (a.allowAlternateFallback === false) continue
    const zhPath = getAlternatePath(a.canonicalPath) // /en/foo → /foo
    if (!isCityCategoryPath(zhPath)) add(zhPath)
  }

  // Next 16 + output:"export" rejects an empty generateStaticParams() with
  // "Page is missing generateStaticParams()". Insert a harmless placeholder so
  // the route remains statically exportable even when no non-city/category
  // ready articles exist yet (e.g. fresh image, only city/category drafts).
  // The placeholder path renders nothing — the page redirects to "/".
  if (result.length === 0) {
    result.push({ slug: ["__seo_placeholder__"] })
  }

  return result
}

/** Returns slug arrays for /en/[...slug] catch-all.
 *  Includes both canonicalPath and derived alternatePath for /en/ paths. */
export function getSeoReadyStaticParamsForEnCatchAll(): { slug: string[] }[] {
  const slugSet = new Set<string>()
  const result: { slug: string[] }[] = []

  function add(enPath: string) {
    const slug = enPath.replace(/^\/en\//, "")
    if (slugSet.has(slug)) return
    slugSet.add(slug)
    result.push({ slug: slug.split("/") })
  }

  for (const a of loadAll()) {
    if (a.canonicalPath.startsWith("/en/") && !isEnCityCategoryPath(a.canonicalPath)) {
      add(a.canonicalPath)
    }
    if (a.allowAlternateFallback === false) continue
    // Also add /en/ version of zh articles as fallback paths
    if (!a.canonicalPath.startsWith("/en/") && !isCityCategoryPath(a.canonicalPath)) {
      const enPath = getAlternatePath(a.canonicalPath) // /foo → /en/foo
      if (!isEnCityCategoryPath(enPath)) add(enPath)
    }
  }

  // See note in getSeoReadyStaticParamsForCatchAll — empty array breaks
  // `next build` under output:"export".
  if (result.length === 0) {
    result.push({ slug: ["__seo_placeholder__"] })
  }

  return result
}

/** Returns city/category params for a given lang prefix */
export function getSeoReadyCityCategoryParams(lang: "zh" | "en"): { city: string; category: string }[] {
  const prefix = lang === "en" ? "/en/city/" : "/city/"
  const result: { city: string; category: string }[] = []
  const seen = new Set<string>()

  for (const a of loadAll()) {
    if (a.canonicalPath.startsWith(prefix)) {
      const parts = a.canonicalPath.replace(prefix, "").split("/")
      if (parts.length === 2) {
        const key = `${parts[0]}/${parts[1]}`
        if (!seen.has(key)) { seen.add(key); result.push({ city: parts[0], category: parts[1] }) }
      }
    }
    if (a.allowAlternateFallback === false) continue
    // Also add fallback: if lang=en, add /en/city/x/y for every zh /city/x/y article
    if (lang === "en" && isCityCategoryPath(a.canonicalPath)) {
      const parts = a.canonicalPath.replace("/city/", "").split("/")
      if (parts.length === 2) {
        const key = `${parts[0]}/${parts[1]}`
        if (!seen.has(key)) { seen.add(key); result.push({ city: parts[0], category: parts[1] }) }
      }
    }
    // If lang=zh, add /city/x/y for every en /en/city/x/y article
    if (lang === "zh" && isEnCityCategoryPath(a.canonicalPath)) {
      const parts = a.canonicalPath.replace("/en/city/", "").split("/")
      if (parts.length === 2) {
        const key = `${parts[0]}/${parts[1]}`
        if (!seen.has(key)) { seen.add(key); result.push({ city: parts[0], category: parts[1] }) }
      }
    }
  }

  return result
}

function isCityCategoryPath(p: string): boolean {
  return /^\/city\/[^/]+\/[^/]+$/.test(p)
}

function isEnCityCategoryPath(p: string): boolean {
  return /^\/en\/city\/[^/]+\/[^/]+$/.test(p)
}
