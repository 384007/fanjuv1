import { existsSync, readdirSync, readFileSync } from "fs"
import { dirname, isAbsolute, join, resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
export const DEFAULT_ROOT = join(__dirname, "../..")
export const ARTICLE_BRIEF_VERSION = "deterministic-brief-v1"

export function pathFromRoot(root, value) {
  if (!value) return root
  return isAbsolute(value) ? value : join(root, value)
}

export function historyRootFromEnv(env = process.env) {
  return env.SEO_HISTORY_ROOT ? resolve(env.SEO_HISTORY_ROOT) : DEFAULT_ROOT
}

export function parseFrontmatter(raw) {
  const match = String(raw || "").match(/^---\r?\n([\s\S]*?)\r?\n---/)
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

export function normalizeCanonicalPath(value = "") {
  if (!value) return ""
  let path = String(value).trim()
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname
    } catch {
      return ""
    }
  }
  path = path.startsWith("/") ? path : `/${path}`
  return path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path
}

function routePartsFromPath(value = "") {
  const path = normalizeCanonicalPath(value)
  const match = path.match(/^\/(?:(en)\/)?city\/([^/]+)(?:\/([^/]+))?$/)
  if (!match) return null
  return {
    locale: match[1] === "en" ? "en" : "zh",
    citySlug: match[2],
    topicSlug: match[3] || "city-overview",
  }
}

export function routeKeyFor(value = {}) {
  const fromPath = routePartsFromPath(value.route || value.canonicalPath || value.path || "")
  const locale = String(value.locale || value.lang || fromPath?.locale || "").trim()
  const citySlug = String(value.citySlug || value.city_slug || fromPath?.citySlug || "").trim()
  const topicSlug = String(value.topicSlug || value.topic_slug || fromPath?.topicSlug || "").trim()
  if (!locale || !citySlug || !topicSlug) return ""
  return `${locale}:${citySlug}:${topicSlug}`
}

export function localeCityTypeKeyFor(value = {}) {
  return routeKeyFor(value)
}

function createHistoryState() {
  return {
    routeKeys: new Set(),
    canonicalPaths: new Set(),
    promptHashes: new Set(),
    profileHashes: new Set(),
    localeCityTypeKeys: new Set(),
    d1CanonicalPaths: new Set(),
    markdownCanonicalPaths: new Set(),
    pathSources: new Map(),
    routeKeySources: new Map(),
    promptHashSources: new Map(),
    profileHashSources: new Map(),
    localeCityTypeSources: new Map(),
    stats: {
      markdownRecords: 0,
      publishedStateRecords: 0,
      d1Records: 0,
      totalCanonical: 0,
      routeManifestDraft: 0,
      alreadyPublishedRoutes: 0,
      historicalPromptHashes: 0,
      historicalProfileHashes: 0,
    },
  }
}

function addMapSource(map, key, source) {
  if (!key) return
  if (!map.has(key)) map.set(key, new Set())
  map.get(key).add(source)
}

function addHistoryRecord(history, record, source) {
  const canonicalPath = normalizeCanonicalPath(record.canonicalPath || record.canonical_path || record.route || record.path || "")
  const routeKey = String(record.routeKey || record.route_key || routeKeyFor({ ...record, canonicalPath })).trim()
  const comboKey = String(record.localeCityTypeKey || localeCityTypeKeyFor({ ...record, canonicalPath })).trim()
  const promptHash = String(record.promptHash || record.prompt_hash || "").trim()
  const profileHash = String(record.profileHash || record.profile_hash || "").trim()

  if (canonicalPath) {
    history.canonicalPaths.add(canonicalPath)
    addMapSource(history.pathSources, canonicalPath, source)
    if (source === "d1") history.d1CanonicalPaths.add(canonicalPath)
    if (source === "markdown" || source === "route_manifest_v2") history.markdownCanonicalPaths.add(canonicalPath)
  }
  if (routeKey) {
    history.routeKeys.add(routeKey)
    addMapSource(history.routeKeySources, routeKey, source)
  }
  if (comboKey) {
    history.localeCityTypeKeys.add(comboKey)
    addMapSource(history.localeCityTypeSources, comboKey, source)
  }
  if (promptHash) {
    history.promptHashes.add(promptHash)
    addMapSource(history.promptHashSources, promptHash, source)
  }
  if (profileHash) {
    history.profileHashes.add(profileHash)
    addMapSource(history.profileHashSources, profileHash, source)
  }
}

