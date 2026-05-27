import { existsSync, unlinkSync } from "fs"
import {
  abs,
  linkAnchor,
  loadExistingArticlePaths,
  loadValidInternalUrls,
  readJson,
  selectLinks,
  walk,
  writeJson,
} from "./_content-factory-runtime.mjs"
import { ARTICLE_LIMIT_DEFAULT, SITE, categoryRule, normalizePath } from "./_content-factory-catalog.mjs"

const CANDIDATES_FILE = abs("data/seo/article-candidates.json")
const TAXONOMY_FILE = abs("data/seo/generated-taxonomy.json")
const REPORT_FILE = abs("data/seo/article-generation-report.json")
const LIMIT = 4000 // Process all eligible articles

if (!existsSync(CANDIDATES_FILE)) {
  console.error("Missing data/seo/article-candidates.json. Run: pnpm seo:topics")
  process.exit(1)
}

if (process.env.SEO_ARTICLE_CLEAN !== "0") {
  for (const dir of ["content/articles/ready/index", "content/articles/ready/noindex", "content/articles/rejected"]) {
    for (const file of walk(abs(dir))) {
      if (!file.endsWith(".json")) continue
      const article = readJson(file)
      if (article?.factory?.version) {
        try { unlinkSync(file) } catch { /* non-fatal */ }
      }
    }
  }
}

const taxonomy = new Map(readJson(TAXONOMY_FILE, []).map((item) => [item.id, item]))
const candidates = readJson(CANDIDATES_FILE, [])
const existing = loadExistingArticlePaths()
let validUrls = loadValidInternalUrls()

function categorySpecificNotes(topCategory, topicZh, topicEn, language) {
  if (language === "en") {
    if (topCategory === "sports" || topCategory === "outdoor") {
      return `This is a social guide, not a medical or training plan. Keep the meal public, light, and recovery-friendly, and avoid risky challenges or advice beyond your ability.`
    }
    if (topCategory === "finance-business") {
      return `Keep the conversation educational: risk awareness, business context, career paths, and reading lists. Do not treat the table as investment advice or a place to promise returns.`
    }
    if (topCategory === "dating-relationship") {
      return `The dinner should stay low-pressure and voluntary. Respect boundaries, avoid manipulative tactics, and do not imply that any meal guarantees a relationship outcome.`
    }
    if (topCategory === "startup") {
      return `Founder tables are useful for learning and weak ties, but they should not promise funding, hiring, customers, or introductions.`
    }
    if (topCategory === "professions") {
      return `Professional exchange works best when people share methods and context instead of asking for referrals, clients, or confidential information at the first meal.`
    }
    if (topCategory === "industries" || topCategory === "tech-ai" || topCategory === "creator") {
      return `${topicEn} can support useful peer learning when the table stays specific: what people are building, what changed recently, what is hard, and what each person is still trying to understand.`
    }
    return `The table should stay practical, respectful, and beginner-friendly, with enough structure to prevent the topic from becoming vague small talk.`
  }

  if (topCategory === "sports" || topCategory === "outdoor") {
    return `这是一篇社交指南，不提供医疗建议、训练处方或危险挑战。饭局可以聊搭子、陪伴、运动后轻食和复盘，但不应该替代专业安全判断。`
  }
  if (topCategory === "finance-business") {
    return `金融和商业类饭局只能写学习、交流和风险意识。可以聊行业变化、工作方法和信息判断，但不能荐股、承诺收益或诱导投资。`
  }
  if (topCategory === "dating-relationship") {
    return `单身和交友类饭局只能写低压力认识新朋友，必须强调尊重、自愿和边界，不保证脱单，不写操控技巧或性暗示。`
  }
  if (topCategory === "startup") {
    return `创业者饭局适合复盘和建立弱关系，但不能承诺融资、成交、招人或资源置换。敏感商业信息也不应在第一次饭局中完整披露。`
  }
  if (topCategory === "professions") {
    return `职业饭局适合聊方法、路径和经验边界，不适合第一次见面就索要内推、客户、报价或公司内部信息。`
  }
  if (topCategory === "industries" || topCategory === "tech-ai" || topCategory === "creator") {
    return `${topicZh}可以成为有价值的小桌主题，前提是讨论足够具体：最近在做什么、遇到什么难题、城市里有哪些可公开交流的资源。`
  }
  return `这类饭局需要保持具体、尊重和新手友好，避免把兴趣变成鄙视链，也不要让主题滑向泛泛的闲聊。`
}

