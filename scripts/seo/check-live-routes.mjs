// scripts/seo/check-live-routes.mjs
//
// Crawl the public route set against a deployed host and fail on:
//   - HTTP 4xx/5xx
//   - tiny HTML pages that look like parked/error shells
//   - known spam/parked-domain phrases such as "本站联系QQ"
//
// Environment:
//   BASE_URL       deployed origin to check. Default: https://fanju.app
//   ROUNDS         number of complete passes. Default: 1
//   CONCURRENCY    parallel requests. Default: 12
//   TIMEOUT_MS     per-request timeout. Default: 20000
//   URL_LIMIT      optional cap for quick debugging
//   INCLUDE_MANIFEST  also check every generation-opportunity route. Default: 0
//   EXTRA_PATHS       comma-separated paths to add to the crawl
//   OUTPUT_FILE       JSON report path. Default: /private/tmp/fanju-live-route-check.json

import { existsSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const SITEMAP_FILE = join(ROOT, "public/sitemap.xml")
const MANIFEST_FILE = join(ROOT, "data/seo/route-manifest.json")

const BASE_URL = (process.env.BASE_URL || "https://fanju.app").replace(/\/$/, "")
const ROUNDS = Math.max(1, Number.parseInt(process.env.ROUNDS || "1", 10))
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.CONCURRENCY || "12", 10))
const TIMEOUT_MS = Math.max(1000, Number.parseInt(process.env.TIMEOUT_MS || "20000", 10))
const URL_LIMIT = Math.max(0, Number.parseInt(process.env.URL_LIMIT || "0", 10))
const OUTPUT_FILE = process.env.OUTPUT_FILE || "/private/tmp/fanju-live-route-check.json"
const INCLUDE_MANIFEST = process.env.INCLUDE_MANIFEST === "1"
const EXTRA_PATHS = (process.env.EXTRA_PATHS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

const BAD_PUBLIC_PATTERNS = [
  /本站联系QQ/i,
  /联系QQ/i,
  /本地联系/i,
  /站长/i,
  /广告合作/i,
  /域名出售/i,
  /domain\s+for\s+sale/i,
  /buy\s+this\s+domain/i,
  /parked\s+domain/i,
  /\bIntro paragraph mentioning\b/i,
  /\bReturn valid JSON\b/i,
  /\bBody requirements\b/i,
  /\bmarkdown skeleton\b/i,
  /"body"\s*:/i,
  /"description"\s*:/i,
  /开头段落/,
  /正文要求/,
  /只返回合法 JSON/,
]

function extractSitemapPaths() {
  if (!existsSync(SITEMAP_FILE)) return []
  const xml = readFileSync(SITEMAP_FILE, "utf8")
  const paths = []
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const url = new URL(match[1])
      paths.push(`${url.pathname}${url.search}`)
    } catch {
      // ignore malformed sitemap entries; route coverage scripts catch those
    }
  }
  return paths
}

function extractManifestPaths() {
  if (!existsSync(MANIFEST_FILE)) return []
  const parsed = JSON.parse(readFileSync(MANIFEST_FILE, "utf8"))
  if (!Array.isArray(parsed.entries)) return []
  return parsed.entries
    .filter((entry) => entry && entry.enabled !== false && typeof entry.route === "string")
    .map((entry) => entry.route)
}

function uniquePaths(paths) {
  const out = []
  const seen = new Set()
  for (const raw of paths) {
    if (!raw) continue
    const path = raw.startsWith("/") ? raw : `/${raw}`
    if (seen.has(path)) continue
    seen.add(path)
    out.push(path)
  }
  return out.sort((a, b) => a.localeCompare(b))
}

function buildUrl(path) {
  return `${BASE_URL}${path}`
}

function badPhraseHits(text) {
  const hits = []
  for (const pattern of BAD_PUBLIC_PATTERNS) {
    if (pattern.test(text)) hits.push(String(pattern))
  }
  return hits
}

function publicHtmlForBadPhraseScan(html) {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
}

async function checkOne(path, round) {
  const url = buildUrl(path)
  const started = Date.now()
  const result = {
    round,
    path,
    url,
    status: 0,
    ok: false,
    bytes: 0,
    elapsedMs: 0,
    contentType: "",
    effectiveUrl: url,
    issues: [],
  }

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "user-agent": "fanju-live-route-check/1.0",
        "cache-control": "no-cache",
        pragma: "no-cache",
      },
    })
    result.status = response.status
    result.effectiveUrl = response.url
    result.contentType = response.headers.get("content-type") || ""

    const text = await response.text()
    result.bytes = Buffer.byteLength(text)

    if (response.status >= 400) result.issues.push(`http-${response.status}`)

    const isHtml = result.contentType.includes("text/html") || /^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text)
    if (response.status === 200 && isHtml && result.bytes < 1500) {
      result.issues.push(`tiny-html:${result.bytes}`)
    }

    const hits = badPhraseHits(publicHtmlForBadPhraseScan(text))
    if (hits.length) result.issues.push(`bad-public-phrase:${hits.join(",")}`)
  } catch (err) {
    result.issues.push(`fetch-error:${err.name || "Error"}:${String(err.message || err).slice(0, 160)}`)
  }

  result.elapsedMs = Date.now() - started
  result.ok = result.issues.length === 0
  return result
}

async function runPool(items, worker) {
  const out = new Array(items.length)
  let cursor = 0

  async function runWorker() {
    while (cursor < items.length) {
      const index = cursor++
      out[index] = await worker(items[index], index)
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, () => runWorker())
  await Promise.all(workers)
  return out
}

async function main() {
  const manifestPaths = INCLUDE_MANIFEST ? extractManifestPaths() : []
  const allPaths = uniquePaths(["/", ...extractSitemapPaths(), ...manifestPaths, ...EXTRA_PATHS])
  const paths = URL_LIMIT > 0 ? allPaths.slice(0, URL_LIMIT) : allPaths

  if (paths.length === 0) {
    console.error("No routes found in sitemap or route manifest.")
    process.exit(1)
  }

  console.log(`Live route check: ${BASE_URL}`)
  console.log(`Routes: ${paths.length}`)
  console.log(`Rounds: ${ROUNDS}`)
  console.log(`Concurrency: ${CONCURRENCY}`)
  console.log(`Timeout: ${TIMEOUT_MS}ms`)
  console.log(`Include manifest: ${INCLUDE_MANIFEST ? "yes" : "no"}`)

  const report = {
    baseUrl: BASE_URL,
    rounds: ROUNDS,
    routeCount: paths.length,
    checkedAt: new Date().toISOString(),
    failures: [],
    roundsSummary: [],
  }

  for (let round = 1; round <= ROUNDS; round++) {
    const results = await runPool(paths, (path) => checkOne(path, round))
    const failures = results.filter((r) => !r.ok)
    report.failures.push(...failures)
    report.roundsSummary.push({
      round,
      checked: results.length,
      failed: failures.length,
      statusCounts: results.reduce((acc, r) => {
        const key = String(r.status || "error")
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {}),
    })

    console.log(`Round ${round}/${ROUNDS}: checked ${results.length}, failures ${failures.length}`)
    for (const failure of failures.slice(0, 30)) {
      console.log(`  FAIL ${failure.status || "ERR"} ${failure.path} ${failure.issues.join("; ")}`)
    }
    if (failures.length > 30) console.log(`  ...and ${failures.length - 30} more`)
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2) + "\n", "utf8")
  console.log(`Report: ${OUTPUT_FILE}`)

  if (report.failures.length) {
    console.error(`Live route check failed: ${report.failures.length} total failures.`)
    process.exit(1)
  }

  console.log("OK")
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
