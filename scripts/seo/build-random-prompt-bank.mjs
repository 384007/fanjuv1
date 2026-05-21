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

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const MANIFEST_FILE = join(ROOT, "data/seo/route-manifest.json")
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

const SECTION_BRIEFS_EN = [
  "local rhythm and why this route topic matters here",
  "who should join and who should wait",
  "what the table actually feels like from arrival to dessert",
  "host, venue, and guest-quality signals",
  "comfort boundaries, safety cues, and skip signals",
  "how to choose the right table without overthinking it",
  "a concrete next move that does not sound like sales copy",
]

const SECTION_BRIEFS_ZH = [
  "这座城市的生活节奏与本主题为什么成立",
  "哪些人适合坐这一桌，哪些人应该先观望",
  "从进门到散场，这桌饭真实会怎么流动",
  "主理人、餐厅和同桌质量应该怎么看",
  "舒适边界、安全信号和不该报名的信号",
  "怎样选对一桌饭，而不是盲目参加",
  "一个具体下一步，但不要写成硬广告",
]

function titleDirectionFor(profile) {
  const map = profile.locale === "en" ? TITLE_DIRECTIONS_EN : TITLE_DIRECTIONS_ZH
  return map[profile.titlePattern] || (profile.locale === "en" ? "use a specific editorial hook" : "使用一个具体编辑钩子")
}

function sectionBriefsFor(profile) {
  const briefs = profile.locale === "en" ? SECTION_BRIEFS_EN : SECTION_BRIEFS_ZH
  const shiftSource = `${profile.citySlug}|${profile.topicSlug}|${profile.angle.id}|${profile.structure}`
  const start = seedFromString(shiftSource) % briefs.length
  return [...briefs.slice(start), ...briefs.slice(0, start)].slice(0, 6)
}

