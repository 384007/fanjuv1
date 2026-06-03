const DEFAULT_INDEXNOW_KEY = "e425652261cb6c96a73b030ea9c77e4c"
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

const INDEXNOW_KEY = clean(process.env.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY)
const HOST = clean(process.env.HOST || process.env.INDEXNOW_HOST || "fanju.app").replace(/^https?:\/\//, "").replace(/\/$/, "")
const KEY_LOCATION =
  clean(process.env.KEY_LOCATION || process.env.INDEXNOW_KEY_LOCATION) || `https://${HOST}/${INDEXNOW_KEY}.txt`
const SITEMAP_URL = clean(process.env.SITEMAP_URL) || `https://${HOST}/sitemap-index.xml`
const MAX_URLS = Number.parseInt(process.env.MAX_URLS || process.env.INDEXNOW_MAX_URLS || "10000", 10)
const DRY_RUN = process.env.DRY_RUN === "1"

if (!INDEXNOW_KEY) {
  console.error("Missing INDEXNOW_KEY")
  process.exit(1)
}

if (!Number.isFinite(MAX_URLS) || MAX_URLS <= 0 || MAX_URLS > 10000) {
  console.error("MAX_URLS must be between 1 and 10000")
  process.exit(1)
}

function clean(value = "") {
  return String(value || "").trim()
}

function extractLocUrls(xml = "") {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1].trim())
}

async function fetchSitemapXml(sitemapUrl) {
  if (DRY_RUN) {
    try {
      const url = new URL(sitemapUrl)
      const localPath = `../../public${url.pathname}`
      const { existsSync, readFileSync } = await import("fs")
      const localUrl = new URL(localPath, import.meta.url)
      if (existsSync(localUrl)) return readFileSync(localUrl, "utf8")
    } catch {
      // Fall through to network fetch for non-standard dry-run URLs.
    }
  }

  const res = await fetch(sitemapUrl, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": "fanju-indexnow-sitemap-push/1.0" },
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${sitemapUrl}: ${res.status}`)
  }

  return res.text()
}

function isSitemapIndex(xml) {
  return /<sitemapindex[\s>]/i.test(xml)
}

async function collectUrls(sitemapUrl, seen = new Set()) {
  if (seen.has(sitemapUrl)) return []
  seen.add(sitemapUrl)
  const xml = await fetchSitemapXml(sitemapUrl)
  const locs = extractLocUrls(xml)
  if (isSitemapIndex(xml)) {
    const nested = await Promise.all(locs.map((loc) => collectUrls(loc, seen)))
    return nested.flat()
  }
  return locs
}

const allUrls = await collectUrls(SITEMAP_URL)
const urls = allUrls
  .filter((url) => url.startsWith(`https://${HOST}/`))
  .filter((url, i, arr) => arr.indexOf(url) === i)
  .slice(0, MAX_URLS)

if (urls.length === 0) {
  console.error(`No URLs for https://${HOST}/ found in ${SITEMAP_URL}`)
  process.exit(1)
}

const payload = {
  host: HOST,
  key: INDEXNOW_KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls,
}

console.log(`Submitting ${urls.length} URLs to IndexNow`)
console.log(`Host: ${HOST}`)
console.log(`Key location: ${KEY_LOCATION}`)
console.log(`Sitemap: ${SITEMAP_URL}`)
console.log("First submitted URLs:")
for (const url of urls.slice(0, 10)) console.log(`- ${url}`)

if (DRY_RUN) {
  console.log("DRY_RUN=1: not submitting to IndexNow")
  process.exit(0)
}

const res = await fetch(INDEXNOW_ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
})

const body = await res.text()
console.log("Status:", res.status)
if (body) console.log(body)

if (!res.ok) process.exit(1)
