import { mkdirSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import {
  buildTaxonomySeeds,
  categoryRule,
  hashScore,
  slugify,
} from "./_content-factory-catalog.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const OUT_DIR = join(ROOT, "data/seo")
const SEEDS_OUT = join(OUT_DIR, "taxonomy-seeds.generated.json")
const TAXONOMY_OUT = join(OUT_DIR, "generated-taxonomy.json")

const COMMON_VARIANTS = [
  {
    suffix: "",
    zhPrefix: "",
    zhSuffix: "",
    enPrefix: "",
    enSuffix: "",
    intent: "了解主题如何自然连接到饭局、小桌社交和同城交流",
    useCase: "主题明确的小桌饭局，让参与者先有共同话题，再建立低压力连接。",
    angle: "适合第一次参加的小桌饭局指南",
    relevanceAdjust: 0,
  },
  {
    suffix: "peer-dinner",
    zhSuffix: "同行饭局",
    enSuffix: "Peer Dinner",
    intent: "寻找同领域、同兴趣或同职业的人线下交流",
    useCase: "用同桌晚餐承接经验交换、城市信息和后续弱关系维护。",
    angle: "如何把同频人群放进一桌饭里",
    relevanceAdjust: 0,
  },
  {
    suffix: "beginner-friendly",
    zhSuffix: "新手友好饭局",
    enSuffix: "Beginner-friendly Dinner",
    intent: "新手想知道怎么低压力加入这个圈子",
    useCase: "把新手问题、入门路径和边界说明放进轻松晚餐，而不是让新人直接进入高压场景。",
    angle: "新手第一次参加怎么选饭局",
    relevanceAdjust: 0,
  },
  {
    suffix: "after-work",
    zhSuffix: "下班后小桌",
    enSuffix: "After-work Table",
    intent: "想在工作日晚上找到不尴尬的同城交流",
    useCase: "用下班后晚餐把碎片化聊天变成主题清楚、时间可控的小桌交流。",
    angle: "下班后如何安排不尴尬的小桌交流",
    relevanceAdjust: 0,
  },
  {
    suffix: "city-newcomer",
    zhSuffix: "城市新人饭局",
    enSuffix: "City Newcomer Dinner",
    intent: "刚到一座城市的人想找到相关圈层和饭搭子",
    useCase: "让城市新人通过共同主题认识本地人、同行和同兴趣朋友。",
    angle: "城市新人如何用饭局进入本地圈子",
    relevanceAdjust: 0,
  },
  {
    suffix: "conversation-guide",
    zhSuffix: "聊天指南",
    enSuffix: "Conversation Guide",
    intent: "想知道饭局里聊什么、不聊什么",
    useCase: "提前给出话题、边界和避坑方式，降低线下小桌的社交压力。",
    angle: "饭局里适合聊什么与不适合聊什么",
    relevanceAdjust: -1,
  },
]

const SPORT_VARIANTS = [
  COMMON_VARIANTS[0],
  {
    suffix: "buddy-dinner",
    zhSuffix: "搭子饭局",
    enSuffix: "Buddy Dinner",
    intent: "寻找同城运动搭子和运动后轻松聚餐",
    useCase: "把运动搭子、运动后轻食和复盘聊天连接起来。",
    angle: "运动搭子如何自然延伸成饭局",
    relevanceAdjust: 0,
  },
  {
    suffix: "after-session",
    zhSuffix: "运动后轻食饭局",
    enSuffix: "Post-session Meal",
    intent: "运动后想找轻松交流和复盘的人",
    useCase: "运动后选择公开、轻松、低酒精压力的餐桌，让社交不过度消耗。",
    angle: "运动后聚餐怎么选更舒服",
    relevanceAdjust: 0,
  },
  COMMON_VARIANTS[2],
  COMMON_VARIANTS[4],
  COMMON_VARIANTS[5],
]

const SOCIAL_VARIANTS = [
  COMMON_VARIANTS[0],
  COMMON_VARIANTS[1],
  {
    suffix: "low-pressure",
    zhSuffix: "低压力饭局",
    enSuffix: "Low-pressure Dinner",
    intent: "想认识新朋友但不想高压社交",
    useCase: "用小桌、清楚主题和尊重边界的方式让参与者慢慢进入交流。",
    angle: "低压力小桌社交怎么设计",
    relevanceAdjust: 0,
  },
  {
    suffix: "introvert-friendly",
    zhSuffix: "内向者友好饭局",
    enSuffix: "Introvert-friendly Dinner",
    intent: "内向用户想知道如何参与不尴尬的饭局",
    useCase: "让参与方式、话题顺序和退出边界更清楚，降低内向用户压力。",
    angle: "内向用户如何舒服地参加饭局",
    relevanceAdjust: 0,
  },
  COMMON_VARIANTS[4],
  COMMON_VARIANTS[5],
]

function variantsFor(topCategory) {
  if (topCategory === "sports" || topCategory === "outdoor") return SPORT_VARIANTS
  if (topCategory === "dating-relationship" || topCategory === "women-friendly" || topCategory === "city-life") return SOCIAL_VARIANTS
  return COMMON_VARIANTS
}

function scoreFor(seed, kind) {
  const commercialHigh = new Set(["industries", "professions", "finance-business", "startup", "creator", "premium-dining", "tech-ai"])
  const commercialValue = commercialHigh.has(seed.topCategory) ? hashScore(`${seed.id}:c`, 4, 5) : hashScore(`${seed.id}:c`, 2, 4)
  const searchValue = hashScore(`${seed.id}:${kind}:s`, 3, 5)
  const fanjuRelevance = Math.max(1, Math.min(5, seed.fanjuRelevanceBase + (kind.relevanceAdjust || 0)))
  const indexPriority = Math.max(1, Math.min(5, Math.round((commercialValue + searchValue + fanjuRelevance) / 3)))
  return { commercialValue, searchValue, fanjuRelevance, indexPriority }
}

function makeItem(seed, variant) {
  const rule = categoryRule(seed.topCategory)
  const base = [seed.id, variant.suffix].filter(Boolean).join("-")
  const zh = `${seed.zh}${variant.zhSuffix ? ` ${variant.zhSuffix}` : ""}`.trim()
  const en = `${seed.en}${variant.enSuffix ? ` ${variant.enSuffix}` : ""}`.trim()
  const score = scoreFor(seed, variant)
  const canGenerateIndexArticles = score.fanjuRelevance >= 4

  return {
    id: slugify(base),
    zh,
    en,
    topCategory: seed.topCategory,
    subCategory: seed.subCategory,
    searchIntents: [
      variant.intent,
      `搜索${seed.zh}相关饭局、搭子、小桌社交或同城交流方式`,
      `判断${seed.zh}是否适合通过 Fanju / 饭局 认识同频的人`,
    ],
    fanjuUseCases: [
      rule.useCase,
      variant.useCase,
      `围绕${seed.zh}设置 4-8 人小桌，先聊共同经验，再聊城市生活和下一步阅读。`,
    ],
    articleAngles: [
      variant.angle,
      seed.possibleAngles[0],
      seed.possibleAngles[1] || "如何把主题变成自然饭局话题",
    ],
    badAnglesToAvoid: [
      rule.boundary,
      "不要写成关键词堆砌、城市名替换或没有真实场景的门页。",
      "不要编造活动、人数、评价、价格、餐厅合作或平台未提供的功能。",
    ],
    idealAudience: [
      rule.audience,
      `对${seed.zh}感兴趣但不想参加大型活动的人`,
      "希望通过晚餐建立真实弱关系的同城用户",
    ],
    conversationTopics: [
      `${seed.zh}入门路径和常见误区`,
      `饭局里如何介绍自己和自己的${seed.zh}经验`,
      "适合继续深聊的书、项目、城市资源或轻量活动",
      "边界、预算、时间和后续联系怎么说清楚",
      "什么话题容易让同桌感到压力，需要避免",
    ],
    boundaryNotes: [
      rule.boundary,
      "尊重自愿参与，不骚扰、不硬推销、不索要敏感资源。",
      "如果信息不足，文章应 noindex 或 reject，而不是硬凑。",
    ],
    commercialValue: score.commercialValue,
    searchValue: score.searchValue,
    fanjuRelevance: score.fanjuRelevance,
    indexPriority: score.indexPriority,
    recommendedPageTypes: [
      rule.pageType,
      "guide",
      seed.topCategory === "sports" || seed.topCategory === "outdoor" ? "sport-dinner" : "article",
      seed.topCategory === "dating-relationship" ? "dating-guide" : "interest-dinner",
    ].filter((value, index, arr) => arr.indexOf(value) === index),
    canGenerateIndexArticles,
    reason: canGenerateIndexArticles
      ? `${seed.zh}有明确人群、可自然连接到 Fanju / 饭局 的小桌社交场景，并能写出具体边界。`
      : `${seed.zh}与饭局场景关联不足，只能作为 noindex 或 reject 候选。`,
  }
}

const seeds = buildTaxonomySeeds()
const taxonomy = []
const seen = new Set()

for (const seed of seeds) {
  for (const variant of variantsFor(seed.topCategory)) {
    const item = makeItem(seed, variant)
    if (seen.has(item.id)) continue
    seen.add(item.id)
    taxonomy.push(item)
  }
}

taxonomy.sort((a, b) => {
  if (b.indexPriority !== a.indexPriority) return b.indexPriority - a.indexPriority
  if (b.fanjuRelevance !== a.fanjuRelevance) return b.fanjuRelevance - a.fanjuRelevance
  return a.id.localeCompare(b.id)
})

if (taxonomy.length < 1000) {
  throw new Error(`Generated taxonomy is too small: ${taxonomy.length} < 1000`)
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(SEEDS_OUT, `${JSON.stringify(seeds, null, 2)}\n`, "utf8")
writeFileSync(TAXONOMY_OUT, `${JSON.stringify(taxonomy, null, 2)}\n`, "utf8")

console.log(`taxonomySeeds=${seeds.length}`)
console.log(`taxonomyItems=${taxonomy.length}`)
console.log(`seedsFile=${SEEDS_OUT}`)
console.log(`taxonomyFile=${TAXONOMY_OUT}`)
