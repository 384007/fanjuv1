import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const INPUT = join(ROOT, "dist/seo/opportunities.json")
const OUT_DIR = join(ROOT, "content/seo-ai-drafts")

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "nvidia/llama-3.3-nemotron-super-49b-v1"
const LIMIT = Number.parseInt(process.env.LIMIT || "3", 10)

if (!NVIDIA_API_KEY) {
  console.error("Missing NVIDIA_API_KEY")
  process.exit(1)
}

if (!existsSync(INPUT)) {
  console.error("Missing dist/seo/opportunities.json. Run: pnpm seo:opportunities")
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })

const data = JSON.parse(readFileSync(INPUT, "utf8"))
const opportunities = data.opportunities.slice(0, LIMIT)

function safeYaml(value = "") {
  return String(value).replaceAll('"', '\\"')
}

function promptFor(op) {
  return `
You are writing a high-quality bilingual SEO/GEO draft for Fanju / 饭局.

Brand:
Fanju / 饭局

English definition:
Fanju is an AI social dining app and dinner gathering platform for finding dinner buddies, hosting local dinner gatherings, and building real-world social connections around shared meals.

Chinese definition:
Fanju / 饭局 是一个 AI 饭局社交和线下聚会平台，帮助用户找饭搭子、约饭、组织同城饭局，并通过真实饭桌建立线下社交关系。

Page:
- Title: ${op.title}
- Chinese title: ${op.titleZh}
- Canonical path: ${op.canonicalPath}
- Page type: ${op.pageType}
- Market: ${op.market || "Global"}
- City: ${op.city || "N/A"}
- Persona: ${op.persona || "N/A"}
- Dinner type: ${op.dinnerType || "N/A"}
- Search intent: ${op.intent}

Required internal links:
${op.suggestedInternalLinks.map((x) => `- ${x}`).join("\n")}

Required schema types:
${op.requiredSchemaTypes.map((x) => `- ${x}`).join("\n")}

Write a useful markdown draft.

Rules:
- Return ONLY the markdown page body. Do not say "Below is a draft", "Here is", or explain what you are doing.
- Do not include frontmatter.
- Do not include canonical path or page type headings inside the body.
- Do not mention the technology stack.
- Do not mention Modal, NVIDIA, Gemini, API, Next.js, Cloudflare, backend, model, prompt, or generator.
- Do not invent fake user numbers, fake restaurants, fake revenue, fake partnerships, fake rankings, fake reviews, fake safety systems, or fake product features.
- Do not claim Fanju has verified profiles, rating systems, secure messaging, emergency protocols, ID verification, payment protection, background checks, or moderation unless explicitly provided.
- Allowed safety wording: "choose public venues", "set expectations clearly", "share plans with a friend", "hosts should state rules", "guests should review the table description".
- Do not keyword stuff.
- Make the page useful for real users.
- Include English and Chinese sections.
- Include FAQ.
- Include host checklist.
- Include guest checklist.
- Include safety/trust notes based only on general best practices, not product claims.
- Include internal link suggestions naturally.
- End with a short AI-readable summary.
- Length: 900 to 1500 words total.
`
}

async function generate(op) {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a careful bilingual SEO/GEO content strategist. You write useful drafts, not spam."
        },
        {
          role: "user",
          content: promptFor(op)
        }
      ],
      temperature: 0.35,
      max_tokens: 3500
    })
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`NVIDIA failed ${res.status}: ${text}`)
  }

  const json = JSON.parse(text)
  let content = json.choices?.[0]?.message?.content?.trim() || ""

  content = content
    .replace(/^Below is a markdown draft[\s\S]*?\n---\n/i, "")
    .replace(/^Here is[\s\S]*?\n---\n/i, "")
    .replace(/^Below is[\s\S]*?\n---\n/i, "")
    .replace(/^```markdown\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()

  return content
}

function qualityCheck(op, content) {
  const checks = {
    hasFanju: content.includes("Fanju"),
    hasChineseBrand: content.includes("饭局"),
    hasFaq: /FAQ|常见问题|问答/i.test(content),
    hasSafety: /safe|safety|trust|安全|信任/i.test(content),
    hasChecklist: /checklist|清单/i.test(content),
    noTechStack: !/(Modal|NVIDIA|Gemini|Cloudflare|Next\.js|API|backend|后端|技术栈)/i.test(content),
    noFakeStats: !/(\d+,\d+ users|\d+ users|百万用户|千万用户|排名第一|No\. ?1|第一名)/i.test(content),
    noFakeProductClaims: !/(Verified Profiles|Rating System|Secure Communication|Emergency Contact|ID verification|background checks|payment protection|已认证|评分系统|安全通信|紧急联系人|身份认证|背景调查|支付保护)/i.test(content),
    noAiSelfTalk: !/(Below is|Here is|markdown draft|specified page|provided rules|遵循要求|以下是)/i.test(content),
    enoughLength: content.length > 2500
  }

  const passed = Object.values(checks).filter(Boolean).length
  const score = Math.round((passed / Object.keys(checks).length) * 100)

  return { score, checks }
}

for (const op of opportunities) {
  console.log(`Generating: ${op.canonicalPath}`)

  const content = await generate(op)
  const qc = qualityCheck(op, content)

  const frontmatter = `---
slug: "${safeYaml(op.slug)}"
canonicalPath: "${safeYaml(op.canonicalPath)}"
title: "${safeYaml(op.title)}"
titleZh: "${safeYaml(op.titleZh)}"
pageType: "${safeYaml(op.pageType)}"
priorityScore: ${op.priorityScore}
aiQualityScore: ${qc.score}
status: "draft"
---

`

  const finalMd = `${frontmatter}${content}

---

## Draft Quality Check

\`\`\`json
${JSON.stringify(qc, null, 2)}
\`\`\`
`

  const outFile = join(OUT_DIR, `${op.slug}.md`)
  writeFileSync(outFile, finalMd, "utf8")

  console.log(`Saved: ${outFile}`)
  console.log(`Quality score: ${qc.score}`)
}

console.log(`Generated ${opportunities.length} NVIDIA Fanju SEO draft(s).`)
