// scripts/seo/check-prompt-bank-diversity.mjs
//
// Inspects data/seo/random-prompt-bank.jsonl. Prints a distribution report
// and exits non-zero if any uniqueness invariant is violated.

import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const BANK = join(ROOT, process.env.PROMPT_BANK_FILE || "data/seo/random-prompt-bank.jsonl")

if (!existsSync(BANK)) {
  console.error(`Missing prompt bank: ${BANK}`)
  process.exit(1)
}

const lines = readFileSync(BANK, "utf8").split(/\r?\n/).filter((l) => l.trim())
const prompts = lines.map((l, i) => {
  try {
    return JSON.parse(l)
  } catch (err) {
    console.error(`Invalid JSON on line ${i + 1}: ${err.message}`)
    process.exit(1)
  }
})

const promptHashes = new Map()
const profileHashes = new Map()
const localeCount = { en: 0, zh: 0, other: 0 }
const cityCount = new Map()
const angleCount = new Map()
const structureCount = new Map()
const openingCount = new Map()
const faqCount = new Map()
const ctaCount = new Map()
const toneCount = new Map()
const titlePatternCount = new Map()
const exampleCount = new Map()
const warnings = []

function bump(map, key) {
  map.set(key, (map.get(key) || 0) + 1)
}

for (const p of prompts) {
  if (p.locale === "en") localeCount.en++
  else if (p.locale === "zh") localeCount.zh++
  else localeCount.other++

  bump(cityCount, `${p.locale}:${p.citySlug}`)
  bump(angleCount, `${p.locale}:${p.angle?.id}`)
  bump(structureCount, p.structure)
  bump(openingCount, p.openingStyle)
  bump(faqCount, p.faqMode)
  bump(ctaCount, p.ctaPosition)
  bump(toneCount, `${p.locale}:${p.tone}`)
  bump(titlePatternCount, p.titlePattern)
  bump(exampleCount, p.exampleType)

  if (p.promptHash) {
    if (promptHashes.has(p.promptHash)) {
      warnings.push(`Duplicate promptHash: ${p.promptHash} (${p.promptId} vs ${promptHashes.get(p.promptHash)})`)
    } else {
      promptHashes.set(p.promptHash, p.promptId)
    }
  } else {
    warnings.push(`Missing promptHash on ${p.promptId}`)
  }

  if (p.profileHash) {
    if (profileHashes.has(p.profileHash)) {
      warnings.push(`Duplicate profileHash: ${p.profileHash} (${p.promptId} vs ${profileHashes.get(p.profileHash)})`)
    } else {
      profileHashes.set(p.profileHash, p.promptId)
    }
  } else {
    warnings.push(`Missing profileHash on ${p.promptId}`)
  }
}

function topN(map, n = 8) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
}

console.log("Prompt bank diversity report:")
console.log(`Total prompts: ${prompts.length}`)
console.log(`EN: ${localeCount.en}`)
console.log(`ZH: ${localeCount.zh}`)
if (localeCount.other) console.log(`Other locale: ${localeCount.other}`)
console.log(`Unique promptHash: ${promptHashes.size}/${prompts.length}`)
console.log(`Unique profileHash: ${profileHashes.size}/${prompts.length}`)
console.log(`Duplicate prompts: ${prompts.length - promptHashes.size}`)
console.log(`Duplicate profiles: ${prompts.length - profileHashes.size}`)

console.log("Top cities:")
for (const [k, v] of topN(cityCount)) console.log(`  ${k.padEnd(28)} ${v}`)
console.log("Top angles:")
for (const [k, v] of topN(angleCount)) console.log(`  ${k.padEnd(48)} ${v}`)
console.log("Top structures:")
for (const [k, v] of topN(structureCount)) console.log(`  ${k.padEnd(28)} ${v}`)
console.log("Top opening styles:")
for (const [k, v] of topN(openingCount)) console.log(`  ${k.padEnd(36)} ${v}`)
console.log("Top FAQ modes:")
for (const [k, v] of topN(faqCount)) console.log(`  ${k.padEnd(28)} ${v}`)
console.log("Top CTA positions:")
for (const [k, v] of topN(ctaCount)) console.log(`  ${k.padEnd(36)} ${v}`)

if (warnings.length) {
  console.log("Warnings:")
  for (const w of warnings.slice(0, 50)) console.log(`  ${w}`)
  if (warnings.length > 50) console.log(`  ...and ${warnings.length - 50} more`)
}

const hasDup =
  promptHashes.size !== prompts.length || profileHashes.size !== prompts.length
if (hasDup) {
  console.error("Diversity check failed: duplicate hashes detected.")
  process.exit(1)
}

console.log("OK")