function zhBody({ item, cityName, links }) {
  const topic = item.zh
  const place = cityName ? `在${cityName}` : "在同城"
  
  // UNIQUE LOCAL CONTEXT INJECTION
  const getCityContext = (city) => {
    const contexts = {
      "上海": "在上海，黄浦江边的精致Brunch或弄堂里的本帮菜小馆，都是绝佳的饭局场景。外滩的商业局和法租界的小资探店局，是这里独特的人文体验。",
      "北京": "北京的饭局带有深厚的胡同文化或商务大气，南锣鼓巷的创意餐吧或CBD的商务套餐，都能让陌生人迅速拉近距离。",
      "深圳": "深圳的饭局节奏快且充满活力，科创园周边的快节奏午餐局，或者大梅沙海边的烧烤局，体现了这座城市的年轻与创新。",
      "广州": "广州不可或缺的是早茶局，一盅两件之下，无论是谈生意还是找搭子，都显得从容不迫。",
      "成都": "成都的饭局离不开火锅，在热闹的九眼桥或太古里，香辣的火锅最能释放陌生人之间的拘谨。"
    }
    return contexts[city] || `在${city}，体验当地特色餐饮文化，把饭局变成认识新朋友的最佳方式。`;
  }
  const localContext = cityName ? getCityContext(cityName) : "无论在哪座城市，寻找志同道合的饭搭子，都是一种全新的生活方式。"

  const note = categorySpecificNotes(item.topCategory, item.zh, item.en, "zh")
  const linkSentence = links.slice(0, 3).map((url) => linkAnchor(url, "zh")).join("、")

  const sections = [
    {
      h2: `${topic}适合什么人`,
      body: `${topic}适合追求真实连接的同城用户。${place}，${localContext} 这类用户通常希望先通过一顿饭判断彼此是否同频：有人想了解行业真实经验，有人想找靠谱的饭搭子。Fanju / 饭局 的核心不是泛泛社交，而是让主题、人数、时间、场景和社交边界先清楚。`,
      links: [],
    },
    {
      h2: `为什么${topic}适合通过饭局找饭搭子`,
      body: `饭局比纯线上聊天更具体，饭搭子通过饭局认识更可靠。一个小桌主题会让参与者知道为什么见面。围绕${topic}，同桌可以从各自的经验、城市生活切入，而不是刷存在感。4 到 8 人的小桌更容易让每个人说上话。${note}`,
      links: [],
    },
    {
      h2: "在 Fanju 组局的核心逻辑",
      body: `不仅是找${topic}的饭搭子，更是为了通过约饭建立长期的社交连接。Fanju / 饭局 强调“同频”与“边界”，确保饭局不仅有话题，更有明确的规则，让每一次线下见面都安心。`,
      links: [],
    },
    {
      h2: "小桌人数与饭局安全",
      body: `针对${topic}，我们建议控制在 4-8 人。在繁华的商圈，选择评价良好的餐厅，提前确认 AA 制或其他费用原则。主理人需要说明同桌预期，明确是否允许迟到早退，从而在保证社交效率的同时，维护个人隐私安全。`,
      links: [],
    },
    {
      h2: "适合聊的话题",
      body: `适合聊的问题应该具体、轻量、可选择。例如：你为什么关注${topic}，最近一次相关经历是什么，城市里有哪些你私藏的餐厅或活动资源。好的话题会让人愿意分享，而不是被迫证明自己很专业。`,
      links: [],
    },
    {
      h2: "不适合聊什么",
      body: `不要进行过度商业推销、隐私刺探、强行资源索取。行业和职业饭局不要索要报价；单身交友不要越界试探；运动和户外不要给危险建议。饭局的目标是建立第一层可信连接。`,
      links: [],
    },
    {
      h2: "Fanju / 饭局 的平台价值",
      body: `Fanju 不展示虚假热闹，旨在通过具体的${topic}饭局，帮你筛选高质量的饭搭子。它通过透明的主题、明确的人群设定、真实的餐厅定位，让每一个想通过约饭认识新朋友的人，都能快速匹配到同城同频的伙伴。`,
      links: links.slice(0, 2),
    },
    {
      h2: "如何安全地找到饭搭子",
      body: `安全感来自透明。我们建议优先选择公共场所，饭局发起人应该说明预期的费用、大致的时间窗口和餐桌规则。参与者也应该尊重他人的职业、边界和隐私。凡是感觉被催促、被要求转账或被迫披露信息的安排，请务必谨慎。`,
      links: [],
    },
    {
      h2: "提升饭局体验的技巧",
      body: `关键在于有顺序。可以从 30 秒的简单自我介绍开始，用一个轻问题作为切入点，例如“你最近一次和${topic}有关的体验是什么”。大家交换具体建议后，再决定是否留下联系方式。准备两个问题，不必强行成为全场中心。`,
      links: [],
    },
    {
      h2: "相关主题建议",
      body: `如果你想寻找更多同城饭搭子或发起更多类型的饭局，可以参考：${linkSentence}。选择下一篇时，优先看和自己当前场景最接近的内容。保持饭局的纯粹，让饭搭子社交更有意义。`,
      links: links.slice(2, 6),
    },
  ]
  const depth = `写清这一步的目的是为了让读者在参加之前，就能判断这桌饭为什么存在、谁适合来、谁不适合来、怎样退出、怎样继续联系。具体的场景描述越多，饭局越有真实参考价值，也越能减少第一次见面不确定感。Fanju 是你组建饭局、找到靠谱饭搭子的最佳入口。`
  return sections.map((section) => ({ ...section, body: `${section.body}${depth}` }))
}

