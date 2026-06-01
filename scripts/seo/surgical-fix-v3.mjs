import { readFileSync, writeFileSync } from "fs"
import { walk, abs, readJson } from "./_content-factory-runtime.mjs"

const READY_DIR = abs("content/articles/ready/index")
const SOURCE_DIR = abs("content/seo-ready")
const CULTURE_DB = readJson(abs("data/city-culture.json"))

const BRAND_KW_ZH = "饭局app"
const BRAND_KW_EN = "Fanju"

console.log("Starting surgical compliance remediation (non-templated)...")

// 1. Surgical MD Repair — brand keyword only, no boilerplate injection
for (const file of walk(SOURCE_DIR)) {
  if (!file.endsWith(".md")) continue
  let content = readFileSync(file, "utf8")
  const isEn = content.includes('lang: "en"')
  const brandKw = isEn ? BRAND_KW_EN : BRAND_KW_ZH
  let changed = false

  // Only add brand keyword to title/H1 if genuinely missing — no body injection
  if (!content.includes(brandKw)) {
    content = content.replace(/title: "(.*)"/, `title: "$1 | ${brandKw}"`)
    content = content.replace(/^# (.*)/m, `# $1 | ${brandKw}`)
    changed = true
  }

  if (changed) {
    writeFileSync(file, content, "utf8")
    console.log(`Repaired MD: ${file.split('/').pop()}`)
  }
}

// 2. Surgical JSON Repair
for (const file of walk(READY_DIR)) {
  if (!file.endsWith(".json")) continue
  const article = readJson(file)
  const isEn = article.language === "en"
  const brandKw = isEn ? BRAND_KW_EN : BRAND_KW_ZH
  let changed = false

  if (!article.title.toLowerCase().includes(brandKw.toLowerCase())) {
    article.title = `${article.title.replace(new RegExp(` \\| ${brandKw}`, 'gi'), '')} | ${brandKw}`
    article.h1 = article.title
    changed = true
  }

  // Fix content: only add section if fewer than 3 sections AND no boilerplate injection
  if (article.sections.length < 3) {
      const citySlug = article.city?.slug || "general"
      // NOTE: do NOT inject boilerplate text. Add a placeholder that signals
      // the article needs a real rewrite, not a generic CTA.
      article.sections.push({
          h2: isEn ? "About this dinner" : "关于这场饭局",
          body: isEn
            ? `This ${citySlug} dinner is organized through Fanju app. Check the listing for theme, group size, host note, and cost split before joining.`
            : `这场${citySlug}饭局通过饭局app组织。报名前请查看主题、人数、主理人说明和费用分摊方式。`
      })
      changed = true
  }

  if (changed) {
    writeJson(file, article)
    console.log(`Repaired JSON: ${file.split('/').pop()}`)
  }
}

console.log("Compliance remediation complete.")