function frameIndex(profile, salt, size) {
  return seedFromString(`${profile.citySlug}|${profile.topicSlug}|${profile.angle.id}|${profile.structure}|${profile.titlePattern}|${salt}`) % size
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

  if (isEn) {
    const lens = angleLensEn(profile.angle.id)
    const scene = [
      "after-work pause",
      "weekend table",
      "first-message moment",
      "neighbourhood choice",
      "guest-list question",
      "quiet arrival",
      "second-dinner possibility",
    ][frameIndex(profile, "scene", 7)]
    const h1s = [
      `In ${city}, Fanju app turns ${topic} into a table people can actually trust`,
      `When ${topic} feels too loose in ${city}, Fanju app starts with the table`,
      `${city} after work: how Fanju app makes ${topic} feel like a real room`,
      `For people trying ${topic} in ${city}, Fanju app puts the guest mix first`,
      `${city} does not need another vague invite; Fanju app makes ${topic} specific`,
      `A calmer way to approach ${topic} in ${city} through Fanju app`,
      `Why ${topic} in ${city} works better when Fanju app keeps the table small`,
    ]
    const h2s = [
      [
        `${city}'s ${scene} is why ${topic} needs a clearer frame`,
        `The ${scene} in ${city} should not become another loose invite`,
        `Why ${topic} needs a sharper table before the night begins in ${city}`,
      ][frameIndex(profile, "h2-1", 3)],
      [
        `The ${lens} changes who should sit at this table`,
        `A table built around ${lens} needs a different guest mix`,
        `Who belongs at this ${topic} table depends on the ${lens}`,
      ][frameIndex(profile, "h2-2", 3)],
      [
        `How Fanju app keeps ${topic} specific before anyone arrives`,
        `Before the first order, Fanju app should make the table legible`,
        `The details that keep ${topic} from becoming a vague social plan`,
      ][frameIndex(profile, "h2-3", 3)],
      [
        `What the host and venue should prove in ${city}`,
        `Host choices that make ${topic} credible in ${city}`,
        `The venue signals that make strangers easier to trust in ${city}`,
      ][frameIndex(profile, "h2-4", 3)],
      [
        `The point where comfort matters more than staying polite`,
        `When the table should slow down instead of getting louder`,
        `Where a good dinner leaves room for a quiet no`,
      ][frameIndex(profile, "h2-5", 3)],
      [
        `Choosing one table without turning the night into pressure`,
        `A next step that keeps ${topic} human, not transactional`,
        `How to leave ${city} with a second-table possibility`,
      ][frameIndex(profile, "h2-6", 3)],
    ]
    const h3s = [
      `### What should I check before joining my first table?`,
      `### How do I know the dinner is not just another meetup?`,
      `### What if I arrive alone and do not know anyone?`,
    ]
    return {
      h1: h1s[frameIndex(profile, "h1", h1s.length)],
      h2s,
      h3: h3s[frameIndex(profile, "h3", h3s.length)],
    }
  }

  const lens = angleLensZh(profile.angle.id)
  const scene = [
    "下班后的空档",
    "周末晚饭",
    "第一次报名的那一刻",
    "街区饭点",
    "同桌名单出现前",
    "一个人到场前十分钟",
    "第二次见面的余地",
  ][frameIndex(profile, "scene", 7)]
  const h1s = [
    `${city}不想只靠群聊时，饭局app怎样把${topic}坐成一桌`,
    `在${city}找一桌不尴尬的${topic}，饭局app先解决什么`,
    `${city}${topic}不是凑人吃饭，饭局app更看重这一桌的边界`,
    `下班后的${city}，饭局app怎样让${topic}有真实同桌`,
    `${city}想参加${topic}，饭局app把信任感放在饭前`,
    `${city}的一顿${topic}，饭局app为什么先看人再看热闹`,
    `在${city}把${topic}坐稳，饭局app需要筛掉哪些尴尬`,
  ]
  const h2s = [
    [
      `在${city}，${topic}要先把同桌预期讲清楚`,
      `${city}的${topic}不能只靠一句有人来吗`,
      `${scene}提醒${city}：这桌饭要先有边界`,
    ][frameIndex(profile, "h2-1", 3)],
    [
      `${lens}会改变谁适合坐到这张桌边`,
      `围绕${lens}组一桌人，不能只看热闹`,
      `谁该坐下来，先看${lens}有没有被说清楚`,
    ][frameIndex(profile, "h2-2", 3)],
    [
      `饭局app怎样把${topic}从泛泛邀约变成具体一桌`,
      `第一条报名信息就应该让${topic}变得可判断`,
      `别急着凑人，先让这一桌的预期立起来`,
    ][frameIndex(profile, "h2-3", 3)],
    [
      `${city}主理人和餐厅细节要先证明什么`,
      `真正可信的安排往往藏在饭前细节里`,
      `餐厅、时间和同桌说明会暴露主理人的功底`,
    ][frameIndex(profile, "h2-4", 3)],
    [
      `舒服的边界不在热闹里而在这些停顿里`,
      `一桌饭什么时候该慢下来而不是继续加人`,
      `能让人安心的局，通常先允许有人说不`,
    ][frameIndex(profile, "h2-5", 3)],
    [
      `选稳第一桌之后再谈下一次见面`,
      `${city}的第一顿饭要留下可复盘的余地`,
      `下一步不是冲动报名，而是选对这一桌`,
    ][frameIndex(profile, "h2-6", 3)],
  ]
  const h3s = [
    `### 第一次参加前最该先问哪一个问题？`,
    `### 怎么判断这不是一场随便拼桌？`,
    `### 如果一个人来会不会显得尴尬？`,
  ]
  return {
    h1: h1s[frameIndex(profile, "h1", h1s.length)],
    h2s,
    h3: h3s[frameIndex(profile, "h3", h3s.length)],
  }
}

// ---------------------------------------------------------------------------
// System & user prompt assembly. Strict negative list to prevent the model
// from ever leaking the internal pipeline name to the public-facing article.
// ---------------------------------------------------------------------------

