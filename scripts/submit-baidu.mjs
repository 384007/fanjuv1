/**
 * scripts/submit-baidu.mjs
 * Submit a small, prioritized Fanju URL batch to Baidu.
 *
 * Optional, choose one:
 *   BAIDU_API="https://data.zz.baidu.com/urls?site=...&token=..."
 *   BAIDU_TOKEN="..."
 *   BAIDU_PUSH_TOKEN="..."
 *
 * Optional:
 *   BAIDU_SITE="https://fanju.app"
 *   BAIDU_MAX_URLS=50
 */

import { existsSync, readFileSync } from "fs"

const SITE_ROOT = (process.env.SITE_URL?.trim() || "https://fanju.app").replace(/\/$/, "")
const SITE = `${SITE_ROOT}/`
const DEFAULT_MAX_URLS = 50
const BAIDU_MAX_URLS = Number.parseInt(process.env.BAIDU_MAX_URLS ?? `${DEFAULT_MAX_URLS}`, 10)
const BAIDU_SITE = process.env.BAIDU_SITE ?? SITE_ROOT
const BAIDU_PUSH_TOKEN = process.env.BAIDU_TOKEN ?? process.env.BAIDU_PUSH_TOKEN
const DRY_RUN = process.env.DRY_RUN === "1"

const INITIAL_SITEMAPS = [
  "https://fanju.app/sitemap-index.xml",
  "https://fanju.app/sitemap.xml",
  "https://fanju.app/product-sitemap.xml",
]

const PRIORITY_URLS = [
  "https://fanju.app/",
  "https://fanju.app/robots.txt",
  "https://fanju.app/sitemap-index.xml",
  "https://fanju.app/sitemap.xml",
  "https://fanju.app/product-sitemap.xml",
  "https://fanju.app/llms.txt",
  "https://fanju.app/ai.txt",
  "https://fanju.app/what-is-fanju",
  "https://fanju.app/en/what-is-fanju",
  "https://fanju.app/cities",
  "https://fanju.app/en/cities",
  "https://fanju.app/categories",
  "https://fanju.app/en/categories",
  "https://fanju.app/rules",
  "https://fanju.app/hosts",
  "https://fanju.app/guides/mainland-city-dinner-guide",
  "https://fanju.app/city/shenzhen",
  "https://fanju.app/city/guangzhou",
  "https://fanju.app/city/shanghai",
  "https://fanju.app/city/beijing",
  "https://fanju.app/city/hangzhou",
  "https://fanju.app/city/chengdu",
  "https://fanju.app/city/hong-kong",
  "https://fanju.app/city/taipei",
  "https://fanju.app/city/singapore",
  "https://fanju.app/city/tokyo",
  "https://fanju.app/category/singles-dinner",
  "https://fanju.app/category/business-dinner",
  "https://fanju.app/category/founder-dinner",
  "https://fanju.app/category/curated-dinner",
  "https://fanju.app/category/weekend-dinner",
  "https://fanju.app/category/stranger-dinner",
  "https://fanju.app/category/chinese-social-dining",
  "https://fanju.app/category/student-dinner",
  "https://fanju.app/category/newcomer-dinner",
]

const BAIDU_API =
  process.env.BAIDU_API ??
  (BAIDU_PUSH_TOKEN
    ? `https://data.zz.baidu.com/urls?site=${encodeURIComponent(BAIDU_SITE)}&token=${encodeURIComponent(BAIDU_PUSH_TOKEN)}`
    : undefined)

if (!BAIDU_API && !DRY_RUN) {
  console.log("SKIP: BAIDU_API, BAIDU_TOKEN, or BAIDU_PUSH_TOKEN is not configured.")
  process.exit(0)
}

if (!Number.isFinite(BAIDU_MAX_URLS) || BAIDU_MAX_URLS <= 0) {
  console.error("BAIDU_MAX_URLS must be a positive number.")
  process.exit(1)
}

function extractLocUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim())
}

function isSitemapIndex(xml) {
  return /<sitemapindex[\s>]/i.test(xml)
}

function isFanjuUrl(url) {
  return url.startsWith(SITE)
}

function normalizeUrl(url) {
  return url.trim().replace(/\/$/, "")
}