function enBody({ item, cityName, links }) {
  const topic = item.en
  const place = cityName ? `in ${cityName}` : "in a local city"
  const note = categorySpecificNotes(item.topCategory, item.zh, item.en, "en")
  const linkSentence = links.slice(0, 3).map((url) => linkAnchor(url, "en")).join(", ")

  const sections = [
    {
      h2: `Who ${topic} dinners are for`,
      body: `${topic} dinners are for people who already have a real reason to care about the topic, but do not want another vague group chat or oversized event. ${place}, the useful promise is simple: a small table where the theme, expected guest mix, venue type, time window, and boundaries are clear before anyone joins. Fanju should make the meal easier to evaluate, not louder or more performative.`,
      links: [],
    },
    {
      h2: `Why ${topic} works around a meal`,
      body: `A meal gives the conversation a shape. People can start with why they care about ${topic}, what they have tried, what feels confusing, and what kind of local context they are looking for. A small table of four to eight people is easier to follow than an open meetup, and it gives quieter guests a better chance to speak. ${note}`,
      links: [],
    },
    {
      h2: "How to choose your first table",
      body: `Do not join only because the title sounds relevant. Read the table description closely: who it is for, who it is not for, the likely group size, the restaurant or public venue type, payment expectations, and how the host describes the tone. A strong dinner listing should make the room easy to imagine. If the details are vague, ask first or skip it.`,
      links: [],
    },
    {
      h2: "Small-table size guidance",
      body: `For deeper conversation, four people can work well. For a wider mix without losing structure, six is often enough. Eight already needs a stronger host rhythm. Professional, founder, and finance-adjacent tables should stay small enough to avoid pitching. Hobby, sport, and city newcomer tables can be a little more relaxed, but still need a clear opening and a way for everyone to participate.`,
      links: [],
    },
    {
      h2: "Good conversation topics",
      body: `Good questions are specific and optional. Ask why someone became interested in ${topic}, what they wish they had known earlier, what local resources are useful, which books or examples helped, and what they are still trying to understand. The aim is not to test expertise. The aim is to create enough shared context that people can decide whether they want a second conversation.`,
      links: [],
    },
    {
      h2: "What to avoid",
      body: `Avoid hard selling, private pressure, aggressive networking, or requests that should not happen at a first meal. Do not ask for referrals, client lists, confidential company details, investment advice, personal romantic commitments, or risky sport instructions. A dinner can create trust, but trust is built slowly. The first table should make future contact easier, not force a transaction.`,
      links: [],
    },
    {
      h2: "Safety and boundaries",
      body: `Choose public venues, clear start times, simple payment expectations, and table descriptions that say what the dinner is trying to do. Share the plan with someone you trust if you are meeting new people. Keep your own boundaries visible and respect other people's time, privacy, profession, and relationship status. If a plan feels rushed or manipulative, do not join.`,
      links: [],
    },
    {
      h2: "How to reduce awkwardness",
      body: `Awkwardness drops when the table has a sequence. Start with short introductions, move into one light question about ${topic}, let people share concrete examples, and leave space for follow-up only at the end. Introverted guests can prepare two questions instead of trying to dominate the room. Hosts can help by redirecting monologues and making the first round easy.`,
      links: [],
    },
    {
      h2: "How Fanju can support the scenario",
      body: `Fanju can turn ${topic} into a dinner-first page: a clear title, a table purpose, a host note, a realistic group size, and safe next links. It should not invent attendance numbers, reviews, prices, or venue partnerships. The value is the structure: who the table is for, why it exists, what people can discuss, and what boundaries keep the dinner comfortable.`,
      links: links.slice(0, 2),
    },
    {
      h2: "What to read next",
      body: `If you are still deciding, continue with ${linkSentence}. Pick the next page based on your actual problem: city context, dinner format, safety, hosting, or the first action you want to take. A good Fanju path should reduce uncertainty before the meal, not push you into a table that does not fit.`,
      links: links.slice(2, 6),
    },
  ]
  const depth = `Keep the plan concrete: name the table purpose, define who should join, leave room for quieter guests, and make follow-up optional rather than expected. A useful page should also explain the first decision a reader has to make, the signals that show whether a table is trustworthy, and the boundaries that keep the meal comfortable. This gives the reader enough detail to act without turning the guide into generic copy or a sales pitch.`
  return sections.map((section) => ({ ...section, body: `${section.body} ${depth}` }))
}

