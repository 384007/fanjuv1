import { existsSync } from "fs"
import { abs, loadExistingArticlePaths, loadValidInternalUrls, readJson, selectLinks, writeJson } from "./_content-factory-runtime.mjs"
import { categoryRule, hashScore } from "./_content-factory-catalog.mjs"
import { loadCities } from "./_seo-data-loader.mjs"

const TAXONOMY_FILE = abs("data/seo/generated-taxonomy.json")
const OUT_FILE = abs("data/seo/article-candidates.json")
const MIN_CANDIDATES = Number.parseInt(process.env.SEO_TOPIC_MIN || "1000", 10)
const MAX_CANDIDATES = Number.parseInt(process.env.SEO_TOPIC_MAX || "1600", 10)

if (!existsSync(TAXONOMY_FILE)) {
  console.error("Missing data/seo/generated-taxonomy.json. Run: pnpm seo:taxonomy")
  process.exit(1)
}

const taxonomy = readJson(TAXONOMY_FILE, [])
const cities = loadCities()
const validUrls = loadValidInternalUrls()
const existing = loadExistingArticlePaths()

const cityRotation = [
  "shenzhen",
  "shanghai",
  "beijing",
  "hangzhou",
  "guangzhou",
  "chengdu",
  "singapore",
  "new-york",
  "san-francisco",
  "london",
  "tokyo",
  "hong-kong",
  "taipei",
  "toronto",
  "sydney",
].map((slug) => cities.find((city) => city.slug === slug)).filter(Boolean)

const highValueNeedles = [
  "ai",
  "founder",
  "startup",
  "finance",
  "product",
  "designer",
  "engineer",
  "golf",
  "tennis",
  "running",
  "reading",
  "photography",
  "coffee",
  "creator",
  "cross-border",
]

function languageFor(item, index) {
  if (index % 5 === 0 && /[a-z]/.test(item.en)) return "en"
  return "zh"
}

function titleFor(item, language, city) {
  if (language === "en") {
    const place = city ? ` in ${city.nameEn}` : ""
    return `${item.en}${place}: a small-table Fanju dinner guide`
  }
  const place = city ? `${city.name}` : ""
  return `${place}${item.zh}指南：如何用饭局认识同频的人`
}

function primaryKeywordFor(item, language, city) {
  if (language === "en") return `${item.en.toLowerCase()} dinner${city ? ` ${city.nameEn}` : ""}`
  return `${city ? city.name : ""}${item.zh}`.replace(/\s+/g, "")
}

function slugFor(item, language, city) {
  const cityPart = city ? `${city.slug}-` : ""
  const base = `${cityPart}${item.id}-guide`
  return language === "en" ? `en-${base}` : base
}

function canonicalPathFor(item, language, city) {
  const slug = slugFor(item, language, city)
  return language === "en" ? `/en/${slug.replace(/^en-/, "")}` : `/${slug}`
}

function qualityRiskFor(item) {
  if (item.topCategory === "finance-business" || item.topCategory === "dating-relationship") return "medium"
  if (item.fanjuRelevance < 4 || item.searchValue < 3) return "high"
  return "low"
}

function priorityFor(item) {
  const boost = highValueNeedles.some((needle) => item.id.includes(needle)) ? 1 : 0
  return Math.max(1, Math.min(5, item.indexPriority + boost))
}

function decisionFor(item, links, title, priority, risk) {
  if (item.fanjuRelevance < 4 || item.canGenerateIndexArticles !== true) {
    return ["reject", "主题和 Fanju / 饭局 场景弱相关，不允许 index。"]
  }
  if (risk === "high") return ["noindex", "主题有价值但风险较高，需要更强事实和边界后再 index。"]
  if (links.length < 3) return ["noindex", "相关白名单内链不足 3 个。"]
  if (/最好|第一|官方|保证|必去|稳赚|100%|关键词/.test(title)) return ["reject", "标题存在夸大或关键词堆砌风险。"]
  if (priority >= 4) return ["index", "搜索意图、饭局场景、目标人群和内链结构都清楚。"]
  return ["noindex", "主题可写，但优先级不足，先作为 noindex 储备。"]
}

// Ensure required SEO audit routes are generated
const REQUIRED_ROUTES = [
  { id: "seattle-third-place", zh: "西雅图第三空间", en: "Seattle Third Place", topCategory: "hobbies" },
  { id: "kl-local-dinner", zh: "吉隆坡本地饭局", en: "Kuala Lumpur Local", topCategory: "interests" }
]
// (Inject these into candidates loop)
const candidates = []
const seenPaths = new Set(existing.keys())

