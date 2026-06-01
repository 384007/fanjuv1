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

  // No boilerplate injection — do NOT append generic H2 sections.
  // Previously this script added "## 在当地通过饭局app寻找靠谱饭搭子 / Experience the local dinner scene"
  // when H2 count < 3. That created hundreds of identical tail sections.
  // Articles with too few H2s should fail the quality gate and be rewritten by the AI,
  // not patched with boilerplate text.

  if (changed) {
    writeFileSync(file, content, "utf8")
    console.log(`Surgically fixed: ${file.split('/').pop()}`)
  }
}
console.log("Compliance remediation complete.")
