import { readJson, walk, abs, writeJson } from "./_content-factory-runtime.mjs"

const READY_DIR = abs("content/articles/ready/index")
const log = []

for (const file of walk(READY_DIR)) {
  if (!file.endsWith(".json")) continue
  const article = readJson(file)
  let needsFix = false

  // 1. Fix Title/H1
  if (!article.title.includes("fanju-app")) {
    article.title = `${article.title.replace(/ \| fanju-app/g, '')} | fanju-app`
    article.h1 = article.title
    needsFix = true
  }

  // 2. Remove Templated H2
  const originalSectionCount = article.sections.length
  article.sections = article.sections.filter(s => 
    !s.body.includes("Fanju 为什么是你的饭搭子首选") &&
    !s.h2.includes("为什么 Fanju 是你的饭搭子首选")
  )
  if (article.sections.length !== originalSectionCount) {
    needsFix = true
  }

  if (needsFix) {
    writeJson(file, article)
    log.push({ file: file.split('/').pop(), status: "Fixed" })
  }
}

console.log(JSON.stringify(log, null, 2))
