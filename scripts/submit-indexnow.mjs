/**
 * Submit Fanju URLs to IndexNow.
 *
 * Optional:
 *   INDEXNOW_KEY="..."
 *
 * Optional:
 *   INDEXNOW_HOST="fanju.app"
 *   INDEXNOW_KEY_LOCATION="https://fanju.app/<key>.txt"
 *   INDEXNOW_MAX_URLS=100
 */

import { existsSync, readFileSync } from "fs"

const SITE_ROOT = (process.env.SITE_URL?.trim() || "https://fanju.app").replace(/\/$/, "")
const SITE = `${SITE_ROOT}/`
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"
const INDEXNOW_KEY = process.env.INDEXNOW_KEY?.trim()
const INDEXNOW_HOST = process.env.INDEXNOW_HOST?.trim() || new URL(SITE_ROOT).hostname
const INDEXNOW_KEY_LOCATION =
  process.env.INDEXNOW_KEY_LOCATION?.trim() ||
  (INDEXNOW_KEY ? `${SITE_ROOT}/${INDEXNOW_KEY}.txt` : "")
const INDEXNOW_MAX_URLS = Number.parseInt(process.env.INDEXNOW_MAX_URLS ?? "100", 10)
const DRY_RUN = process.env.DRY_RUN === "1"

const INITIAL_SITEMAPS = [
  "https://fanju.app/sitemap-index.xml",
  "https://fanju.app/sitemap.xml",
  "https://fanju.app/product-sitemap.xml",
]

const PRIORITY_URLS = [
  "https://fanju.app/",
  "https://fanju.app/what-is-fanju",
  "https://fanju.app/faq",
  "https://fanju.app/press",
  "https://fanju.app/social-dining",
  "https://fanju.app/china-social-dining",
  "https://fanju.app/hong-kong-social-dining",
  "https://fanju.app/taiwan-social-dining",
  "https://fanju.app/macau-social-dining",
  "https://fanju.app/singapore-social-dining",
  "https://fanju.app/southeast-asia-social-dining",
  "https://fanju.app/fanju-vs-meetup",
  "https://fanju.app/fanju-vs-tinder",
  "https://fanju.app/fanju-vs-xiaohongshu",
  "https://fanju.app/cities",
  "https://fanju.app/categories",
  "https://fanju.app/llms.txt",
  "https://fanju.app/ai.txt",
  "https://fanju.app/humans.txt",
]

if (!INDEXNOW_KEY && !DRY_RUN) {
  console.log("SKIP: INDEXNOW_KEY is not configured.")
  process.exit(0)
}

if (!Number.isFinite(INDEXNOW_MAX_URLS) || INDEXNOW_MAX_URLS <= 0 || INDEXNOW_MAX_URLS > 10000) {
  console.error("INDEXNOW_MAX_URLS must be between 1 and 10000.")
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
    headers: { "User-Agent": "fanju-indexnow-submit/1.0" },
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

const urlList = orderedUrls.slice(0, INDEXNOW_MAX_URLS)
const payload = {
  host: INDEXNOW_HOST,
  key: INDEXNOW_KEY,
  keyLocation: INDEXNOW_KEY_LOCATION,
  urlList,
}

if (!INDEXNOW_KEY_LOCATION) {
  delete payload.keyLocation
}

console.log(`Collected ${orderedUrls.length} Fanju URLs.`)
console.log(`${DRY_RUN ? "Would submit" : "Submitting"} ${urlList.length} URLs to IndexNow.`)
console.log("First submitted URLs:")
for (const url of urlList.slice(0, 10)) {
  console.log(`- ${url}`)
}

if (DRY_RUN) {
  console.log("DRY_RUN: IndexNow")
  console.log("title: Fanju IndexNow URL submission")
  console.log(`canonicalUrl: ${SITE_ROOT}/sitemap-index.xml`)
  console.log(`urlCount: ${urlList.length}`)
  console.log(
    `payloadSummary: ${JSON.stringify({
      endpoint: INDEXNOW_ENDPOINT,
      host: payload.host,
      hasKey: Boolean(payload.key),
      hasKeyLocation: Boolean(payload.keyLocation),
      firstUrl: urlList[0],
      lastUrl: urlList.at(-1),
    })}`,
  )
  process.exit(0)
}

const res = await fetch(INDEXNOW_ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
})

const text = await res.text()
console.log(`IndexNow response: ${res.status} ${res.statusText}`)
if (text) {
  console.log(text)
}

if (!res.ok) {
  process.exit(1)
}
