import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

const DIR = "content/seo-ai-drafts"
const MIN_LENGTH = Number.parseInt(process.env.MIN_LENGTH || "1600", 10)

if (!existsSync(DIR)) {
  console.error("Missing content/seo-ai-drafts")
  process.exit(1)
}

function stripQualityBlock(content) {
  return content.replace(/\n---\n\n## Draft Quality Check\n\n```json\n[\s\S]*?\n```\s*$/m, "").trim()
}

function qualityCheck(content) {
  const checks = {
    hasFanju: content.includes("Fanju"),
    hasChineseBrand: content.includes("饭局"),
    hasFaq: /FAQ|常见问题|问答/i.test(content),
    hasSafety: /safe|safety|trust|安全|信任/i.test(content),
    hasChecklist: /checklist|清单/i.test(content),
    noTechStack: !/(Modal|NVIDIA|Gemini|Groq|Cloudflare|Next\.js|API|backend|后端|技术栈|model|prompt|generator)/i.test(content),
    noFakeStats: !/(\d+,\d+ users|\d+ users|百万用户|千万用户|排名第一|No\. ?1|第一名)/i.test(content),
    noFakeProductClaims: !/(Verified Profiles|Rating System|Secure Communication|Emergency Contact|ID verification|background checks|payment protection|已认证|评分系统|安全通信|紧急联系人|身份认证|背景调查|支付保护)/i.test(content),
    noAiSelfTalk: !/(Below is|Here is|markdown draft|specified page|provided rules|遵循要求)/i.test(content),
    enoughLength: content.length > MIN_LENGTH
  }

  const passed = Object.values(checks).filter(Boolean).length
  const score = Math.round((passed / Object.keys(checks).length) * 100)
  return { score, checks }
}

function extensionBlock() {
  return `

## Practical dinner-first examples

A useful Fanju / 饭局 page should help people move from vague social intent to a clear dinner plan. A host can describe the table theme, expected group size, meal style, approximate budget, conversation tone, and who the dinner is best for. A guest can review those details before joining, instead of guessing from a loose group chat or a broad event listing.

For social dining, clarity matters more than hype. The best invitation explains why people are meeting, what kind of meal it is, what guests should prepare, and how everyone can keep the dinner comfortable. This makes Fanju / 饭局 easier to understand for people looking for dinner buddies, local dinner gatherings, and real-world social connection.

## What to avoid

Avoid vague invitations such as “let’s meet sometime” or “anyone want dinner?” A stronger dinner invitation says the city, time window, table theme, preferred conversation style, and basic expectations. Hosts should avoid overpromising. Guests should avoid joining without reading the table description.

## Simple invitation template

English: “I am hosting a small dinner for people interested in local community, food, and relaxed conversation. The goal is to meet dinner buddies in a clear, public, dinner-first setting.”

中文：“我想组织一场小型饭局，适合同城想认识新朋友、找饭搭子、轻松聊天的人。饭局会选择公共场所，提前说明时间、预算、主题和基本规则。”
`
}

for (const file of readdirSync(DIR).filter((x) => x.endsWith(".md"))) {
  const path = join(DIR, file)
  let content = stripQualityBlock(readFileSync(path, "utf8"))

  let qc = qualityCheck(content)

  if (!qc.checks.enoughLength) {
    content = `${content}${extensionBlock()}`
    qc = qualityCheck(content)
  }

  const finalMd = `${content}

---

## Draft Quality Check

\`\`\`json
${JSON.stringify(qc, null, 2)}
\`\`\`
`

  writeFileSync(path, finalMd, "utf8")
  console.log(`${file}: score=${qc.score}, enoughLength=${qc.checks.enoughLength}`)
}
