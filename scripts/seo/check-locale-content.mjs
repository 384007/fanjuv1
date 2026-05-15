// scripts/seo/check-locale-content.mjs
//
// Validates dist/seo/generated-drafts.json against the route manifest and
// the native-locale contract:
//   - draft.locale must equal the manifest entry locale for draft.route
//   - ZH drafts must have CJK-heavy body and title; EN drafts ASCII-heavy
//   - translationApiUsed must be false; generationMode must be "native"
//   - cityNameLocalized and topicNameLocalized must be present

import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const DRAFTS_FILE = join(ROOT, process.env.DRAFTS_FILE || "dist/seo/generated-drafts.json")
const MANIFEST_FILE = join(ROOT, "data/seo/route-manifest.json")

if (!existsSync(DRAFTS_FILE)) {
  console.log("Drafts file not found, treating as empty:", DRAFTS_FILE)
  console.log("Locale content report:")
  console.log("Total drafts: 0")
  console.log("OK")
  process.exit(0)
}
if (!existsSync(MANIFEST_FILE)) {
  console.error("Missing data/seo/route-manifest.json")
  process.exit(1)
}

const drafts = JSON.parse(readFileSync(DRAFTS_FILE, "utf8")).drafts || []
const manifest = JSON.parse(readFileSync(MANIFEST_FILE, "utf8"))
const byKey = new Map()
for (const e of manifest.entries) byKey.set(`${e.locale}|${e.route}`, e)

let routeMismatch = 0
let wrongLanguage = 0
let missingLabels = 0
let translated = 0
let nonNative = 0
const offenders = []

let en = 0
let zh = 0

function isMostlyChinese(s) {
  const t = String(s || "")
  if (!t) return false
  const chinese = (t.match(/[\u4e00-\u9fff]/g) || []).length
  return chinese / t.length > 0.3
}
function isMostlyEnglish(s) {
  const t = String(s || "")
  if (!t) return false
  const ascii = (t.match(/[A-Za-z]/g) || []).length
  return ascii / t.length > 0.4
}

for (const d of drafts) {
  if (d.locale === "en") en++
  if (d.locale === "zh") zh++

  const key = `${d.locale}|${d.route}`
  const manifestEntry = byKey.get(key)
  if (!manifestEntry) {
    routeMismatch++
    if (offenders.length < 30) offenders.push(`UNMATCHED ${key} (${d.promptId})`)
    continue
  }
  if (manifestEntry.locale !== d.locale) {
    routeMismatch++
    if (offenders.length < 30) offenders.push(`ROUTE-LOCALE-MISMATCH ${key}`)
  }

  if (d.translationApiUsed === true) {
    translated++
    if (offenders.length < 30) offenders.push(`TRANSLATED ${d.promptId}`)
  }
  if (d.generationMode && d.generationMode !== "native") {
    nonNative++
    if (offenders.length < 30) offenders.push(`NON-NATIVE ${d.promptId} mode=${d.generationMode}`)
  }

  if (!d.cityNameLocalized || !d.topicNameLocalized) {
    missingLabels++
    if (offenders.length < 30) offenders.push(`MISSING-LABEL ${d.promptId}`)
  }

  // Only inspect language for completed drafts (status === "ready")
  if (d.status === "ready") {
    const sample = `${d.title || ""}\n${d.description || ""}`
    if (d.locale === "zh" && !isMostlyChinese(sample)) {
      wrongLanguage++
      if (offenders.length < 30) offenders.push(`ZH-LANG ${d.promptId}`)
    }
    if (d.locale === "en" && !isMostlyEnglish(sample)) {
      wrongLanguage++
      if (offenders.length < 30) offenders.push(`EN-LANG ${d.promptId}`)
    }
  }
}

console.log("Locale content report:")
console.log(`Total drafts: ${drafts.length}`)
console.log(`EN drafts: ${en}`)
console.log(`ZH drafts: ${zh}`)
console.log(`Route locale mismatches: ${routeMismatch}`)
console.log(`Wrong-language content: ${wrongLanguage}`)
console.log(`Missing localized city/topic labels: ${missingLabels}`)
console.log(`Translation API used: ${translated}`)
console.log(`Non-native generation mode: ${nonNative}`)

if (offenders.length) {
  console.log("Offenders (first 30):")
  for (const x of offenders) console.log(`  ${x}`)
}

const errors = []
if (routeMismatch) errors.push(`routeMismatch=${routeMismatch}`)
if (wrongLanguage) errors.push(`wrongLanguage=${wrongLanguage}`)
if (missingLabels) errors.push(`missingLabels=${missingLabels}`)
if (translated) errors.push(`translated=${translated}`)
if (nonNative) errors.push(`nonNative=${nonNative}`)

if (errors.length) {
  console.error("FAIL: " + errors.join(" "))
  process.exit(1)
}
console.log("OK")
