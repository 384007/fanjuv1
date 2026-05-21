/**
 * scripts/check-seo-ready-routes.mjs
 * Validates all content/seo-ready/*.md files.
 * Rules:
 *   - status=ready
 *   - aiQualityScore >= 90
 *   - canonicalPath exists, starts with /, no whitespace
 *   - no duplicate canonicalPath
 *
 * NOT checked (intentionally):
 *   - translationKey pairing
 *   - alternatePath existence
 *   - zh/en article pairing
 */

import { existsSync, readdirSync, readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const READY_DIR = join(ROOT, "content/seo-ready")
const MANIFEST_FILE = join(ROOT, "data/seo/route-manifest.json")
const MIN_SCORE = 90
let routeMetaCache = null

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const meta = {}
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/)
    if (m) meta[m[1]] = m[2].trim()
  }
  return meta
}

function bodyWithoutFrontmatter(raw) {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/)
  return match ? match[1].trim() : raw.trim()
}

function normalizePath(p) {
  if (!p) return ""
  const n = p.startsWith("/") ? p : `/${p}`
  return n.endsWith("/") && n.length > 1 ? n.slice(0, -1) : n
}

function getAlternatePath(p) {
  return p.startsWith("/en/") ? p.slice(3) : `/en${p}`
}

function isMostlyChinese(s) {
  const total = s.length
  if (total === 0) return false
  const chinese = (s.match(/[\u4e00-\u9fff]/g) || []).length
  return chinese / total > 0.25
}

function isMostlyEnglish(s) {
  const total = s.length
  if (total === 0) return false
  const ascii = (s.match(/[A-Za-z]/g) || []).length
  return ascii / total > 0.35
}

function countMarkdownHeadings(body, level = 2) {
  const marker = "#".repeat(level)
  return (body.match(new RegExp(`^${marker}\\s+`, "gm")) || []).length
}

function countParagraphs(body) {
  return body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith("#") && !/^[-*]\s+/m.test(part) && !/^\d+\.\s+/m.test(part))
    .length
}

function duplicateMarkdownHeadings(body, level = 2) {
  const marker = "#".repeat(level)
  const headings = [...body.matchAll(new RegExp(`^${marker}\\s+(.+)$`, "gm"))]
    .map((m) => m[1].trim().toLowerCase())
    .filter(Boolean)
  return headings.length - new Set(headings).size
}

