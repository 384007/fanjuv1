// Build a deterministic random prompt bank for SEO articles.
//
//   Input:  data/seo/route-manifest.json
//   Output: data/seo/random-prompt-bank.jsonl
//
// Each line of the output JSONL is a complete prompt object that downstream
// generation scripts can consume directly. This script does NOT contact any
// AI provider — it only builds prompt strings.
//
// Environment variables:
//   LIMIT        total number of prompts to emit. Default 1000.
//   LANG         "all" | "en" | "zh". Default "all".
//                If "all", LIMIT is split 50/50 between en & zh.
//   RANDOM_SEED  string used to make the random selection deterministic.
//   OUTPUT_FILE  override for the output JSONL.
//
// Hard rules enforced:
//   - Every selected route must exist in the route manifest.
//   - The combination
//       (route, locale, topicSlug, angle.id, structure, openingStyle,
//        faqMode, ctaPosition)
//     must be unique across all emitted prompts.
//   - promptHash and profileHash must each be unique.
//   - English prompts only sample English angles/tones; same for ZH.

import { createHash } from "crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import {
  ARTICLE_BRIEF_VERSION,
  historicalSkipReason,
  loadPromptBankHistory,
  localeCityTypeKeyFor,
  pathFromRoot,
  routeKeyFor,
} from "./prompt-bank-history.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const MANIFEST_FILE = pathFromRoot(ROOT, process.env.MANIFEST_FILE || "data/seo/route-manifest.json")
const DEFAULT_OUT_FILE = join(ROOT, "data/seo/random-prompt-bank.jsonl")

const LIMIT = Number.parseInt(process.env.LIMIT || "1000", 10)
const LANG = (process.env.LANG || "all").toLowerCase()
const RANDOM_SEED = process.env.RANDOM_SEED || "20260516"
const EN_TOP_CITY_LIMIT = Math.max(1, Number.parseInt(process.env.EN_TOP_CITY_LIMIT || "100", 10))
const OUTPUT_FILE = process.env.OUTPUT_FILE
  ? join(ROOT, process.env.OUTPUT_FILE)
  : DEFAULT_OUT_FILE
const TARGET_ROUTES = new Set(
  (process.env.TARGET_ROUTES || "")
    .split(",")
    .map((route) => route.trim())
    .filter(Boolean),
)

// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32) + 32-bit seed derived from the seed string.
// ---------------------------------------------------------------------------

function seedFromString(s) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