function walkJsonFiles(dir) {
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name)
    if (name.isDirectory()) out.push(...walkJsonFiles(full))
    else if (name.isFile() && /published.*\.json$/i.test(name.name)) out.push(full)
  }
  return out
}

function loadMarkdownHistory(history, root, minScore) {
  const readyDir = pathFromRoot(root, "content/seo-ready")
  if (!existsSync(readyDir)) return
  for (const file of readdirSync(readyDir).filter((name) => name.endsWith(".md"))) {
    try {
      const meta = parseFrontmatter(readFileSync(join(readyDir, file), "utf8"))
      const score = Number.parseInt(meta.aiQualityScore || "0", 10)
      if (meta.status !== "ready" || score < minScore) continue
      addHistoryRecord(history, {
        ...meta,
        canonicalPath: meta.canonicalPath || `/${meta.slug || file.replace(/\.md$/, "")}`,
        locale: meta.lang,
      }, "markdown")
      history.stats.markdownRecords++
    } catch {
      // Route validation handles malformed content; history loading stays tolerant.
    }
  }
}

function loadPublishedStateHistory(history, root, minScore) {
  const distDir = pathFromRoot(root, "dist/seo")
  for (const file of walkJsonFiles(distDir)) {
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8"))
      const entries = Array.isArray(parsed?.drafts) ? parsed.drafts : Array.isArray(parsed) ? parsed : []
      for (const entry of entries) {
        const score = Number.parseInt(entry.score || entry.aiQualityScore || "0", 10)
        if (entry.status !== "ready" || (score && score < minScore)) continue
        addHistoryRecord(history, entry, "published_state")
        history.stats.publishedStateRecords++
      }
    } catch {
      // Ignore unrelated or partial state files.
    }
  }
}

function loadRouteManifestV2History(history, root) {
  const manifestFile = pathFromRoot(root, "dist/seo/route-manifest-v2.json")
  if (!existsSync(manifestFile)) return
  try {
    const manifest = JSON.parse(readFileSync(manifestFile, "utf8"))
    const canonical = Array.isArray(manifest.canonical) ? manifest.canonical : []
    const draft = Array.isArray(manifest.draft) ? manifest.draft : []
    history.stats.totalCanonical = canonical.length
    history.stats.routeManifestDraft = draft.length
    for (const entry of canonical) {
      addHistoryRecord(history, {
        canonicalPath: entry.path,
        locale: entry.lang,
      }, "route_manifest_v2")
    }
  } catch {
    // The builder/checker can continue without this optional history source.
  }
}

function cleanEnv(value = "") {
  return String(value || "").trim()
}

function cleanToken(value = "") {
  return cleanEnv(value).replace(/^Bearer\s+/i, "")
}

function loadD1HistoryFile(history, root, env, minScore) {
  const file = env.SEO_HISTORY_D1_FILE ? pathFromRoot(root, env.SEO_HISTORY_D1_FILE) : ""
  if (!file || !existsSync(file)) return false
  const parsed = JSON.parse(readFileSync(file, "utf8"))
  const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.rows) ? parsed.rows : Array.isArray(parsed?.results) ? parsed.results : []
  for (const row of rows) {
    const score = Number.parseInt(row.score || row.quality_score || row.aiQualityScore || "0", 10)
    if (row.status && row.status !== "ready") continue
    if (score && score < minScore) continue
    addHistoryRecord(history, {
      canonicalPath: row.canonicalPath || row.canonical_path || row.route || row.path,
      routeKey: row.routeKey || row.route_key,
      promptHash: row.promptHash || row.prompt_hash,
      profileHash: row.profileHash || row.profile_hash,
      locale: row.locale || row.lang,
      citySlug: row.citySlug || row.city_slug,
      topicSlug: row.topicSlug || row.topic_slug,
    }, "d1")
    history.stats.d1Records++
  }
  return true
}

