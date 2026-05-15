/**
 * scripts/check-seo-endpoints.mjs
 * Checks that critical SEO endpoints return HTTP 200.
 * Usage: node scripts/check-seo-endpoints.mjs
 * Or via package.json: pnpm seo:check
 *
 * If BASE_URL is set, checks HTTP endpoints.
 * Otherwise, checks the static Next.js export in out/ when available.
 */

import { existsSync } from "fs"
import { join } from "path"

const BASE_URL = process.env.BASE_URL
const OUT_DIR = join(process.cwd(), "out")

const ENDPOINTS = [
  "/robots.txt",
  "/sitemap.xml",
  "/product-sitemap.xml",
  "/sitemap-index.xml",
  "/llms.txt",
  "/ai.txt",
  "/humans.txt",
  "/what-is-fanju",
  "/faq",
  "/press",
  "/social-dining",
  "/china-social-dining",
  "/hong-kong-social-dining",
  "/taiwan-social-dining",
  "/macau-social-dining",
  "/singapore-social-dining",
  "/southeast-asia-social-dining",
  "/fanju-vs-meetup",
  "/fanju-vs-tinder",
  "/fanju-vs-xiaohongshu",
  "/cities",
  "/categories",
  "/city/shenzhen",
  "/city/shanghai",
  "/city/beijing",
  "/city/tokyo",
  "/category/singles-dinner",
  "/category/chinese-social-dining",
  "/guides/mainland-city-dinner-guide",
]

let passed = 0
let failed = 0

function exportPath(path) {
  if (path.endsWith(".txt") || path.endsWith(".xml")) {
    return join(OUT_DIR, path)
  }

  if (path === "/") {
    return join(OUT_DIR, "index.html")
  }

  return join(OUT_DIR, path, "index.html")
}

async function checkHttpEndpoint(path) {
  const url = `${BASE_URL}${path}`
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": "fanju-seo-check/1.0" },
  })

  if (res.ok) {
    console.log(`✓  ${res.status}  ${path}`)
    passed++
  } else {
    console.error(`✗  ${res.status}  ${path}`)
    failed++
  }
}

function checkExportEndpoint(path) {
  const file = exportPath(path)
  if (existsSync(file)) {
    console.log(`✓  export  ${path}`)
    passed++
  } else {
    console.error(`✗  missing ${path} (${file})`)
    failed++
  }
}

const useExport = !BASE_URL && existsSync(OUT_DIR)

if (BASE_URL) {
  console.log(`\nChecking SEO endpoints at ${BASE_URL}\n`)
} else if (useExport) {
  console.log(`\nChecking SEO endpoints in static export: ${OUT_DIR}\n`)
} else {
  console.error("BASE_URL is not set and out/ does not exist. Run npm run build or set BASE_URL.")
  process.exit(1)
}

for (const path of ENDPOINTS) {
  try {
    if (useExport) {
      checkExportEndpoint(path)
    } else {
      await checkHttpEndpoint(path)
    }
  } catch (err) {
    console.error(`✗  ERR  ${path}  —  ${err.message}`)
    failed++
  }
}

console.log(`\n${passed} passed, ${failed} failed out of ${ENDPOINTS.length} endpoints.\n`)

if (failed > 0) {
  process.exit(1)
}
