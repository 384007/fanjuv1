// Build a deterministic, locale-aware route manifest from the existing
// city/category source-of-truth in lib/seo-data.ts. Used by the prompt-bank
// builder so we never invent routes the front-end cannot render.
//
// Output: data/seo/route-manifest.json
//
// Routes covered:
//   ZH city overview        /city/<citySlug>
//   ZH city × topic page    /city/<citySlug>/<topicSlug>
//   EN city overview        /en/city/<citySlug>
//   EN city × topic page    /en/city/<citySlug>/<topicSlug>
//
// Each entry uses a stable shape:
//   { locale, citySlug, cityNameLocalized, topicSlug, topicNameLocalized,
//     route, enabled }
//
// IMPORTANT: This script does NOT contact any AI provider, does NOT mention
// any internal pipeline name in its output. The manifest is consumed by
// build-time scripts only.

import { mkdirSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { loadCategories, loadCities } from "./_seo-data-loader.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const OUT_FILE = join(ROOT, "data/seo/route-manifest.json")

const CITY_OVERVIEW_TOPIC_ZH = { slug: "city-overview", name: "城市饭局", nameEn: "City Dinners" }

function buildEntries(cities, categories) {
  const entries = []
  for (const city of cities) {
    // ZH city overview
    entries.push({
      locale: "zh",
      citySlug: city.slug,
      cityNameLocalized: city.name,
      topicSlug: CITY_OVERVIEW_TOPIC_ZH.slug,
      topicNameLocalized: CITY_OVERVIEW_TOPIC_ZH.name,
      route: `/city/${city.slug}`,
      enabled: true,
    })
    // EN city overview
    entries.push({
      locale: "en",
      citySlug: city.slug,
      cityNameLocalized: city.nameEn,
      topicSlug: CITY_OVERVIEW_TOPIC_ZH.slug,
      topicNameLocalized: CITY_OVERVIEW_TOPIC_ZH.nameEn,
      route: `/en/city/${city.slug}`,
      enabled: true,
    })
    for (const cat of categories) {
      entries.push({
        locale: "zh",
        citySlug: city.slug,
        cityNameLocalized: city.name,
        topicSlug: cat.slug,
        topicNameLocalized: cat.name,
        route: `/city/${city.slug}/${cat.slug}`,
        enabled: true,
      })
      entries.push({
        locale: "en",
        citySlug: city.slug,
        cityNameLocalized: city.nameEn,
        topicSlug: cat.slug,
        topicNameLocalized: cat.nameEn,
        route: `/en/city/${city.slug}/${cat.slug}`,
        enabled: true,
      })
    }
  }
  return entries
}

function main() {
  const cities = loadCities()
  const categories = loadCategories()
  const entries = buildEntries(cities, categories)

  // Stable sort: locale, then route
  entries.sort((a, b) => {
    if (a.locale !== b.locale) return a.locale.localeCompare(b.locale)
    return a.route.localeCompare(b.route)
  })

  const enCount = entries.filter((e) => e.locale === "en").length
  const zhCount = entries.filter((e) => e.locale === "zh").length

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceOfTruth: "lib/seo-data.ts",
    counts: {
      total: entries.length,
      en: enCount,
      zh: zhCount,
      cities: cities.length,
      topics: categories.length + 1, // +1 for synthetic city-overview
    },
    entries,
  }

  mkdirSync(dirname(OUT_FILE), { recursive: true })
  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2) + "\n", "utf8")

  console.log("Route manifest written:", OUT_FILE)
  console.log("  total:", entries.length)
  console.log("  en:   ", enCount)
  console.log("  zh:   ", zhCount)
  console.log("  cities:", cities.length)
  console.log("  topics:", categories.length + 1)
}

main()
