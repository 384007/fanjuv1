import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"
import { categories, cities, guides } from "@/lib/seo-data"

const READY_DIR = join(process.cwd(), "content/seo-ready")
const MIN_SCORE = 90

export type SeoReadyArticle = {
  slug: string
  title: string
  titleZh?: string
  description?: string
  canonicalPath: string
  canonicalUrl?: string
  lang?: string
  alternatePath?: string
  translationKey?: string
  pageType?: string
  aiQualityScore: number
  priorityScore?: number
  status: string
  body: string
}

export type SafeLink = {
  label: string
  href: string
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: raw }
  const meta: Record<string, string> = {}
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/)
    if (m) meta[m[1]] = m[2].trim()
  }
  return { meta, body: match[2].trim() }
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

function loadAll(): SeoReadyArticle[] {
  if (_cache) return _cache
  if (!existsSync(READY_DIR)) return (_cache = [])

  const articles: SeoReadyArticle[] = []
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
      canonicalPath,
      canonicalUrl: meta.canonicalUrl,
      lang: meta.lang,
      alternatePath,
      translationKey: meta.translationKey,
      pageType: meta.pageType,
      aiQualityScore: score,
      priorityScore: meta.priorityScore ? parseInt(meta.priorityScore, 10) : undefined,
      status: meta.status,
      body,
    })
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
  return loadAll().find((a) => a.canonicalPath === normalized)
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
  "/social-dining",
  "/faq",
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
    addPath(paths, article.alternatePath)
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

function cityName(citySlug: string, lang: "zh" | "en") {
  const city = cities.find((item) => item.slug === citySlug)
  if (!city) return titleCase(citySlug)
  return lang === "en" ? city.nameEn : city.name
}

function topicName(topicSlug: string, lang: "zh" | "en") {
  const category = categories.find((item) => item.slug === topicSlug)
  if (category) return lang === "en" ? category.nameEn : category.name
  return titleCase(topicSlug)
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

function isPathLang(path: string, lang: "zh" | "en") {
  const normalized = pathWithoutHash(path)
  return lang === "en" ? normalized.startsWith("/en/") : !normalized.startsWith("/en/")
}

function labelForArticlePath(path: string, lang: "zh" | "en") {
  const citySlug = citySlugFromPath(path)
  const topicSlug = topicSlugFromPath(path)
  const city = cityName(citySlug, lang)
  const topic = topicName(topicSlug, lang)
  return lang === "en" ? `${city} ${topic}` : `${city}${topic}`
}

function defaultSafeLinks(lang: "zh" | "en"): SafeLink[] {
  return lang === "en"
    ? [
        { label: "All cities", href: "/en/cities" },
        { label: "All categories", href: "/en/categories" },
        { label: "What is Fanju", href: "/en/what-is-fanju" },
        { label: "Social dining", href: "/social-dining" },
        { label: "FAQ", href: "/faq" },
      ]
    : [
        { label: "全部城市", href: "/cities" },
        { label: "全部类型", href: "/categories" },
        { label: "饭局是什么", href: "/what-is-fanju" },
        { label: "饭局社交", href: "/social-dining" },
        { label: "常见问题", href: "/faq" },
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
  const prefix = lang === "en" ? `/en/city/${citySlug}/` : `/city/${citySlug}/`
  const current = pathWithoutHash(currentPath)
  const seen = new Set<string>()
  const links: SafeLink[] = []

  for (const article of loadAll()) {
    const path = pathWithoutHash(article.canonicalPath)
    if (!isPathLang(path, lang) || !path.startsWith(prefix) || !isCityTopicPath(path) || path === current) continue
    addSafeLink(links, seen, labelForArticlePath(path, lang), path, current)
    if (links.length >= limit) break
  }

  return links
}

export function safeLinksForArticle(currentPath: string, article: SeoReadyArticle): SafeLink[] {
  const normalized = pathWithoutHash(currentPath || article.canonicalPath)
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
    add(getAlternatePath(a.canonicalPath))
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
    // Also add the derived alternatePath if it's not an /en/ path (it won't be, but guard anyway)
    const alt = getAlternatePath(a.canonicalPath)
    if (!alt.startsWith("/en/") && !isCityCategoryPath(alt)) add(alt)
  }

  // Also include fallback paths for /en/ articles (their zh counterpart)
  for (const a of loadAll()) {
    if (!a.canonicalPath.startsWith("/en/") || isEnCityCategoryPath(a.canonicalPath)) continue
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