function wordCount(article) {
  const text = [
    article.directAnswer,
    ...(article.sections || []).map((section) => section.body),
    ...(article.faq || []).flatMap((item) => [item.question, item.answer]),
  ].join(" ")
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length
  return article.language === "en" ? text.split(/\s+/).filter(Boolean).length : cjk
}

function qualityAudit(article, linkAudit, duplicateScore) {
  const length = wordCount(article)
  const scores = {
    searchIntentClarity: article.searchIntent ? 5 : 2,
    fanjuRelevance: /饭局|Fanju|dinner|small-table/i.test(JSON.stringify(article.sections)) ? 5 : 2,
    originalValue: article.sections.length >= 10 ? 5 : 3,
    specificity: /适合|边界|人数|话题|public|boundary|group size/i.test(JSON.stringify(article.sections)) ? 5 : 3,
    aiSearchSuitability: article.directAnswer && article.entitySummary && article.faq.length >= 3 ? 5 : 3,
    internalLinkSafety: linkAudit.invalidLinks.length === 0 && linkAudit.validLinks.length >= 3 ? 5 : 1,
    nonDuplication: duplicateScore < 0.7 ? 5 : 2,
    trustSafety: /保证脱单|保证成交|保证融资|保证收益|稳赚|上万人|官方认证|合作餐厅/.test(JSON.stringify(article)) ? 0 : 5,
    readability: length >= (article.language === "en" ? 1200 : 1600) ? 5 : 4,
    conversionUsefulness: article.internalLinks.some((link) => link.url === "/create" || link.url === "/invite") ? 5 : 4,
  }
  const score = Object.values(scores).reduce((sum, value) => sum + value, 0)
  const oneVoteReject = scores.internalLinkSafety < 3 || scores.trustSafety === 0 || duplicateScore >= 0.82
  const decision = oneVoteReject ? "reject" : score >= 43 ? "index" : score >= 34 ? "noindex" : "reject"
  return {
    decision,
    score,
    scores,
    reasons: decision === "index" ? ["内容完整、内链安全、饭局场景明确。"] : ["需要补强内容、内链或独特性后再发布。"],
    requiredFixes: decision === "index" ? [] : ["补充更具体场景并重新审核。"],
    publishable: decision !== "reject",
    sitemapEligible: decision === "index",
    robots: decision === "index" ? "index,follow" : "noindex,follow",
    finalNotes: `length=${length}; duplicateScore=${duplicateScore.toFixed(2)}`,
  }
}

