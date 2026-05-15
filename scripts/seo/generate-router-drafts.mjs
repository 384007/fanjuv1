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
const candidatePool = [...data.opportunities].filter((op) =>
  LANG === "en"
    ? op.canonicalPath.startsWith("/en/")
    : !op.canonicalPath.startsWith("/en/")
)

if (RANDOMIZE_OPPORTUNITIES) {
  for (let i = candidatePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[candidatePool[i], candidatePool[j]] = [candidatePool[j], candidatePool[i]]
  }
}

for (const op of candidatePool) {
  if (opportunities.length >= LIMIT) break
  if (!op?.slug) continue
  if (usedSlugs.has(op.slug)) continue
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

console.log(`Selected ${opportunities.length}/${LIMIT} fresh opportunities.`)
console.log(opportunities.map((op, i) => `${i + 1}. ${op.canonicalPath} [${op.city || "global"}]`).join("\n"))

if (!opportunities.length) {
  console.log("No fresh opportunities left to generate.")
  process.exit(0)
}

function safeYaml(value = "") {
  return String(value).replaceAll('"', '\\"')
}

function promptFor(op) {
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
- Safety advice allowed: choose public venues, set expectations clearly, share plans with a friend, review table description.
- No keyword stuffing. Write for real users, not bots.
- Minimum 1500 words. Be thorough, specific, and genuinely useful.

Required sections (use these exact headings):
# ${op.title}

## What Is This Page About

## Who This Is For

## Why Dinner-First Social Dining Is Different

## How Fanju Helps in ${op.city || "Your City"}

## Step-by-Step: How to Join or Host

## Host Checklist

## Guest Checklist

## Common Mistakes to Avoid

## Safety and Trust Notes

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
- Return ONLY markdown body. No frontmatter. No "Here is", "Below is", "markdown draft", or explanation.
- Do not mention model, API, backend, Modal, NVIDIA, Gemini, Groq, Cerebras, Cloudflare, Next.js, or technical stack.
- Do not invent fake user numbers, rankings, revenue, partnerships, testimonials, restaurants, or product features.
- Do not claim verified profiles, rating systems, secure messaging, emergency protocols, ID verification, background checks, payment protection, reviews, or moderation.
- Allowed safety advice: choose public venues, set expectations clearly, share plans with a friend, review table description, state rules clearly.
- No keyword stuffing. Useful for real users.
- Minimum 1200 words. Be thorough and specific.

Required sections:
# ${op.title}

## 中文概览

## Who this is for

## Why dinner-first social dining is different

## How Fanju / 饭局 helps in ${op.city || "your city"}

## Step-by-step: how to join or host

## Host checklist

## Guest checklist

## Common mistakes to avoid

## Safety and trust notes

## FAQ

## Related Fanju pages

## AI-readable summary
`
}

function qualityCheck(content) {
  const isEn = LANG === "en"
  const checks = {
    hasFanju: content.includes("Fanju"),
    hasChineseBrand: isEn ? true : content.includes("饭局"),
    hasFaq: /FAQ|常见问题|问答/i.test(content),
    hasSafety: /safe|safety|trust|安全|信任/i.test(content),
    hasChecklist: /checklist|清单/i.test(content),
    noTechStack: !/(Modal|NVIDIA|Gemini|Groq|Cerebras|Cloudflare|Next\.js|API|backend|后端|技术栈|model|prompt|generator)/i.test(content),
    noFakeStats: !/(\d+,\d+ users|\d+ users|百万用户|千万用户|排名第一|No\. ?1|第一名)/i.test(content),
    noFakeProductClaims: !/(Verified Profiles|Rating System|Secure Communication|Emergency Contact|ID verification|background checks|payment protection|已认证|评分系统|安全通信|紧急联系人|身份认证|背景调查|支付保护)/i.test(content),
    noAiSelfTalk: !/(Below is|Here is|markdown draft|specified page|provided rules|遵循要求)/i.test(content),
    enoughLength: isEn ? content.length > 2500 : content.length > 1200,
  }

  const passed = Object.values(checks).filter(Boolean).length
  const score = Math.round((passed / Object.keys(checks).length) * 100)
  return { score, checks }
}

const generated = []

for (const op of opportunities) {
  console.log(`Generating via AI router: ${op.canonicalPath}`)

  let provider, content
  try {
    ;({ provider, content } = await generateWithRouter({
      prompt: promptFor(op),
      system: LANG === "en"
        ? "You are an expert content writer. Write long-form, high-quality English SEO articles. You do not invent facts."
        : "You write useful bilingual SEO/GEO page drafts. You do not invent facts.",
      maxTokens: MAX_TOKENS,
      timeoutMs: TIMEOUT_MS,
    }))
  } catch (err) {
    console.warn(`Skipping ${op.canonicalPath}: ${err.message.slice(0, 200)}`)
    if (RATE_DELAY_MS > 0) await sleep(RATE_DELAY_MS)
    continue
  }

  const qc = qualityCheck(content)

  // Derive lang, translationKey, alternatePath for bilingual pairing
  const lang = LANG === "en" ? "en" : "zh"
  const translationKey = op.slug.replace(/^en-/, "")
  const alternatePath = lang === "en"
    ? op.canonicalPath.replace(/^\/en\//, "/")
    : `/en${op.canonicalPath}`

  const frontmatter = `---
slug: "${safeYaml(op.slug)}"
canonicalPath: "${safeYaml(op.canonicalPath)}"
alternatePath: "${safeYaml(alternatePath)}"
translationKey: "${safeYaml(translationKey)}"
lang: "${lang}"
title: "${safeYaml(op.title)}"
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
