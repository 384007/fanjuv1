// scripts/seo/check-route-coverage.mjs
//
// Confirms every route used by the prompt bank is also present (and enabled)
// in the route manifest. Also enforces locale counts and hash uniqueness.

import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const MANIFEST_FILE = join(ROOT, "data/seo/route-manifest.json")
const BANK_FILE = join(ROOT, process.env.PROMPT_BANK_FILE || "data/seo/random-prompt-bank.jsonl")
const REQUIRE_EN = Number.parseInt(process.env.REQUIRE_EN || "500", 10)
const REQUIRE_ZH = Number.parseInt(process.env.REQUIRE_ZH || "500", 10)

if (!existsSync(MANIFEST_FILE)) {
  console.error("Missing data/seo/route-manifest.json. Run: pnpm seo:routes")
  process.exit(1)
}
if (!existsSync(BANK_FILE)) {
  console.error("Missing prompt bank. Run: pnpm seo:prompt-bank")
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(MANIFEST_FILE, "utf8"))
const lines = readFileSync(BANK_FILE, "utf8").split(/\r?\n/).filter((l) => l.trim())
const prompts = lines.map((l) => JSON.parse(l))

const enabledByRouteLocale = new Map()
const allByRouteLocale = new Map()
for (const e of manifest.entries) {
  const key = `${e.locale}|${e.route}`
  allByRouteLocale.set(key, e)
  if (e.enabled === true) enabledByRouteLocale.set(key, e)
}

const enabledEn = manifest.entries.filter((e) => e.locale === "en" && e.enabled).length
const enabledZh = manifest.entries.filter((e) => e.locale === "zh" && e.enabled).length

let missing = 0
let disabledHits = 0
const promptHashes = new Map()
const profileHashes = new Map()
let dupP = 0
let dupF = 0
const localeCount = { en: 0, zh: 0, other: 0 }

const offending = []

for (const p of prompts) {
  if (p.locale === "en") localeCount.en++
  else if (p.locale === "zh") localeCount.zh++
  else localeCount.other++

  const key = `${p.locale}|${p.route}`
  if (!allByRouteLocale.has(key)) {
    missing++
    if (offending.length < 20) offending.push(`MISSING ${key} (${p.promptId})`)
  } else if (!enabledByRouteLocale.has(key)) {
    disabledHits++
    if (offending.length < 20) offending.push(`DISABLED ${key} (${p.promptId})`)
  }

  if (p.promptHash) {
    if (promptHashes.has(p.promptHash)) dupP++
    else promptHashes.set(p.promptHash, p.promptId)
  }
  if (p.profileHash) {
    if (profileHashes.has(p.profileHash)) dupF++
    else profileHashes.set(p.profileHash, p.promptId)
  }
}

console.log("Route coverage report:")
console.log(`Total manifest routes: ${manifest.entries.length}`)
console.log(`EN manifest routes: ${enabledEn}`)
console.log(`ZH manifest routes: ${enabledZh}`)
console.log(`Total prompts: ${prompts.length}`)
console.log(`EN prompts: ${localeCount.en}`)
console.log(`ZH prompts: ${localeCount.zh}`)
console.log(`Routes missing from manifest: ${missing}`)
console.log(`Disabled routes used: ${disabledHits}`)
console.log(`Duplicate promptHash: ${dupP}`)
console.log(`Duplicate profileHash: ${dupF}`)

if (offending.length) {
  console.log("Offenders (first 20):")
  for (const x of offending) console.log(`  ${x}`)
}

const errors = []
if (missing > 0) errors.push(`Missing routes: ${missing}`)
if (disabledHits > 0) errors.push(`Disabled routes used: ${disabledHits}`)
if (dupP > 0) errors.push(`Duplicate promptHash: ${dupP}`)
if (dupF > 0) errors.push(`Duplicate profileHash: ${dupF}`)
if (REQUIRE_EN > 0 && localeCount.en < REQUIRE_EN) errors.push(`EN prompts ${localeCount.en} < required ${REQUIRE_EN}`)
if (REQUIRE_ZH > 0 && localeCount.zh < REQUIRE_ZH) errors.push(`ZH prompts ${localeCount.zh} < required ${REQUIRE_ZH}`)

if (errors.length) {
  console.error("FAIL:")
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}

console.log("OK")
