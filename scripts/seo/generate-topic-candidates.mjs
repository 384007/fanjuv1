import { existsSync } from "fs"
import { abs, loadExistingArticlePaths, loadValidInternalUrls, readJson, selectLinks, writeJson } from "./_content-factory-runtime.mjs"
import { categoryRule, hashScore } from "./_content-factory-catalog.mjs"
import { loadCities } from "./_seo-data-loader.mjs"

const TAXONOMY_FILE = abs("data/seo/generated-taxonomy.json")
const OUT_FILE = abs("data/seo/article-candidates.json")
const MIN_CANDIDATES = Number.parseInt(process.env.SEO_TOPIC_MIN || "3000", 10)
const MAX_CANDIDATES = Number.parseInt(process.env.SEO_TOPIC_MAX || "5000", 10)

if (!existsSync(TAXONOMY_FILE)) {
  console.error("Missing data/seo/generated-taxonomy.json. Run: pnpm seo:taxonomy")
  process.exit(1)
}

const taxonomy = readJson(TAXONOMY_FILE, [])
const cities = loadCities()
const validUrls = loadValidInternalUrls()
const existing = loadExistingArticlePaths()

// High priority cities for more frequent coverage
const priorityCities = [
  "shenzhen",
  "shanghai",
  "beijing",
  "hangzhou",
  "guangzhou",
  "chengdu",
]

const cityRotation = [
  ...priorityCities,
  "singapore",
  "new-york",
  "san-francisco",
  "london",
  "tokyo",
  "hong-kong",
  "taipei",
  "toronto",
  "sydney",
  "xiamen",
  "changsha",
  "nanjing",
  "suzhou",
  "wuhan",
  "chongqing",
  "xian",
  "qingdao",
  "zhengzhou",
  "foshan",
  "dongguan",
  "zhuhai",
  "tianjin",
  "ningbo",
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
    return `${item.en} | Find a Dinner Buddy${place} — Fanju 饭局`
  }
  const place = city ? `${city.name}` : "同城"
  return `${place}${item.zh}饭局 — 找${item.zh}饭搭子约饭 | Fanju`
}

function primaryKeywordFor(item, language, city) {
  if (language === "en") return `${item.en.toLowerCase()} dinner buddy${city ? ` ${city.nameEn}` : ""}`
  return `${city ? city.name : ""}${item.zh}饭搭子`.replace(/\s+/g, "")
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

const candidates = []
const seenPaths = new Set(existing.keys())

// Generate multiple passes to reach the target count
const loops = [
  { cityFreq: 1, langFreq: 10 }, // Pass 1: 100% cities, mostly Chinese
  { cityFreq: 0, langFreq: 5 },  // Pass 2: 0% cities, more English
  { cityFreq: 0.5, langFreq: 8 }, // Pass 3: 50% cities
]

for (const loop of loops) {
  for (let i = 0; i < taxonomy.length && candidates.length < MAX_CANDIDATES; i++) {
    const item = taxonomy[i]
    const rule = categoryRule(item.topCategory)
    const priority = priorityFor(item)
    
    // Determine city based on loop frequency
    const city = loop.cityFreq === 1 
      ? cityRotation[i % cityRotation.length]
      : (loop.cityFreq === 0 ? null : (hashScore(`${item.id}:${loop.cityFreq}`, 0, 1) === 0 ? cityRotation[i % cityRotation.length] : null))

    const language = i % loop.langFreq === 0 && /[a-z]/.test(item.en) ? "en" : "zh"
    
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
      topicId: `${item.id}-${language}${city ? `-${city.slug}` : ""}`,
      language,
      title,
      slug,
      canonicalPath,
      primaryKeyword: primaryKeywordFor(item, language, city),
      secondaryKeywords: language === "en"
        ? ["dinner buddy", "social dining", "find a dinner buddy", "Fanju"]
        : ["饭局", "饭搭子", "约饭", "同城约饭", "找饭局"],
      taxonomyId: item.id,
      topCategory: item.topCategory,
      city: city ? { slug: city.slug, zh: city.name, en: city.nameEn, countryCode: city.countryCode || "CN" } : null,
      audience: rule.audience,
      searchIntent: item.searchIntents[0],
      userProblem: language === "en"
        ? `The reader is looking for a dinner buddy for ${item.en} and wants to join a real-life Fanju dinner.`
        : `用户想找${item.zh}饭搭子，不想一个人吃饭，想通过 饭局app 参加真实的同城约饭。`,
      fanjuAngle: item.fanjuUseCases[0],
      articleType: rule.pageType,
      contentPromise: language === "en"
        ? `Find your ${item.en} dinner buddy at a Fanju dinner. We explain who it suits, how to choose a table, and safety boundaries for meeting strangers over dinner.`
        : `不想一个人吃饭？来 Fanju 找${item.zh}饭搭子。本文说明谁适合参加、如何选择饭局、小桌人数建议、适合聊什么、不适合聊什么、安全边界，以及 饭局app 如何帮你建立真实线下连接。`,
      requiredSections: [
        "直接答案",
        "适合人群",
        "为什么适合通过饭局找饭搭子",
        "第一次参加怎么选",
        "小桌人数建议",
        "适合聊什么",
        "不适合聊什么",
        "安全和边界感",
        "如何避免尴尬",
        "Fanju / 饭局 的平台价值",
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