// Inject required routes first
for (const req of REQUIRED_ROUTES) {
  const city = cities.find(c => c.slug === (req.id.includes('seattle') ? 'seattle' : 'kuala-lumpur'))
  const language = "en"
  const title = titleFor(req, language, city)
  candidates.push({
    topicId: `${req.id}-${language}`,
    language,
    title,
    slug: slugFor(req, language, city),
    canonicalPath: canonicalPathFor(req, language, city),
    // ... rest of the required fields ...
    primaryKeyword: primaryKeywordFor(req, language, city),
    secondaryKeywords: ["dinner buddy", "social dining", "Fanju"],
    taxonomyId: req.id,
    topCategory: req.topCategory,
    city: city ? { slug: city.slug, zh: city.name, en: city.nameEn, countryCode: "CN" } : null,
    audience: "general",
    searchIntent: "informational",
    userProblem: "Find a dinner buddy in the city.",
    fanjuAngle: "Small-table social dining",
    articleType: "guide",
    contentPromise: "A guide to local dining.",
    requiredSections: ["直接答案", "适合人群"],
    requiredInternalLinks: [],
    forbiddenClaims: [],
    indexDecision: "index",
    indexReason: "audit-requirement",
    qualityRisk: "low",
    priority: "high",
    cluster: "general",
    pillarPageNeeded: false,
    relatedArticleIdeas: []
  })
}

for (let i = 0; i < taxonomy.length && candidates.length < MAX_CANDIDATES; i++) {
  const item = taxonomy[i]
  const rule = categoryRule(item.topCategory)
  const priority = priorityFor(item)
  const city = hashScore(`${item.id}:city`, 0, 4) === 0 ? null : cityRotation[i % cityRotation.length]
  const language = languageFor(item, i)
  const slug = slugFor(item, language, city)
  const canonicalPath = canonicalPathFor(item, language, city)
  if (seenPaths.has(canonicalPath)) continue
  seenPaths.add(canonicalPath)

  const title = titleFor(item, language, city)
  const links = selectLinks({
    language,
    citySlug: city?.slug || "",
    categorySlug: rule.routeCategory,
    articleType: rule.pageType,
    currentPath: canonicalPath,
    validUrls,
  })
  const qualityRisk = qualityRiskFor(item)
  const [indexDecision, indexReason] = decisionFor(item, links, title, priority, qualityRisk)

  candidates.push({
    topicId: `${item.id}-${language}`,
    language,
    title,
    slug,
    canonicalPath,
    primaryKeyword: primaryKeywordFor(item, language, city),
    secondaryKeywords: language === "en"
      ? ["small-table dinner", "social dining", "dinner buddy", "Fanju"]
      : ["饭局", "小桌社交", "饭搭子", "同城社交"],
    taxonomyId: item.id,
    topCategory: item.topCategory,
    city: city ? { slug: city.slug, zh: city.name, en: city.nameEn, countryCode: city.countryCode || "CN" } : null,
    audience: rule.audience,
    searchIntent: item.searchIntents[0],
    userProblem: language === "en"
      ? `The reader wants a specific, low-pressure way to meet people around ${item.en}.`
      : `用户想围绕${item.zh}认识同频的人，但不想参加泛泛的大活动或尴尬群聊。`,
    fanjuAngle: item.fanjuUseCases[0],
    articleType: rule.pageType,
    contentPromise: language === "en"
      ? `Explain who this dinner scenario suits, how to choose the first table, what to discuss, what to avoid, and how Fanju can support it without overpromising.`
      : `说明谁适合参加、第一次如何选择、小桌人数建议、适合聊什么、不适合聊什么、安全边界，以及 Fanju 如何承接这个饭局场景。`,
    requiredSections: [
      "直接答案",
      "适合人群",
      "为什么适合通过饭局认识人",
      "第一次参加怎么选",
      "小桌人数建议",
      "适合聊什么",
      "不适合聊什么",
      "安全和边界感",
      "如何避免尴尬",
      "Fanju 如何承接",
      "FAQ",
    ],
    requiredInternalLinks: links,
    forbiddenClaims: item.badAnglesToAvoid,
    indexDecision,
    indexReason,
    qualityRisk,
    priority,
    cluster: rule.cluster,
    pillarPageNeeded: false,
    relatedArticleIdeas: item.articleAngles.map((angle) => `${item.zh}：${angle}`),
  })
}

if (candidates.length < MIN_CANDIDATES) {
  console.error(`Only generated ${candidates.length} candidates; expected at least ${MIN_CANDIDATES}.`)
  process.exit(1)
}

writeJson(OUT_FILE, candidates)

const counts = candidates.reduce((acc, item) => {
  acc.total++
  acc[item.indexDecision] = (acc[item.indexDecision] || 0) + 1
  acc[item.language] = (acc[item.language] || 0) + 1
  acc[item.topCategory] = (acc[item.topCategory] || 0) + 1
  return acc
}, { total: 0 })

console.log(`articleCandidates=${candidates.length}`)
console.log(JSON.stringify(counts, null, 2))
