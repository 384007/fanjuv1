import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { generateWithRouter, sleep } from "./ai-router.mjs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const INPUT = join(ROOT, "dist/seo/opportunities.json")
const OUT_DIR = join(ROOT, "content/seo-ai-drafts")
const PUBLISHED_FILE = join(ROOT, process.env.PUBLISHED_FILE || "data/seo/published-ready-drafts.json")
const GENERATED_DRAFTS_FILE = join(ROOT, process.env.GENERATED_DRAFTS_FILE || "dist/seo/generated-drafts.json")

const LANG = (process.env.LANG || "zh").toLowerCase().startsWith("en") ? "en" : "zh"
const LIMIT = Number.parseInt(process.env.LIMIT || "3", 10)
const MAX_TOKENS = Number.parseInt(process.env.MAX_TOKENS || (LANG === "en" ? "2500" : "1800"), 10)
const TIMEOUT_MS = Number.parseInt(process.env.TIMEOUT_MS || "60000", 10)
const RATE_DELAY_MS = Number.parseInt(process.env.RATE_DELAY_MS || "4000", 10)
const MIN_SCORE = Number.parseInt(process.env.MIN_SCORE || "90", 10)
const QUALITY_ATTEMPTS = Math.max(1, Number.parseInt(process.env.QUALITY_ATTEMPTS || "3", 10))
const QUALITY_RETRY_DELAY_MS = Number.parseInt(process.env.QUALITY_RETRY_DELAY_MS || "2500", 10)
const TARGET_ROUTES = (process.env.TARGET_ROUTES || "")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean)

if (!existsSync(INPUT)) {
  console.error("Missing dist/seo/opportunities.json. Run: pnpm seo:opportunities")
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })

const data = JSON.parse(readFileSync(INPUT, "utf8"))

const DRAFT_DIR = join(ROOT, "content/seo-ai-drafts")
const READY_DIR = join(ROOT, "content/seo-ready")
const PUBLISHED_DIR = join(ROOT, "content/seo-published")
const MAX_PER_CITY_PER_RUN = Number.parseInt(process.env.MAX_PER_CITY_PER_RUN || "1", 10)
const RANDOMIZE_OPPORTUNITIES = process.env.RANDOMIZE_OPPORTUNITIES !== "0"

function fileSlugs(dir) {
  if (!existsSync(dir)) return new Set()
  return new Set(
    readdirSync(dir)
      .filter((x) => x.endsWith(".md"))
      .map((x) => x.replace(/\.md$/, ""))
  )
}

function readPublishedSlugs() {
  if (!existsSync(PUBLISHED_FILE)) return new Set()
  try {
    const published = JSON.parse(readFileSync(PUBLISHED_FILE, "utf8"))
    return new Set((published.articles || []).map((item) => item.slug).filter(Boolean))
  } catch {
    return new Set()
  }
}

function badDuplicateSlug(slug) {
  return /business-business|founder-founder|singles-singles|student-student|dinner-buddy-dinner-buddy|newcomer-newcomer/.test(slug)
}

const usedSlugs = new Set([
  ...fileSlugs(DRAFT_DIR),
  ...fileSlugs(READY_DIR),
  ...fileSlugs(PUBLISHED_DIR),
  ...readPublishedSlugs(),
])

const cityCounts = new Map()
const opportunities = []
const targetRoutesForLang = TARGET_ROUTES.filter((route) =>
  LANG === "en" ? route.startsWith("/en/") : !route.startsWith("/en/")
)
const baseCandidatePool = [...data.opportunities].filter((op) =>
  LANG === "en"
    ? op.canonicalPath.startsWith("/en/")
    : !op.canonicalPath.startsWith("/en/")
)
const candidatesByPath = new Map(baseCandidatePool.map((op) => [op.canonicalPath, op]))
const missingTargets = targetRoutesForLang.filter((route) => !candidatesByPath.has(route))

if (missingTargets.length) {
  console.error(`Missing ${LANG} target route opportunities:`)
  for (const route of missingTargets) console.error(`  ${route}`)
  process.exit(1)
}

const candidatePool = targetRoutesForLang.length
  ? targetRoutesForLang.map((route) => candidatesByPath.get(route)).filter(Boolean)
  : baseCandidatePool
const selectionLimit = targetRoutesForLang.length ? targetRoutesForLang.length : LIMIT

if (targetRoutesForLang.length) {
  console.log(`TARGET_ROUTES mode: ${targetRoutesForLang.length} ${LANG} route(s).`)
} else if (RANDOMIZE_OPPORTUNITIES) {
  for (let i = candidatePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidatePool[i], candidatePool[j]] = [candidatePool[j], candidatePool[i]]
  }
}

