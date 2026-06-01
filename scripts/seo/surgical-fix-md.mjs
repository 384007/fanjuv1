import { readFileSync, writeFileSync } from "fs"
import { abs, readJson } from "./_content-factory-runtime.mjs"

const FAILING_FILES = [
  "content/seo-ready/anshun-backpacker-dinner.md",
  "content/seo-ready/en-budapest-mechanical-engineer-dinner.md",
  "content/seo-ready/en-casablanca-local-dinner.md",
  "content/seo-ready/en-kyoto-digital-detox-dinner.md",
  "content/seo-ready/en-lagos-open-table-dinner.md",
  "content/seo-ready/en-manila-vegan-dinner.md",
  "content/seo-ready/shantou-tea-ceremony-dinner.md",
  "content/seo-ready/xiamen-remote-worker-dinner.md",
  "content/seo-ready/xiaogan-aviation-dinner.md",
  "content/seo-ready/wuhu-professor-dinner.md",
  "content/seo-ready/wulumuqi-city-guide-dinner.md",
  "content/seo-ready/wulumuqi-community-builder-dinner.md",
  "content/seo-ready/wulumuqi-freelancer-dinner.md",
  "content/seo-ready/wulumuqi-friday-dinner.md",
  "content/seo-ready/wulumuqi-returnee-dinner.md",
  "content/seo-ready/wulumuqi-yoga-dinner.md",
  "content/seo-ready/wuwei-cybersecurity-dinner.md",
  "content/seo-ready/wuwei-loneliness-solution-dinner.md",
  "content/seo-ready/wuwei-military-dinner.md",
  "content/seo-ready/wuwei-stranger-dinner.md",
  "content/seo-ready/wuxi-angel-investor-dinner.md",
  "content/seo-ready/wuxi-boxing-dinner.md",
  "content/seo-ready/wuxi-local-guide-dinner.md",
  "content/seo-ready/wuzhong-biotech-dinner.md",
  "content/seo-ready/wuzhou-keto-dinner.md"
]

const CULTURE_DB = readJson(abs("data/city-culture.json"))

console.log("Starting surgical MD repair...")

for (const file of FAILING_FILES) {
  const filePath = abs(file)
  let content = readFileSync(filePath, "utf8")
  
  // 1. Mandatory Branding (Unique Injection)
  const isEn = content.includes('lang: "en"')
  const brandKw = isEn ? "Fanju" : "饭局app"
  if (!content.includes(brandKw)) {
    content = content.replace(/title: "(.*)"/, `title: "$1 | ${brandKw}"`)
    content = content.replace(/^# (.*)/m, `# $1 | ${brandKw}`)
  }

  // 2. Surgical Removal of Templated Sections (using regex to find and kill)
  const TEMPLATE_PATTERNS = [
    /## 为什么 Fanju 是你的饭搭子首选[\s\S]*?(?=##|$)/g,
    /## 如何判断这一桌是否适合你[\s\S]*?(?=##|$)/g,
    /## 如何判断这一桌是否适合自己[\s\S]*?(?=##|$)/g,
    /## 参与边界清晰，安全自主[\s\S]*?(?=##|$)/g,
    /## Safety and Comfort Are Built Into the Design[\s\S]*?(?=##|$)/g,
    /## Safety, Boundaries, and the Freedom to Leave[\s\S]*?(?=##|$)/g,
    /## Safety, Clarity, and the Role of the Host[\s\S]*?(?=##|$)/g
  ]
  
  for (const pattern of TEMPLATE_PATTERNS) {
    content = content.replace(pattern, "")
  }

  // 3. No boilerplate injection — removed.
  // Previously this script appended "## 在当地的饭局社交体验 / Experience the local dinner scene"
  // to every article. That created 671+ identical tail sections which Google treats as duplicate
  // content. The article body must stand on its own; no CTA sections are appended here.

  writeFileSync(filePath, content, "utf8")
  console.log(`Repaired: ${file}`)
}

console.log("Surgical repair complete.")
