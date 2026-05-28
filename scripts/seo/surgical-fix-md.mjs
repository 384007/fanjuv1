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

// 高度差异化的随机补充语料库
const UNIQUE_INJECTIONS = {
  zh: [
    (city, cat) => `在${city}，通过 Fanju / 饭局app 参与${cat}小桌社交，是为了筛选出真正同频的饭搭子。我们不主张盲目社交，而是通过明确的场景与规则，让每一次线下见面都回归社交的本质。`,
    (city, cat) => `无论你是想在${city}拓展${cat}相关的行业视角，还是仅仅寻找一个低压力的线下入口，Fanju / 饭局app 的小桌模式都能帮你有效筛选出可信赖的饭搭子，实现高质量的线下连接。`,
    (city, cat) => `想要在${city}找到靠谱的${cat}饭搭子，关键在于场景的透明度。Fanju 饭局通过主题化的小桌社交，降低了参与者的认知成本，让你在报名前就能通过清晰的人群与费用规则，判断这桌饭是否值得投入时间。`
  ],
  en: [
    (city, cat) => `In ${city}, Fanju's small-table approach for ${cat} is designed for high-signal, low-pressure connection. It's about finding reliable dinner buddies through clear, structured scenarios rather than noisy events.`,
    (city, cat) => `Finding a dinner buddy for ${cat} in ${city} should not be left to chance. Fanju creates a safe, boundary-clear entrance for those seeking real-world interaction, helping you filter for trust and commonality from the first meal.`,
    (city, cat) => `The strength of a Fanju dinner lies in its structure: for ${cat} enthusiasts in ${city}, we provide a platform where group size, purpose, and professional/personal boundaries are explicit, making your social networking efficient and secure.`
  ]
}

console.log("Starting surgical remediation...")

function getUniqueParagraph(article) {
  const isEn = article.language === "en"
  const city = article.city?.zh || article.city?.en || "当地"
  const cat = article.topCategory || "社交"
  const pool = isEn ? UNIQUE_INJECTIONS.en : UNIQUE_INJECTIONS.zh
  const phrase = pool[Math.floor(Math.random() * pool.length)](city, cat)
  return {
    h2: isEn ? "Building Real Connections" : "在当地构建真实连接",
    body: phrase
  }
}

// 1. Remediate Markdown Sources
for (const file of walk(SOURCE_DIR)) {
  if (!file.endsWith(".md")) continue
  let content = readFileSync(file, "utf8")
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
    writeFileSync(file, content, "utf8")
    console.log(`Surgically repaired MD: ${file.split('/').pop()}`)
  }
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
  
  // Only inject if removed or too short
  if (article.sections.length !== initialSectionsLength || article.sections.map(s => s.body).join(" ").length < 1000) {
    article.sections.push(getUniqueParagraph(article))
    changed = true
  }

  if (changed) {
    writeJson(file, article)
    console.log(`Surgically repaired JSON: ${file.split('/').pop()}`)
  }
}

console.log("Remediation complete.")