for (const op of candidatePool) {
  if (opportunities.length >= selectionLimit) break
  if (!op?.slug) continue
  if (!targetRoutesForLang.length && usedSlugs.has(op.slug)) continue
  if (badDuplicateSlug(op.slug)) continue

  // Enforce: en lang must have /en/ canonicalPath, zh must not
  if (LANG === "en" && !op.canonicalPath.startsWith("/en/")) continue
  if (LANG === "zh" && op.canonicalPath.startsWith("/en/")) continue

  const cityKey = op.city || "global"
  const currentCityCount = cityCounts.get(cityKey) || 0
  if (currentCityCount >= MAX_PER_CITY_PER_RUN) continue

  opportunities.push(op)
  cityCounts.set(cityKey, currentCityCount + 1)
}

console.log(`Selected ${opportunities.length}/${selectionLimit} fresh opportunities.`)
console.log(opportunities.map((op, i) => `${i + 1}. ${op.canonicalPath} [${op.city || "global"}]`).join("\n"))

if (!opportunities.length) {
  console.log("No fresh opportunities left to generate.")
  process.exit(0)
}

function safeYaml(value = "") {
  return String(value).replaceAll('"', '\\"')
}

function topicLabel(op) {
  if (LANG === "en") return op.dinnerType || op.title.replace(/\s+Guide$/i, "")
  return op.dinnerType || op.titleZh || op.title
}

function promptFor(op) {
  const topic = topicLabel(op)
  if (LANG === "en") {
    return `Write ONLY the markdown body for this Fanju SEO article. Return raw markdown, no explanation, no frontmatter.

Brand: Fanju is an AI social dining app and dinner gathering platform for finding dinner buddies, hosting local dinner gatherings, and building real-world social connections around shared meals.

Page details:
- Title: ${op.title}
- Page type: ${op.pageType}
- City: ${op.city || "N/A"}
- Persona: ${op.persona || "N/A"}
- Dinner type: ${op.dinnerType || "N/A"}
- Search intent: ${op.intent}

Internal links to weave in naturally:
${op.suggestedInternalLinks.map((x) => `- ${x}`).join("\n")}

Rules:
- English only. No Chinese.
- No frontmatter, no "Here is", no "Below is", no explanation text.
- Do NOT mention: Modal, NVIDIA, Gemini, Groq, Cerebras, Cloudflare, Next.js, API, backend, model, prompt, generator.
- Do NOT invent: user counts, rankings, revenue, partnerships, testimonials, restaurant names, product features not described above.
- Do NOT claim: verified profiles, rating systems, secure messaging, ID verification, background checks, payment protection, reviews, moderation.
- Do NOT mention: QQ, site owner contact, local contact ads, domain sale, webmaster, advertising cooperation.
- Safety advice allowed: choose public venues, set expectations clearly, share plans with a friend, review table description.
- No keyword stuffing. Write for real users, not bots.
- Write as a practical editorial city guide, not a landing page.
- Include city rhythm, neighborhood or area choice, guest mix, host signals, budget expectations, attendee concerns, safety context, and decision criteria.
- Every H2 section must have real article paragraphs, not just lists.
- Minimum 900 English words. Be thorough, specific, and genuinely useful.

Required sections (use these exact headings):
# ${op.city || "City"} ${topic} Guide for Dinner-First Social Dining

Intro paragraph mentioning ${op.city || "the city"} and Fanju.

## Why ${topic} Matters in ${op.city || "This City"}

## What a Good Fanju Table Should Feel Like

## How to Choose the Right Host, Venue, and Guest Mix

## Before You Join: Quick Attendee Checklist

## Hosting Notes for a Better Dinner

## Safety, Boundaries, and Practical Expectations

## Common Mistakes to Avoid

## FAQ

## Related Fanju Pages

## Summary for AI Search Engines
`
  }

  return `Write ONLY the markdown body for this Fanju / 饭局 SEO/GEO draft. Return raw markdown, no explanation, no frontmatter.

Brand definition EN:
Fanju is an AI social dining app and dinner gathering platform for finding dinner buddies, hosting local dinner gatherings, and building real-world social connections around shared meals.

Brand definition ZH:
Fanju / 饭局 是一个 AI 饭局社交和线下聚会平台，帮助用户找饭搭子、约饭、组织同城饭局，并通过真实饭桌建立线下社交关系。

Page:
- Title: ${op.title}
- Chinese title: ${op.titleZh}
- Page type: ${op.pageType}
- Market: ${op.market || "Global"}
- City: ${op.city || "N/A"}
- Persona: ${op.persona || "N/A"}
- Dinner type: ${op.dinnerType || "N/A"}
- Search intent: ${op.intent}

Internal links to include naturally:
${op.suggestedInternalLinks.map((x) => `- ${x}`).join("\n")}

Rules:
- 中文为主，可以自然保留 Fanju / 饭局 这两个品牌名。不要写英文段落标题。
- Return ONLY markdown body. No frontmatter. No "Here is", "Below is", "markdown draft", or explanation.
- Do not mention model, API, backend, Modal, NVIDIA, Gemini, Groq, Cerebras, Cloudflare, Next.js, or technical stack.
- Do not invent fake user numbers, rankings, revenue, partnerships, testimonials, restaurants, or product features.
- Do not claim verified profiles, rating systems, secure messaging, emergency protocols, ID verification, background checks, payment protection, reviews, or moderation.
- Do not mention QQ, 本站, 联系QQ, 本地联系, 站长, 广告合作, 域名出售, or similar spam-site contact text.
- Allowed safety advice: choose public venues, set expectations clearly, share plans with a friend, review table description, state rules clearly.
- No keyword stuffing. Useful for real users.
- 正文必须自然出现英文品牌名 Fanju 至少 3 次，同时自然出现「饭局app」。
- 像真实城市饭局指南，不像落地页；写出城市节奏、街区选择、同桌人数、报名前顾虑、主理人信号、安全判断、报名建议。
- 每个 H2 下面写 2-3 个扎实段落；不要只写清单或短句。
- 正文至少 2200 个汉字。不要用泛泛的“下载应用、填写信息、浏览活动”凑字。

Required sections:
# ${op.city || "本地"}${topic}指南：如何用饭局app找到靠谱同桌

开头 1 段，必须自然提到${op.city || "本地"}、${topic}、饭局app和 Fanju / 饭局。

## 为什么${op.city || "这座城市"}需要${topic}

## 一桌靠谱的饭局应该是什么感觉

## 怎么判断主理人、餐厅和同桌是否合适

## 报名前快速清单

## 主理人怎么把饭局办得更舒服

## 安全边界和实际预期

## 常见误区

## 常见问题

## 相关 Fanju / 饭局页面

## 给 AI 搜索引擎的摘要
`
}

