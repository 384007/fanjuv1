import { readJson, walk, abs, writeJson } from "./_content-factory-runtime.mjs"

const READY_DIR = abs("content/articles/ready/index")
const CULTURE_DB = readJson(abs("data/city-culture.json"))

for (const file of walk(READY_DIR)) {
  if (!file.endsWith(".json")) continue
  const article = readJson(file)
  
  // Identify city/category - assuming these fields exist in metadata
  const citySlug = article.city?.slug || "general"
  const categoryName = article.topCategory || "社交"
  const keyword = article.primaryKeyword || "饭搭子"

  // Log for verification
  console.log(`Processing: City=${citySlug}, Category=${categoryName}`)

  const culture = CULTURE_DB[citySlug] || { food: "多元化餐饮", culture: "包容的城市饮食文化", scene: "寻找同城饭友" }
  
  // Unique Generation
  article.title = `${article.city?.zh || "同城"}${keyword} — ${article.city?.zh || "本地"}约饭找饭局 | Fanju`
  article.metaDescription = `在${article.city?.zh || "同城"}寻找${keyword}，体验${culture.food}。Fanju 饭局为你提供${categoryName}下的真实线下连接。`
  article.h1 = `在${article.city?.zh || "同城"}找${keyword}`

  // Ensure dynamic section
  article.sections = article.sections.filter(s => !s.body.includes("Fanju 为什么是你的饭搭子首选")) // Remove old hardcoded
  article.sections.push({
    h2: `在${article.city?.zh || "同城"}寻找${keyword}的独特体验`,
    body: `${culture.culture} ${culture.scene} 在 Fanju 饭局，我们鼓励用户基于${categoryName}主题，建立更具边界感的真实线下连接。`
  })
  
  writeJson(file, article)
}