function mulberry32(seed) {
  let s = seed >>> 0
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

function shuffleInPlace(rng, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function balancedRoutePool(rng, routes) {
  const cityGroups = new Map()
  for (const route of routes) {
    if (!cityGroups.has(route.citySlug)) cityGroups.set(route.citySlug, [])
    cityGroups.get(route.citySlug).push(route)
  }

  const cities = shuffleInPlace(rng, [...cityGroups.keys()])
  for (const city of cities) shuffleInPlace(rng, cityGroups.get(city))

  const out = []
  let round = 0
  while (out.length < routes.length) {
    let added = 0
    for (const city of cities) {
      const group = cityGroups.get(city)
      if (round >= group.length) continue
      out.push(group[round])
      added++
    }
    if (added === 0) break
    round++
  }
  return out
}

function routeEligibleForLocale(route, locale) {
  const countryCode = String(route.countryCode || "CN").toUpperCase()
  if (locale === "zh") {
    return ["CN", "HK", "MO", "TW"].includes(countryCode)
  }
  if (locale === "en") {
    const enRank = Number(route.enRank || 0)
    return enRank >= 1 && enRank <= EN_TOP_CITY_LIMIT
  }
  return true
}

function assertZhCityDisplayNames(entries) {
  const bad = entries.filter((entry) => {
    const countryCode = String(entry.countryCode || "CN").toUpperCase()
    return entry.locale === "zh"
      && ["CN", "HK", "MO", "TW"].includes(countryCode)
      && !/[\u4e00-\u9fff]/.test(String(entry.cityNameLocalized || ""))
  })
  if (bad.length > 0) {
    const sample = bad.slice(0, 12).map((entry) => `${entry.route}:${entry.cityNameLocalized || "(missing)"}`).join(", ")
    throw new Error(`ZH CN/HK/MO/TW city display names must be Chinese, not pinyin/English. Bad entries: ${sample}`)
  }
}

function buildCityNameIndex(entries) {
  const index = new Map()
  for (const entry of entries) {
    if (!entry?.citySlug) continue
    if (!index.has(entry.citySlug)) index.set(entry.citySlug, {})
    const names = index.get(entry.citySlug)
    if (entry.locale === "zh" && entry.cityNameLocalized) names.zh = entry.cityNameLocalized
    if (entry.locale === "en" && entry.cityNameLocalized) names.en = entry.cityNameLocalized
  }
  return index
}

function sha256Hex(s) {
  return createHash("sha256").update(s).digest("hex")
}

// ---------------------------------------------------------------------------
// Profile dimensions. Each list is intentionally long so the cartesian product
// is deep, even though we only emit a few hundred prompts per locale.
// ---------------------------------------------------------------------------

const ANGLES_EN = [
  { id: "first_timer_view", name: "First-timer perspective", instruction: "Write from the perspective of someone considering their first Fanju dinner. Start with hesitation, uncertainty, or curiosity. Explain what the experience feels like before explaining the platform." },
  { id: "host_view", name: "Host perspective", instruction: "Write from the perspective of someone who hosts dinners regularly. Explain what makes a table feel right, how to keep conversation flowing, and what a Fanju dinner looks like from the host side." },
  { id: "safety_trust_view", name: "Safety and trust perspective", instruction: "Frame the article around how a small dinner can feel safe and trustworthy: public venues, real names, small tables, host follow-through." },
  { id: "community_building_view", name: "Community-building perspective", instruction: "Treat dinners as the smallest unit of city community. Talk about repeat tables, neighbours, and how small groups grow into a real social fabric." },
  { id: "expat_newcomer_view", name: "Expat / newcomer perspective", instruction: "Write for someone who recently moved to the city and wants their first authentic local connection through dinner." },
  { id: "local_food_discovery_view", name: "Local food discovery perspective", instruction: "Centre the piece on what gets eaten and where. The dinner is the thread that ties together a real local food map." },
  { id: "loneliness_solution_view", name: "Loneliness solution perspective", instruction: "Acknowledge how lonely big cities can feel and present a small dinner as a low-pressure way back into in-person life." },
  { id: "business_networking_view", name: "Business networking perspective", instruction: "For founders, operators and professionals — explain how a small dinner replaces awkward networking events." },
  { id: "weekend_plan_view", name: "Weekend planning perspective", instruction: "Position dinner as the centre of the weekend, not an afterthought. What to do before, during and after." },
  { id: "city_lifestyle_view", name: "City lifestyle perspective", instruction: "Use the city's own rhythm — neighbourhoods, transit, dining culture — as the structuring device." },
  { id: "date_free_social_view", name: "Date-free social perspective", instruction: "Make it explicit that this is not a dating event. Explain what changes when there is no romantic pressure." },
  { id: "group_dinner_view", name: "Group-dinner perspective", instruction: "Talk about the dynamics of a 6–12 person table: who speaks, who orders, how the night flows." },
  { id: "private_table_view", name: "Private-table perspective", instruction: "Focus on the calmer, more intentional version of a Fanju dinner — small, considered, private." },
  { id: "authentic_local_life_view", name: "Authentic local life perspective", instruction: "Argue that a real dinner with local hosts beats any tourist itinerary." },
  { id: "post_work_dinner_view", name: "After-work dinner perspective", instruction: "Frame the dinner as a low-effort end of the working day instead of going home alone." },
  { id: "introvert_friendly_view", name: "Introvert-friendly perspective", instruction: "Explain why a small, structured dinner is dramatically easier for introverts than a bar or a meetup." },
  { id: "women_friendly_view", name: "Women-friendly perspective", instruction: "Centre the article on how the format and small-table structure make it comfortable for women in particular." },
  { id: "solo_traveler_view", name: "Solo traveller perspective", instruction: "For someone passing through the city alone, explain what an evening looks like when they join a Fanju table." },
  { id: "remote_worker_view", name: "Remote worker perspective", instruction: "Speak to people who work from home or alone and need a recurring social anchor in their week." },
  { id: "neighborhood_discovery_view", name: "Neighbourhood discovery perspective", instruction: "Use one specific neighbourhood as the lens — what dinner here feels like, who shows up, what they eat." },
  { id: "premium_social_dining_view", name: "Premium social dining perspective", instruction: "Take the more curated, higher-craft version of the dinner seriously. Talk about menus, hosts, intent." },
  { id: "food_as_connection_view", name: "Food as connection perspective", instruction: "Argue that food is the fastest connector between strangers and use that to organise the article." },
  { id: "offline_social_reboot_view", name: "Offline social reboot perspective", instruction: "Position the dinner as a way to reset social habits after years of mostly-online connection." },
  { id: "city_arrival_view", name: "Just-arrived perspective", instruction: "Speak to someone who just arrived in the city this month and is figuring out where to start." },
  { id: "small_table_big_city_view", name: "Small table in a big city perspective", instruction: "Contrast the scale of the city with the intimacy of a small dinner table — that contrast is the article." },
]

const ANGLES_ZH = [
  { id: "first_timer_view", name: "第一次参加饭局的人视角", instruction: "从一个第一次想报名 Fanju 饭局的人的视角写。先写出他的犹豫、不确定或好奇，再描述这场饭局的感觉，最后才解释平台逻辑。" },
  { id: "host_view", name: "主办方组织者视角", instruction: "从经常组织小桌饭局的主办方角度写。讨论一桌人怎样才算合适、怎样让聊天自然延展、Fanju 饭局在主办方一侧是什么样子。" },
  { id: "safety_trust_view", name: "安全和信任视角", instruction: "围绕「一桌小饭局如何让人觉得安全」展开：公开餐厅、真实身份、小桌、主办方跟进。" },
  { id: "community_building_view", name: "城市社区建设视角", instruction: "把饭局当作城市社区的最小单元。聊回头桌、邻居关系，以及小桌如何长成稳定的城市社交骨架。" },
  { id: "expat_newcomer_view", name: "新来城市的人视角", instruction: "写给刚搬来这座城市、还没有本地朋友、想通过一顿饭获得真实连接的人。" },
  { id: "local_food_discovery_view", name: "本地美食探索视角", instruction: "以「这一顿到底吃了什么、在哪吃」为主线，把饭局当成串起真实本地餐厅地图的一根线。" },
  { id: "loneliness_solution_view", name: "解决孤独和社交断层视角", instruction: "正视大城市的孤独感，把一桌小饭局当作低压力地回到线下生活的方式。" },
  { id: "business_networking_view", name: "商务饭局人脉视角", instruction: "面向创业者、经营者、专业人士，解释一桌小饭局如何替代尴尬的 networking 活动。" },
  { id: "weekend_plan_view", name: "周末活动安排视角", instruction: "把饭局当作周末的核心节目而不是顺手的事，写清楚饭前、饭中、饭后的真实节奏。" },
  { id: "city_lifestyle_view", name: "城市生活方式视角", instruction: "用这座城市自己的节奏（街区、交通、本地餐饮文化）来组织文章。" },
  { id: "date_free_social_view", name: "非相亲社交视角", instruction: "明确说这不是相亲活动，解释当没有恋爱压力时，整桌的氛围会发生什么变化。" },
  { id: "group_dinner_view", name: "小桌饭局视角", instruction: "聊 6–12 人小桌的真实动态：谁开口、怎么点菜、整晚怎么走。" },
  { id: "private_table_view", name: "私密饭局视角", instruction: "聚焦更安静、更有意图的版本：小、慎重、私密。" },
  { id: "authentic_local_life_view", name: "真实本地生活视角", instruction: "论证「跟本地主办方吃一顿饭」远比任何旅游攻略更接近真实生活。" },
  { id: "post_work_dinner_view", name: "下班后饭局视角", instruction: "把饭局写成一种「不再独自回家」的低成本结束工作日方式。" },
  { id: "introvert_friendly_view", name: "内向者友好视角", instruction: "解释为什么一桌小且有结构的饭局对内向者来说远比酒吧或大型活动更舒服。" },
  { id: "women_friendly_view", name: "女性友好视角", instruction: "围绕这种格式与小桌结构如何让女性更安心展开。" },
  { id: "solo_traveler_view", name: "独自旅行者视角", instruction: "面向一个独自路过这座城市的旅行者，写他加入一桌 Fanju 饭局的一晚是什么样子。" },
  { id: "remote_worker_view", name: "远程工作者视角", instruction: "面向在家或独自办公、每周需要一个稳定线下锚点的人。" },
  { id: "neighborhood_discovery_view", name: "街区探索视角", instruction: "用一个具体街区做主轴，讲在这里吃饭是什么感觉、来吃饭的是谁、点的是什么。" },
  { id: "premium_social_dining_view", name: "轻高端社交饭局视角", instruction: "认真对待更精选、更讲究的那一版：菜单、主办方功底、桌上意图。" },
  { id: "food_as_connection_view", name: "用美食连接人的视角", instruction: "论证食物是陌生人之间最快的连接器，并把整篇文章按这个逻辑组织。" },
  { id: "offline_social_reboot_view", name: "线下社交重启视角", instruction: "把饭局写成在长期线上社交后重新打开线下生活的方式。" },
  { id: "city_arrival_view", name: "刚到一座城市的视角", instruction: "面向这个月刚到这座城市的人，写他从哪里开始、第一桌饭怎么坐下来。" },
  { id: "small_table_big_city_view", name: "大城市小桌饭局视角", instruction: "用「城市的大」与「饭桌的小」之间的反差作为整篇文章的核心。" },
]

const STRUCTURES = [
  "story_first",
  "pain_point_first",
  "city_observation_first",
  "checklist_style",
  "guide_style",
  "comparison_style",
  "myth_vs_reality",
  "scenario_based",
  "question_driven",
  "listicle_but_natural",
  "mini_case_study",
  "local_playbook",
  "beginner_walkthrough",
  "trust_framework",
  "community_manifesto",
  "problem_solution",
  "before_after",
  "field_guide",
  "decision_tree",
  "social_script",
]

const OPENING_STYLES = [
  "start_with_scene",
  "start_with_question",
  "start_with_contrast",
  "start_with_problem",
  "start_with_city_detail",
  "start_with_micro_story",
  "start_with_social_observation",
  "start_with_user_intent",
  "start_with_misconception",
  "start_with_weekend_moment",
  "start_with_after_work_moment",
  "start_with_newcomer_moment",
]

const FAQ_MODES = [
  "no_faq",
  "one_question_only",
  "short_faq_middle",
  "short_faq_end",
  "faq_as_subsections",
  "practical_questions_only",
  "faq_inside_guide",
  "faq_as_objections",
  "no_formal_faq",
]

const CTA_POSITIONS = [
  "no_hard_cta",
  "soft_cta_middle",
  "soft_cta_end",
  "contextual_cta_after_intro",
  "cta_inside_practical_section",
  "city_specific_cta",
  "cta_after_example",
  "cta_before_final_section",
  "no_cta_only_brand_mention",
]

const TITLE_PATTERNS = [
  "question_based",
  "city_first",
  "pain_point_based",
  "beginner_based",
  "comparison_based",
  "scenario_based",
  "trust_based",
  "community_based",
  "weekend_based",
  "after_work_based",
  "local_life_based",
]

const TONES_EN = [
  "warm",
  "practical",
  "local",
  "calm",
  "premium",
  "community_driven",
  "beginner_friendly",
  "trustworthy",
  "modern_city_life",
]

const TONES_ZH = [
  "温暖",
  "实用",
  "本地感",
  "平静可信",
  "轻高级",
  "社区感",
  "新手友好",
  "信任感",
  "现代城市生活感",
]

const EXAMPLE_TYPES = [
  "first_dinner_example",
  "host_example",
  "weekend_dinner_example",
  "after_work_dinner_example",
  "newcomer_dinner_example",
  "neighbourhood_dinner_example",
  "small_table_example",
  "introvert_dinner_example",
  "founder_dinner_example",
  "remote_worker_dinner_example",
]

const TITLE_DIRECTIONS_EN = {
  question_based: "make the H1 a decision question, but not a generic FAQ line",
  city_first: "start from a local city tension, then connect it to Fanju app",
  pain_point_based: "name the reader's social problem before naming the topic",
  beginner_based: "speak to a first-timer without using the word guide as the main hook",
  comparison_based: "contrast a Fanju dinner with meetups, group chats, or dating apps",
  scenario_based: "anchor the H1 in one concrete evening scenario",
  trust_based: "make trust and table quality the editorial hook",
  community_based: "make the small-table community idea the hook",
  weekend_based: "make the weekend or after-hours decision the hook",
  after_work_based: "make the post-work social gap the hook",
  local_life_based: "make local life and neighbourhood fit the hook",
}

const TITLE_DIRECTIONS_ZH = {
  question_based: "把 H1 写成一个具体决策问题，但不要写成通用 FAQ",
  city_first: "先写这座城市里的一个真实社交张力，再接到饭局app",
  pain_point_based: "先点出读者的社交难题，再落到本主题",
  beginner_based: "写给第一次参加的人，但不要用“指南/攻略”当主标题",
  comparison_based: "对比饭局app与群聊、相亲局或大型活动的差别",
  scenario_based: "把 H1 锚定在一个具体晚饭场景里",
  trust_based: "用信任感、主理人和同桌质量作为标题钩子",
  community_based: "用小桌如何长出城市社区作为标题钩子",
  weekend_based: "用周末或下班后的选择作为标题钩子",
  after_work_based: "用下班后不想独自回家的空档作为标题钩子",
  local_life_based: "用本地生活和街区适配作为标题钩子",
}

function titleDirectionFor(profile) {
  const map = profile.locale === "en" ? TITLE_DIRECTIONS_EN : TITLE_DIRECTIONS_ZH
  return map[profile.titlePattern] || (profile.locale === "en" ? "use a specific editorial hook" : "使用一个具体编辑钩子")
}

const BRIEF_POOLS = {
  en: {
    readerIntent: [
      "decide whether this dinner format is worth joining soon",
      "compare Fanju with a loose meetup or group chat",
      "understand who will be at the table before committing",
      "find a low-pressure way to meet people through dinner",
      "judge whether the host and table rhythm feel credible",
    ],
    readerStage: ["first consideration", "ready to compare options", "one step before RSVP", "new to the city", "returning after a long social gap"],
    localScene: [
      "an after-work evening when going straight home feels too small",
      "a weekend meal where the table matters more than the venue hype",
      "a first arrival at a restaurant with no familiar faces yet",
      "a neighbourhood dinner that needs clear expectations before anyone sits down",
      "a small-table night where the opening ten minutes decide the mood",
    ],
    introDirection: [
      "open with a concrete local hesitation, then explain why a named table reduces uncertainty",
      "start from the reader's decision point and make the city context visible immediately",
      "begin with the table, not the platform, then show how Fanju clarifies fit",
      "contrast a vague invite with a small dinner that states its intent up front",
    ],
    sectionFocus: [
      "reader hesitation",
      "guest mix",
      "host reliability",
      "table rhythm",
      "comfort boundaries",
      "local fit",
      "conversation opening",
      "next move",
    ],
  },
  zh: {
    readerIntent: [
      "判断这类饭局值不值得报名",
      "比较饭局app和普通群聊约饭的差别",
      "在报名前看清这一桌适不适合自己",
      "找到低压力认识新人的吃饭方式",
      "判断主理人、同桌和饭桌节奏是否靠谱",
    ],
    readerStage: ["第一次考虑报名", "正在比较不同选择", "准备 RSVP 前一步", "刚到这座城市", "想重新回到线下社交"],
    localScene: [
      "下班后不想直接回家的一个晚上",
      "周末想吃顿饭但不想随便拼桌的时刻",
      "一个人到餐厅还没见到熟人的前十分钟",
      "街区饭点里需要先说清楚预期的一桌饭",
      "小桌开场几分钟决定整晚舒不舒服的场景",
    ],
    introDirection: [
      "从一个具体本地犹豫切入，再解释清楚命名饭桌怎样降低不确定",
      "先写读者报名前的判断点，并立刻带出城市语境",
      "先写饭桌而不是平台，再说明饭局app如何让适配度更清楚",
      "对比泛泛邀约和一桌预期清楚的小饭局",
    ],
    sectionFocus: [
      "报名犹豫",
      "同桌组合",
      "主理人可靠性",
      "饭桌节奏",
      "舒适边界",
      "本地适配",
      "开场聊天",
      "下一步动作",
    ],
  },
}

function briefIndex(profile, salt, size) {
  return seedFromString(`${profile.randomSeed}|${profile.route}|${profile.topicSlug}|${profile.angle.id}|${profile.structure}|${profile.openingStyle}|${profile.faqMode}|${profile.ctaPosition}|${profile.titlePattern}|${salt}`) % size
}

function briefPick(profile, salt, values) {
  return values[briefIndex(profile, salt, values.length)]
}

function articleBriefFor(profile, frame) {
  const isEn = profile.locale === "en"
  const pools = isEn ? BRIEF_POOLS.en : BRIEF_POOLS.zh
  const city = profile.cityNameLocalized
  const type = profile.topicNameLocalized
  const localScene = briefPick(profile, "local-scene", pools.localScene)
  const readerIntent = briefPick(profile, "reader-intent", pools.readerIntent)
  const readerStage = briefPick(profile, "reader-stage", pools.readerStage)
  const introDirection = briefPick(profile, "intro-direction", pools.introDirection)
  const sectionPlan = frame.h2s.map((heading, index) => ({
    level: 2,
    heading,
    focus: briefPick(profile, `section-focus-${index}`, pools.sectionFocus),
    paragraphs: 2,
  }))
  for (const deep of frame.deepHeadings) {
    sectionPlan.push({
      level: deep.level,
      heading: deep.text,
      focus: briefPick(profile, `deep-focus-${deep.level}`, pools.sectionFocus),
      paragraphs: 1,
    })
  }

  const mustInclude = isEn ? [
    `city name: ${city}`,
    `dinner type: ${type}`,
    "who this table is suitable for",
    "why a participant would want to join",
    "how conversation can begin at the table",
    "why a small-table dinner feels easier than a normal gathering",
    `one concrete scene: ${localScene}`,
    "practical advice before joining",
  ] : [
    `城市名：${city}`,
    `饭局类型：${type}`,
    "适合什么人",
    "参与者为什么会想参加",
    "饭桌上如何开始聊天",
    "为什么小桌饭局比普通聚会更轻松",
    `一个具体场景：${localScene}`,
    "实用建议",
  ]

  const mustAvoid = [
    "duplicate heading",
    "repeated paragraph opening",
    "thin content",
    "generic SEO filler",
    "fake statistics",
    "claims that Fanju guarantees friendships",
    "over-promising safety or outcomes",
    "irrelevant city facts",
    "keyword stuffing",
  ]

  const languageRules = isEn ? [
    "Natural local English",
    "No generic AI-style conclusion",
    "Avoid repeated section openings",
    "Avoid keyword stuffing",
    "Mention Fanju naturally, not aggressively",
  ] : [
    "使用自然中文",
    "不要无意义夹英文",
    "技术类英文词只允许在必要时出现",
    "禁止重复标题",
    "禁止段落开头高度重复",
    "禁止空泛营销话术",
    "禁止 AI 味总结",
    "禁止把“饭局app”每段都硬塞进去",
  ]

  return {
    version: ARTICLE_BRIEF_VERSION,
    routeKey: profile.routeKey,
    locale: profile.locale,
    city,
    type,
    readerIntent,
    readerStage,
    localScene,
    angle: profile.angle.name,
    structure: profile.structure,
    openingStyle: profile.openingStyle,
    faqMode: profile.faqMode,
    ctaPosition: profile.ctaPosition,
    titleDirection: titleDirectionFor(profile),
    introDirection,
    sectionPlan,
    mustInclude,
    mustAvoid,
    languageRules,
  }
}

function frameIndex(profile, salt, size) {
  return seedFromString(`${profile.citySlug}|${profile.topicSlug}|${profile.angle.id}|${profile.structure}|${profile.titlePattern}|${salt}`) % size
}

function possessiveEn(value = "") {
  const s = String(value || "").trim()
  if (!s) return ""
  return /s$/i.test(s) ? `${s}'` : `${s}'s`
}

function indefiniteArticleEn(value = "") {
  return /^[aeiou]/i.test(String(value || "").trim()) ? "an" : "a"
}

function normalizeForTemplateCheck(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function duplicateNormalizedHeadingTexts(headings) {
  const seen = new Map()
  const duplicates = []
  for (const heading of headings) {
    const normalized = normalizeForTemplateCheck(heading.text)
    if (!normalized) continue
    const label = `H${heading.level}:${heading.text}`
    if (seen.has(normalized)) {
      duplicates.push(`${seen.get(normalized)} <=> ${label}`)
    } else {
      seen.set(normalized, label)
    }
  }
  return duplicates
}

function localizedHeadingIncludes(heading, value) {
  const normalizedHeading = normalizeForTemplateCheck(heading)
  const normalizedValue = normalizeForTemplateCheck(value)
  return normalizedValue && normalizedHeading.includes(normalizedValue)
}

function preflightArticleFrame(profile, frame) {
  const routeLabel = `${profile.locale}:${profile.route}`
  if (!frame?.h1) {
    throw new Error(`Heading preflight failed for ${routeLabel}: missing H1`)
  }
  if (!Array.isArray(frame.h2s) || frame.h2s.length !== 6) {
    throw new Error(`Heading preflight failed for ${routeLabel}: expected exactly 6 H2 headings, got ${frame?.h2s?.length || 0}`)
  }

  const expectedDeepCount = frame.maxDepth - 2
  if (!Array.isArray(frame.deepHeadings) || frame.deepHeadings.length !== expectedDeepCount) {
    throw new Error(`Heading preflight failed for ${routeLabel}: expected H3-H${frame.maxDepth} deep headings, got ${frame?.deepHeadings?.length || 0}`)
  }
  for (let i = 0; i < expectedDeepCount; i++) {
    const expectedLevel = i + 3
    const actual = frame.deepHeadings[i]
    if (!actual || actual.level !== expectedLevel) {
      throw new Error(`Heading preflight failed for ${routeLabel}: deep headings must be consecutive H3-H${frame.maxDepth}; expected H${expectedLevel} at position ${i + 1}, got H${actual?.level || "(missing)"}`)
    }
  }

  const badH2s = frame.h2s.filter((heading) =>
    !localizedHeadingIncludes(heading, profile.cityNameLocalized) ||
    !localizedHeadingIncludes(heading, profile.topicNameLocalized)
  )
  if (badH2s.length) {
    throw new Error(`Heading preflight failed for ${routeLabel}: every H2 must include city="${profile.cityNameLocalized}" and topic="${profile.topicNameLocalized}". Bad H2: ${badH2s.slice(0, 3).join(" | ")}`)
  }

  const headings = [
    { level: 1, text: frame.h1 },
    ...frame.h2s.map((text) => ({ level: 2, text })),
    ...frame.deepHeadings,
  ]
  const duplicates = duplicateNormalizedHeadingTexts(headings)
  if (duplicates.length) {
    throw new Error(`Heading preflight failed for ${routeLabel}: duplicate normalized heading text: ${duplicates.slice(0, 4).join(" | ")}`)
  }
}

function angleLensEn(angleId = "") {
  const map = {
    first_timer_view: "first-timer hesitation",
    host_view: "host-side craft",
    safety_trust_view: "trust question",
    community_building_view: "community-building promise",
    expat_newcomer_view: "newcomer gap",
    local_food_discovery_view: "food-discovery thread",
    loneliness_solution_view: "loneliness problem",
    business_networking_view: "professional-table pressure",
    weekend_plan_view: "weekend decision",
    city_lifestyle_view: "city-rhythm question",
    date_free_social_view: "date-free boundary",
    group_dinner_view: "small-group chemistry",
    private_table_view: "private-table expectation",
    authentic_local_life_view: "local-life test",
    post_work_dinner_view: "after-work gap",
    introvert_friendly_view: "introvert comfort",
    women_friendly_view: "comfort-and-safety lens",
    solo_traveler_view: "solo-arrival moment",
    remote_worker_view: "remote-worker social anchor",
    neighborhood_discovery_view: "neighbourhood lens",
    premium_social_dining_view: "curated-table standard",
    food_as_connection_view: "food-as-connection idea",
    offline_social_reboot_view: "offline-social reset",
    city_arrival_view: "just-arrived uncertainty",
    small_table_big_city_view: "small-table contrast",
  }
  return map[angleId] || "reader decision"
}

function angleLensZh(angleId = "") {
  const map = {
    first_timer_view: "第一次参加的犹豫",
    host_view: "主理人视角里的桌面功夫",
    safety_trust_view: "安全感和信任问题",
    community_building_view: "城市社区感",
    expat_newcomer_view: "刚到城市的空档",
    local_food_discovery_view: "本地吃饭线索",
    loneliness_solution_view: "孤独感和社交断层",
    business_networking_view: "专业人士的同桌压力",
    weekend_plan_view: "周末选择",
    city_lifestyle_view: "城市生活节奏",
    date_free_social_view: "非相亲边界",
    group_dinner_view: "小桌化学反应",
    private_table_view: "私密小桌期待",
    authentic_local_life_view: "真实本地生活",
    post_work_dinner_view: "下班后的空档",
    introvert_friendly_view: "内向者舒适感",
    women_friendly_view: "女性友好的安全感",
    solo_traveler_view: "一个人抵达的夜晚",
    remote_worker_view: "远程工作者的线下锚点",
    neighborhood_discovery_view: "街区视角",
    premium_social_dining_view: "精选小桌标准",
    food_as_connection_view: "用食物连接人",
    offline_social_reboot_view: "线下社交重启",
    city_arrival_view: "刚到城市的不确定",
    small_table_big_city_view: "大城市里的一张小桌",
  }
  return map[angleId] || "报名决策"
}

function articleFrameFor(profile) {
  const city = profile.cityNameLocalized
  const topic = profile.topicNameLocalized
  const isEn = profile.locale === "en"

  // Heading templates per level (H1-H7+), each embeds city+topic for global uniqueness.
  // Level index 0 = H1, 1 = H2, ..., 6 = H7, 7 = H8, etc.
  const TEMPLATES_EN = [
    // H1 (14 variants)
    [
      `In ${city}, Fanju app turns ${topic} into a table people can actually trust`,
      `When ${topic} feels too loose in ${city}, Fanju app starts with the table`,
      `${city} after work: how Fanju app makes ${topic} feel like a real room`,
      `For people trying ${topic} in ${city}, Fanju app puts the guest mix first`,
      `${city} does not need another vague invite; Fanju app makes ${topic} specific`,
      `A calmer way to approach ${topic} in ${city} through Fanju app`,
      `Why ${topic} in ${city} works better when Fanju app keeps the table small`,
      `${city} has plenty of ${topic} options; Fanju app is the one that names the table first`,
      `Before the first message in ${city}, Fanju app makes ${topic} feel like a real decision`,
      `${topic} in ${city} should not feel like a gamble; Fanju app changes the odds`,
      `The ${topic} table ${city} actually needs is the one Fanju app describes up front`,
      `How Fanju app turns a ${city} ${topic} night into something worth showing up for`,
      `${city} strangers sit down easier when Fanju app frames the ${topic} table first`,
      `What makes ${topic} in ${city} worth the risk; Fanju app answers before you arrive`,
    ],
    // H2 (6 slots × 6 variants each — picked per slot below)
    null,
    // H3 (6 variants)
    [
      `What should I check before joining my first ${city} ${topic} table?`,
      `How do I know this ${city} ${topic} dinner is not just another meetup?`,
      `What if I arrive alone to a ${city} ${topic} table and do not know anyone?`,
      `How do I tell a well-run ${city} ${topic} table from a random group dinner?`,
      `What happens if the conversation stalls at a ${city} ${topic} dinner?`,
      `Is it normal to feel nervous before the first ${city} ${topic} Fanju app dinner?`,
    ],
    // H4 (6 variants)
    [
      `The practical checklist before confirming a seat at a ${city} ${topic} table`,
      `What to verify before the ${city} ${topic} dinner starts`,
      `Three details worth checking before any ${city} ${topic} RSVP`,
      `A short pre-dinner checklist for first-time ${city} ${topic} guests`,
      `What experienced ${city} ${topic} diners look at before they confirm`,
      `The details that separate a good ${city} ${topic} table from a risky one`,
    ],
    // H5 (6 variants)
    [
      `How the first ten minutes of a ${city} ${topic} table usually go`,
      `What the opening of a well-run ${city} ${topic} dinner looks like`,
      `The first exchange that tells you whether this ${city} ${topic} table is worth staying for`,
      `Reading the room in the first few minutes at a ${city} ${topic} dinner`,
      `What a confident host does in the first ten minutes at a ${city} ${topic} table`,
      `The opening signal that separates a real ${city} ${topic} table from a random one`,
    ],
    // H6 (6 variants)
    [
      `A note on leaving early from a ${city} ${topic} dinner`,
      `On the quiet right to leave any ${city} ${topic} table that does not feel right`,
      `Why leaving early is always acceptable at a ${city} ${topic} dinner`,
      `The exit option every ${city} ${topic} guest should know about`,
      `Leaving on your own terms at a ${city} ${topic} dinner`,
      `A short note on early exits and personal comfort at ${city} ${topic} tables`,
    ],
    // H7 (6 variants)
    [
      `One concrete next step after a good ${city} ${topic} dinner`,
      `What to do the day after a ${city} ${topic} table`,
      `The follow-up that keeps a ${city} ${topic} connection real`,
      `After the ${city} ${topic} dinner: one action that matters`,
      `How to turn one good ${city} ${topic} table into something that continues`,
      `The only follow-up move worth making after a ${city} ${topic} dinner`,
    ],
    // H8 (6 variants)
    [
      `A brief note on repeat ${city} ${topic} tables and why they work differently`,
      `What changes the second time you join a ${city} ${topic} dinner`,
      `Why the second ${city} ${topic} table is easier than the first`,
      `On returning to the same ${city} ${topic} table a second time`,
      `What repeat ${city} ${topic} guests notice that first-timers miss`,
      `The small shift that happens when you become a regular at ${city} ${topic} dinners`,
    ],
    // H9 (6 variants)
    [
      `A word on hosting your own ${city} ${topic} table through Fanju app`,
      `What it takes to host a ${city} ${topic} dinner rather than just attend`,
      `The difference between attending and hosting a ${city} ${topic} table`,
      `On becoming a ${city} ${topic} host rather than a guest`,
      `What new ${city} ${topic} hosts get wrong in the first session`,
      `The one thing that makes a ${city} ${topic} host worth following`,
    ],
    // H10 (6 variants)
    [
      `Final thoughts on finding the right ${city} ${topic} table through Fanju app`,
      `What the best ${city} ${topic} tables have in common`,
      `A closing note on patience and the right ${city} ${topic} table`,
      `Why the right ${city} ${topic} table is worth waiting for`,
      `On not rushing the search for a good ${city} ${topic} dinner`,
      `The long view on ${city} ${topic} social dining through Fanju app`,
    ],
  ]

  const TEMPLATES_ZH = [
    // H1 (14 variants)
    [
      `${city}不想只靠群聊时，饭局app怎样把${topic}坐成一桌`,
      `在${city}找一桌不尴尬的${topic}，饭局app先解决什么`,
      `${city}${topic}不是凑人吃饭，饭局app更看重这一桌的边界`,
      `下班后的${city}，饭局app怎样让${topic}有真实同桌`,
      `${city}想参加${topic}，饭局app把信任感放在饭前`,
      `${city}的一顿${topic}，饭局app为什么先看人再看热闹`,
      `在${city}把${topic}坐稳，饭局app需要筛掉哪些尴尬`,
      `${city}${topic}不缺饭局，缺的是饭局app这样先说清楚的那一桌`,
      `第一次在${city}参加${topic}，饭局app怎样让陌生人坐得下来`,
      `${city}的${topic}饭局为什么值得去，饭局app在报名前就给了答案`,
      `不想在${city}随便拼桌，饭局app怎样让${topic}变成一个真实决定`,
      `${city}${topic}的同桌质量，饭局app在第一条信息里就开始筛`,
      `在${city}找到对的${topic}饭局，饭局app先把这一桌说清楚`,
      `${city}的${topic}不该靠运气，饭局app把主理人和同桌放在最前面`,
    ],
    // H2 — picked per slot below
    null,
    // H3 (6 variants)
    [
      `${city}${topic}饭局第一次参加前最该先问哪一个问题？`,
      `怎么判断${city}这场${topic}饭局不是随便拼桌？`,
      `如果一个人来${city}${topic}饭局会不会显得尴尬？`,
      `怎么区分${city}一桌认真组织的${topic}饭局和随便凑的群聊饭？`,
      `${city}${topic}饭局聊天冷场了，这桌饭还能继续吗？`,
      `第一次参加${city}${topic}饭局app的饭局，紧张是正常的吗？`,
    ],
    // H4 (6 variants)
    [
      `确认${city}${topic}饭局席位前的实用核查清单`,
      `${city}${topic}饭局开始前要核实哪些细节`,
      `报名${city}${topic}饭局前值得确认的三件事`,
      `第一次参加${city}${topic}饭局的报名前检查`,
      `有经验的${city}${topic}饭局参与者确认前会看什么`,
      `区分${city}${topic}好饭局和有风险饭局的关键细节`,
    ],
    // H5 (6 variants)
    [
      `${city}${topic}饭局开场的前十分钟通常是什么样的`,
      `一桌组织认真的${city}${topic}饭局开场是什么感觉`,
      `${city}${topic}饭局开场的第一句话能告诉你这桌值不值得留下`,
      `在${city}${topic}饭局开场几分钟内怎么读懂这桌的氛围`,
      `一个靠谱的${city}${topic}主理人在开场十分钟内会做什么`,
      `区分${city}${topic}真实饭局和随便凑桌的开场信号`,
    ],
    // H6 (6 variants)
    [
      `关于提前离开${city}${topic}饭局的一点说明`,
      `在${city}${topic}饭局感觉不对时安静离开的权利`,
      `为什么提前离开${city}${topic}饭局永远是可以的`,
      `每个${city}${topic}饭局参与者都应该知道的退出选项`,
      `在${city}${topic}饭局按自己的节奏离开`,
      `关于${city}${topic}饭局提前离场和个人舒适感的简短说明`,
    ],
    // H7 (6 variants)
    [
      `一顿好的${city}${topic}饭局结束后的一个具体下一步`,
      `${city}${topic}饭局结束后第二天该做什么`,
      `让${city}${topic}饭局连接保持真实的后续动作`,
      `${city}${topic}饭局结束后：一个真正重要的行动`,
      `怎样把一桌好的${city}${topic}饭局变成可以延续的东西`,
      `${city}${topic}饭局结束后唯一值得做的后续`,
    ],
    // H8 (6 variants)
    [
      `关于再次参加${city}${topic}饭局为什么和第一次不一样`,
      `第二次参加${city}${topic}饭局会有什么变化`,
      `为什么${city}${topic}饭局的第二次比第一次更容易`,
      `再次回到同一桌${city}${topic}饭局是什么感觉`,
      `${city}${topic}饭局的回头客会注意到新人看不到的东西`,
      `成为${city}${topic}饭局常客后会发生的小变化`,
    ],
    // H9 (6 variants)
    [
      `关于通过饭局app自己组织${city}${topic}饭局的一点说明`,
      `组织${city}${topic}饭局和参加饭局需要什么不同的准备`,
      `在${city}做${topic}饭局主理人和做参与者的区别`,
      `从${city}${topic}饭局参与者变成主理人是什么感觉`,
      `新的${city}${topic}饭局主理人在第一场最容易犯的错`,
      `让${city}${topic}饭局主理人值得被关注的那一件事`,
    ],
    // H10 (6 variants)
    [
      `关于通过饭局app找到对的${city}${topic}饭局的最后一点`,
      `最好的${city}${topic}饭局有什么共同点`,
      `关于耐心和找到对的${city}${topic}饭局的结语`,
      `为什么对的${city}${topic}饭局值得等`,
      `不要急着找${city}${topic}好饭局的理由`,
      `通过饭局app做${city}${topic}社交饭局的长期视角`,
    ],
  ]
  const TEMPLATES = isEn ? TEMPLATES_EN : TEMPLATES_ZH

  // Determine max heading depth for this article: random 7-10, seeded deterministically
  const maxDepth = 7 + (frameIndex(profile, "depth", 4)) // 7, 8, 9, or 10

  // H2 slot templates (same as before, 6 slots × 6 variants)
  const lens = isEn ? angleLensEn(profile.angle.id) : angleLensZh(profile.angle.id)
  const cityPossessive = isEn ? possessiveEn(city) : city
  const scene = isEn
    ? ["after-work pause","weekend table","first-message moment","neighbourhood choice","guest-list question","quiet arrival","second-dinner possibility"][frameIndex(profile, "scene", 7)]
    : ["下班后的空档","周末晚饭","第一次报名的那一刻","街区饭点","同桌名单出现前","一个人到场前十分钟","第二次见面的余地"][frameIndex(profile, "scene", 7)]

  const h2Slots = isEn ? [
    [`${cityPossessive} ${scene} is why ${topic} needs a clearer frame`,`The ${scene} in ${city} should not become another loose invite`,`Why ${topic} needs a sharper table before the night begins in ${city}`,`${city} has enough vague plans; ${topic} deserves a named table`,`The ${scene} moment is when ${topic} in ${city} either works or falls apart`,`Before anyone arrives in ${city}, ${topic} needs a frame that holds`],
    [`The ${lens} changes who should sit at this table`,`A table built around ${lens} needs a different guest mix`,`Who belongs at this ${topic} table depends on the ${lens}`,`${lens} is the filter that keeps the ${city} table from feeling random`,`Getting the guest mix right in ${city} starts with naming the ${lens}`,`The right people show up when ${lens} is the first thing the invite says`],
    [`How Fanju app keeps ${topic} specific before anyone arrives`,`Before the first order, Fanju app should make the table legible`,`The details that keep ${topic} from becoming a vague social plan`,`Fanju app earns trust in ${city} by saying what the table is before it fills`,`A ${topic} table in ${city} that names itself first is the one people actually join`,`Specificity is what separates a Fanju app table from a group chat in ${city}`],
    [`What the host and venue should prove in ${city}`,`Host choices that make ${topic} credible in ${city}`,`The venue signals that make strangers easier to trust in ${city}`,`In ${city}, the host's track record matters more than the menu`,`A good venue in ${city} does half the trust work before anyone sits down`,`${city} hosts who show their reasoning make ${topic} feel safer to join`],
    [`The point where comfort matters more than staying polite`,`When the table should slow down instead of getting louder`,`Where a good dinner leaves room for a quiet no`,`Comfort at a ${city} table is not about being agreeable; it is about having an exit`,`The best ${topic} tables in ${city} make it easy to leave early without explanation`,`Knowing when to slow down is what separates a good ${city} table from a pressured one`],
    [`Choosing one table without turning the night into pressure`,`A next step that keeps ${topic} human, not transactional`,`How to leave ${city} with a second-table possibility`,`The right move after a good ${city} table is not to over-plan the next one`,`One table at a time is how ${topic} in ${city} stays worth doing`,`Leaving ${city} with one real connection is a better outcome than a full contact list`],
  ] : [
    [`在${city}，${topic}要先把同桌预期讲清楚`,`${city}的${topic}不能只靠一句有人来吗`,`${scene}提醒${city}：这桌饭要先有边界`,`${city}的${topic}饭局太多，能说清楚的那一桌才值得报名`,`${scene}是${city}${topic}饭局成不成的关键时刻`,`在${city}，${topic}的预期没说清楚，这桌饭就很难坐稳`],
    [`${lens}会改变谁适合坐到这张桌边`,`围绕${lens}组一桌人，不能只看热闹`,`谁该坐下来，先看${lens}有没有被说清楚`,`${lens}是${city}这桌饭不随便拼人的第一道筛`,`把${lens}说清楚，${city}的同桌名单才不会让人失望`,`${city}的${topic}饭局，${lens}决定了谁该在这张桌边`],
    [`饭局app怎样把${topic}从泛泛邀约变成具体一桌`,`第一条报名信息就应该让${topic}变得可判断`,`别急着凑人，先让这一桌的预期立起来`,`饭局app在${city}赢得信任，靠的是先把这桌说清楚再开始填人`,`${city}的${topic}饭局，能在报名前就让人判断的才是好局`,`具体说清楚是饭局app和${city}普通群聊饭局最大的区别`],
    [`${city}主理人和餐厅细节要先证明什么`,`真正可信的安排往往藏在饭前细节里`,`餐厅、时间和同桌说明会暴露主理人的功底`,`在${city}，主理人的过往记录比菜单更重要`,`好餐厅在${city}能帮主理人完成一半的信任工作`,`${city}主理人把选桌理由说出来，${topic}饭局就更容易让人放心报名`],
    [`舒服的边界不在热闹里而在这些停顿里`,`${city}的饭桌该在什么地方慢下来`,`能让人安心的局，通常先允许有人说不`,`在${city}，舒适感不是要一直聊，而是知道可以提前离开`,`最好的${city}${topic}饭局，让人不用解释就能早退`,`知道什么时候慢下来，是${city}好饭局和有压力饭局的分界线`],
    [`选稳第一桌之后再谈下一次见面`,`${city}的第一顿饭要留下可复盘的余地`,`下一步不是冲动报名，而是选对这一桌`,`在${city}吃完一桌好饭，不急着约下一次才是对的节奏`,`一桌一桌来，是${city}${topic}饭局值得持续做的原因`,`带着一个真实连接离开${city}，比带走一堆联系方式更有价值`],
  ]

  function headingHas(value, needle) {
    const h = String(value || "").toLowerCase()
    const n = String(needle || "").toLowerCase()
    return n && h.includes(n)
  }

  function cleanHeading(value) {
    const heading = String(value || "").trim()
    if (isEn) return heading
    return heading
      .replace(/饭局饭局/g, "饭局")
      .replace(/饭局app的饭局/g, "饭局app饭局")
  }

  function routeSpecificHeading(value) {
    const heading = cleanHeading(value)
    const hasCity = headingHas(heading, city)
    const hasTopic = headingHas(heading, topic)
    if (hasCity && hasTopic) return heading
    if (isEn) {
      if (!hasCity && !hasTopic) return `${heading} for ${topic} in ${city}`
      if (!hasTopic) return `${heading} for ${topic}`
      return `${heading} in ${city}`
    }
    if (!hasCity && !hasTopic) return cleanHeading(`${city}${topic}这一桌：${heading}`)
    if (!hasTopic) return cleanHeading(`${heading}，回到${topic}`)
    return cleanHeading(`${city}这一桌：${heading}`)
  }

  const h2s = h2Slots.map((variants, i) => routeSpecificHeading(variants[frameIndex(profile, `h2-${i + 1}`, 6)]))

  // Build heading outline: H1, then H2s (level 2), then H3..HmaxDepth (one each, levels 3..maxDepth)
  // Each deeper heading is a child of the previous — strictly increasing level, never decreasing.
  const deepHeadings = [] // { level, text }
  for (let level = 3; level <= maxDepth; level++) {
    const templateIdx = level - 1 // index into TEMPLATES array (0=H1,1=H2,2=H3,...)
    const variants = TEMPLATES[templateIdx] || TEMPLATES[TEMPLATES.length - 1]
    const text = routeSpecificHeading(variants[frameIndex(profile, `h${level}`, variants.length)])
    deepHeadings.push({ level, text })
  }

  const frame = { h1: cleanHeading(TEMPLATES[0][frameIndex(profile, "h1", TEMPLATES[0].length)]), h2s, deepHeadings, maxDepth }
  preflightArticleFrame(profile, frame)
  return frame
}
function systemInstructionFor(locale) {
  if (locale === "en") {
    return [
      "Write one public Fanju city article as plain Markdown only.",
      "Voice: human, practical, city-specific, calm. No hype.",
      "The body must be a complete editorial article, not an outline, template, summary, list of placeholders, or short answer.",
      "The first line must be the article H1 and must begin with '# '.",
      "Markdown heading syntax is strict: valid headings use '# ', '## ', '### ', '#### ', '##### ', '###### ', '####### ' etc. with a space after the hashes. Never omit the space.",
      "Use '## ' for major sections. Deeper headings (H3 through H7+) must appear in strictly increasing order — never skip levels downward.",
      "Use only the exact H1, six H2 headings, and H3-through-Hmax headings provided in the user prompt. Do not create any additional Markdown headings at any level.",
      "Every H1-Hn heading must appear at most once. Never duplicate a FAQ heading, checklist heading, question heading, conclusion heading, or any provided heading.",
      "A repeated heading is a hard failure: rewrite the article from scratch. Do not try to bypass this by changing quality score, status, renderMode, metadata, or by deleting required public content.",
      "Write original paragraphs with concrete local context. Do not repeat the same sentence pattern, paragraph opening, or section logic across sections.",
      "Before returning, silently verify: H1 has city + Fanju app; every H1-Hn heading is unique inside this article; every H2-Hn is specific to this city, topic, and angle; title is not a reusable template; at least one non-opening paragraph has city context for meta description extraction; body has exactly 6 H2, the provided H3-Hmax headings only, at least 13 natural paragraphs, no repeated paragraph openings, no public links, no JSON.",
      "Never invent statistics, restaurants, user counts, awards, or partnerships.",
      "Never mention tools or production process.",
      "Never write Markdown links, raw URLs, href attributes, or HTML anchor tags. Mention page names as plain text only; the site template adds all links.",
      "Never output JSON, YAML frontmatter, metadata keys, prompt instructions, section placeholders, or markdown skeleton text.",
      "Never include parked-domain, webmaster, local-contact, advertising-sales, QQ, or site-owner contact copy.",
      "If the route topic contains AI, use AI only as a normal public topic term, never as self-reference or production commentary.",
      "Forbidden public words: automation, prompt, pipeline, cron, JSONL, hash, Modal, generated, QQ, webmaster, domain for sale, advertising cooperation, 本站, 联系QQ, 站长, 本地联系, 广告合作, 域名出售.",
      "Return only the Markdown article text. No code fence. No JSON object.",
    ].join("\n")
  }
  return [
    "只写一个公开的饭局 Fanju 城市文章，输出必须是纯 Markdown 文章正文。",
    "声音：自然、具体、平静、实用。不要营销腔。",
    "正文必须是一篇完整、有编辑感的文章，不是提纲、模板、摘要、占位段落或短回答。",
    "第一行必须是文章 H1，必须以「# 」开头。",
    "Markdown 标题语法必须严格：合法标题是「# 标题」「## 标题」「### 标题」「#### 标题」「##### 标题」「###### 标题」「####### 标题」等，井号后必须有空格。",
    "主要小节必须用「## 」开头。更深层标题（H3 到 H7+）必须严格递增出现，不能跳级降低。",
    "只能使用用户提示中给定的 H1、6 个 H2、以及 H3 到 Hmax 的标题，不得新增任何额外 Markdown 标题。",
    "本篇所有 H1-Hn 标题每个最多出现一次。禁止重复 FAQ 标题、检查清单标题、问题标题、结语标题或任何给定标题。",
    "标题重复就是硬失败：必须从头重写。禁止通过修改质量分、status、renderMode、metadata 或删除必要正文来绕过。",
    "返回前请在内部自检：H1 有中文城市名 + 饭局app；本篇所有 H1-Hn 标题互不重复；每个 H2-Hn 都具体到这座城市、这个主题和这个角度；标题不是套模板；开头之后至少一段有中文城市语境，供 meta description 抽取；正文正好 6 个 H2、只使用给定的 H3-Hmax 标题、至少 13 个自然段、没有重复段落开头、无公开链接、无 JSON。",
    "每段都要有真实城市语境，不要在不同小节反复套同一种句式、段落开头或论证顺序。",
    "不要编造统计数据、餐厅名、用户数、奖项或合作伙伴。",
    "不要提及任何工具、后台或生产流程。",
    "正文不要写 Markdown 链接、裸 URL、href 或 HTML a 标签。可以提到页面名称，但真实链接全部由页面模板统一添加。",
    "不要输出 JSON、YAML frontmatter、metadata key、提示词内容、章节占位文字或 markdown 骨架说明。",
    "不要出现停放域名、站长联系、本地联系、广告招商、QQ 或站主联系方式。",
    "如果路由主题本身包含 AI，只能把 AI 当作公开主题词使用，不能用来描述写作或生产过程。",
    "公开字段禁用词：自动化、prompt、提示词、pipeline、JSONL、哈希、Modal、生成、本站、联系QQ、QQ、本地联系、站长、广告合作、域名出售。",
    "只返回 Markdown 文章正文，不要代码块，不要 JSON object。",
  ].join("\n")
}

function userPromptFor(profile, frame = articleFrameFor(profile), articleBrief = articleBriefFor(profile, frame)) {
  const isEn = profile.locale === "en"
  const titleDirection = titleDirectionFor(profile)

  // Build the deep heading outline string (H3 through HmaxDepth)
  const deepOutline = frame.deepHeadings
    .map(({ level, text }) => `${"#".repeat(level)} ${text}`)
    .join("\n")
  const maxDepth = frame.maxDepth

  if (isEn) {
    return [
      `Write a high-quality long-form English article for route ${profile.route}.`,
      `City: ${profile.cityNameLocalized}. Topic: ${profile.topicNameLocalized}.`,
      `Use this deterministic articleBrief as the source brief for the article. It is program-generated, not AI-generated. Follow it closely, but do not quote it, summarize it, or output JSON:\n${JSON.stringify(articleBrief, null, 2)}`,
      `Use this exact H1 as the first line, with no edits:\n# ${frame.h1}\nThis H1 already includes the city and the exact phrase "Fanju app".`,
      `Title/H1 guardrails: title direction=${titleDirection}. Do not replace the H1 with "${profile.cityNameLocalized} ${profile.topicNameLocalized} Guide", "A Guide to ${profile.topicNameLocalized} in ${profile.cityNameLocalized}", "${profile.topicNameLocalized} in ${profile.cityNameLocalized}", "How to join ${profile.topicNameLocalized} in ${profile.cityNameLocalized}", or any title that only swaps city/topic words. Also avoid bland titles like "${indefiniteArticleEn(profile.cityNameLocalized).replace(/^./, (c) => c.toUpperCase())} ${profile.cityNameLocalized} dinner journey" or "Discover ${profile.cityNameLocalized} through dinner".`,
      `Angle: ${profile.angle.name}. Use this angle: ${profile.angle.instruction}`,
      `Style profile: structure=${profile.structure}; opening=${profile.openingStyle}; faq=${profile.faqMode}; cta=${profile.ctaPosition}; example=${profile.exampleType}; tone=${profile.tone}; title=${profile.titlePattern}.`,
      `Heading allowlist: the only Markdown headings allowed in the article are the exact H1 below, the exact 6 H2 headings below, and the exact H3-H${maxDepth} headings below. Do not add any other H1, H2, H3, H4, H5, H6, H7, H8, H9, or H10 heading.`,
      `Use these exact 6 H2 headings, in this order, with no edits:\n${frame.h2s.map((h) => `## ${h}`).join("\n")}`,
      `After the H2 sections, use these exact deeper headings in strict order (H3 through H${maxDepth}). Each heading must appear exactly once, on its own line, with the correct number of # symbols and a space:\n${deepOutline}`,
      "Do not create FAQ, checklist, conclusion, next-step, safety, or summary headings beyond the allowlist. If you need those ideas, write them as normal paragraph prose under the provided headings.",
      "Hard failure rule: no H1-Hn heading text may repeat after normalization. If any heading would repeat, rewrite the full article before returning it. Do not bypass heading failures by changing score/status/renderMode/metadata or by deleting required article sections.",
      `Heading depth rule: headings must only go deeper (H2 → H3 → H4 → … → H${maxDepth}). Never use a shallower heading after a deeper one. The article must reach at least H${maxDepth}.`,
      "Quality: practical editorial guide, not a landing page. Include city rhythm, neighbourhood choice, attendee concerns, host reliability cues, comfort boundaries, and decision criteria. Every H2-Hn section must have real article paragraphs with distinct ideas and distinct paragraph openings.",
      `Output contract that must pass automated quality checks: first character '#'; exactly one H1; all H1-H${maxDepth} headings are unique; 6 H2 headings using '## ' with a space; all deeper headings from H3 to H${maxDepth} present in strict order; at least 13 natural paragraphs; every H2 has at least two paragraphs; every deeper heading has at least one paragraph; first paragraph mentions city, Fanju app, and the exact primary keyword "${profile.cityNameLocalized} ${String(profile.topicNameLocalized || "").replace(/\s+Dinner$/i, "") || profile.topicNameLocalized} Dinner"; at least one H2 contains that city + topic phrase; at least one later paragraph mentions the city without repeating the opening; title, first paragraph, and opening 600 characters mention Fanju app.`,
      "Hard public-content rule: do not include QQ, webmaster contact, local contact, parked-domain text, advertising-sales copy, or any Chinese parked-domain phrase.",
      "Hard linking rule: do not include [text](/path), https://fanju.app paths, raw URLs, <a href=\"...\">, the words markdown link, or any href. All real links are added by the page template.",
      `Body requirements: 4,600-6,500 characters; at least 13 natural paragraphs; no filler. Do not use bullet lists or numbered lists. Use blank lines between paragraphs. Start with one complete answer-summary paragraph in the first 120 words explaining that Fanju app is a social dining app for small, clearly described meals and real-world connections in ${profile.cityNameLocalized}; this opening must be newly written for the exact route, must end with . ? or !, and must not end on a comma, conjunction, or reusable line like "In ${profile.cityNameLocalized}, Fanju app is not..." Then write the 6 required H2 sections exactly as given. Each H2 heading must be on its own line, begin with "## ", and be followed by two distinct paragraphs. Each paragraph should be 90-150 English words, concrete to this city/topic/angle, and must not reuse the same opening sentence pattern. After the last H2, write the deeper heading sections (H3 through H${maxDepth}) in order, each with at least one paragraph. Avoid checklist-style section labels such as "Who this is for", "Safety and boundaries", "How it works", "What to expect", "Next steps", or "Conclusion". Across the article, naturally resolve the reader's decision points before joining: local fit, table rhythm, host and venue quality, guest mix, comfort boundaries, skip signals, and a concrete next move. If the body has fewer than 13 public paragraphs or any public paragraph ends mid-sentence, it will be rejected.`,
      "Return only the finished Markdown article text. The first character of the response must be '#'. Do not wrap it in JSON, YAML frontmatter, or a code fence.",
    ].join("\n")
  }
  return [
    `为「${profile.cityNameLocalized}」城市页写一篇高质量中文长文。`,
    `城市：${profile.cityNameLocalized}。主题：${profile.topicNameLocalized}。`,
    `以下 deterministic articleBrief 是程序生成的写作简报，不是 AI 生成的 prompt。必须优先按它写文章，但不要引用、复述或输出 JSON：\n${JSON.stringify(articleBrief, null, 2)}`,
    `第一行必须使用这个精确 H1，不能改字：\n# ${frame.h1}\n这个 H1 已经包含中文城市名和「饭局app」。`,
    `标题/H1 防线：标题方向=${titleDirection}。禁止改成只替换城市/主题的模板标题。正文前 200 字必须自然出现「饭局app」和「${profile.cityNameLocalized}」，开头之后至少一段也要自然出现「${profile.cityNameLocalized}」。`,
    `中文城市名硬规则：公开标题、H1、H2 和正文里，城市名只能使用「${profile.cityNameLocalized}」；URL slug、拼音城市名、英文城市名一律不能出现在公开字段里。`,
    `角度：${profile.angle.name}。按这个方向写：${profile.angle.instruction}`,
    `风格 profile：结构=${profile.structure}；开头=${profile.openingStyle}；FAQ=${profile.faqMode}；CTA=${profile.ctaPosition}；例子=${profile.exampleType}；语气=${profile.tone}；标题=${profile.titlePattern}。`,
    `标题白名单：文章中唯一允许出现的 Markdown 标题，是下面给定的精确 H1、6 个精确 H2、以及精确 H3-H${maxDepth}。不得新增任何额外 H1、H2、H3、H4、H5、H6、H7、H8、H9 或 H10 标题。`,
    `必须使用这 6 个精确 H2，按顺序写，不能改字：\n${frame.h2s.map((h) => `## ${h}`).join("\n")}`,
    `H2 之后，必须按顺序使用以下更深层标题（H3 到 H${maxDepth}），每个标题单独成行，井号数量和空格必须完全一致：\n${deepOutline}`,
    "不要在白名单之外新增 FAQ、检查清单、结语、下一步、安全、总结等标题。如果需要表达这些内容，只能写成给定标题下面的普通正文段落。",
    "硬失败规则：H1-Hn 任意标题归一化后都不能重复。如果会重复，必须在返回前重写全文。禁止通过修改 score/status/renderMode/metadata 或删除必要正文来绕过标题失败。",
    `标题深度规则：标题只能越来越深（H2 → H3 → H4 → … → H${maxDepth}），不能在更深的标题后出现更浅的标题。文章必须到达 H${maxDepth}。`,
    "质量：像真实城市饭局指南，不像落地页。写出城市节奏、街区选择、同桌人数、报名前顾虑、主理人信号、安全判断、报名建议。每个 H2-Hn 标题小节都必须有真实正文段落，且各小节观点、段落开头和论证顺序不能重复。",
    `输出契约：第一个字符必须是「#」；只允许 1 个 H1；H1 到 H${maxDepth} 的所有标题必须互不重复；必须有 6 个「## 」标题；H3 到 H${maxDepth} 的所有标题必须按顺序出现；至少 13 个自然段；第一段必须同时出现「饭局app」、中文城市名和精确主关键词「${profile.cityNameLocalized}${String(profile.topicNameLocalized || "").replace(/饭局$/, "") || profile.topicNameLocalized}饭局」；至少一个 H2 包含城市名和主题词；开头之后至少一段也要自然出现中文城市名但不能复用开头句式；标题、H1、前 600 字都必须出现饭局app。`,
    "公开内容硬规则：不要出现本站、联系QQ、QQ、本地联系、站长、广告合作、域名出售、停放域名、招商或站主联系方式。",
    "链接硬规则：不要出现 [文字](/path)、https://fanju.app 路径、裸 URL、<a href=\"...\">、markdown link 或任何 href。所有真实链接由页面模板统一添加。",
    `正文结构硬规则：3,200-4,900 字符；至少 13 个自然段；段落之间必须空行；不要写项目符号列表、编号列表或结语。第一段必须是完整的 answer-summary 式自然段，在前 200 字解释饭局app / Fanju 是围绕小桌吃饭、清晰主题和线下连接的社交应用，并明确落到「${profile.cityNameLocalized}」；这一段必须以 。！？ 结尾，禁止以逗号、顿号、连接词或半句结尾；开头必须为本路由重写，禁止用「在${profile.cityNameLocalized}，饭局app不是用来……而是……」这类可复用句式。然后写 6 个 H2 小节，每个 H2 下至少 2 段，标题必须原样保留、单独成行、以「## 」开头。H2 结束后，按顺序写 H3 到 H${maxDepth} 的深层小节，每个小节至少 1 段。不要用「适合谁」「核心饭局场景」「安全重点」「一桌饭怎样运作」「主理人信号」「舒适边界」「下一步行动」「结语」这类模板标题。全文要自然回答读者报名前会想清楚的决定点：本地适配、这一桌的节奏、主理人/餐厅/同桌质量、舒适边界、哪些信号说明不该去、下一步怎么做。不要反复用「饭局app可以帮助」「通过饭局app」开头。少于 13 个公开自然段或任何公开段落半句结尾都会被拒绝。`,
    "只返回最终 Markdown 文章正文，第一个字符必须是「#」。不要 JSON，不要 YAML frontmatter，不要代码块。",
  ].join("\n")
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

function loadManifest() {
  if (!existsSync(MANIFEST_FILE)) {
    console.error("Missing data/seo/route-manifest.json. Run: pnpm seo:routes")
    process.exit(1)
  }
  const payload = JSON.parse(readFileSync(MANIFEST_FILE, "utf8"))
  if (!Array.isArray(payload.entries) || payload.entries.length === 0) {
    console.error("route-manifest.json has no entries.")
    process.exit(1)
  }
  return payload
}

function planLocaleCounts(limit, lang) {
  if (lang === "en") return { en: limit, zh: 0 }
  if (lang === "zh") return { en: 0, zh: limit }
  // "all" or anything else
  const en = Math.floor(limit / 2)
  const zh = limit - en
  return { en, zh }
}

function buildLocalePrompts({ locale, count, manifestEntries, cityNameIndex, masterSeed, seenH1Set, history }) {
  const enabledRoutes = manifestEntries.filter(
    (e) => e.locale === locale && e.enabled === true && routeEligibleForLocale(e, locale) && (TARGET_ROUTES.size === 0 || TARGET_ROUTES.has(e.route))
  )
  if (enabledRoutes.length === 0) {
    throw new Error(`No enabled routes for locale=${locale} in route-manifest.json`)
  }
  if (enabledRoutes.length === 0) {
    throw new Error(`No legal routes for locale=${locale}`)
  }

  // The bank requires at least 500 prompts per locale when LANG=all and
  // LIMIT=1000. We support arbitrary counts but must always have at least
  // one route.
  const angles = locale === "en" ? ANGLES_EN : ANGLES_ZH
  const tones = locale === "en" ? TONES_EN : TONES_ZH

  const subSeed = seedFromString(`${masterSeed}::${locale}`)
  const rng = mulberry32(subSeed)

  // Balance by topic first so LIMIT=1000 covers 100+ article types instead of
  // accidentally clustering around the original small category set.
  const routeCandidates = enabledRoutes.filter((route) => {
    const routeKey = routeKeyFor({ locale: route.locale, citySlug: route.citySlug, topicSlug: route.topicSlug, route: route.route })
    const localeCityTypeKey = localeCityTypeKeyFor({ locale: route.locale, citySlug: route.citySlug, topicSlug: route.topicSlug, route: route.route })
    return !historicalSkipReason({ ...route, routeKey, localeCityTypeKey }, history)
  })
  const routePool = balancedRoutePool(rng, routeCandidates)

  const profileKeySet = new Set()
  const promptHashSet = new Set()
  const routeKeySet = new Set()
  const canonicalPathSet = new Set()
  const localeCityTypeSet = new Set()
  const out = []

  let routeCursor = 0
  let attempts = 0
  const maxTotalAttempts = routePool.length

  while (out.length < count && routeCursor < routePool.length) {
    if (attempts++ > maxTotalAttempts) break
    const route = routePool[routeCursor]
    routeCursor++
    const routeKey = routeKeyFor({ locale: route.locale, citySlug: route.citySlug, topicSlug: route.topicSlug, route: route.route })
    const localeCityTypeKey = localeCityTypeKeyFor({ locale: route.locale, citySlug: route.citySlug, topicSlug: route.topicSlug, route: route.route })
    if (routeKeySet.has(routeKey) || canonicalPathSet.has(route.route) || localeCityTypeSet.has(localeCityTypeKey)) continue

    const angle = pick(rng, angles)
    const structure = pick(rng, STRUCTURES)
    const openingStyle = pick(rng, OPENING_STYLES)
    const faqMode = pick(rng, FAQ_MODES)
    const ctaPosition = pick(rng, CTA_POSITIONS)

    const profileKey = [
      route.route,
      route.locale,
      route.topicSlug,
      angle.id,
      structure,
      openingStyle,
      faqMode,
      ctaPosition,
    ].join("|")
    if (profileKeySet.has(profileKey)) continue

    const exampleType = pick(rng, EXAMPLE_TYPES)
    const tone = pick(rng, tones)
    const titlePattern = pick(rng, TITLE_PATTERNS)

    const profile = {
      locale: route.locale,
      citySlug: route.citySlug,
      cityNameLocalized: route.cityNameLocalized,
      cityNameZh: cityNameIndex.get(route.citySlug)?.zh || (route.locale === "zh" ? route.cityNameLocalized : ""),
      cityNameEn: cityNameIndex.get(route.citySlug)?.en || (route.locale === "en" ? route.cityNameLocalized : ""),
      countryCode: route.countryCode,
      topicSlug: route.topicSlug,
      topicNameLocalized: route.topicNameLocalized,
      route: route.route,
      routeKey,
      localeCityTypeKey,
      randomSeed: RANDOM_SEED,
      angle,
      structure,
      openingStyle,
      faqMode,
      ctaPosition,
      exampleType,
      tone,
      titlePattern,
    }

    // H1 global dedup: reject if this exact H1 text was already used
    const frame = articleFrameFor(profile)
    const articleBrief = articleBriefFor(profile, frame)
    const h1Key = frame.h1.toLowerCase().replace(/\s+/g, " ").trim()
    if (seenH1Set.has(h1Key)) continue

    const systemInstruction = systemInstructionFor(profile.locale)
    const userPrompt = userPromptFor(profile, frame, articleBrief)

    const profileHash = sha256Hex(profileKey)
    const promptHash = sha256Hex(`${systemInstruction}\n---\n${userPrompt}\n---\n${JSON.stringify(articleBrief)}`)
    if (promptHashSet.has(promptHash)) continue
    const historyReason = historicalSkipReason({ ...profile, articleBrief, promptHash, profileHash }, history)
    if (historyReason) continue

    profileKeySet.add(profileKey)
    promptHashSet.add(promptHash)
    routeKeySet.add(routeKey)
    canonicalPathSet.add(route.route)
    localeCityTypeSet.add(localeCityTypeKey)
    seenH1Set.add(h1Key)

    out.push({
      profile,
      articleBrief,
      systemInstruction,
      userPrompt,
      profileHash,
      promptHash,
    })
  }

  return { prompts: out, availableCandidates: routeCandidates.length, requested: count }
}

async function main() {
  const manifest = loadManifest()
  assertZhCityDisplayNames(manifest.entries)
  const cityNameIndex = buildCityNameIndex(manifest.entries)
  const history = await loadPromptBankHistory({ root: process.env.SEO_HISTORY_ROOT ? undefined : ROOT })

  const counts = planLocaleCounts(LIMIT, LANG === "en" || LANG === "zh" ? LANG : "all")

  // Required precondition: the manifest must have enough enabled routes per
  // locale to support the requested counts. If not, hard-fail rather than
  // silently borrow routes from the other locale.
  const enabledEn = manifest.entries.filter((e) => e.locale === "en" && e.enabled).length
  const enabledZh = manifest.entries.filter((e) => e.locale === "zh" && e.enabled).length

  if (counts.en > 0 && enabledEn === 0) {
    console.error("No enabled EN routes in route-manifest.json")
    process.exit(1)
  }
  if (counts.zh > 0 && enabledZh === 0) {
    console.error("No enabled ZH routes in route-manifest.json")
    process.exit(1)
  }

  // The user-facing requirement: when LIMIT=1000 and LANG=all, EN=500 ZH=500.
  // We enforce both halves can be filled, and never substitute languages.
  const seedNum = seedFromString(RANDOM_SEED)
  const masterSeed = `${RANDOM_SEED}#${seedNum}`
  const seenH1Set = new Set()

  const enPrompts = counts.en > 0
    ? buildLocalePrompts({ locale: "en", count: counts.en, manifestEntries: manifest.entries, cityNameIndex, masterSeed, seenH1Set, history })
    : { prompts: [], availableCandidates: 0, requested: 0 }
  const zhPrompts = counts.zh > 0
    ? buildLocalePrompts({ locale: "zh", count: counts.zh, manifestEntries: manifest.entries, cityNameIndex, masterSeed, seenH1Set, history })
    : { prompts: [], availableCandidates: 0, requested: 0 }

  const all = []
  // Interleave so EN and ZH alternate roughly evenly through the file.
  const total = enPrompts.prompts.length + zhPrompts.prompts.length
  let ei = 0
  let zi = 0
  for (let i = 0; i < total; i++) {
    const wantEn = enPrompts.prompts.length - ei > 0 && (zhPrompts.prompts.length - zi === 0 || i % 2 === 0)
    if (wantEn) all.push(enPrompts.prompts[ei++])
    else all.push(zhPrompts.prompts[zi++])
  }

  // Final emission. Each line is an independent JSON object.
  const lines = []
  for (let i = 0; i < all.length; i++) {
	    const p = all[i]
	    const idx = String(i + 1).padStart(6, "0")
	    const promptId = `fanju-seo-${idx}`
	    const seed = `${RANDOM_SEED}-${idx}`
	    const obj = {
	      promptId,
	      seed,
	      promptSeed: seed,
	      randomSeed: RANDOM_SEED,
	      articleBriefVersion: ARTICLE_BRIEF_VERSION,
	      routeKey: p.profile.routeKey,
	      locale: p.profile.locale,
      citySlug: p.profile.citySlug,
      cityNameLocalized: p.profile.cityNameLocalized,
      cityNameZh: p.profile.cityNameZh,
      cityNameEn: p.profile.cityNameEn,
      countryCode: p.profile.countryCode,
      topicSlug: p.profile.topicSlug,
      topicNameLocalized: p.profile.topicNameLocalized,
      route: p.profile.route,
      routeExistsInManifest: true,
      angle: p.profile.angle,
      structure: p.profile.structure,
      openingStyle: p.profile.openingStyle,
      faqMode: p.profile.faqMode,
      ctaPosition: p.profile.ctaPosition,
      exampleType: p.profile.exampleType,
      tone: p.profile.tone,
	      titlePattern: p.profile.titlePattern,
	      articleBrief: p.articleBrief,
	      systemInstruction: p.systemInstruction,
      userPrompt: p.userPrompt,
      promptHash: p.promptHash,
      profileHash: p.profileHash,
    }
    lines.push(JSON.stringify(obj))
  }

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true })
  writeFileSync(OUTPUT_FILE, lines.join("\n") + "\n", "utf8")

  console.log("Prompt bank written:", OUTPUT_FILE)
  console.log("  total:", all.length)
  console.log("  en:   ", enPrompts.prompts.length)
  console.log("  zh:   ", zhPrompts.prompts.length)
  console.log("  seed: ", RANDOM_SEED)
  console.log("History filter:")
  console.log("  totalCanonical:", history.stats.totalCanonical)
  console.log("  alreadyPublishedRoutes:", history.stats.alreadyPublishedRoutes)
  console.log("  historicalPromptHashes:", history.stats.historicalPromptHashes)
  console.log("  historicalProfileHashes:", history.stats.historicalProfileHashes)
  console.log("  availableCandidates:", enPrompts.availableCandidates + zhPrompts.availableCandidates)
  console.log("  requestedLimit:", LIMIT)
  console.log("  actualGenerated:", all.length)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
