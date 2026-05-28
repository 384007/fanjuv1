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
  "Safety, Clarity, and the Role of the Host",
  "在当地构建真实连接"
]

console.log("Starting strictly surgical remediation (remove-only)...")

// 1. Remediate Markdown Sources
for (const file of walk(SOURCE_DIR)) {
  if (!file.endsWith(".md")) continue
  let raw = readFileSync(file, "utf8")
  let changed = false
  
  // Parse frontmatter briefly
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fmMatch) continue
  const fm = fmMatch[1]
  let body = raw.slice(fmMatch[0].length)
  
  const meta = {}
  for (const line of fm.split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)\s*$/)
    if (m) meta[m[1]] = m[2].trim().replace(/^["']|["']$/g, "")
  }

  if (meta.status !== "ready") continue

  // Fix body: Remove templated H2s
  let newBody = body
  for (const h2 of TEMPLATE_H2S) {
    const regex = new RegExp(`## ${h2}[\\s\\S]*?(?=##|$)`, 'g')
    if (newBody.match(regex)) {
      newBody = newBody.replace(regex, '')
      changed = true
    }
  }

  // Check body length (trim to be sure)
  const lang = meta.lang === "en" ? "en" : "zh"
  if (newBody.trim().length < (lang === "en" ? 1200 : 800)) {
    raw = raw.replace(/status:\s*["']?ready["']?/, 'status: "draft"')
    writeFileSync(file, raw, "utf8")
    continue
  }
  
  // Fix title and H1 in frontmatter/body
  const isEn = lang === "en"
  const brandKw = isEn ? "Fanju app" : "饭局app"
  const titleRegex = isEn ? /Fanju app/i : /(饭局|饭搭子|Fanju)/i
  
  let newFm = fmMatch[0]
  if (meta.title && !titleRegex.test(meta.title)) {
    const cleanTitle = meta.title.replace(/ \| (fanju-app|fanju|饭局app|饭局)/gi, "").trim()
    const newTitle = `${cleanTitle} | ${brandKw}`
    newFm = newFm.replace(`title: "${meta.title}"`, `title: "${newTitle}"`)
                 .replace(`title: '${meta.title}'`, `title: "${newTitle}"`)
                 .replace(`title: ${meta.title}\n`, `title: "${newTitle}"\n`)
    changed = true
  }

  // Fix H1 independently
  const h1Match = newBody.match(/^#\s+(.+)$/m)
  if (h1Match) {
    const h1Text = h1Match[1].trim()
    if (!titleRegex.test(h1Text)) {
      const cleanH1 = h1Text.replace(/ \| (fanju-app|fanju|饭局app|饭局)/gi, "").trim()
      newBody = newBody.replace(/^#\s+.+$/m, `# ${cleanH1} | ${brandKw}`)
      changed = true
    }
  }

  if (changed) {
    writeFileSync(file, newFm + newBody, "utf8")
  }
}

// 2. Remediate JSON Products
for (const file of walk(READY_DIR)) {
  if (!file.endsWith(".json")) continue
  const article = readJson(file)
  if (article.status !== "publish") continue
  let changed = false

  // Remove Templated Sections
  const initialSectionsLength = article.sections.length
  article.sections = article.sections.filter(s => !TEMPLATE_H2S.includes(s.h2))
  
  if (article.sections.length !== initialSectionsLength) {
    changed = true
  }

  const isEn = article.language === "en"
  const brandKw = isEn ? "Fanju app" : "饭局app"
  const titleRegex = isEn ? /Fanju app/i : /(饭局|饭搭子|Fanju)/i

  if (!titleRegex.test(article.title)) {
    const cleanTitle = article.title.replace(/ \| (fanju-app|fanju|饭局app|饭局)/gi, "").trim()
    article.title = `${cleanTitle} | ${brandKw}`
    article.h1 = article.title
    changed = true
  }

  if (changed) {
    writeJson(file, article)
  }
}

console.log("Compliance remediation complete.")
