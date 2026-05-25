// scripts/seo/check-prompt-bank-diversity.mjs
//
// Inspects data/seo/random-prompt-bank.jsonl. Prints a distribution report
// and exits non-zero if any uniqueness invariant is violated.

import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import {
  historicalSkipReason,
  isHistoricallyPublishedRoute,
  loadPromptBankHistory,
  localeCityTypeKeyFor,
  pathFromRoot,
  routeKeyFor,
} from "./prompt-bank-history.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const BANK = pathFromRoot(ROOT, process.env.PROMPT_BANK_FILE || "data/seo/random-prompt-bank.jsonl")
const MANIFEST = pathFromRoot(ROOT, process.env.MANIFEST_FILE || "data/seo/route-manifest.json")
const EN_TOP_CITY_LIMIT = Math.max(1, Number.parseInt(process.env.EN_TOP_CITY_LIMIT || "100", 10))
const RAW_PROMPT_LANG = (process.env.PROMPT_BANK_LANG || process.env.LANG || "all").toLowerCase()
const LANG = ["all", "en", "zh"].includes(RAW_PROMPT_LANG) ? RAW_PROMPT_LANG : "all"

function routeEligibleForLocale(route, locale) {
  const countryCode = String(route.countryCode || "CN").toUpperCase()
  if (locale === "zh") return ["CN", "HK", "MO", "TW"].includes(countryCode)
  if (locale === "en") {
    const enRank = Number(route.enRank || 0)
    return enRank >= 1 && enRank <= EN_TOP_CITY_LIMIT
  }
  return true
}

async function main() {
  if (!existsSync(BANK)) {
    console.error(`Missing prompt bank: ${BANK}`)
    process.exit(1)
  }

  const history = await loadPromptBankHistory({ root: process.env.SEO_HISTORY_ROOT ? undefined : ROOT })

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
  let historicalRouteDuplicates = 0
  let historicalPromptHashDuplicates = 0
  let historicalProfileHashDuplicates = 0

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

    const historyProbe = {
      ...p,
      routeKey: p.routeKey || routeKeyFor(p),
      localeCityTypeKey: p.localeCityTypeKey || localeCityTypeKeyFor(p),
    }
    const historyReason = historicalSkipReason(historyProbe, history)
    if (isHistoricallyPublishedRoute(historyProbe, history)) {
      historicalRouteDuplicates++
      warnings.push(`Historical route duplicate: ${p.promptId} ${p.route} (${historyReason || "already_published"})`)
    }
    if (p.promptHash && history.promptHashes.has(p.promptHash)) {
      historicalPromptHashDuplicates++
      warnings.push(`Historical promptHash duplicate: ${p.promptHash} (${p.promptId})`)
    }
    if (p.profileHash && history.profileHashes.has(p.profileHash)) {
      historicalProfileHashDuplicates++
      warnings.push(`Historical profileHash duplicate: ${p.profileHash} (${p.promptId})`)
    }

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
  console.log(`Historical route duplicates: ${historicalRouteDuplicates}`)
  console.log(`Historical promptHash duplicates: ${historicalPromptHashDuplicates}`)
  console.log(`Historical profileHash duplicates: ${historicalProfileHashDuplicates}`)

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

  let coverageFailed = false
  if (existsSync(MANIFEST)) {
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"))
    const entries = Array.isArray(manifest.entries) ? manifest.entries : []
    const countLocale = (entry) => LANG === "all" || LANG === "" || entry.locale === LANG
    const availableCandidatesAfterHistoryFilter = entries.filter((entry) => {
      if (!entry.enabled || !countLocale(entry) || !routeEligibleForLocale(entry, entry.locale)) return false
      return !historicalSkipReason({
        ...entry,
        routeKey: routeKeyFor(entry),
        localeCityTypeKey: localeCityTypeKeyFor(entry),
      }, history)
    }).length
    const zhEligibleCities = new Set(
      entries
        .filter((entry) => entry.locale === "zh" && entry.enabled && ["CN", "HK", "MO", "TW"].includes(String(entry.countryCode || "CN").toUpperCase()))
        .map((entry) => entry.citySlug),
    )
    const enEligibleCities = new Set(
      entries
        .filter((entry) => {
          const enRank = Number(entry.enRank || 0)
          return entry.locale === "en" && entry.enabled && enRank >= 1 && enRank <= EN_TOP_CITY_LIMIT
        })
        .map((entry) => entry.citySlug),
    )
    const zhPromptCities = new Set(prompts.filter((p) => p.locale === "zh").map((p) => p.citySlug))
    const enPromptCities = new Set(prompts.filter((p) => p.locale === "en").map((p) => p.citySlug))
    const missingZh = [...zhEligibleCities].filter((city) => !zhPromptCities.has(city))
    const missingEn = [...enEligibleCities].filter((city) => !enPromptCities.has(city))

    console.log(`Available candidates after history filter: ${availableCandidatesAfterHistoryFilter}`)
    console.log(`Eligible ZH China cities: ${zhEligibleCities.size}; covered in prompts: ${zhPromptCities.size}`)
    console.log(`Eligible EN top cities: ${enEligibleCities.size}; covered in prompts: ${enPromptCities.size}`)

    const checkZhCoverage = LANG === "all" || LANG === "zh" || LANG === ""
    const checkEnCoverage = LANG === "all" || LANG === "en" || LANG === ""

    if (checkZhCoverage && zhEligibleCities.size < 300) {
      console.error(`Diversity check failed: expected at least 300 ZH China cities, got ${zhEligibleCities.size}.`)
      coverageFailed = true
    }
    if (checkEnCoverage && enEligibleCities.size !== EN_TOP_CITY_LIMIT) {
      console.error(`Diversity check failed: expected ${EN_TOP_CITY_LIMIT} EN top cities, got ${enEligibleCities.size}.`)
      coverageFailed = true
    }
    if (checkZhCoverage && missingZh.length) {
      console.error(`Diversity check failed: ${missingZh.length} ZH China cities missing from prompt bank.`)
      console.error(`Missing ZH sample: ${missingZh.slice(0, 20).join(", ")}`)
      coverageFailed = true
    }
    if (checkEnCoverage && missingEn.length) {
      console.error(`Diversity check failed: ${missingEn.length} EN global cities missing from prompt bank.`)
      console.error(`Missing EN sample: ${missingEn.slice(0, 20).join(", ")}`)
      coverageFailed = true
    }
  } else {
    console.log("Available candidates after history filter: 0")
  }

  const hasHistoricalDup = historicalRouteDuplicates > 0 || historicalPromptHashDuplicates > 0 || historicalProfileHashDuplicates > 0
  if (hasDup || hasHistoricalDup || coverageFailed) {
    if (hasDup) console.error("Diversity check failed: duplicate hashes detected.")
    if (hasHistoricalDup) console.error("Diversity check failed: historical duplicates detected.")
    process.exit(1)
  }

  console.log("OK")
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
