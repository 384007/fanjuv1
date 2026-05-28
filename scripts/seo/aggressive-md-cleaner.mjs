import { readFileSync, writeFileSync } from "fs"
import { walk, abs } from "./_content-factory-runtime.mjs"

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

for (const file of walk(SOURCE_DIR)) {
  if (!file.endsWith(".md")) continue
  let content = readFileSync(file, "utf8")
  
  // Remove templated headings AND the following paragraph to be sure
  for (const h2 of TEMPLATE_H2S) {
    const regex = new RegExp(`## ${h2}[\\s\\S]*?(?=##|$)`, 'g')
    content = content.replace(regex, '')
  }
  
  // Remove duplicate paragraphs (rudimentary)
  const lines = content.split('\n')
  const uniqueLines = []
  const seen = new Set()
  for (const line of lines) {
    if (line.trim() && seen.has(line.trim())) continue
    uniqueLines.push(line)
    if (line.trim()) seen.add(line.trim())
  }
  content = uniqueLines.join('\n')

  writeFileSync(file, content, "utf8")
}
