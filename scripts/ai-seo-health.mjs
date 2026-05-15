/**
 * scripts/ai-seo-health.mjs
 * Basic AI SEO health checks for deployed Fanju pages.
 * Does not call any paid AI API.
 */

const URLS = [
  "https://fanju.app/",
  "https://fanju.app/robots.txt",
  "https://fanju.app/sitemap-index.xml",
  "https://fanju.app/llms.txt",
  "https://fanju.app/ai.txt",
]

const HOME_URL = "https://fanju.app/"
const ROBOTS_URL = "https://fanju.app/robots.txt"
const LLMS_URL = "https://fanju.app/llms.txt"
const AI_URL = "https://fanju.app/ai.txt"

const failures = []
const summary = []
const RETRYABLE_URLS = new Set([AI_URL])
const RETRY_ATTEMPTS = Number.parseInt(process.env.AI_SEO_RETRY_ATTEMPTS ?? "12", 10)
const RETRY_DELAY_MS = Number.parseInt(process.env.AI_SEO_RETRY_DELAY_MS ?? "30000", 10)

async function fetchText(url) {
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": "fanju-ai-seo-health/1.0" },
  })

  const text = await res.text()
  return { res, text }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchTextWithRetry(url) {
  const attempts = RETRYABLE_URLS.has(url) ? RETRY_ATTEMPTS : 1
  let lastResult
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      lastResult = await fetchText(url)
      if (lastResult.res.status === 200 || attempt === attempts) {
        return lastResult
      }
    } catch (err) {
      lastError = err
      if (attempt === attempts) {
        throw lastError
      }
    }

    console.log(`Waiting for ${url} to return 200 (${attempt}/${attempts})...`)
    await sleep(RETRY_DELAY_MS)
  }

  return lastResult
}

function record(ok, label) {
  if (ok) {
    summary.push(`PASS ${label}`)
  } else {
    failures.push(label)
    summary.push(`FAIL ${label}`)
  }
}

const cache = new Map()

for (const url of URLS) {
  try {
    const result = await fetchTextWithRetry(url)
    cache.set(url, result)
    record(result.res.status === 200, `${url} returns 200`)
  } catch (err) {
    record(false, `${url} fetch failed: ${err.message}`)
  }
}

const home = cache.get(HOME_URL)?.text ?? ""
record(/<title[^>]*>[^<]+<\/title>/i.test(home), "homepage has title")
record(/<meta\s+[^>]*name=["']description["'][^>]*content=["'][^"']+["'][^>]*>/i.test(home), "homepage has description meta")
record(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["'][^"']+["'][^>]*>/i.test(home), "homepage has canonical")
record(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["'][^"']+["'][^>]*>/i.test(home), "homepage has Open Graph og:title")
record(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(home), "homepage has JSON-LD script")
record(home.includes("Fanju"), "homepage contains Fanju")
record(home.includes("饭局"), "homepage contains 饭局")
record(/social dining/i.test(home), "homepage contains social dining")
record(/\bAI\b/i.test(home), "homepage contains AI")

const robots = cache.get(ROBOTS_URL)?.text ?? ""
record(/Allow/i.test(robots), "robots.txt contains Allow")
record(/Sitemap/i.test(robots), "robots.txt contains Sitemap")

const llmsResult = cache.get(LLMS_URL)
const aiResult = cache.get(AI_URL)
record((llmsResult?.res.status === 200 && llmsResult.text.trim().length > 0), "llms.txt is 200 and not empty")
record((aiResult?.res.status === 200 && aiResult.text.trim().length > 0), "ai.txt is 200 and not empty")

console.log("\nSEO health summary:")
for (const line of summary) {
  console.log(line)
}
console.log(`\n${summary.length - failures.length} passed, ${failures.length} failed out of ${summary.length} checks.`)

if (failures.length > 0) {
  process.exit(1)
}
