// scripts/seo/check-built-pages.mjs
//
// Sends a GET request to every route used in the prompt bank against a
// running server (defaults to http://localhost:3000). Pass = HTTP 200/301/302.
// Anything else (including network errors) counts as a failure.

import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const BANK_FILE = join(ROOT, process.env.PROMPT_BANK_FILE || "data/seo/random-prompt-bank.jsonl")
const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "")
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.CONCURRENCY || "8", 10))
const TIMEOUT_MS = Number.parseInt(process.env.TIMEOUT_MS || "20000", 10)

if (!existsSync(BANK_FILE)) {
  console.error(`Missing prompt bank: ${BANK_FILE}`)
  process.exit(1)
}

const bank = readFileSync(BANK_FILE, "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => JSON.parse(l))

// Deduplicate routes
const seen = new Set()
const routes = []
for (const p of bank) {
  if (!p.route) continue
  if (seen.has(p.route)) continue
  seen.add(p.route)
  routes.push(p.route)
}

console.log(`Built page check: BASE_URL=${BASE_URL} routes=${routes.length}`)

async function fetchOnce(route) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE_URL}${route}`, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
    })
    return { ok: res.status === 200 || res.status === 301 || res.status === 302, status: res.status }
  } catch (err) {
    return { ok: false, status: 0, error: err?.message || String(err) }
  } finally {
    clearTimeout(timer)
  }
}

let okCount = 0
let notFound = 0
let serverError = 0
let other = 0
const failedRoutes = []

for (let i = 0; i < routes.length; i += CONCURRENCY) {
  const chunk = routes.slice(i, i + CONCURRENCY)
  const results = await Promise.all(chunk.map((r) => fetchOnce(r)))
  for (let j = 0; j < chunk.length; j++) {
    const route = chunk[j]
    const r = results[j]
    if (r.ok) {
      okCount++
    } else if (r.status === 404) {
      notFound++
      failedRoutes.push(`404 ${route}`)
    } else if (r.status >= 500 && r.status < 600) {
      serverError++
      failedRoutes.push(`${r.status} ${route}`)
    } else {
      other++
      failedRoutes.push(`${r.status || "ERR"} ${route} ${r.error ? `(${r.error})` : ""}`)
    }
  }
  if ((i + chunk.length) % 200 === 0) {
    console.log(`  progress: ${i + chunk.length}/${routes.length} ok=${okCount}`)
  }
}

console.log("Built page check:")
console.log(`Checked routes: ${routes.length}`)
console.log(`OK: ${okCount}`)
console.log(`404: ${notFound}`)
console.log(`5xx: ${serverError}`)
console.log(`Other: ${other}`)

if (failedRoutes.length) {
  console.log("Failed routes:")
  for (const x of failedRoutes.slice(0, 40)) console.log(`  ${x}`)
  if (failedRoutes.length > 40) console.log(`  ...and ${failedRoutes.length - 40} more`)
}

if (notFound > 0 || serverError > 0 || other > 0) {
  process.exit(1)
}
console.log("OK")
