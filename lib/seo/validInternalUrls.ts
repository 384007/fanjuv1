import { existsSync, readdirSync, readFileSync, statSync } from "fs"
import { extname, join, relative } from "path"
import { categories, cities, guides } from "@/lib/seo-data"

const SITE = "https://fanju.app"

export type ValidInternalUrlEntry = {
  path: string
  source: string
}

export type ValidInternalUrlsResult = {
  urls: string[]
  entries: ValidInternalUrlEntry[]
  excluded: { path: string; reason: string }[]
}

function rootPath(...parts: string[]) {
  return join(process.cwd(), ...parts)
}

export function normalizeInternalUrl(value: string): string {
  if (!value) return ""
  let raw = String(value).trim()
  if (!raw || raw.includes("?")) return ""
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw)
      if (url.hostname !== "fanju.app") return ""
      raw = url.pathname
    } catch {
      return ""
    }
  }
  if (!raw.startsWith("/")) raw = `/${raw}`
  if (raw !== "/" && raw.endsWith("/")) raw = raw.slice(0, -1)
  if (raw.includes("//") || /\s/.test(raw)) return ""
  return raw
}

function readJson<T>(path: string): T | undefined {
  if (!existsSync(path)) return undefined
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T
  } catch {
    return undefined
  }
}

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const meta: Record<string, string> = {}
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

function* walk(dir: string): Generator<string> {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) yield* walk(full)
    else if (stat.isFile()) yield full
  }
}

function appRouteFromPageFile(file: string): string | undefined {
  if (!file.endsWith("page.tsx") && !file.endsWith("page.ts")) return undefined
  const rel = relative(rootPath("app"), file).replace(/\\/g, "/")
  const parts = rel.split("/").slice(0, -1)
  if (parts.some((part) => part.startsWith("[") || part.startsWith("("))) return undefined
  const route = `/${parts.join("/")}`
  return normalizeInternalUrl(route === "/" ? "/" : route)
}

function existingSeoDataRoutes() {
  const routes = new Set<string>()
  routes.add("/")
  routes.add("/cities")
  routes.add("/en/cities")
  routes.add("/categories")
  routes.add("/en/categories")
  for (const city of cities) {
    routes.add(`/city/${city.slug}`)
    routes.add(`/en/city/${city.slug}`)
    for (const category of categories) {
      routes.add(`/city/${city.slug}/${category.slug}`)
      routes.add(`/en/city/${city.slug}/${category.slug}`)
    }
  }
  for (const category of categories) {
    routes.add(`/category/${category.slug}`)
    routes.add(`/en/category/${category.slug}`)
  }
  for (const guide of guides) {
    routes.add(`/guides/${guide.slug}`)
    routes.add(`/en/guides/${guide.slug}`)
  }
  return routes
}

function collectNoindexAndBlocked() {
  const blocked = new Map<string, string>()

  for (const dir of [rootPath("content/articles/ready/noindex"), rootPath("content/articles/rejected")]) {
    for (const file of walk(dir)) {
      if (extname(file) !== ".json") continue
      const article = readJson<{ canonicalPath?: string; canonical?: string }>(file)
      const path = normalizeInternalUrl(article?.canonicalPath || article?.canonical || "")
      if (path) blocked.set(path, dir.includes("rejected") ? "rejected" : "noindex")
    }
  }

  const manifestV2 = readJson<{ redirect?: { path: string }[]; draft?: { path: string }[] }>(
    rootPath("dist/seo/route-manifest-v2.json"),
  )
  for (const entry of manifestV2?.redirect || []) {
    const path = normalizeInternalUrl(entry.path)
    if (path) blocked.set(path, "redirect")
  }
  for (const entry of manifestV2?.draft || []) {
    const path = normalizeInternalUrl(entry.path)
    if (path) blocked.set(path, "draft")
  }

  return blocked
}

export function buildValidInternalUrls(): ValidInternalUrlsResult {
  const entries = new Map<string, string>()
  const excluded: { path: string; reason: string }[] = []
  const blocked = collectNoindexAndBlocked()

  function add(path: string, source: string) {
    const normalized = normalizeInternalUrl(path)
    if (!normalized) return
    const blockedReason = blocked.get(normalized)
    if (blockedReason) {
      excluded.push({ path: normalized, reason: blockedReason })
      return
    }
    if (!entries.has(normalized)) entries.set(normalized, source)
  }

  for (const route of existingSeoDataRoutes()) add(route, "seo-data")

  for (const file of walk(rootPath("app"))) {
    const route = appRouteFromPageFile(file)
    if (route) add(route, "app-route")
  }

  const sitemap = rootPath("public/sitemap.xml")
  if (existsSync(sitemap)) {
    const xml = readFileSync(sitemap, "utf8")
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) add(match[1].replace(SITE, ""), "sitemap")
  }

  const manifest = readJson<{ entries?: { route?: string; enabled?: boolean }[] }>(rootPath("data/seo/route-manifest.json"))
  const knownSeoRoutes = existingSeoDataRoutes()
  for (const entry of manifest?.entries || []) {
    const route = normalizeInternalUrl(entry.route || "")
    if (entry.enabled && knownSeoRoutes.has(route)) add(route, "route-manifest")
  }

  for (const file of walk(rootPath("content/seo-ready"))) {
    if (extname(file) !== ".md") continue
    const raw = readFileSync(file, "utf8")
    const meta = parseFrontmatter(raw)
    const score = Number.parseInt(meta.aiQualityScore || "0", 10)
    const path = normalizeInternalUrl(meta.canonicalPath || "")
    if (meta.status === "ready" && score >= 90 && path) add(path, "seo-ready")
    else if (path) excluded.push({ path, reason: "draft" })
  }

  for (const file of walk(rootPath("content/articles/ready/index"))) {
    if (extname(file) !== ".json") continue
    const article = readJson<{ canonicalPath?: string; status?: string; robots?: string; sitemapEligible?: boolean }>(file)
    const path = normalizeInternalUrl(article?.canonicalPath || "")
    if (article?.status === "publish" && article.robots === "index,follow" && article.sitemapEligible !== false && path) {
      add(path, "generated-index-article")
    } else if (path) {
      excluded.push({ path, reason: "not-indexable" })
    }
  }

  const ordered = [...entries.entries()]
    .map(([path, source]) => ({ path, source }))
    .sort((a, b) => a.path.localeCompare(b.path))

  return {
    urls: ordered.map((entry) => entry.path),
    entries: ordered,
    excluded,
  }
}

export function getValidInternalUrlSet() {
  return new Set(buildValidInternalUrls().urls)
}
