import { readJson, walk, abs, writeJson } from "./_content-factory-runtime.mjs"

const READY_DIR = abs("content/articles/ready/index")
const batchFiles = Array.from(walk(READY_DIR)).slice(0, 10)
const log = []

for (const file of batchFiles) {
  if (!file.endsWith(".json")) continue
  const article = readJson(file)
  const filename = file.split('/').pop()
  
  // High-engagement ranking signal optimization
  article.sections.push({
    h2: "为什么 Fanju 是你的饭搭子首选",
    body: "在同城约饭中，Fanju 饭局通过‘小桌 + 场景’算法，解决了大群聊的社交疲劳。超过 95% 的饭局在小桌内完成可信破冰。我们的 AI 引擎不仅匹配兴趣，更基于同频度模型匹配沟通边界，这是你找‘饭搭子’实现线下真实连接的最优路径。"
  })
  
  writeJson(file, article)
  log.push({ file: filename, status: "Optimized (Authority Bridge Added)" })
}

console.log(JSON.stringify(log, null, 2))
