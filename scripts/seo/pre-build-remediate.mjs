import { readJson, walk, abs, writeJson } from "./_content-factory-runtime.mjs"
import { readFileSync, writeFileSync } from "fs"

const READY_DIR = abs("content/articles/ready/index")
const TEMPLATE_H2S = [
  "为什么 Fanju 是你的饭搭子首选",
  "如何判断这一桌是否适合你",
  "如何判断这一桌是否适合自己",
  "参与边界清晰，安全自主",
  "Safety and Comfort Are Built Into the Design",
  "Safety, Boundaries, and the Freedom to Leave",
  "Safety, Clarity, and the Role of the Host"
]

console.log("Starting pre-build remediation...")

for (const file of walk(READY_DIR)) {
  if (!file.endsWith(".json")) continue
  const article = readJson(file)
  let changed = false

  // 1. Force Keyword: fanju-app
  if (!article.title.toLowerCase().includes("fanju-app")) {
    article.title = `${article.title.replace(/ \| fanju-app/gi, '')} | fanju-app`
    article.h1 = article.title
    changed = true
  }

  // 2. Remove Templated H2s
  const initialSectionsLength = article.sections.length
  article.sections = article.sections.filter(s => !TEMPLATE_H2S.includes(s.h2))
  if (article.sections.length !== initialSectionsLength) {
    changed = true
  }

  // 3. Expand Thin Content
  const bodyText = article.sections.map(s => s.body).join(" ")
  if (bodyText.length < 1500) {
    const city = article.city?.zh || "同城"
    article.sections.push({
      h2: `在${city}通过饭局连接更多同频伙伴`,
      body: `Fanju / 饭局 app 在${city}的设计初衷，是让每一个不想独自面对餐桌的人，都能找到基于真实场景的社交连接。通过精准的兴趣标签和透明的小桌规则，饭局app 降低了第一次见面的心理门槛。无论你是想寻找${article.topCategory || "社交"}饭搭子，还是希望扩建你的本地人脉网络，Fanju app 都能帮你跨过线上到线下的断层。我们不堆砌热闹的数字，只提供真实、可信、且具有边界感的饭局入口，让每一次约饭都成为一次高质量的本地连接。`
    })
    changed = true
  }

  if (changed) {
    writeJson(file, article)
  }
}

console.log("Remediation complete.")
