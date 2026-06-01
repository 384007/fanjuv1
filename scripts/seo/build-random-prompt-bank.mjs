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
  ? pathFromRoot(ROOT, process.env.OUTPUT_FILE)
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
    "技术类英文词只允许在必要���出现",
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

const AUTHORITY_ANCHORS_ZH = ["饭局", "饭局app", "Fanju饭局", "同城饭局", "饭搭子饭局", "线下饭局社交"]
const AUTHORITY_ANCHORS_EN = ["Fanju app", "Fanju 饭局app", "social dining app", "offline dinner social", "small-table dinner", "what Fanju means"]

function routeSeed(profile, salt) {
  return frameIndex(profile, salt, 1000000)
}

function rotateFrom(profile, salt, arr, count = arr.length) {
  if (!arr.length) return []
  const start = routeSeed(profile, salt) % arr.length
  const out = []
  for (let i = 0; i < Math.min(count, arr.length); i++) {
    out.push(arr[(start + i) % arr.length])
  }
  return out
}

function briefAuthorityPath(locale) {
  return locale === "en" ? "/en/what-is-fanju" : "/what-is-fanju"
}

function buildEditorialBrief(profile) {
  const isEn = profile.locale === "en"
  const city = profile.cityNameLocalized
  const topic = profile.topicNameLocalized
  const topicCoreZh = isEn ? topic : String(topic || "").replace(/饭局$/, "") || topic
  const lens = isEn ? angleLensEn(profile.angle.id) : angleLensZh(profile.angle.id)
  const scene = rotateFrom(profile, "brief-scene", isEn
    ? [
        "an after-work table where people need a concrete reason to cross town",
        "a weekend dinner that has to feel planned before anyone commits",
        "a first-arrival moment when one guest is deciding whether to walk in",
        "a neighbourhood choice where venue clarity matters more than hype",
        "a quieter small table where the guest mix must be readable up front",
        "a second-table possibility that should not turn into pressure",
      ]
    : [
        "下班后要不要跨区赴约的那一刻",
        "周末晚饭还没报名、但已经开始判断值不值得去的时刻",
        "一个人到场前十分钟最容易犹豫的场景",
        "街区和公共场所是否清楚会影响信任的场景",
        "小桌同桌名单还没出现、但预期必须先说清楚的场景",
        "吃完第一桌之后要不要继续联系的场景",
      ], 1)[0]
  const pain = rotateFrom(profile, "brief-pain", isEn
    ? [
        "the reader does not want another vague group chat",
        "the reader needs to know who the dinner is for before paying attention",
        "the reader worries that a social dinner will feel like disguised dating",
        "the reader wants host and venue signals before joining strangers",
        "the reader prefers a table with permission to decline or leave",
        "the reader wants a real offline connection without being pushed to network",
      ]
    : [
        "读者不想再被拉进一个没有主题的群聊",
        "读者想先知道这桌饭到底适合谁、不适合谁",
        "读者担心饭局被包装成相亲、推销或尴尬拼桌",
        "读者需要在报名前看懂主理人、场地和同桌预期",
        "读者希望保留拒绝、提前离开和不继续联系的边界",
        "读者想要真实线下连接，但不想被迫社交或交换资源",
      ], 1)[0]
  const localDetails = rotateFrom(profile, "brief-local-details", isEn
    ? [
        `${city} dinner plans often need clear arrival and exit timing, especially when guests cross neighbourhoods.`,
        `A public venue type matters in ${city} because strangers need to picture the room before joining.`,
        `${topic} in ${city} should explain expected group size before the table fills.`,
        `The host note should say why this topic fits ${city} now, not just repeat the category name.`,
        `A practical ${city} listing should make payment, time window, and dietary expectations easy to ask about.`,
        `For first-timers in ${city}, the opening ten minutes need a simple conversation frame.`,
        `The page should distinguish a calm dinner table from a noisy meetup or random chat in ${city}.`,
        `${city} readers need skip signals: vague venue, unclear cost, pressured follow-up, or a guest mix that feels off.`,
      ]
    : [
        `${city}用户会先判断跨区、到场时间和离场方式是否清楚。`,
        `${city}的公共场所说明很重要，因为陌生人要先能想象这桌饭在哪里发生。`,
        `${city}${topic}要在报名之前说清楚大概人数，而不是等群里临时凑。`,
        `主理人说明要写出为什么这个主题适合${city}，不能只重复分类名。`,
        `${city}读者会关心时间窗口、费用处理、饮食限制和是否方便提前提问。`,
        `第一次参加的人需要知道开场十分钟如何破冰，而不是被丢进随机闲聊。`,
        `这篇文章要把小桌饭局和大型 meetup、相亲局、微信群拼饭区分开。`,
        `需要写明不该报名的信号：场地含糊、费用不清、强推后续、同桌预期不透明。`,
      ], 6)

  const targetAudience = isEn
    ? `${city} readers considering ${topic} who want a small offline dinner with a clear theme, host context, safety boundaries, and no swipe-feed pressure.`
    : `在${city}考虑参加${topic}的人：想通过小桌吃饭认识同频同桌，但需要先看清主题、主理人、边界和安全信号。`
  const mustAnswerQuestions = isEn
    ? [
        `What is Fanju app in the context of ${city} ${topic}?`,
        `Who is this table suitable for, and who should skip it?`,
        `What local details should a reader check before joining in ${city}?`,
        "How can the reader judge host reliability, venue clarity, and guest boundaries?",
        "What is the safest next step if the listing feels vague?",
      ]
    : [
        `饭局app / Fanju饭局在${city}${topic}场景里到底是什么？`,
        `这类饭局适合谁，不适合谁？`,
        `在${city}报名前要检查哪些本地细节？`,
        `怎样判断主理人、场地、同桌边界和安全信号？`,
        `如果信息含糊，读者下一步应该怎么处理？`,
      ]
  const firstScreenAnswer = isEn
    ? `The first public paragraph must include ${city}, ${topic}, Fanju app, the Chinese bridge “饭局 / 饭局app / Fanju饭局”, and these exact clarifiers: not a dating guarantee, not a random group chat, not an endless profile feed. Keep it within 120-220 words.`
    : `首段 120-220 字内必须同时出现「${city}」「${topic}」「饭局app / Fanju饭局」，并自然解释它是围绕小桌吃饭、清晰主题和线下连接的社交应用。首段必须包含这些可审计短语：不是相亲保证、不是随机群聊、不是无限刷资料。`
  const anchors = rotateFrom(profile, "brief-anchors", isEn ? AUTHORITY_ANCHORS_EN : AUTHORITY_ANCHORS_ZH, 4)
  const authorityPath = briefAuthorityPath(profile.locale)
  const internalLinkPlan = [
    { anchor: anchors[0], url: authorityPath, reason: isEn ? "main entity authority page" : "回链主词权威页" },
    { anchor: anchors[1], url: isEn ? "/en/cities" : "/cities", reason: isEn ? "city discovery hub" : "城市集合页" },
    { anchor: anchors[2], url: isEn ? "/en/categories" : "/categories", reason: isEn ? "topic/category hub" : "饭局类型集合页" },
    { anchor: anchors[3], url: "/how-to-find-dinner-buddies", reason: isEn ? "dinner buddy intent support" : "饭搭子意图支撑页" },
  ]
  // H1: instruction-driven, not a fixed template. AI must write a unique title using the given angle/lens/scene/pain.
  const titleDirection = titleDirectionFor(profile)
  // topicCoreZh strips trailing 饭局 to avoid "友情饭局饭局" when AI appends 饭局 again
  // Also strip leading 同城 to avoid "南通同城饭局饭局" patterns
  const topicDisplayZh = (topicCoreZh.replace(/^同城/, "") || topicCoreZh || topic)
  const H1 = isEn
    ? `Write a unique H1 for this article. Direction: ${titleDirection}. Lens: ${lens}. Scene: ${scene}. Pain: ${pain}. City: ${city}. Topic: ${topic}. The title must naturally include "${city}", "${topic}", and "Fanju app" or a natural variant. Do NOT use any of these banned patterns: "[City] [Topic]: how Fanju app...", "Before joining [Topic] in [City]...", "For [City] readers considering [Topic]...", "A clearer [Topic] dinner in [City]...", or any title that only swaps city/topic words into a fixed frame. The title must be original prose that could only apply to this specific city+topic+angle combination.`
    : `为这篇文章写一个唯一的 H1 标题。方向：${titleDirection}。视角：${lens}。场景：${scene}。读者痛点：${pain}。城市：${city}。主题核心词：${topicDisplayZh}。标题必须自然包含「${city}」和「${topicDisplayZh}」以及「饭局app」或「Fanju饭局」的自然变体。【严禁重复词】：标题里「饭局」只能出现一次，不能出现「饭局饭局」「同城饭局饭局」「${topicDisplayZh}饭局饭局」等重复。禁止使用以下固定句式：「${city}${topicDisplayZh}饭局，饭局app要先把哪几件事说清楚」「${city}${topic}不该只靠群聊，饭局app要把这桌饭讲明白」「${city}同城饭局怎么选」或任何只替换城市/主题词的固定框架。标题必须是只适用于这个城市+主题+视角组合的原创表达。`

  // H2 outline: instruction-driven per-role, not fixed templates. Each H2 must be unique to this city+topic+angle.
  const h2Roles = isEn
    ? [
        { role: "search intent", instruction: `Write an H2 that frames the core reader decision for ${topic} in ${city}, using the lens "${lens}". Must not be a generic "what is" or "overview" heading.` },
        { role: "entity definition", instruction: `Write an H2 that explains what Fanju app means in the specific context of ${topic} in ${city}, anchored in the scene: "${scene}".` },
        { role: "local details", instruction: `Write an H2 about a concrete local detail or tension specific to ${city} and ${topic}. Use the local detail: "${localDetails[0]}". Must name a real local friction, not a generic "local tips" heading.` },
        { role: "trust criteria", instruction: `Write an H2 about how to judge host, venue, or guest-mix quality for ${topic} in ${city}. Angle: "${lens}". Must be a specific judgment criterion, not "how to choose" or "what to look for".` },
        { role: "fit and non-fit", instruction: `Write an H2 that distinguishes who this ${topic} table in ${city} is genuinely for versus who should skip it. Must be specific to this angle: "${lens}".` },
        { role: "safety boundary", instruction: `Write an H2 about exit cues, follow-up pace, or safety signals for ${topic} in ${city}. Must be concrete and city-specific, not a generic "safety tips" heading.` },
      ]
    : [
        { role: "search intent", instruction: `写一个 H2，用「${lens}」视角切入，框定读者在${city}参加${topicDisplayZh}饭局时的核心决策问题。不能是通用的"是什么"或"概述"标题。` },
        { role: "entity definition", instruction: `写一个 H2，在「${scene}」这个具体场景下，解释饭局app在${city}${topicDisplayZh}语境里的含义。必须锚定在这个场景，不能泛泛而谈。` },
        { role: "local details", instruction: `写一个 H2，关于${city}和${topicDisplayZh}饭局特有的本地细节或张力。参考本地细节：「${localDetails[0]}」。必须点名真实的本地摩擦，不能是通用的"本地攻略"标题。` },
        { role: "trust criteria", instruction: `写一个 H2，从「${lens}」视角出发，聚焦${city}${topicDisplayZh}饭局里一个具体的信任判断点（比如：主理人说明是否够清楚、场地选择是否合理、同桌预期是否透明）。标题必须锚定在「${city}」和「${topicDisplayZh}」，不能出现"如何判断""主理人/场地/同桌质量"等通用词组，必须是只适用于这篇文章的原创表达。` },
        { role: "fit and non-fit", instruction: `写一个 H2，从「${lens}」视角出发，描述${city}${topicDisplayZh}饭局里一个具体的"适配"或"不适配"场景（比如：什么样的人坐下来会觉得对、什么情况下报名前应该先想清楚）。标题必须锚定在「${city}」和「${topicDisplayZh}」，不能出现"适合谁""排除谁""不适合人群"等通用词组，必须是只适用于这篇文章的原创表达。` },
        { role: "safety boundary", instruction: `写一个 H2，从「${lens}」视角出发，写${city}${topicDisplayZh}饭局结束后读者会面临的一个具体判断场景（比如：是否继续联系、如何判断这桌值不值得再来、什么情况下应该提前离开）。标题必须锚定在「${city}」和「${topicDisplayZh}」，不能出现"离场信号""安全边界""退出指南"等通用词组，必须是只适用于这篇文章的原创表达。` },
      ]
  const outline = h2Roles.map((item) => ({
    level: 2,
    heading: item.instruction,
    role: item.role,
  }))

  return {
    searchIntent: isEn
      ? `Decide whether Fanju app is a credible way to join ${topic} in ${city}, with enough information to choose, skip, or ask better questions.`
      : `帮助搜索${city}${topic}、饭局app、Fanju饭局的用户判断这桌饭是否值得报名、是否适合自己、哪里需要先问清楚。`,
    uniqueAngle: isEn ? `${lens} seen through ${scene}.` : `从${lens}切入，具体落到${scene}。`,
    userPain: pain,
    localDetails,
    targetAudience,
    mustAnswerQuestions,
    firstScreenAnswer,
    internalLinkPlan,
    externalPostTitle: isEn
      ? `${city} ${topic}: Fanju app / 饭局app small-table dinner guide`
      : `${city}${topic}：饭局app / Fanju饭局小桌指南`,
    H1,
    outline,
    rejectIfSimilarTo: {
      H1: "Reject if the H1 only swaps city/topic words, or is near the old fixed H1 pools.",
      H2: "Reject if H2 headings reuse generic sections such as who this is for, safety and boundaries, how it works, next steps, or city/topic-swapped variants.",
      paragraphOpenings: "Reject if paragraph openings repeat the first 12-18 words/chars used by recent articles.",
      structureFingerprint: "Reject if the sequence is just scene/problem/Fanju explanation/host trust/safety/next step in the same order as recent articles.",
    },
  }
}

