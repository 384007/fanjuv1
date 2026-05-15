import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"

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

function normalizePath(p: string): string {
  if (!p) return ""
  const normalized = p.startsWith("/") ? p : `/${p}`
  return normalized.endsWith("/") && normalized.length > 1 ? normalized.slice(0, -1) : normalized
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