async function loadCloudflareD1History(history, env, minScore) {
  if (env.SEO_HISTORY_D1_ENABLED === "0") return
  const accountId = cleanEnv(env.CLOUDFLARE_ACCOUNT_ID)
  const token = cleanToken(env.CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_AUTH_TOKEN)
  const databaseId = cleanEnv(env.CLOUDFLARE_D1_DATABASE_ID || "58d63133-adeb-4efd-b9eb-a9b056271ca5")
  if (!accountId || !token || !databaseId) return

  const sql = [
    "SELECT canonical_path, prompt_hash, profile_hash, lang, city_slug, topic_slug, status, quality_score",
    "FROM articles WHERE status = 'ready'",
  ].join(" ")
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params: [] }),
  })
  const json = await res.json()
  if (!res.ok || json?.success === false) {
    throw new Error(`D1 history query failed: ${res.status} ${JSON.stringify(json?.errors || json).slice(0, 500)}`)
  }
  const rows = (json.result || []).flatMap((part) => part.results || [])
  for (const row of rows) {
    const score = Number.parseInt(row.quality_score || "0", 10)
    if (score && score < minScore) continue
    addHistoryRecord(history, row, "d1")
    history.stats.d1Records++
  }
}

export async function loadPromptBankHistory(options = {}) {
  const env = options.env || process.env
  const root = options.root || historyRootFromEnv(env)
  const minScore = Number.parseInt(String(options.minScore ?? env.MIN_SCORE ?? "90"), 10)
  const history = createHistoryState()

  loadMarkdownHistory(history, root, minScore)
  loadPublishedStateHistory(history, root, minScore)
  loadRouteManifestV2History(history, root)

  try {
    const loadedFile = loadD1HistoryFile(history, root, env, minScore)
    if (!loadedFile) await loadCloudflareD1History(history, env, minScore)
  } catch (err) {
    if (env.STRICT_HISTORY_D1 === "1") throw err
    console.warn(`D1 history unavailable: ${err.message}`)
  }

  history.stats.alreadyPublishedRoutes = history.canonicalPaths.size
  history.stats.historicalPromptHashes = history.promptHashes.size
  history.stats.historicalProfileHashes = history.profileHashes.size
  return history
}

function sourcesHaveD1(sources) {
  return sources && sources.has("d1")
}

function sourcesHavePublishedContent(sources) {
  return sources && (
    sources.has("markdown") ||
    sources.has("route_manifest_v2") ||
    sources.has("published_state")
  )
}

export function historicalSkipReason(value, history) {
  const canonicalPath = normalizeCanonicalPath(value.route || value.canonicalPath || value.path || "")
  const routeKey = String(value.routeKey || routeKeyFor(value)).trim()
  const comboKey = String(value.localeCityTypeKey || localeCityTypeKeyFor(value)).trim()
  const promptHash = String(value.promptHash || "").trim()
  const profileHash = String(value.profileHash || "").trim()

  const routeSources = new Set()
  for (const sources of [
    canonicalPath ? history.pathSources.get(canonicalPath) : null,
    routeKey ? history.routeKeySources.get(routeKey) : null,
    comboKey ? history.localeCityTypeSources.get(comboKey) : null,
  ]) {
    if (!sources) continue
    for (const source of sources) routeSources.add(source)
  }

  if (sourcesHaveD1(routeSources)) return "already_in_d1"
  if (sourcesHavePublishedContent(routeSources)) return "already_in_markdown"
  if (promptHash && history.promptHashes.has(promptHash)) return "historical_prompt_hash"
  if (profileHash && history.profileHashes.has(profileHash)) return "historical_profile_hash"
  return ""
}

export function isHistoricallyPublishedRoute(value, history) {
  const reason = historicalSkipReason(value, history)
  return reason === "already_in_d1" || reason === "already_in_markdown"
}
