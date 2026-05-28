import { readJson, walk, abs, writeJson } from "./_content-factory-runtime.mjs"
import { readFileSync, writeFileSync } from "fs"

const READY_DIR = abs("content/articles/ready/index")
const SOURCE_DIR = abs("content/seo-ready")
const TEMPLATE_H2S = [
  "为什么 Fanju 是你的饭搭子首选",
  "如何判断这一桌是否适合你",
  "如何判断这一桌是否适合自己",
  "参与边界清晰，安全自主",
  "Safety and Comfort Are Built Into the Design",
  "Safety, Boundaries, and the Freedom to Leave",
  "Safety, Clarity, and the Role of the Host"
]

console.log("Starting linguistic-aware remediation...")

// Helper to patch markdown
function patchMarkdown(filePath) {
  let content = readFileSync(filePath, "utf8")
  const isEn = content.includes('lang: "en"')
  const brandKw = isEn ? "Fanju" : "饭局app"
  let changed = false

  // Force Keyword
  if (!content.match(new RegExp(`title:.*${brandKw}`, 'i'))) {
    content = content.replace(/title: "(.*)"/, `title: "$1 | ${brandKw}"`)
    content = content.replace(/^# (.*)/m, `# $1 | ${brandKw}`)
    changed = true
  }

  // Remove templated H2s
  for (const h2 of TEMPLATE_H2S) {
    const regex = new RegExp(`## ${h2}[\\s\\S]*?(?=##|$)`, 'g')
    if (content.match(regex)) {
      content = content.replace(regex, '')
      changed = true
    }
  }

  if (changed) {
    writeFileSync(filePath, content, "utf8")
    return true
  }
  return false
}

// 1. Remediate Markdown Sources
for (const file of walk(SOURCE_DIR)) {
  if (!file.endsWith(".md")) continue
  patchMarkdown(file)
}

// 2. Remediate JSON Products
for (const file of walk(READY_DIR)) {
  if (!file.endsWith(".json")) continue
  const article = readJson(file)
  const isEn = article.language === "en"
  const brandKw = isEn ? "Fanju" : "饭局app"
  let changed = false

  if (!article.title.toLowerCase().includes(brandKw.toLowerCase())) {
    article.title = `${article.title.replace(new RegExp(` \\| ${brandKw}`, 'gi'), '')} | ${brandKw}`
    article.h1 = article.title
    changed = true
  }

  const initialSectionsLength = article.sections.length
  article.sections = article.sections.filter(s => !TEMPLATE_H2S.includes(s.h2))
  if (article.sections.length !== initialSectionsLength) changed = true

  if (changed) {
    writeJson(file, article)
  }
}

console.log("Remediation complete.")