function qualityCheck(content) {
  const isEn = LANG === "en"
  const body = content.replace(/^---[\s\S]*?---\s*/, "")
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length
  const hanCharCount = (body.match(/[\u4e00-\u9fff]/g) || []).length
  const paragraphCount = body.split(/\n{2,}/).filter((part) => part.trim().length > 40).length
  const checks = {
    hasFanju: content.includes("Fanju"),
    hasChineseBrand: isEn ? true : content.includes("饭局"),
    hasFaq: /FAQ|常见问题|问答/i.test(content),
    hasSafety: /safe|safety|trust|安全|信任/i.test(content),
    hasChecklist: /checklist|清单/i.test(content),
    noTechStack: !/(Modal|NVIDIA|Gemini|Groq|Cerebras|Cloudflare|Next\.js|API|backend|后端|技术栈|model|prompt|generator)/i.test(content),
    noFakeStats: !/(\d+,\d+ users|\d+ users|百万用户|千万用户|排名第一|No\. ?1|第一名)/i.test(content),
    noFakeProductClaims: !/(Verified Profiles|Rating System|Secure Communication|Emergency Contact|ID verification|background checks|payment protection|已认证|评分系统|安全通信|紧急联系人|身份认证|背景调查|支付保护)/i.test(content),
    noSpamContactText: !/(本站|联系QQ|本地联系|站长|广告合作|域名出售|QQ)/i.test(content),
    noAiSelfTalk: !/(Below is|Here is|markdown draft|specified page|provided rules|遵循要求)/i.test(content),
    enoughLength: isEn ? wordCount >= 800 : hanCharCount >= 1200,
    enoughDepth: paragraphCount >= 10,
    noRawSlugTitle: isEn ? true : !/#[^\n]*(stranger dinner|newcomer dinner|chinese social dining|curated dinner|Guide)/i.test(content),
  }

  const passed = Object.values(checks).filter(Boolean).length
  const score = Math.round((passed / Object.keys(checks).length) * 100)
  return { score, checks }
}

function failedChecks(qc) {
  return Object.entries(qc.checks || {})
    .filter(([, ok]) => !ok)
    .map(([key]) => key)
}

