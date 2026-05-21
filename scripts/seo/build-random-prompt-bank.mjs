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

// ---------------------------------------------------------------------------
// System & user prompt assembly. Strict negative list to prevent the model
// from ever leaking the internal pipeline name to the public-facing article.
// ---------------------------------------------------------------------------

function systemInstructionFor(locale) {
  if (locale === "en") {
    return [
      "Write one public Fanju city article as valid JSON only.",
      "Voice: human, practical, city-specific, calm. No hype.",
      "The body must be a complete editorial article, not an outline, template, summary, list of placeholders, or short answer.",
      "Write original paragraphs with concrete local context. Do not repeat the same sentence pattern across sections.",
      "Never invent statistics, restaurants, user counts, awards, or partnerships.",
      "Never mention tools or production process.",
      "Never write Markdown links, raw URLs, href attributes, or HTML anchor tags. Mention page names as plain text only; the site template adds all links.",
      "Never print JSON keys, prompt instructions, section placeholders, or markdown skeleton text inside public fields.",
      "Never include parked-domain, webmaster, local-contact, advertising-sales, QQ, or site-owner contact copy.",
      "If the route topic contains AI, use AI only as a normal public topic term, never as self-reference or production commentary.",
      "Forbidden public words: automation, prompt, pipeline, cron, JSONL, hash, Modal, generated, QQ, webmaster, domain for sale, advertising cooperation, 本站, 联系QQ, 站长, 本地联系, 广告合作, 域名出售.",
      "Return exactly one JSON object and nothing else.",
    ].join("\n")
  }
  return [
      "只写一个公开的饭局 Fanju 城市文章，输出必须是合法 JSON。",
      "声音：自然、具体、平静、实用。不要营销腔。",
      "正文必须是一篇完整、有编辑感的文章，不是提纲、模板、摘要、占位段落或短回答。",
      "每段都要有真实城市语境，不要在不同小节反复套同一种句式。",
      "不要编造统计数据、餐厅名、用户数、奖项或合作伙伴。",
    "不要提及任何工具、后台或生产流程。",
    "正文不要写 Markdown 链接、裸 URL、href 或 HTML a 标签。可以提到页面名称，但真实链接全部由页面模板统一添加。",
    "公开字段里不要输出 JSON key、提示词内容、章节占位文字或 markdown 骨架说明。",
    "不要出现停放域名、站长联系、本地联系、广告招商、QQ 或站主联系方式。",
    "如果路由主题本身包含 AI，只能把 AI 当作公开主题词使用，不能用来描述写作或生产过程。",
    "公开字段禁用词：自动化、prompt、提示词、pipeline、JSONL、哈希、Modal、生成、本站、联系QQ、QQ、本地联系、站长、广告合作、域名出售。",
    "只返回一个 JSON object，不要额外说明。",
  ].join("\n")
}