function systemInstructionFor(locale) {
  if (locale === "en") {
    return [
      "Write one public Fanju city article as plain Markdown only.",
      "Voice: human, practical, city-specific, calm. No hype.",
      "The body must be a complete editorial article, not an outline, template, summary, list of placeholders, or short answer.",
      "The first line must be the article H1 and must begin with '# '.",
      "Markdown heading syntax is strict: valid headings are '# Title', '## Title', and '### Question'. Invalid headings like '#Title' or '##Title' fail.",
      "Use '## ' for major sections and exactly one concrete reader-question line beginning with '### '.",
      "Before returning, silently verify: H1 has city + Fanju app; title is not a reusable template; description has city; body has 5-7 H2, exactly one H3, at least 10 natural paragraphs, no public links, no JSON.",
      "Write original paragraphs with concrete local context. Do not repeat the same sentence pattern across sections.",
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
      "Markdown 标题语法必须严格：合法标题是「# 标题」「## 标题」「### 问题」。像「#标题」「##标题」这种没有空格的标题会失败。",
      "主要小节必须用「## 」开头，且只能有 1 个具体疑问型「### 」标题。",
      "返回前请在内部自检：H1 有中文城市名 + 饭局app；标题不是套模板；description 有中文城市名；正文有 5-7 个 H2、且只有 1 个 H3、至少 10 个自然段、无公开链接、无 JSON。",
      "每段都要有真实城市语境，不要在不同小节反复套同一种句式。",
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

function userPromptFor(profile) {
  const isEn = profile.locale === "en"
  const titleDirection = titleDirectionFor(profile)
  const sectionBriefs = sectionBriefsFor(profile)
  const frame = articleFrameFor(profile)
  if (isEn) {
    return [
      `Write a high-quality long-form English article for route ${profile.route}.`,
      `City: ${profile.cityNameLocalized}. Topic: ${profile.topicNameLocalized}.`,
      `Use this exact H1 as the first line, with no edits:\n# ${frame.h1}\nThis H1 already includes the city and the exact phrase "Fanju app".`,
      `Title/H1 guardrails: title direction=${titleDirection}. Do not replace the H1 with "${profile.cityNameLocalized} ${profile.topicNameLocalized} Guide", "A Guide to ${profile.topicNameLocalized} in ${profile.cityNameLocalized}", "${profile.topicNameLocalized} in ${profile.cityNameLocalized}", "How to join ${profile.topicNameLocalized} in ${profile.cityNameLocalized}", or any title that only swaps city/topic words. Also avoid bland titles like "A ${profile.cityNameLocalized} dinner journey" or "Discover ${profile.cityNameLocalized} through dinner".`,
      `Angle: ${profile.angle.name}. Use this angle: ${profile.angle.instruction}`,
      `Style profile: structure=${profile.structure}; opening=${profile.openingStyle}; faq=${profile.faqMode}; cta=${profile.ctaPosition}; example=${profile.exampleType}; tone=${profile.tone}; title=${profile.titlePattern}.`,
      `Use these exact 6 H2 headings, in this order, with no edits:\n${frame.h2s.map((heading) => `## ${heading}`).join("\n")}`,
      `Use this exact H3 once, after the third or fourth H2 section:\n${frame.h3}`,
      `Section intent, for paragraph content only: ${sectionBriefs.map((brief, i) => `${i + 1}. ${brief}`).join(" | ")}.`,
      "Quality: practical editorial guide, not a landing page. Include city rhythm, neighbourhood choice, attendee concerns, host reliability cues, comfort boundaries, and decision criteria. Every H2 section must have real article paragraphs with distinct ideas.",
      "Output contract that must pass automated quality checks: first character '#'; exactly one H1; 6 H2 headings using '## ' with a space; exactly one H3 using '### '; at least 13 natural paragraphs; every H2 has at least two paragraphs; description/source summary can be taken from the first paragraph and therefore the first paragraph must mention the city; title, first paragraph, and opening 600 characters must mention Fanju app.",
      "Hard public-content rule: do not include QQ, webmaster contact, local contact, parked-domain text, advertising-sales copy, or any Chinese parked-domain phrase.",
      "Hard linking rule: do not include [text](/path), https://fanju.app paths, raw URLs, <a href=\"...\">, the words markdown link, or any href. All real links are added by the page template.",
      `Body requirements: 4,600-6,500 characters; at least 13 natural paragraphs; no filler. Use blank lines between paragraphs. Start the public article with an answer-summary paragraph in the first 120 words explaining that Fanju app is a social dining app for small, clearly described meals and real-world connections in ${profile.cityNameLocalized}. Then include a short key-points bullet list covering who it suits, the core dinner scenario, and comfort or trust cues, but do not put a heading above that list. After that, write the 6 required H2 sections with original city/topic-specific headings shaped by the angle. Avoid checklist-style section labels such as "Who this is for", "Safety and boundaries", "How it works", "What to expect", "Next steps", or "Conclusion"; every H2 must sound like an editor wrote it for this exact city, topic, audience, and tension. Across the article, naturally resolve the reader's decision points before joining: local fit, table rhythm, host and venue quality, guest mix, comfort boundaries, skip signals, and a concrete next move. Fold those points into original sections instead of using them as literal H2 labels. Include exactly one concrete reader-question H3 line beginning "### "; do not use a generic FAQ label. If the body has fewer than 10 public paragraphs, it will be rejected.`,
      "Return only the finished Markdown article text. The first character of the response must be '#'. Do not wrap it in JSON, YAML frontmatter, or a code fence.",
    ].join("\n")
  }
  return [
    `为「${profile.cityNameLocalized}」城市页写一篇高质量中文长文。`,
    `城市：${profile.cityNameLocalized}。主题：${profile.topicNameLocalized}。`,
    `第一行必须使用这个精确 H1，不能改字、不能换标题：\n# ${frame.h1}\n这个 H1 已经包含中文城市名和「饭局app」。`,
    `标题/H1 防线：标题方向=${titleDirection}。禁止改成「${profile.cityNameLocalized}${profile.topicNameLocalized}指南」「${profile.cityNameLocalized}${profile.topicNameLocalized}怎么参加」「${profile.cityNameLocalized}${profile.topicNameLocalized}攻略」「${profile.cityNameLocalized}的饭局之旅」「探索${profile.cityNameLocalized}」这类只替换城市/主题的模板标题。description、正文前 200 字必须自然出现「饭局app」和「${profile.cityNameLocalized}」。`,
    `中文城市名硬规则：公开标题、H1、description、H2 和正文里，城市名只能使用「${profile.cityNameLocalized}」这个中文名；URL slug、拼音城市名、英文城市名一律不能出现在公开字段里。中国、港澳台城市全部使用中文名。`,
    `角度：${profile.angle.name}。按这个方向写：${profile.angle.instruction}`,
    `风格 profile：结构=${profile.structure}；开头=${profile.openingStyle}；FAQ=${profile.faqMode}；CTA=${profile.ctaPosition}；例子=${profile.exampleType}；语气=${profile.tone}；标题=${profile.titlePattern}。`,
    `必须使用这 6 个精确 H2，按顺序写，不能改字：\n${frame.h2s.map((heading) => `## ${heading}`).join("\n")}`,
    `必须且只使用这 1 个精确 H3，放在第 3 或第 4 个 H2 小节之后：\n${frame.h3}`,
    `小节写作意图只用于正文内容，不要原样复制成标题：${sectionBriefs.map((brief, i) => `${i + 1}. ${brief}`).join(" | ")}。`,
    "质量：像真实城市饭局指南，不像落地页。写出城市节奏、街区选择、同桌人数、报名前顾虑、主理人信号、安全判断、报名建议。每个 H2 都必须有真实正文段落，且各小节观点不能重复。",
    "必须通过的输出契约：回复第一个字符必须是「#」；只允许 1 个 H1；必须有 6 个带空格的「## 」标题；必须且只允许 1 个「### 」标题；至少 13 个自然段；每个 H2 下至少 2 段；第一段必须同时出现「饭局app」和中文城市名；标题、H1、前 600 字都必须出现饭局app。",
    "公开内容硬规则：不要出现本站、联系QQ、QQ、本地联系、站长、广告合作、域名出售、停放域名、招商或站主联系方式。",
    "链接硬规则：不要出现 [文字](/path)、https://fanju.app 路径、裸 URL、<a href=\"...\">、markdown link 或任何 href。所有真实链接由页面模板统一添加。",
    `正文要求：3,200-4,900 字符；至少 13 个自然段；段落之间必须空行；不要灌水，不要超过 5,000 字符。开头必须是 answer-summary 式自然段，在前 200 字解释饭局app / Fanju 是围绕小桌吃饭、清晰主题和线下连接的社交应用，并明确落到「${profile.cityNameLocalized}」。随后直接写一个简短要点列表，覆盖合适人群、饭局场景和安全重点，但不要给这个列表单独加 H2/H3 标题。然后写 6 个 H2，小节标题必须围绕${profile.cityNameLocalized}、${profile.topicNameLocalized}和本次角度重新拟定。不要用清单式通用小标题；禁止用「适合谁」「核心饭局场景」「安全重点」「一桌饭怎样运作」「主理人信号」「舒适边界」「下一步行动」「结语」这类模板 H2。全文要自然回答读者报名前会想清楚的决定点：本地适配、这一桌的节奏、主理人/餐厅/同桌质量、舒适边界、哪些信号说明不该去、下一步怎么做。把这些内容揉进原创小节，不要把这些决定点原样当标题。每个 H2 下至少写 2 个扎实、互不重复的段落，每段约 120-190 个汉字。必须包含且只包含 1 个以「### 」开头的具体疑问型 H3，不要写通用 FAQ 标签。少于 10 个公开自然段会被拒绝。`,
    "只返回最终 Markdown 文章正文，回复第一个字符必须是「#」。不要 JSON，不要 YAML frontmatter，不要代码块。",
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

function buildLocalePrompts({ locale, count, manifestEntries, cityNameIndex, masterSeed }) {
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
  const routePool = balancedRoutePool(rng, enabledRoutes)

  const profileKeySet = new Set()
  const promptHashSet = new Set()
  const out = []

  let routeCursor = 0
  let attempts = 0
  const maxTotalAttempts = count * 200

  while (out.length < count) {
    if (attempts++ > maxTotalAttempts) {
      throw new Error(`Could not build ${count} unique prompts for locale=${locale} after ${attempts} attempts`)
    }
    const route = routePool[routeCursor % routePool.length]
    routeCursor++

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
      angle,
      structure,
      openingStyle,
      faqMode,
      ctaPosition,
      exampleType,
      tone,
      titlePattern,
    }

    const systemInstruction = systemInstructionFor(profile.locale)
    const userPrompt = userPromptFor(profile)

    const profileHash = sha256Hex(profileKey)
    const promptHash = sha256Hex(`${systemInstruction}\n---\n${userPrompt}`)
    if (promptHashSet.has(promptHash)) continue

    profileKeySet.add(profileKey)
    promptHashSet.add(promptHash)

    out.push({
      profile,
      systemInstruction,
      userPrompt,
      profileHash,
      promptHash,
    })
  }

  return out
}

function main() {
  const manifest = loadManifest()
  assertZhCityDisplayNames(manifest.entries)
  const cityNameIndex = buildCityNameIndex(manifest.entries)

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

  const enPrompts = counts.en > 0
    ? buildLocalePrompts({ locale: "en", count: counts.en, manifestEntries: manifest.entries, cityNameIndex, masterSeed })
    : []
  const zhPrompts = counts.zh > 0
    ? buildLocalePrompts({ locale: "zh", count: counts.zh, manifestEntries: manifest.entries, cityNameIndex, masterSeed })
    : []

  const all = []
  // Interleave so EN and ZH alternate roughly evenly through the file.
  const total = enPrompts.length + zhPrompts.length
  let ei = 0
  let zi = 0
  for (let i = 0; i < total; i++) {
    const wantEn = enPrompts.length - ei > 0 && (zhPrompts.length - zi === 0 || i % 2 === 0)
    if (wantEn) all.push(enPrompts[ei++])
    else all.push(zhPrompts[zi++])
  }

  const datePrefix = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")

  // Final emission. Each line is an independent JSON object.
  const lines = []
  for (let i = 0; i < all.length; i++) {
    const p = all[i]
    const idx = String(i + 1).padStart(6, "0")
    const promptId = `fanju-seo-${idx}`
    const seed = `${datePrefix}-${idx}`
    const obj = {
      promptId,
      seed,
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
  console.log("  en:   ", enPrompts.length)
  console.log("  zh:   ", zhPrompts.length)
  console.log("  seed: ", RANDOM_SEED)
}

main()