function duplicateParagraphs(body) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((part) => part
      .replace(/^#+\s*/, "")
      .replace(/\s+/g, "")
      .replace(/[，。,.!?！？、；;：:"'“”‘’()（）[\]【】]/g, "")
      .toLowerCase())
    .filter((part) => part.length >= 80)
  return paragraphs.length - new Set(paragraphs).size
}

function markdownH1(body = "") {
  return String(body || "").match(/^#\s+(.+)$/m)?.[1]?.trim() || ""
}

function normalizeForTemplateCheck(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function compactCjk(value = "") {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[，。,.!?！？、；;：:"'“”‘’()（）[\]【】|｜-]/g, "")
    .toLowerCase()
}

function normalizedWords(value = "") {
  return ` ${String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()} `
}

function zhCitySlugLeak(meta, value = "") {
  if (meta.lang !== "zh") return false
  const routeMeta = routeMetaFor(meta)
  const slug = String(routeMeta?.citySlug || "").toLowerCase().trim()
  if (!slug || /[\u4e00-\u9fff]/.test(slug) || slug.length < 3) return false
  const spacedSlug = slug.replace(/-/g, " ")
  return normalizedWords(value).includes(` ${spacedSlug} `)
}

function latinNoiseInZhHeading(value = "") {
  const allowed = new Set(["fanju", "app", "ai", "vc", "ceo", "cfo", "cto", "coo", "mba", "pm", "ip", "bd"])
  return [...String(value || "").matchAll(/[A-Za-z][A-Za-z-]{2,}/g)]
    .map((m) => m[0].toLowerCase())
    .filter((word) => !allowed.has(word))
}

function zhHeadingLatinNoise(body = "") {
  const headings = [...String(body || "").matchAll(/^#{1,3}\s+(.+)$/gm)]
    .map((m) => m[1].trim())
    .filter(Boolean)
  const words = new Set()
  for (const heading of headings) {
    for (const word of latinNoiseInZhHeading(heading)) words.add(word)
  }
  return [...words]
}

function loadRouteMeta() {
  if (routeMetaCache) return routeMetaCache
  routeMetaCache = new Map()
  if (!existsSync(MANIFEST_FILE)) return routeMetaCache
  const manifest = JSON.parse(readFileSync(MANIFEST_FILE, "utf8"))
  for (const entry of manifest.entries || []) {
    if (entry?.route) routeMetaCache.set(normalizePath(entry.route), entry)
  }
  return routeMetaCache
}

function routeMetaFor(meta) {
  return loadRouteMeta().get(normalizePath(meta.canonicalPath || "")) || null
}

function isTemplateTitle(meta, value = "") {
  const title = String(value || "").trim()
  if (!title) return false
  const routeMeta = routeMetaFor(meta)
  const city = String(routeMeta?.cityNameLocalized || "").trim()
  const topic = String(routeMeta?.topicNameLocalized || "").trim()
  const lang = meta.lang === "en" ? "en" : "zh"

  if (lang === "en") {
    const t = normalizeForTemplateCheck(title)
    const c = normalizeForTemplateCheck(city)
    const p = normalizeForTemplateCheck(topic)
    if (c && p) {
      const exact = new Set([
        `${c} ${p}`,
        `${c} ${p} guide`,
        `${c} ${p} dinner guide`,
        `a guide to ${p} in ${c}`,
        `how to join a ${p} in ${c}`,
        `how to join ${p} in ${c}`,
        `${p} in ${c}`,
        `${p} in ${c} guide`,
      ])
      if (exact.has(t)) return true
      const words = t.split(" ")
      if (t.startsWith(`${c} ${p}`) && / guide$/.test(t) && words.length <= c.split(" ").length + p.split(" ").length + 2) return true
    }
    return false
  }

  const t = compactCjk(title)
  const c = compactCjk(city)
  const p = compactCjk(topic)
  if (c && p && new Set([
    `${c}${p}`,
    `${c}${p}指南`,
    `${c}${p}饭局指南`,
    `${c}${p}怎么参加`,
    `${c}如何参加${p}`,
    `${c}${p}攻略`,
  ]).has(t)) return true

  return /(指南|攻略|怎么参加)$/.test(t) && t.length <= 28
}

function includesRouteCity(meta, value = "") {
  const routeMeta = routeMetaFor(meta)
  const city = String(routeMeta?.cityNameLocalized || "").trim()
  if (!city) return true
  const haystack = String(value || "")
  return meta.lang === "en"
    ? haystack.toLowerCase().includes(city.toLowerCase())
    : haystack.includes(city)
}

function templateH2Issues(meta, body = "") {
  const headings = [...String(body || "").matchAll(/^##\s+(.+)$/gm)]
    .map((m) => m[1].trim())
    .filter(Boolean)
  const genericEn = new Set([
    "what is fanju",
    "what is fanju app",
    "who this page is for",
    "how to assess safety and trust",
    "how fanju differs from social and dating apps",
    "how the table works",
    "how a fanju dinner works",
    "safety and boundaries",
    "boundaries and safety",
    "when not to join",
    "a practical first step",
  ])
  const genericZh = new Set([
    "fanju饭局app是什么",
    "饭局app是什么",
    "这个页面适合谁",
    "如何判断安全和信任",
    "和普通社交约会软件有什么不同",
    "一桌饭怎样运作",
    "边界和安全",
    "什么情况不适合报名",
    "一个实际的第一步",
  ])

  return headings
    .filter((heading) => {
      const normalized = normalizeForTemplateCheck(heading)
      const compact = compactCjk(heading)
      return genericEn.has(normalized) || genericZh.has(compact) || isTemplateTitle(meta, heading)
    })
    .map((heading) => heading.slice(0, 80))
}

function sourceBodyIssues(meta, body) {
  const issues = []
  const lang = meta.lang === "en" ? "en" : "zh"
  const haystack = `${meta.title || ""}\n${meta.description || ""}\n${body}`
  const h1 = markdownH1(body) || meta.title || ""
  const badPatterns = [
    /\bautomation\b/i,
    /\bprompt\b/i,
    /\bpipeline\b/i,
    /\bcron\b/i,
    /\bJSONL\b/i,
    /\bhash\b/i,
    /\bModal\b/i,
    /\bD1\b/i,
    /\bR2\b/i,
    /\bCloudflare\b/i,
    /\bgenerated by\b/i,
    /\bDraft Quality Check\b/i,
    /\bAI-readable summary\b/i,
    /\bSummary for AI Search Engines\b/i,
    /\bRelated Fanju Pages\b/i,
    /\bHere is\b/i,
    /\bBelow is\b/i,
    /\bReturn valid JSON\b/i,
    /\bBody requirements\b/i,
    /\bQQ\b/i,
    /本站/,
    /联系QQ/,
    /本地联系/,
    /站长/,
    /广告合作/,
    /域名出售/,
    /提示词/,
    /模型/,
    /后台/,
    /技术栈/,
    /流水线/,
    /自动化/,
  ]

  for (const pattern of badPatterns) {
    if (pattern.test(haystack)) issues.push(`bad-public-pattern:${pattern}`)
  }
  if (/\[[^\]]+\]\([^)]+\)/.test(body)) issues.push("markdown-link-in-body")
  if (/<a\b[^>]*href\s*=/i.test(body) || /\bhref\s*=/i.test(body)) issues.push("html-link-in-body")
  if (/https?:\/\/[^\s)]+/i.test(body)) issues.push("raw-url-in-body")
  if (/```/.test(body)) issues.push("code-fence-in-body")
  if (!meta.description || meta.description.length < (lang === "en" ? 80 : 35)) issues.push("missing-or-short-description")
  if (lang === "en" && !isMostlyEnglish(body)) issues.push("body-not-english")
  if (lang === "zh" && !isMostlyChinese(body)) issues.push("body-not-chinese")
  if (lang === "en" && !/Fanju app/i.test(meta.title || "")) issues.push("title-missing-primary-keyword:fanju-app")
  if (lang === "zh" && !(meta.title || "").includes("饭局app")) issues.push("title-missing-primary-keyword:饭局app")
  if (!includesRouteCity(meta, meta.title || "")) issues.push("title-missing-city")
  if (!includesRouteCity(meta, h1)) issues.push("h1-missing-city")
  if (!includesRouteCity(meta, meta.description || "")) issues.push("description-missing-city")
  if (zhCitySlugLeak(meta, `${meta.title || ""}\n${meta.description || ""}\n${body.slice(0, 1600)}`)) {
    issues.push(`pinyin-city-name-in-zh-public-text:${routeMetaFor(meta)?.citySlug || "unknown"}`)
  }
  if (lang === "zh") {
    const titleNoise = latinNoiseInZhHeading(meta.title || "")
    const h1Noise = latinNoiseInZhHeading(h1)
    const headingNoise = zhHeadingLatinNoise(body)
    if (titleNoise.length) issues.push(`latin-word-in-zh-title:${titleNoise.slice(0, 3).join("|")}`)
    if (h1Noise.length) issues.push(`latin-word-in-zh-h1:${h1Noise.slice(0, 3).join("|")}`)
    if (headingNoise.length) issues.push(`latin-word-in-zh-heading:${headingNoise.slice(0, 5).join("|")}`)
  }
  if (isTemplateTitle(meta, meta.title || "")) issues.push("template-title")
  if (isTemplateTitle(meta, h1)) issues.push("template-h1")
  if (body.length < (lang === "en" ? 3200 : 2200)) issues.push(`body-too-short:${body.length}`)
  if (countMarkdownHeadings(body, 2) < 5) issues.push(`too-few-h2:${countMarkdownHeadings(body, 2)}`)
  if (countParagraphs(body) < 10) issues.push(`too-few-paragraphs:${countParagraphs(body)}`)
  if (duplicateMarkdownHeadings(body, 2) > 0) issues.push("duplicate-h2")
  if (duplicateParagraphs(body) > 0) issues.push("duplicate-paragraphs")

  const h2 = [...body.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim().toLowerCase())
  const genericHeadings = [
    "what is fanju",
    "who this page is for",
    "how to assess safety and trust",
    "how fanju differs from social and dating apps",
    "fanju / 饭局app 是什么",
    "这个页面适合谁",
    "如何判断安全和信任",
    "和普通社交/约会软件有什么不同",
  ]
  const genericHits = h2.filter((heading) => genericHeadings.includes(heading)).length
  if (genericHits >= 3) issues.push(`template-heading-set:${genericHits}`)
  const templateH2 = templateH2Issues(meta, body)
  if (templateH2.length > 0) issues.push(`template-h2:${templateH2.join("|")}`)

  return issues
}

if (!existsSync(READY_DIR)) {
  console.error(`❌  content/seo-ready not found at ${READY_DIR}`)
  process.exit(1)
}

const files = readdirSync(READY_DIR).filter((f) => f.endsWith(".md"))
if (files.length === 0) {
  console.warn("⚠️  No .md files in content/seo-ready/")
}

let errors = 0
const seenPaths = new Map()

for (const file of files) {
  const raw = readFileSync(join(READY_DIR, file), "utf8")
  const meta = parseFrontmatter(raw)
  const body = bodyWithoutFrontmatter(raw)
  const score = parseInt(meta.aiQualityScore || "0", 10)

  console.log(`\n📄 ${file}`)
  console.log(`   status: ${meta.status || "(missing)"}  score: ${score}  lang: ${meta.lang || "(none)"}`)
  console.log(`   canonicalPath: ${meta.canonicalPath || "(missing)"}`)

  if (meta.status !== "ready" || score < MIN_SCORE) {
    console.log(`   ⚠️  Not ready or score < ${MIN_SCORE} — skipped`)
    continue
  }

  if (!meta.canonicalPath) {
    console.error(`   ❌ Missing canonicalPath`)
    errors++
    continue
  }

  const cp = normalizePath(meta.canonicalPath)

  if (!cp.startsWith("/")) {
    console.error(`   ❌ canonicalPath must start with /`)
    errors++
    continue
  }

  if (/\s/.test(cp)) {
    console.error(`   ❌ canonicalPath contains whitespace`)
    errors++
    continue
  }

  if (seenPaths.has(cp)) {
    console.error(`   ❌ Duplicate canonicalPath (also in ${seenPaths.get(cp)})`)
    errors++
    continue
  }

  seenPaths.set(cp, file)
  const alt = getAlternatePath(cp)
  console.log(`   ✅ canonicalPath OK  →  alternatePath: ${alt}`)

  if (meta.renderMode === "source") {
    const sourceIssues = sourceBodyIssues(meta, body)
    if (sourceIssues.length) {
      console.error(`   ❌ Source article body failed strict checks: ${sourceIssues.join(", ")}`)
      errors += sourceIssues.length
      continue
    }
    console.log(`   ✅ source body OK  →  paragraphs: ${countParagraphs(body)}, h2: ${countMarkdownHeadings(body, 2)}`)
  }
}

console.log(`\n─── Summary ────────────────────────────────────────────────────`)
console.log(`Files: ${files.length}  |  Ready & valid: ${seenPaths.size}  |  Errors: ${errors}`)

if (errors > 0) {
  console.error(`\n❌  ${errors} error(s). Fix before building.`)
  process.exit(1)
} else {
  console.log(`\n✅  All checks passed.`)
}