// The former fixed H1-H10 article frame factory was intentionally removed.
// Production prompts now use per-route editorialBrief objects instead of reusable heading pools.

function systemInstructionFor(locale) {
  if (locale === "en") {
        return [
      "Write one public Fanju city article as plain Markdown only, using the supplied editorial brief as the source of truth.",
      "Voice: human editor, practical, city-specific, calm. No hype and no search-ranking promises.",
      "The article must be original prose, not an outline, not a template, and not a landing page.",
      "The first line must be exactly one article H1 beginning with '# '. The brief H1 field is a generation instruction, not the final title — you must write an original title based on the instruction. Do not output the instruction text as the title.",
      "Use 5 to 7 '## ' H2 sections. H3 is optional. H4-H10 are forbidden.",
      "The brief outline[].heading fields are H2 generation instructions, not final headings — write an original H2 for each based on its instruction. Every H2 must be unique to this specific city+topic+angle and must not be a generic reusable section heading.",
      "【MANDATORY OPENING】: The first paragraph must define Fanju app as a social app for small-table meals and offline connection. Its first sentence MUST include the city and topic. It MUST include these exact phrases: 'not a dating guarantee', 'not a random group chat', 'not an endless profile feed'. Missing these results in a 0 score.",
      "Bridge the Chinese entity: Fanju is also known in Chinese as “饭局 / 饭局app / Fanju饭局”.",
      "Include at least five local details, three real reader questions, two concrete judgment criteria, one 'who this is not for' point, and one safety boundary.",
      "Never invent statistics, restaurants, user counts, or awards.",
      "Never mention tools, backends, or production processes.",
      "Never write Markdown links, raw URLs, or HTML anchor tags. Mention internalLinkPlan entities as plain text; the site template adds links.",
      "Never output JSON, YAML, or markdown skeleton text.",
      "Do not use brief questions as headings. Every H2 needs exactly two substantial paragraph blocks.",
      "【LENGTH REQUIREMENT】: The article body MUST be between 3,500 and 7,000 characters. Expand with deep local observations and practical advice, not filler.",
      "Forbidden public words: automation, prompt, pipeline, cron, JSONL, hash, Modal, generated, QQ, webmaster, domain for sale, advertising cooperation.",
      "Return only the Markdown article text. No code fence. No JSON object.",
    ].join("\n");
  }
  return [
    "只写一个公开的饭局 Fanju 城市文章，输出必须是纯 Markdown 文章正文，并以提供的 editorial brief 为唯一生产依据。",
    "声音：真人编辑、自然、具体、平静、实用。不要营销腔，不承诺搜索排名。",
    "正文必须是完整原创文章，不是提纲、模板、摘要、占位段落、城市/主题换词页或落地页。",
    "第一行必须是唯一 H1，必须以「# 」开头。brief 里的 H1 字段是生成指令，不是最终标题——你必须根据指令写出一个原创标题，不能把指令文字直接当标题输出。",
    "正文必须使用 5 到 7 个「## 」H2。H3 仅限回答具体疑问。H4-H10 严格禁止。",
    "brief 里的 outline[].heading 字段是每个 H2 的生成指令，不是最终标题——你必须根据每条指令写出一个原创 H2，不能把指令文字直接当标题输出。每个 H2 必须只适用于这篇文章的城市+主题+视角组合，不能是可以套用到任何城市的通用句式。",
    "【首段硬性要求】：第一段第一句必须包含城市、主题和「饭局app」；首段必须逐字包含这三个【精确短语】（不能改写为近义词）：「不是相亲保证」「不是随机群聊」「不是无限刷资料」。缺少任何一个都会导致 0 分重写。",
    "【正文长度硬性要求】：正文（除标题外）必须达到 2500 到 4500 个汉字。每个 H2 下必须有两个实质性自然段，每段不少于 120 字。请通过深挖本地细节、细化同桌规则来扩充篇幅，禁止废话堆砌。",
    "【严禁重复】：每个自然段的开头句必须与其他所有段落的开头句完全不同；正文中不得出现与首段内容相同或高度相似的段落；每个 H2 下的内容必须覆盖全新角度，不得重述已有段落的核心句。",
    "【严禁英文噪音】：除「Fanju」和城市英文名外，禁止在中文正文、标题、H2 中出现任何英文词汇（如 meetup, jlpt, crossfit, telegram, faq, brt, wod 等），必须全部使用对应的中文。",
    "全文至少包含 5 个本地细节、3 个真实疑问、2 个具体判断标准、1 个“不适合谁”、1 个安全或退出边界。",
    "不要编造统计数据、餐厅名、用户数、奖项或合作伙伴。",
    "不要提及任何工具、后台、生产流程、Modal、自动化或 prompt。",
    "正文不要写 Markdown 链接、裸 URL、href 或 HTML a 标签。internalLinkPlan 只作为锚文本计划，真实链接由页面模板统一添加。",
    "不要输出 JSON、YAML frontmatter、metadata key、提示词内容、章节占位文字或 markdown 骨架说明。",
    "不要把 brief 里的问题原文当成公开标题。每个 H2 后面到下一个标题之前，必须有且只有两个有实质信息的长自然段。",
    "不要出现停放域名、站长联系、本地联系、广告招商、QQ 或站主联系方式。",
    "如果路由主题本身包含 AI，只能把 AI 当作公开主题词使用，不能用来描述写作或生产过程。",
    "公开字段禁用词：自动化、prompt、提示词、pipeline、JSONL、哈希、Modal、生成、本站、联系QQ、QQ、本地联系、站长、广告合作、域名出售。",
    "只返回 Markdown 文章正文，不要代码块，不要 JSON object。",
  ].join("\n");
}

