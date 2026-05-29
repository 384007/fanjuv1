import { readFileSync, writeFileSync } from "fs"
import { walk, abs } from "./_content-factory-runtime.mjs"

const SOURCE_DIR = abs("content/seo-ready")
const BRAND_KW = "fanju-app"

console.log("Starting surgical compliance remediation...")

for (const file of walk(SOURCE_DIR)) {
  if (!file.endsWith(".md")) continue
  let content = readFileSync(file, "utf8")
  let changed = false
  
  // 1. Ensure Brand Keyword in Title/H1
  if (!content.includes(BRAND_KW)) {
    // Regex to find title: "..."
    content = content.replace(/title: "(.*)"/, `title: "$1 | ${BRAND_KW}"`)
    // Regex to find # heading
    content = content.replace(/^# (.*)/m, `# $1 | ${BRAND_KW}`)
    changed = true
  }

  // 2. Aggressive Removal of Templated/Forbidden patterns
  const patterns = [
    /## 为什么 Fanju 是你的饭搭子首选[\s\S]*?(?=##|$)/g,
    /## 如何判断这一桌是否适合你[\s\S]*?(?=##|$)/g,
    /## 如何判断这一桌是否适合自己[\s\S]*?(?=##|$)/g,
    /## 参与边界清晰，安全自主[\s\S]*?(?=##|$)/g,
    /## Safety and Comfort Are Built Into the Design[\s\S]*?(?=##|$)/g,
    /## Safety, Boundaries, and the Freedom to Leave[\s\S]*?(?=##|$)/g,
    /## Safety, Clarity, and the Role of the Host[\s\S]*?(?=##|$)/g,
    /fanju\/饭局app的设计初衷[\s\S]*?(?=\n\n|\n$)/g
  ]
  
  for (const p of patterns) {
    if (content.match(p)) {
      content = content.replace(p, "")
      changed = true
    }
  }

  if (changed) {
    writeFileSync(file, content, "utf8")
    console.log(`Surgically fixed: ${file.split('/').pop()}`)
  }
}
console.log("Compliance remediation complete.")
