// scripts/seo/check-indexability.mjs
//
// Checks live URLs for redirect issues, canonical mismatches, and hreflang
// problems that cause Google Search Console indexability errors.
//
// Environment:
//   URLS      comma-separated paths (e.g. /city/a,/en/city/b)
//   BASE_URL  default origin. Default: https://fanju.app

const BASE_URL = (process.env.BASE_URL || "https://fanju.app").replace(/\/$/, "")
const URLS = (process.env.URLS || "").split(",").map((s) => s.trim()).filter(Boolean)

if (!URLS.length) {
  console.error("Missing URLS. Example: URLS=/city/a,/en/city/b pnpm seo:indexability:check")
  process.exit(1)
}

function buildUrl(raw) {
  if (/^https?:\/\//i.test(raw)) return raw
  return `${BASE_URL}${raw.startsWith("/") ? raw : `/${raw}`}`
}

function normalize(url) {
  return url.replace(/\/$/, "")
}

function decodeEntities(v = "") {
  return v.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'")
}

function parseCanonical(html) {
  const m = html.match(/<link\b(?=[^>]*\brel=["'][^"']*\bcanonical\b[^"']*["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i)
  return m ? decodeEntities(m[1]) : ""
}

function parseHreflang(html) {
  const out = {}
  const re = /<link\b(?=[^>]*\brel=["'][^"']*\balternate\b[^"']*["'])(?=[^>]*\bhreflang=["']([^"']+)["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/gi
  for (const m of html.matchAll(re)) out[m[1].toLowerCase()] = decodeEntities(m[2])
  return out
}

function collectInternalLinks(html, origin) {
  const links = new Set()
  const re = /<a\b[^>]*\bhref=["']([^"'#]+)/gi
  for (const m of html.matchAll(re)) {
    const href = decodeEntities(m[1])
    if (href.startsWith("/")) links.add(`${origin}${href}`)
    else if (href.startsWith(origin)) links.add(href)
  }
  return [...links].slice(0, 20)
}

async function fetchNoRedirect(url) {
  const res = await fetch(url, {
    redirect: "manual",
    headers: { "user-agent": "fanju-indexability-check/1.0", "cache-control": "no-cache" },
  })
  return res
}

async function checkUrl(raw) {
  const url = buildUrl(raw)
  const issues = []

  // Main page — detect redirects
  const res = await fetchNoRedirect(url)
  if (res.status >= 300 && res.status < 400) {
    issues.push({ code: "redirected-url", detail: `${res.status} → ${res.headers.get("location")}` })
    return { url, status: res.status, issues }
  }
  if (res.status !== 200) {
    issues.push({ code: `http-${res.status}`, detail: "" })
    return { url, status: res.status, issues }
  }

  const html = await res.text()
  const canonical = parseCanonical(html)
  const hreflang = parseHreflang(html)
  const normalizedUrl = normalize(url)

  // Canonical checks
  if (!canonical) {
    issues.push({ code: "missing-canonical", detail: "" })
  } else if (normalize(canonical) !== normalizedUrl) {
    issues.push({ code: "canonical-mismatch", detail: `expected ${normalizedUrl}, got ${canonical}` })
  }

  // Hreflang checks
  const zhHref = hreflang["zh-cn"] || hreflang.zh || ""
  const enHref = hreflang.en || ""
  const hasZh = !url.includes("/en/")
  const hasEn = url.includes("/en/") || enHref

  if (!zhHref && !enHref) {
    issues.push({ code: "missing-hreflang", detail: "no zh-CN or en alternates" })
  } else {
    if (!zhHref) issues.push({ code: "missing-hreflang", detail: "missing zh-CN" })
    if (!enHref && hasZh) issues.push({ code: "missing-hreflang", detail: "missing en" })
  }

  // Hreflang must be absolute
  for (const [lang, href] of Object.entries(hreflang)) {
    if (href && !/^https?:\/\//i.test(href)) {
      issues.push({ code: "hreflang-not-absolute", detail: `${lang}=${href}` })
    }
  }

  // Internal link redirect checks (sample up to 20)
  const internalLinks = collectInternalLinks(html, BASE_URL)
  for (const link of internalLinks) {
    try {
      const linkRes = await fetchNoRedirect(link)
      if (linkRes.status >= 300 && linkRes.status < 400) {
        issues.push({ code: "redirected-internal-link", detail: `${link} → ${linkRes.headers.get("location")}` })
      }
    } catch { /* network errors on internal links are not indexability issues */ }
  }

  return { url, status: res.status, canonical, hreflang, issues }
}

const results = []
for (const u of URLS) {
  try {
    results.push(await checkUrl(u))
  } catch (err) {
    results.push({ url: buildUrl(u), status: 0, issues: [{ code: "fetch-error", detail: String(err.message).slice(0, 160) }] })
  }
}

for (const r of results) console.log(JSON.stringify(r))
const failures = results.filter((r) => r.issues.length)
console.log(`\nChecked ${results.length} URL(s), ${failures.length} with issues.`)
if (failures.length) process.exit(1)