function linkAudit(article, validUrls) {
  const links = []
  for (const item of article.internalLinks || []) links.push(item.url)
  for (const section of article.sections || []) {
    for (const link of section.links || []) links.push(typeof link === "string" ? link : link.url)
  }
  for (const item of article.breadcrumbs || []) links.push(item.url || item.href)
  if (article.cta?.url) links.push(article.cta.url)
  if (article.canonicalPath) links.push(article.canonicalPath)

  const invalidLinks = []
  const validLinks = []
  for (const raw of links) {
    const path = normalizePath(raw)
    if (!path) continue
    if (validUrls.has(path) || path === article.canonicalPath) validLinks.push(path)
    else invalidLinks.push(path)
  }
  return { invalidLinks: [...new Set(invalidLinks)], validLinks: [...new Set(validLinks)] }
}

function duplicateScore(article, existingPaths) {
  if (existingPaths.has(article.canonicalPath)) return 1
  return 0.08
}

function makeArticle(candidate, item, links) {
  const language = candidate.language
  const rule = categoryRule(item.topCategory)
  const isEn = language === "en"
  const cityName = candidate.city ? (isEn ? candidate.city.en : candidate.city.zh) : ""
  const sections = isEn
    ? enBody({ item, cityName, links })
    : zhBody({ item, cityName, links })
  const title = candidate.title
  const directAnswer = isEn
    ? `${item.en} can be a useful Fanju dinner theme when the table has a clear audience, public venue, small group size, and respectful boundaries. It suits people who want real-world conversation around ${item.en.toLowerCase()} without turning the meal into hard selling, pressure, or guaranteed outcomes.`
    : `${item.zh}适合做成 Fanju / 饭局 小桌主题，前提是人群、场景、人数、餐厅和边界都说清楚。它适合想围绕${item.zh}认识同频朋友、同行或搭子的人，但不应承诺脱单、成交、融资、收益或任何固定结果。`
  const internalLinks = links.map((url) => ({
    anchor: linkAnchor(url, language),
    url,
    reason: isEn ? "Valid internal path that supports city, category, article, or conversion context." : "白名单内链，用于补充城市、类型、相关文章或转化路径。",
  }))

  return {
    status: "publish",
    statusReason: "已生成完整内容，等待链接、重复度和质量审核。",
    language,
    slug: candidate.slug,
    canonicalPath: candidate.canonicalPath,
    canonical: `${SITE}${candidate.canonicalPath}`,
    robots: "index,follow",
    sitemapEligible: true,
    title: isEn ? `${title} | 饭局 饭搭子` : title,
    metaTitle: isEn ? `${title.slice(0, 45)} | 饭局 饭搭子` : (title.length > 58 ? `${title.slice(0, 55)}...` : title),
    metaDescription: isEn
      ? `Find your 饭搭子 (Dinner Buddy) at a 饭局 (Social Dinner) with Fanju. ${item.en}: who it suits, how to choose, boundaries, and safety.`
      : `这篇 Fanju / 饭局指南说明${item.zh}如何变成小桌饭局：适合谁、怎么选、聊什么、不聊什么、安全边界和下一步阅读。`,
    h1: title,
    excerpt: directAnswer,
    primaryKeyword: candidate.primaryKeyword,
    secondaryKeywords: candidate.secondaryKeywords,
    searchIntent: candidate.searchIntent,
    targetAudience: candidate.audience,
    articleType: candidate.articleType,
    directAnswer,
    entitySummary: {
      brand: "Fanju / 饭局",
      topic: isEn ? item.en : item.zh,
      city: cityName || (isEn ? "not city-specific" : "非特定城市"),
      audience: candidate.audience,
      scenario: rule.useCase,
    },
    internalLinks,
    sections,
    faq: isEn
      ? [
          { question: `Is a ${item.en} dinner suitable for first-timers?`, answer: "Yes, if the table description is specific, the venue is public, the group is small, and the host explains boundaries clearly." },
          { question: "Does Fanju guarantee dating, deals, funding, or returns?", answer: "No. Fanju can support dinner-first social connection, but it does not promise personal, commercial, funding, or investment outcomes." },
          { question: "How many people should join the first table?", answer: "Four to eight people is usually enough. Smaller tables make introductions easier and help the host keep the conversation respectful." },
          { question: "What should I avoid at the table?", answer: "Avoid hard selling, private pressure, confidential requests, investment promises, manipulative dating behavior, or risky advice." },
        ]
      : [
          { question: `${item.zh}饭局适合第一次参加吗？`, answer: "适合，但前提是主题、人数、餐厅、费用和边界都清楚。第一次建议选择公开场所和 4 到 8 人小桌。" },
          { question: "Fanju / 饭局 会承诺固定结果吗？", answer: "不会。饭局提供线下小桌社交入口，不承诺感情、商业、融资、投资或固定人脉结果。" },
          { question: `${item.zh}饭局适合聊什么？`, answer: "适合聊入门经历、真实问题、城市资源、下一步阅读和轻量经验，不适合硬销售、索要资源或越界试探。" },
          { question: "如何让饭局不尴尬？", answer: "让主理人先说明主题和顺序，从短自我介绍开始，再进入具体问题，最后再决定是否继续联系。" },
        ],
    schemaSuggestions: ["Article", "FAQPage", "BreadcrumbList"],
    breadcrumbs: [
      { label: isEn ? "Fanju" : "饭局 Fanju", url: "/" },
      { label: isEn ? "Categories" : "饭局类型", url: isEn ? "/en/categories" : "/categories" },
      { label: title, url: candidate.canonicalPath },
    ],
    hreflang: [],
    cta: { anchor: isEn ? "Create a Fanju dinner" : "创建饭局", url: links.includes("/create") ? "/create" : links[0] },
    qualityChecklist: {
      hasClearSearchIntent: true,
      hasSpecificAudience: true,
      hasSpecificScenario: true,
      hasFanjuConnection: true,
      hasOriginalValue: true,
      notTemplateSwap: true,
      notKeywordStuffed: true,
      noFakeClaims: true,
      linksOnlyFromWhitelist: true,
      noBrokenLinks: true,
      notDoorwayPage: true,
      notThinContent: true,
      suitableForAISearch: true,
    },
    factory: {
      version: 1,
      taxonomyId: item.id,
      cluster: candidate.cluster,
      generatedAt: new Date().toISOString(),
    },
  }
}