function userPromptFor(profile, editorialBrief) {
  const isEn = profile.locale === "en"
  const briefJson = JSON.stringify(editorialBrief, null, 2)
  const titleDirection = titleDirectionFor(profile)

  if (isEn) {
    return [
      `Write a high-quality English article for route ${profile.route}.`,
      `City: ${profile.cityNameLocalized}. Topic: ${profile.topicNameLocalized}.`,
      `Editorial brief JSON:\n${briefJson}`,
      `Title/H1 guardrails: title direction=${titleDirection}. Do not replace the H1 with "${profile.cityNameLocalized} ${profile.topicNameLocalized} Guide", "A Guide to ${profile.topicNameLocalized} in ${profile.cityNameLocalized}", "${profile.topicNameLocalized} in ${profile.cityNameLocalized}", "How to join ${profile.topicNameLocalized} in ${profile.cityNameLocalized}", or any title that only swaps city/topic words. Also avoid bland titles like "${indefiniteArticleEn(profile.cityNameLocalized).replace(/^./, (c) => c.toUpperCase())} ${profile.cityNameLocalized} dinner journey" or "Discover ${profile.cityNameLocalized} through dinner".`,
      `Angle: ${profile.angle.name}. Use this angle: ${profile.angle.instruction}`,
      `Style profile: structure=${profile.structure}; opening=${profile.openingStyle}; faq=${profile.faqMode}; cta=${profile.ctaPosition}; example=${profile.exampleType}; tone=${profile.tone}; title=${profile.titlePattern}.`,
      "The brief H1 field is a generation instruction — write an original title from it, do not output the instruction text. The brief outline[].heading fields are H2 generation instructions — write an original H2 for each, do not output the instruction text. Every heading must be unique to this city+topic+angle and must not be reusable across articles.",
      "Heading contract: exactly one H1; exactly 6 H2 sections; no H3 unless a reader question genuinely needs it; no H4-H10.",
      `Originality contract: do not reuse old H1/H2 structures, paragraph openings, or the standard scene/problem/Fanju explanation/host trust/safety/next step structure. The automated gate will compare against historical titles, H2s, paragraph openings, and structure fingerprints.`,
      `Output contract: first character '#'; title/H1 includes Fanju app or a natural Chinese entity bridge; the first sentence of the first paragraph includes ${profile.cityNameLocalized}, ${profile.topicNameLocalized}, and Fanju app; the first paragraph also includes the Chinese entity bridge “饭局 / 饭局app / Fanju饭局” and the exact phrases “not a dating guarantee”, “not a random group chat”, and “not an endless profile feed”; body has 12-14 natural paragraphs, with exactly two paragraphs under each H2; no repeated paragraph openings; no public links; no JSON.`,
      "Hard public-content rule: do not include QQ, webmaster contact, local contact, parked-domain text, advertising-sales copy, or any Chinese parked-domain phrase.",
      "Hard linking rule: do not include [text](/path), https://fanju.app paths, raw URLs, <a href=\"...\">, the words markdown link, or any href. All real links are added by the page template.",
      `Body requirements: 3,600-7,200 total characters, not 3,600 words; no filler. Do not use bullet lists or numbered lists. Use blank lines between paragraphs. Start with one answer-summary paragraph in 120-220 words. Each H2 must be followed by exactly two paragraph blocks of 70-120 words each before the next heading. Across the article, naturally resolve the reader's decision points before joining: local fit, table rhythm, host and venue quality, guest mix, comfort boundaries, skip signals, and a concrete next move.`,
      "Return only the finished Markdown article text. The first character of the response must be '#'. Do not wrap it in JSON, YAML frontmatter, or a code fence.",
    ].join("\n")
  }
  return [
    `为「${profile.cityNameLocalized}」城市页写一篇高质量中文长文。`,
    `城市：${profile.cityNameLocalized}。主题：${profile.topicNameLocalized}。`,
    `Editorial brief JSON:\n${briefJson}`,
    `标题/H1 防线：标题方向=${titleDirection}。禁止改成只替换城市/主题的模板标题。正文前 200 字必须自然出现「饭局app」和「${profile.cityNameLocalized}」，开头之后至少一段也要自然出现「${profile.cityNameLocalized}」。`,
    `中文城市名硬规则：公开标题、H1、H2 和正文里，城市名只能使用「${profile.cityNameLocalized}」；URL slug、拼音城市名、英文城市名一律不能出现在公开字段里。`,
    `角度：${profile.angle.name}。按这个方向写：${profile.angle.instruction}`,
    `风格 profile：结构=${profile.structure}；开头=${profile.openingStyle}；FAQ=${profile.faqMode}；CTA=${profile.ctaPosition}；例子=${profile.exampleType}；语气=${profile.tone}；标题=${profile.titlePattern}。`,
    "brief 里的 H1 字段是生成指令——根据指令写出原创标题，不能把指令文字直接输出为标题。brief 里的 outline[].heading 字段是 H2 生成指令——根据每条指令写出原创 H2，不能把指令文字直接输出为标题。每个标题必须只适用于这篇文章的城市+主题+视角，不能是可以套用到任何文章的通用句式。",
    "标题契约：只允许 1 个 H1；必须正好 6 个 H2；H3 只在真实需要时出现；禁止 H4-H10。",
    "【H2 后缀硬规则】：每个 H2 标题必须在标题本身结束，严禁在标题末尾追加「，回到XXX饭局」「，返回XXX」「，回到主题」等任何导航性后缀。违反此规则将导致 0 分重写。",
    "原创契约：不要复用历史 H1/H2 结构、段落开头或固定的 scene/problem/Fanju explanation/host trust/safety/next step 顺序。自动门禁会比较历史标题、H2、段落开头和结构指纹。",
    `输出契约：第一个字符必须是「#」；H1 自然包含「饭局 / 饭局app / Fanju饭局 / 城市+主题饭局」之一；第一段第一句必须同时出现「${profile.cityNameLocalized}」「${profile.topicNameLocalized}」和「饭局app」或「Fanju饭局」；第一段必须逐字包含「不是相亲保证」「不是随机群聊」「不是无限刷资料」这三个精确短语（不能改写）；正文 12-14 个自然段，每个 H2 下正好两个自然段；无重复段落开头；无公开链接；无 JSON。`,
    "公开内容硬规则：不要出现本站、联系QQ、QQ、本地联系、站长、广告合作、域名出售、停放域名、招商或站主联系方式。",
    "链接硬规则：不要出现 [文字](/path)、https://fanju.app 路径、��� URL、<a href=\"...\">、markdown link 或任何 href。所有真实链接由页面模板统一添加。",
    `正文结构硬规则：2,800-5,000 字符；段落之间必须空行；不要写项目符号列表、编号列表或结语。第一段必须是 answer-summary 式自然段，在 120-220 字内解释饭局app / Fanju饭局实体，并明确落到「${profile.cityNameLocalized}」。每个 H2 后面到下一个标题前必须正好两个自然段，每段 120-220 个中文字符。全文要自然回答读者报名前会想清楚的决定点：本地适配、这一桌的节奏、主理人/餐厅/同桌质量、舒适边界、哪些信号说明不该去、下一步怎么做。不要反复用「饭局app可以帮助」「通过饭局app」开头。`,
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

  // Balance after history filtering so LIMIT=1000 covers fresh routes instead
  // of repeating content that is already in Markdown, D1, or published state.
  const routeCandidates = enabledRoutes.filter((route) => {
    const routeKey = routeKeyFor({ locale: route.locale, citySlug: route.citySlug, topicSlug: route.topicSlug, route: route.route })
    const localeCityTypeKey = localeCityTypeKeyFor({ locale: route.locale, citySlug: route.citySlug, topicSlug: route.topicSlug, route: route.route })
    return !historicalSkipReason({ ...route, routeKey, localeCityTypeKey }, history)
  })
  if (routeCandidates.length === 0) {
    throw new Error(`No unpublished routes for locale=${locale}`)
  }
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
    if (attempts++ > maxTotalAttempts) {
      throw new Error(`Could not build ${count} unique prompts for locale=${locale} after ${attempts} attempts`)
    }
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
      angle,
      structure,
      openingStyle,
      faqMode,
      ctaPosition,
      exampleType,
      tone,
      titlePattern,
    }

    const editorialBrief = buildEditorialBrief(profile)
    const h1Key = String(editorialBrief.H1 || "").toLowerCase().replace(/\s+/g, " ").trim()
    if (seenH1Set.has(h1Key)) continue

    const systemInstruction = systemInstructionFor(profile.locale)
    const userPrompt = userPromptFor(profile, editorialBrief)

    const profileHash = sha256Hex(profileKey)
    const promptHash = sha256Hex(`${systemInstruction}\n---\n${userPrompt}\n---\n${JSON.stringify(editorialBrief)}`)
    if (promptHashSet.has(promptHash)) continue
    const historyReason = historicalSkipReason({ ...profile, editorialBrief, promptHash, profileHash }, history)
    if (historyReason) continue

    profileKeySet.add(profileKey)
    promptHashSet.add(promptHash)
    routeKeySet.add(routeKey)
    canonicalPathSet.add(route.route)
    localeCityTypeSet.add(localeCityTypeKey)
    seenH1Set.add(h1Key)

    out.push({
      profile,
      editorialBrief,
      systemInstruction,
      userPrompt,
      profileHash,
      promptHash,
    })
  }

  if (out.length < count) {
    throw new Error(`Could not build ${count} unpublished unique prompts for locale=${locale}; generated ${out.length}`)
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
      localeCityTypeKey: p.profile.localeCityTypeKey,
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
      editorialBrief: p.editorialBrief,
      briefHash: sha256Hex(JSON.stringify(p.editorialBrief)),
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
