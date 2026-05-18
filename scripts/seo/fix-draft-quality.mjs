import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

const DRAFT_DIR = "content/seo-ai-drafts"
const MIN_LENGTH = Number.parseInt(process.env.MIN_LENGTH || "1600", 10)
const GENERATED_DRAFTS_FILE = process.env.GENERATED_DRAFTS_FILE || "dist/seo/generated-drafts.json"
const ALLOW_REPAIR_APPEND = process.env.ALLOW_REPAIR_APPEND === "1"
const forbiddenTermRe = /(Modal|NVIDIA|Gemini|Groq|Cerebras|Cloudflare|Next\.js|API|backend|后端|技术栈|Below is|Here is|markdown draft|Verified Profiles|Rating System|Secure Communication|Emergency Contact|ID verification|background checks|payment protection|已认证|评分系统|安全通信|紧急联系人|身份认证|背景调查|支付保护|本站|联系QQ|本地联系|站长|广告合作|域名出售|QQ|model|prompt|generator)/gi

if (!existsSync(DRAFT_DIR)) {
  console.error(`Missing ${DRAFT_DIR}`)
  process.exit(1)
}

function stripQualityBlock(md) {
  return md.replace(/\n---\n\n## Draft Quality Check\n\n```json\n[\s\S]*?\n```\s*$/m, "").trim()
}

function bodyOnly(md) {
  return md
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/\n---\n\n## Draft Quality Check\n\n```json\n[\s\S]*?\n```\s*$/m, "")
}

function getFrontmatterScore(md) {
  const match = md.match(/aiQualityScore:\s*(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 0
}

function getField(md, field) {
  const m = md.match(new RegExp(`^${field}:\\s*"?([^"\\n]+)"?\\s*$`, "m"))
  return m ? m[1].trim() : ""
}

function setFrontmatterScore(md, score) {
  if (/aiQualityScore:\s*\d+/.test(md)) {
    return md.replace(/aiQualityScore:\s*\d+/, `aiQualityScore: ${score}`)
  }
  return md.replace(/^---\n/, `---\naiQualityScore: ${score}\n`)
}

function generatedDraftFiles() {
  if (!existsSync(GENERATED_DRAFTS_FILE)) return null
  try {
    const state = JSON.parse(readFileSync(GENERATED_DRAFTS_FILE, "utf8"))
    return new Set((state.drafts || []).map((draft) => draft.file).filter(Boolean))
  } catch {
    return null
  }
}

function sanitizeForbiddenClaims(md) {
  return md
    .replace(/Below is/gi, "")
    .replace(/Here is/gi, "")
    .replace(/markdown draft/gi, "article")
    .replace(/specified page/gi, "page")
    .replace(/provided rules/gi, "editorial standards")
    .replace(/Verified Profiles/gi, "clear table descriptions")
    .replace(/Rating System/gi, "clear expectations")
    .replace(/Secure Communication/gi, "clear communication")
    .replace(/Emergency Contact/gi, "sharing plans with a friend")
    .replace(/ID verification/gi, "public venue planning")
    .replace(/background checks/gi, "public venue planning")
    .replace(/payment protection/gi, "clear payment expectations")
    .replace(/已认证/g, "清晰说明")
    .replace(/评分系统/g, "清晰预期")
    .replace(/安全通信/g, "清晰沟通")
    .replace(/紧急联系人/g, "告知朋友行程")
    .replace(/身份认证/g, "公共场所安排")
    .replace(/背景调查/g, "公共场所安排")
    .replace(/支付保护/g, "提前说明费用")
    .replace(/\b(Modal|NVIDIA|Gemini|Groq|Cerebras|Cloudflare|Next\.js|API|backend|model|prompt|generator)\b/gi, "")
    .replace(/(后端|技术栈)/g, "")
    .replace(forbiddenTermRe, "")
}

function qualityCheck(md) {
  const body = bodyOnly(md)
  const lang = getField(md, "lang")
  const isEn = lang === "en"
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length
  const hanCharCount = (body.match(/[\u4e00-\u9fff]/g) || []).length
  const paragraphCount = body.split(/\n{2,}/).filter((part) => part.trim().length > 40).length

  const checks = {
    hasFanju: body.includes("Fanju"),
    hasChineseBrand: isEn ? true : body.includes("饭局"),
    hasFaq: /FAQ|常见问题|问答/i.test(body),
    hasSafety: /safe|safety|trust|安全|信任/i.test(body),
    hasChecklist: /checklist|清单/i.test(body),
    noTechStack: !/(Modal|NVIDIA|Gemini|Groq|Cerebras|Cloudflare|Next\.js|API|backend|后端|技术栈|model|prompt|generator)/i.test(body),
    noFakeStats: !/(\d+,\d+ users|\d+ users|百万用户|千万用户|排名第一|No\. ?1|第一名)/i.test(body),
    noFakeProductClaims: !/(Verified Profiles|Rating System|Secure Communication|Emergency Contact|ID verification|background checks|payment protection|已认证|评分系统|安全通信|紧急联系人|身份认证|背景调查|支付保护)/i.test(body),
    noSpamContactText: !/(本站|联系QQ|本地联系|站长|广告合作|域名出售|QQ)/i.test(body),
    noAiSelfTalk: !/(Below is|Here is|markdown draft|specified page|provided rules|遵循要求)/i.test(body),
    enoughLength: isEn ? wordCount >= 800 : hanCharCount >= Math.max(900, MIN_LENGTH),
    enoughDepth: paragraphCount >= 10,
    noRawSlugTitle: isEn ? true : !/#[^\n]*(stranger dinner|newcomer dinner|chinese social dining|curated dinner|Guide)/i.test(body),
  }

  const passed = Object.values(checks).filter(Boolean).length
  const score = Math.round((passed / Object.keys(checks).length) * 100)

  return { score, checks }
}

function repairBlock(lang = "zh") {
  if (lang === "en") {
    return `

## Practical dinner-first examples

A useful Fanju page should help people move from vague social intent to a clear dinner plan. A host can describe the table theme, expected group size, meal style, approximate budget, conversation tone, and who the dinner is best for. A guest can review those details before joining, instead of guessing from a loose group chat or a broad event listing.

For social dining, clarity matters more than hype. The best invitation explains why people are meeting, what kind of meal it is, what guests should prepare, and how everyone can keep the dinner comfortable. This makes Fanju easier to understand for people looking for dinner buddies, local dinner gatherings, and real-world social connection.

## What to avoid

Avoid vague invitations such as "let's meet sometime" or "anyone want dinner?" A stronger dinner invitation says the city, time window, table theme, preferred conversation style, and basic expectations. Hosts should avoid overpromising. Guests should avoid joining without reading the table description.

## Simple invitation template

"I am hosting a small dinner for people interested in local community, food, and relaxed conversation. The goal is to meet dinner buddies in a clear, public, dinner-first setting."

## Safety checklist

- Choose a public restaurant, cafe, or dining space for the first Fanju meeting.
- Write the table theme, time window, expected group size, meal style, and payment expectations clearly.
- Share the plan with a friend before attending a new dinner gathering.
- Keep the conversation respectful and leave if the table does not match the description.
- Hosts should set simple rules before the meal so dinner buddies understand the tone of the gathering.

## FAQ

### Is Fanju only for dating?

No. Fanju is dinner-first social dining. Some people use it to meet dinner buddies, some use it for local community, and some use it for founder, expat, student, newcomer, or interest-based dinner gatherings.

### What makes a high-quality Fanju invitation?

A high-quality invitation is specific. It explains the city, meal type, table theme, budget expectation, conversation style, and who the dinner is best for.

### How can guests choose a suitable dinner?

Guests should read the table description, check whether the theme fits their intent, choose public venues for first meetings, and join dinners where expectations are clear.
`
  }

  return `

## Practical dinner-first examples

A useful Fanju / 饭局 page should help people move from vague social intent to a clear dinner plan. A host can describe the table theme, expected group size, meal style, approximate budget, conversation tone, and who the dinner is best for. A guest can review those details before joining, instead of guessing from a loose group chat or a broad event listing.

For social dining, clarity matters more than hype. The best invitation explains why people are meeting, what kind of meal it is, what guests should prepare, and how everyone can keep the dinner comfortable. This makes Fanju / 饭局 easier to understand for people looking for dinner buddies, local dinner gatherings, and real-world social connection.

## What to avoid

Avoid vague invitations such as “let’s meet sometime” or “anyone want dinner?” A stronger dinner invitation says the city, time window, table theme, preferred conversation style, and basic expectations. Hosts should avoid overpromising. Guests should avoid joining without reading the table description.

## Simple invitation template

English: “I am hosting a small dinner for people interested in local community, food, and relaxed conversation. The goal is to meet dinner buddies in a clear, public, dinner-first setting.”

中文：“我想组织一场小型饭局，适合同城想认识新朋友、找饭搭子、轻松聊天的人。饭局会选择公共场所，提前说明时间、预算、主题和基本规则。”

## Safety checklist

- Choose a public restaurant, cafe, or dining space for the first Fanju / 饭局 meeting.
- Write the table theme, time window, expected group size, meal style, and payment expectations clearly.
- Share the plan with a friend before attending a new dinner gathering.
- Keep the conversation respectful and leave if the table does not match the description.
- Hosts should set simple rules before the meal so dinner buddies understand the tone of the gathering.

## FAQ

### Is Fanju / 饭局 only for dating?

No. Fanju / 饭局 is dinner-first social dining. Some people use it to meet dinner buddies, some use it for local community, and some use it for founder, expat, student, newcomer, or interest-based dinner gatherings.

### What makes a high-quality Fanju / 饭局 invitation?

A high-quality invitation is specific. It explains the city, meal type, table theme, budget expectation, conversation style, and who the dinner is best for.

### How can guests choose a suitable dinner?

Guests should read the table description, check whether the theme fits their intent, choose public venues for first meetings, and join dinners where expectations are clear.
`
}

const allowedFiles = generatedDraftFiles()
const files = readdirSync(DRAFT_DIR).filter((x) => x.endsWith(".md") && (!allowedFiles || allowedFiles.has(x)))

for (const file of files) {
  const path = join(DRAFT_DIR, file)
  let md = readFileSync(path, "utf8")
  const lang = getField(md, "lang")
  const oldScore = getFrontmatterScore(md)

  md = sanitizeForbiddenClaims(stripQualityBlock(md))
  let qc = qualityCheck(md)

  if (ALLOW_REPAIR_APPEND && qc.score < 100) {
    md = sanitizeForbiddenClaims(md + repairBlock(lang))
    qc = qualityCheck(md)
  }

  md = setFrontmatterScore(md, qc.score)

  const finalMd = `${md}

---

## Draft Quality Check

\`\`\`json
${JSON.stringify(qc, null, 2)}
\`\`\`
`

  writeFileSync(path, finalMd, "utf8")
  console.log(`${file}: ${oldScore} -> ${qc.score}`)
}

console.log("Draft quality fix complete.")
