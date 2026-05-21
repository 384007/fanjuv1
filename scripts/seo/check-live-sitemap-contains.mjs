// Verify that live sitemap files contain expected article paths.
//
// Environment:
//   URLS      comma-separated absolute URLs or paths
//   BASE_URL  default https://fanju.app

const BASE_URL = (process.env.BASE_URL || "https://fanju.app").replace(/\/$/, "")
const URLS = (process.env.URLS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)

function normalizePath(raw = "") {
  if (!raw) return ""
  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw)
      return url.pathname.replace(/\/$/, "") || "/"
    } catch {
      return ""
    }
  }
  const path = raw.startsWith("/") ? raw : `/${raw}`
  return path.replace(/\/$/, "") || "/"
}

async function fetchText(url) {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
    headers: {
      "cache-control": "no-cache",
      pragma: "no-cache",
      "user-agent": "fanju-live-sitemap-check/1.0",
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${url}: ${text.slice(0, 200)}`)
  return text
}

function locs(xml = "") {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).filter(Boolean)
}

async function collectSitemapPaths() {
  const sitemapUrl = `${BASE_URL}/sitemap.xml`
  const sitemapXml = await fetchText(sitemapUrl)
  const paths = new Set(locs(sitemapXml).map(normalizePath).filter(Boolean))

  try {
    const indexXml = await fetchText(`${BASE_URL}/sitemap-index.xml`)
    const sitemapLocs = locs(indexXml).filter((loc) => /sitemap/i.test(loc))
    for (const loc of sitemapLocs) {
      if (loc.replace(/\/$/, "") === sitemapUrl) continue
      try {
        const xml = await fetchText(loc)
        for (const path of locs(xml).map(normalizePath).filter(Boolean)) paths.add(path)
      } catch (err) {
        console.warn(`Could not fetch nested sitemap ${loc}: ${err.message}`)
      }
    }
  } catch (err) {
    console.warn(`Could not fetch sitemap-index.xml: ${err.message}`)
  }

  return paths
}

if (!URLS.length) {
  console.error("Missing URLS. Example: URLS=/city/a,/en/city/b node scripts/seo/check-live-sitemap-contains.mjs")
  process.exit(1)
}

const expected = URLS.map(normalizePath).filter(Boolean)
const sitemapPaths = await collectSitemapPaths()
const missing = expected.filter((path) => !sitemapPaths.has(path))
const result = {
  baseUrl: BASE_URL,
  expected,
  sitemapPathCount: sitemapPaths.size,
  missing,
}

console.log(JSON.stringify(result, null, 2))
if (missing.length) process.exit(1)