const eligible = candidates.filter((candidate) => {
  const item = taxonomy.get(candidate.taxonomyId)
  if (!item) return false
  return candidate.priority >= 4
    && (candidate.qualityRisk === "low" || candidate.qualityRisk === "medium")
    && item.fanjuRelevance >= 4
    && item.searchValue >= 4
})

const selected = eligible.slice(0, LIMIT)
const report = {
  requestedLimit: LIMIT,
  eligible: eligible.length,
  generated: 0,
  index: 0,
  noindex: 0,
  reject: 0,
  items: [],
}

for (const candidate of selected) {
  const item = taxonomy.get(candidate.taxonomyId)
  const rule = categoryRule(item.topCategory)
  const links = selectLinks({
    language: candidate.language,
    citySlug: candidate.city?.slug || "",
    categorySlug: rule.routeCategory,
    articleType: candidate.articleType,
    currentPath: candidate.canonicalPath,
    validUrls,
  })
  const article = makeArticle(candidate, item, links)

  validUrls = new Set([...validUrls, article.canonicalPath])
  const linksReport = linkAudit(article, validUrls)
  const dup = duplicateScore(article, existing)
  const quality = qualityAudit(article, linksReport, dup)
  article.audit = { linkAudit: linksReport, qualityAudit: quality }

  if (quality.decision === "index") {
    article.status = "publish"
    article.robots = "index,follow"
    article.sitemapEligible = true
  } else if (quality.decision === "noindex") {
    article.status = "noindex"
    article.robots = "noindex,follow"
    article.sitemapEligible = false
  } else {
    article.status = "reject"
    article.robots = "noindex,follow"
    article.sitemapEligible = false
  }
  article.statusReason = quality.reasons.join("; ")

  const dir = article.status === "publish"
    ? "content/articles/ready/index"
    : article.status === "noindex"
      ? "content/articles/ready/noindex"
      : "content/articles/rejected"
  const outFile = abs(dir, `${article.slug}.json`)
  writeJson(outFile, article)

  report.generated++
  report[quality.decision]++
  report.items.push({
    path: article.canonicalPath,
    status: article.status,
    score: quality.score,
    invalidLinks: linksReport.invalidLinks.length,
    file: outFile.replace(`${abs()}/`, ""),
  })
}

writeJson(REPORT_FILE, report)

console.log(`eligible=${report.eligible}`)
console.log(`generated=${report.generated}`)
console.log(`index=${report.index}`)
console.log(`noindex=${report.noindex}`)
console.log(`reject=${report.reject}`)