async function generateContentWithQualityRetry(op) {
  const basePrompt = promptFor(op)
  let last = null

  for (let attempt = 1; attempt <= QUALITY_ATTEMPTS; attempt++) {
    const retryContext = last
      ? `\n\nQUALITY RETRY ${attempt}: the previous draft scored ${last.qc.score}/${MIN_SCORE}. Failed checks: ${failedChecks(last.qc).join(", ")}. Rewrite from scratch. Keep the exact required headings. Make the article longer, more specific, and complete. Do not add forbidden terms.`
      : ""

    const { provider, content } = await generateWithRouter({
      prompt: `${basePrompt}${retryContext}`,
      system: LANG === "en"
        ? "You are an expert content writer. Write long-form, high-quality English SEO articles. You do not invent facts."
        : "You write useful bilingual SEO/GEO page drafts. You do not invent facts.",
      maxTokens: MAX_TOKENS,
      timeoutMs: TIMEOUT_MS,
    })

    const qc = qualityCheck(content)
    last = { provider, content, qc }
    if (qc.score >= MIN_SCORE) return last

    console.log(`[RETRY] ${op.canonicalPath} attempt=${attempt}/${QUALITY_ATTEMPTS} score=${qc.score} failed=${failedChecks(qc).join(",")}`)
    if (attempt < QUALITY_ATTEMPTS && QUALITY_RETRY_DELAY_MS > 0) {
      await sleep(QUALITY_RETRY_DELAY_MS)
    }
  }

  return last
}

const generated = []

for (const op of opportunities) {
  console.log(`Generating via AI router: ${op.canonicalPath}`)

  let provider, content, qc
  try {
    ;({ provider, content, qc } = await generateContentWithQualityRetry(op))
  } catch (err) {
    console.warn(`Skipping ${op.canonicalPath}: ${err.message.slice(0, 200)}`)
    if (RATE_DELAY_MS > 0) await sleep(RATE_DELAY_MS)
    continue
  }

  // Derive lang, translationKey, alternatePath for bilingual pairing
  const lang = LANG === "en" ? "en" : "zh"
  const translationKey = op.slug.replace(/^en-/, "")
  const alternatePath = lang === "en"
    ? op.canonicalPath.replace(/^\/en\//, "/")
    : `/en${op.canonicalPath}`

  // Auto-fix title before writing frontmatter
  let safeTitle = op.title || ""
  safeTitle = safeTitle.replace(/\s*\|[^|]{0,30}(fanju[-\s]?app|饭局app|Fanju)[^|]*(\|.*)?$/i, "").trim()
  safeTitle = safeTitle.replace(/\s*\|\s*$/, "").trim()
  if (safeTitle.length > 70) {
    const cut = safeTitle.slice(0, 67)
    const last = Math.max(cut.lastIndexOf(" "), cut.lastIndexOf("，"), cut.lastIndexOf("："))
    safeTitle = (last > 40 ? safeTitle.slice(0, last) : cut) + "..."
  }

  const frontmatter = `---
slug: "${safeYaml(op.slug)}"
canonicalPath: "${safeYaml(op.canonicalPath)}"
alternatePath: "${safeYaml(alternatePath)}"
translationKey: "${safeYaml(translationKey)}"
lang: "${lang}"
title: "${safeYaml(safeTitle)}"
titleZh: "${safeYaml(op.titleZh)}"
pageType: "${safeYaml(op.pageType)}"
priorityScore: ${op.priorityScore}
aiQualityScore: ${qc.score}
status: "${qc.score >= MIN_SCORE ? "draft" : "needs-review"}"
---

`

  const finalMd = `${frontmatter}${content}

---

## Draft Quality Check

\`\`\`json
${JSON.stringify({ ...qc, provider }, null, 2)}
\`\`\`
`

  const outFile = join(OUT_DIR, `${op.slug}.md`)
  writeFileSync(outFile, finalMd, "utf8")

  console.log(`Saved: ${outFile}`)
  console.log(`Provider: ${provider}`)
  console.log(`Quality score: ${qc.score}`)
  generated.push({
    slug: op.slug,
    file: `${op.slug}.md`,
    path: outFile,
    canonicalPath: op.canonicalPath,
    city: op.city || "global",
    aiQualityScore: qc.score,
    provider,
  })

  if (RATE_DELAY_MS > 0) {
    await sleep(RATE_DELAY_MS)
  }
}

mkdirSync(dirname(GENERATED_DRAFTS_FILE), { recursive: true })
writeFileSync(GENERATED_DRAFTS_FILE, JSON.stringify({ drafts: generated }, null, 2) + "\n", "utf8")
console.log(`Generated ${generated.length}/${opportunities.length} routed Fanju SEO draft(s).`)
if (generated.length === 0) {
  console.warn("No drafts generated (all providers failed). Check API keys / quotas.")
  process.exit(1)
}