function userPromptFor(profile) {
  const isEn = profile.locale === "en"
  if (isEn) {
    return [
      `Write a high-quality long-form English article for route ${profile.route}.`,
      `City: ${profile.cityNameLocalized}. Topic: ${profile.topicNameLocalized}.`,
      `Title rule: write a specific editorial title that includes ${profile.cityNameLocalized} and naturally mentions Fanju app, but is not a reusable template. Do not use "${profile.cityNameLocalized} ${profile.topicNameLocalized} Guide", "A Guide to ${profile.topicNameLocalized} in ${profile.cityNameLocalized}", or any title that only swaps city/topic words. Tie the title to the angle, audience, and one concrete local or industry tension.`,
      `Angle: ${profile.angle.name}. Use this angle: ${profile.angle.instruction}`,
      `Style profile: structure=${profile.structure}; opening=${profile.openingStyle}; faq=${profile.faqMode}; cta=${profile.ctaPosition}; example=${profile.exampleType}; tone=${profile.tone}; title=${profile.titlePattern}.`,
      "Quality: practical editorial guide, not a landing page. Include city rhythm, neighbourhood choice, attendee concerns, host signals, safety context, and decision criteria. Every H2 section must have real article paragraphs with distinct ideas.",
      "Hard public-content rule: do not include QQ, webmaster contact, local contact, parked-domain text, advertising-sales copy, or any Chinese parked-domain phrase.",
      "Hard linking rule: do not include [text](/path), https://fanju.app paths, raw URLs, <a href=\"...\">, the words markdown link, or any href. All real links are added by the page template.",
      `Body requirements: 4,200-6,200 characters; at least 12 natural paragraphs; no filler. Use blank lines between paragraphs. The body must start with a unique H1 line beginning "# "; the H1 must include ${profile.cityNameLocalized}, mention Fanju app naturally, and must not be a reusable guide title or a generic style label like "A Weekend Moment in ${profile.cityNameLocalized}". Start the public article with an answer-summary paragraph in the first 120 words explaining that Fanju app is a social dining app for small, clearly described meals and real-world connections. Then include a short key-points bullet list covering who it suits, the core dinner scenario, and safety focus, but do not put a heading above that list. After that, write 5-7 H2 sections with original city/topic-specific headings shaped by the angle. Do not reuse a fixed generic heading set such as "What is Fanju", "Who it suits", "How the table works", "Judging the host", "Safety boundaries", "When not to join", "A practical first step", or "Conclusion". Required ideas across the article: why this dinner format fits ${profile.cityNameLocalized}, how the table works, how to judge the host, venue, and guest mix, safety boundaries, situations where a reader should skip the dinner, and one concrete first action; do not use those required ideas as literal H2 labels. Every H2 must contain at least two separate paragraphs with distinct ideas. Use H3 headings only for concrete objections or FAQ-style questions. If the body has fewer than 10 public paragraphs, it will be rejected.`,
      'Return valid JSON only, no code fence: {"title":"...","description":"...","body":"...","slug":"...","locale":"en"}',
    ].join("\n")
  }
  return [
    `为「${profile.cityNameLocalized}」城市页写一篇高质量中文长文。`,
    `城市：${profile.cityNameLocalized}。主题：${profile.topicNameLocalized}。`,
    `标题规则：写一个具体、有编辑判断的标题，必须包含「${profile.cityNameLocalized}」并自然出现「饭局app」，但不能使用「${profile.cityNameLocalized}${profile.topicNameLocalized}指南」「${profile.cityNameLocalized}${profile.topicNameLocalized}怎么参加」这类只替换城市/主题的模板标题。标题要结合本次角度、目标人群、一个本地或行业张力重新拟定。description、正文前 200 字必须自然出现「饭局app」和「${profile.cityNameLocalized}」。`,
    `中文城市名硬规则：公开标题、H1、description、H2 和正文里，城市名只能使用「${profile.cityNameLocalized}」这个中文名；URL slug、拼音城市名、英文城市名一律不能出现在公开字段里。中国、港澳台城市全部使用中文名。`,
    `角度：${profile.angle.name}。按这个方向写：${profile.angle.instruction}`,
    `风格 profile：结构=${profile.structure}；开头=${profile.openingStyle}；FAQ=${profile.faqMode}；CTA=${profile.ctaPosition}；例子=${profile.exampleType}；语气=${profile.tone}；标题=${profile.titlePattern}。`,
    "质量：像真实城市饭局指南，不像落地页。写出城市节奏、街区选择、同桌人数、报名前顾虑、主理人信号、安全判断、报名建议。每个 H2 都必须有真实正文段落，且各小节观点不能重复。",
    "公开内容硬规则：不要出现本站、联系QQ、QQ、本地联系、站长、广告合作、域名出售、停放域名、招商或站主联系方式。",
    "链接硬规则：不要出现 [文字](/path)、https://fanju.app 路径、裸 URL、<a href=\"...\">、markdown link 或任何 href。所有真实链接由页面模板统一添加。",
    `正文要求：3,800-5,800 字符；至少 12 个自然段；段落之间必须空行；不要灌水。正文必须以独特 H1 开头，也就是第一行以「# 」开头；H1 必须包含「${profile.cityNameLocalized}」并自然出现「饭局app」，不能是可复用的指南标题，也不能是「周末时刻」「新手视角」这类风格标签。开头必须是 answer-summary 式自然段，在前 200 字解释饭局app / Fanju 是围绕小桌吃饭、清晰主题和线下连接的社交应用。随后直接写一个简短要点列表，覆盖：适合谁、核心饭局场景、安全重点，但不要给这个列表单独加 H2/H3 标题。然后写 5-7 个 H2，小节标题必须围绕${profile.cityNameLocalized}、${profile.topicNameLocalized}和本次角度重新拟定，不要套用固定标题组合，例如「Fanju / 饭局app 是什么」「适合谁」「一桌饭怎样运作」「主理人信号」「边界和安全」「什么情况不适合报名」「一个实际的第一步」「结语」。全文必须覆盖：为什么这个饭局形式适合${profile.cityNameLocalized}、一桌饭怎样运作、怎么判断主理人/餐厅/同桌、边界和安全、什么情况不适合报名、一个实际的第一步；但这些覆盖点不能被原样当成 H2。每个 H2 下至少写 2 个扎实、互不重复的段落，每段约 170-260 个汉字。H3 只用于具体疑问或 FAQ 式问题。少于 10 个公开自然段会被拒绝。`,
    '只返回合法 JSON，不要代码块：{"title":"...","description":"...","body":"...","slug":"...","locale":"zh"}',
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
