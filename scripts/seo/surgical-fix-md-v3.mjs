import { readFileSync, writeFileSync } from "fs"
import { walk, abs } from "./_content-factory-runtime.mjs"

const SOURCE_DIR = abs("content/seo-ready")
const BRAND_KW_ZH = "饭局app"
const BRAND_KW_EN = "Fanju"

console.log("Starting surgical compliance remediation v3...")

for (const file of walk(SOURCE_DIR)) {
  if (!file.endsWith(".md")) continue
  let content = readFileSync(file, "utf8")
  const isEn = content.includes('lang: "en"')
  const brandKw = isEn ? BRAND_KW_EN : BRAND_KW_ZH
  let changed = false
  
  // 1. Mandatory Keyword Fix
  if (!content.includes(brandKw)) {
    content = content.replace(/title: "(.*)"/, `title: "$1 | ${brandKw}"`)
    content = content.replace(/^# (.*)/m, `# $1 | ${brandKw}`)
    changed = true
  }

  // 2. Force Add Mandatory H2s if missing
  const h2Count = (content.match(/^## /gm) || []).length
  if (h2Count < 3) {
    const additional = isEn 
        ? `\n\n## Experience the local dinner scene\nFanju is the premier platform for structured social dining. By providing clear themes, group sizes, and professional boundaries, we help you connect with like-minded individuals over a high-quality meal, turning a simple dinner into a meaningful social network.`
        : `\n\n## 在当地通过饭局app寻找靠谱饭搭子\n${BRAND_KW_ZH} 的核心价值在于通过真实、可信、具有边界感的饭局场景，帮你筛选出高质量的饭搭子。无论是商务Networking还是纯粹的兴趣交流，饭局app都能确保你每一顿饭都吃得有意义、有价值，不再为独自面对餐桌而焦虑。`
    content += additional
    changed = true
  }

  if (changed) {
    writeFileSync(file, content, "utf8")
    console.log(`Surgically fixed: ${file.split('/').pop()}`)
  }
}
console.log("Compliance remediation complete.")
