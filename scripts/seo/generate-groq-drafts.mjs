import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const INPUT = join(ROOT, "dist/seo/opportunities.json")
const OUT_DIR = join(ROOT, "content/seo-ai-drafts")

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant"
const LIMIT = Number.parseInt(process.env.LIMIT || "3", 10)
const MAX_TOKENS = Number.parseInt(process.env.MAX_TOKENS || "1300", 10)
const TIMEOUT_MS = Number.parseInt(process.env.TIMEOUT_MS || "60000", 10)
const RETRIES = Number.parseInt(process.env.RETRIES || "5", 10)
const RATE_DELAY_MS = Number.parseInt(process.env.RATE_DELAY_MS || "12000", 10)

if (!GROQ_API_KEY) {
  console.error("Missing GROQ_API_KEY")
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
Write ONLY the markdown body for this Fanju / 饭局 SEO/GEO draft.

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

Strict rules:
- Return ONLY markdown body.
- No frontmatter.
- No "Here is", "Below is", "markdown draft", or explanation.
- Do not mention model, API, backend, Modal, NVIDIA, Gemini, Groq, Cloudflare, Next.js, or technical stack.
- Do not invent product features.
- Do not claim verified profiles, rating systems, secure messaging, emergency protocols, ID verification, background checks, payment protection, or moderation.
- Do not invent fake restaurants, user numbers, rankings, revenue, partnerships, or testimonials.
- Allowed safety advice: choose public venues, set expectations clearly, share plans with a friend, review table description, state rules clearly.
- No keyword stuffing.
- Useful for real users.

Required sections:
# ${op.title}

## 中文概览

## Who this is for

## Why dinner-first social dining is different

## How Fanju / 饭局 helps

## Host checklist

## Guest checklist

## Safety and trust notes

## FAQ

## Related Fanju pages

## AI-readable summary

Keep it concise: 700 to 1100 words total.
`
}


function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function retryDelayFromGroq(text, res) {
  const header = res?.headers?.get?.("retry-after")
  if (header && Number.isFinite(Number(header))) {
    return Math.ceil(Number(header) * 1000) + 1000
  }

  const match = text.match(/try again in ([0-9.]+)s/i)
  if (match) {
    return Math.ceil(Number(match[1]) * 1000) + 1500
  }

  return RATE_DELAY_MS
}

async function callGroq(op) {
  let lastError = null

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const started = Date.now()

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: "You write useful bilingual SEO/GEO page drafts. You do not invent facts."
            },
            {
              role: "user",
              content: promptFor(op)
            }
          ],
          temperature: 0.25,
          max_tokens: MAX_TOKENS
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timer))

      const text = await res.text()
      console.log(`Groq response time: ${Math.round((Date.now() - started) / 1000)}s`)

      if (res.ok) {
        const json = JSON.parse(text)
        let content = json.choices?.[0]?.message?.content?.trim() || ""

        content = content
          .replace(/^```markdown\s*/i, "")
          .replace(/```\s*$/i, "")
          .replace(/^Here is[\s\S]*?\n/i, "")
          .replace(/^Below is[\s\S]*?\n/i, "")
          .trim()

        return content
      }

      if (res.status === 429) {
        const delay = retryDelayFromGroq(text, res)
        console.log(`Groq rate limited. Retry ${attempt}/${RETRIES}. Waiting ${Math.round(delay / 1000)}s...`)
        await sleep(delay)
        continue
      }

      throw new Error(`Groq failed ${res.status}: ${text}`)
    } catch (err) {
      clearTimeout(timer)
      lastError = err

      if (err.name === "AbortError") {
        console.log(`Groq timeout. Retry ${attempt}/${RETRIES}. Waiting ${Math.round(RATE_DELAY_MS / 1000)}s...`)
        await sleep(RATE_DELAY_MS)
        continue
      }

      throw err
    }
  }

  throw lastError || new Error("Groq failed after retries")
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
    enoughLength: content.length > 1500
  }

  const passed = Object.values(checks).filter(Boolean).length
  const score = Math.round((passed / Object.keys(checks).length) * 100)
  return { score, checks }
}

for (const op of opportunities) {
  console.log(`Generating with Groq: ${op.canonicalPath}`)

  const content = await callGroq(op)
  const qc = qualityCheck(content)

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

  if (RATE_DELAY_MS > 0) {
    console.log(`Waiting ${Math.round(RATE_DELAY_MS / 1000)}s before next draft...`)
    await sleep(RATE_DELAY_MS)
  }
}

console.log(`Generated ${opportunities.length} Groq Fanju SEO draft(s).`)