function addUrl(list, seen, url) {
  if (!url || !isFanjuUrl(url)) return

  const normalized = normalizeUrl(url)
  if (seen.has(normalized)) return

  seen.add(normalized)
  list.push(normalized)
}

async function fetchSitemap(sitemapUrl) {
  if (DRY_RUN) {
    const pathname = new URL(sitemapUrl).pathname
    const fileUrl = new URL(`../public${pathname}`, import.meta.url)
    if (!existsSync(fileUrl)) {
      throw new Error(`Local sitemap not found for dry-run: ${pathname}`)
    }

    return readFileSync(fileUrl, "utf8")
  }

  const res = await fetch(sitemapUrl, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": "fanju-baidu-submit/1.0" },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${sitemapUrl}: ${res.status}`)
  }

  return res.text()
}

const orderedUrls = []
const seenUrls = new Set()
const sitemapQueue = [...INITIAL_SITEMAPS]
const seenSitemaps = new Set()

for (const url of PRIORITY_URLS) {
  addUrl(orderedUrls, seenUrls, url)
}

while (sitemapQueue.length > 0) {
  const sitemapUrl = sitemapQueue.shift()

  if (!sitemapUrl || seenSitemaps.has(sitemapUrl)) {
    continue
  }

  seenSitemaps.add(sitemapUrl)

  let xml
  try {
    xml = await fetchSitemap(sitemapUrl)
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  const locUrls = extractLocUrls(xml)

  for (const loc of locUrls) {
    addUrl(orderedUrls, seenUrls, loc)
  }

  if (isSitemapIndex(xml)) {
    for (const loc of locUrls) {
      if (isFanjuUrl(loc) && !seenSitemaps.has(loc)) {
        sitemapQueue.push(loc)
      }
    }
  }
}

const submitUrls = orderedUrls.slice(0, BAIDU_MAX_URLS)
const skippedCount = Math.max(orderedUrls.length - submitUrls.length, 0)
const body = submitUrls.join("\n")

console.log(`Collected ${orderedUrls.length} Fanju URLs.`)
console.log(`${DRY_RUN ? "Would submit" : "Submitting"} ${submitUrls.length} prioritized URLs to Baidu. Skipped ${skippedCount} for quota control.`)
console.log(`BAIDU_MAX_URLS=${BAIDU_MAX_URLS}`)
console.log("First submitted URLs:")
for (const url of submitUrls.slice(0, 10)) {
  console.log(`- ${url}`)
}

if (DRY_RUN) {
  console.log("DRY_RUN: Baidu")
  console.log("title: Fanju Baidu URL submission")
  console.log(`canonicalUrl: ${SITE_ROOT}/sitemap-index.xml`)
  console.log(`urlCount: ${submitUrls.length}`)
  console.log(
    `payloadSummary: ${JSON.stringify({
      hasApi: Boolean(BAIDU_API),
      baiduSite: BAIDU_SITE,
      maxUrls: BAIDU_MAX_URLS,
      bodyLines: submitUrls.length,
      firstUrl: submitUrls[0],
      lastUrl: submitUrls.at(-1),
    })}`,
  )
  process.exit(0)
}

const res = await fetch(BAIDU_API, {
  method: "POST",
  headers: { "Content-Type": "text/plain" },
  body,
})

const text = await res.text()

let payload
try {
  payload = JSON.parse(text)
  console.log("Baidu response JSON:")
  console.log(JSON.stringify(payload, null, 2))
} catch {
  console.log(`Baidu response (${res.status}):`)
  console.log(text)
}

if (payload?.not_valid?.length > 0) {
  console.log("Baidu not_valid URLs:")
  console.log(JSON.stringify(payload.not_valid, null, 2))
}

if (payload?.not_same_site?.length > 0) {
  console.log("Baidu not_same_site URLs:")
  console.log(JSON.stringify(payload.not_same_site, null, 2))
}

if (payload?.error === 400 && /over quota/i.test(payload?.message ?? "")) {
  console.log("Baidu quota is exhausted for this period. Treating as a non-fatal submission result.")
  process.exit(0)
}

if (!res.ok) {
  process.exit(1)
}
