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
const QUIET = process.env.SEO_READY_CHECK_VERBOSE !== "1"
  && (process.env.CI === "true" || process.env.CF_PAGES === "1" || process.env.QUIET_SEO_READY_CHECK === "1")
const ZH_CITY_LOCALIZED_COUNTRIES = new Set(["CN", "HK", "MO", "TW"])
let routeMetaCache = null
let routeCityNameIndexCache = null

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const meta = {}
  for (const line of match[1].split("\n")) {
    const m = line.match(/^(\w+):\s*(.*)\s*$/)
    if (!m) continue
    let value = m[2].trim()
    const quote = value[0]
    if ((quote === "\"" || quote === "'") && value.endsWith(quote)) {
      value = value.slice(1, -1)
      value = quote === "\""
        ? value.replace(/\\"/g, "\"")
        : value.replace(/\\'/g, "'")
      value = value.replace(/\\\\/g, "\\")
    }
    meta[m[1]] = value.trim()
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
  return paragraphBlocks(body)
    .length
}

function paragraphBlocks(body = "") {
  return String(body || "")
    .replace(/^#{1,10}\s+.+$/gm, "\n")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith("#") && !/^[-*]\s+/m.test(part) && !/^\d+\.\s+/m.test(part))
}

function duplicateMarkdownHeadings(body, level = 2) {
  const marker = "#".repeat(level)
  const headings = [...body.matchAll(new RegExp(`^${marker}\\s+(.+)$`, "gm"))]
    .map((m) => m[1].trim().toLowerCase())
    .filter(Boolean)
  return headings.length - new Set(headings).size
}

function duplicateMarkdownHeadingTexts(body = "") {
  const headings = markdownHeadings(body)
    .map((heading) => normalizeForTemplateCheck(heading.text))
    .filter(Boolean)
  return headings.length - new Set(headings).size
}

function duplicateParagraphs(body) {
  const paragraphs = paragraphBlocks(body)
    .map((part) => part
      .replace(/^#+\s*/, "")
      .replace(/\s+/g, "")
      .replace(/[，。,.!?！？、；;：:"'“”‘’()（）[\]【】]/g, "")
      .toLowerCase())
    .filter((part) => part.length >= 80)
  return paragraphs.length - new Set(paragraphs).size
}

function publicParagraphs(body = "") {
  return paragraphBlocks(body)
}

function markdownH1(body = "") {
  return String(body || "").match(/^#\s+(.+)$/m)?.[1]?.trim() || ""
}

function markdownHeadings(body = "") {
  return [...String(body || "").matchAll(/^(#{1,10})\s+(.+)$/gm)]
    .map((m) => ({ level: m[1].length, text: m[2].trim() }))
    .filter((item) => item.text)
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

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function stripRouteVariables(meta, value = "") {
  const routeMeta = routeMetaFor(meta) || {}
  const replacements = [
    routeMeta.cityNameLocalized,
    routeMeta.citySlug,
    String(routeMeta.citySlug || "").replace(/-/g, " "),
    routeMeta.topicNameLocalized,
    routeMeta.topicSlug,
    String(routeMeta.topicSlug || "").replace(/-/g, " "),
  ].filter(Boolean)

  let out = String(value || "")
  for (const item of replacements) out = out.replace(new RegExp(escapeRegExp(item), "gi"), " ")
  return out
    .replace(/Fanju\s*app/gi, " ")
    .replace(/Fanju\s*\/\s*饭局/gi, " ")
    .replace(/饭局\s*app/gi, " ")
    .replace(/饭局/g, " ")
}

function textFingerprint(meta, value = "", min = 60, max = 180) {
  const cleaned = stripRouteVariables(meta, value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, "")
    .trim()
  if (cleaned.length < min) return ""
  return cleaned.slice(0, max)
}

function openingFingerprint(meta, value = "") {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[，。,.!?！？、；;：:"'“”‘’()（）[\]【】]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!normalized) return ""
  if (meta.lang === "en") return normalized.split(/\s+/).slice(0, 10).join(" ")
  return normalized.replace(/\s+/g, "").slice(0, 28)
}

function repeatedOpeningIssues(meta, body = "") {
  const seen = new Map()
  const issues = []
  for (const paragraph of publicParagraphs(body)) {
    const sig = openingFingerprint(meta, paragraph)
    if (!sig || sig.length < (meta.lang === "en" ? 24 : 12)) continue
    seen.set(sig, (seen.get(sig) || 0) + 1)
  }
  for (const [sig, count] of seen.entries()) {
    if (count > 1) issues.push(`repeated-paragraph-opening:${sig.slice(0, 60)}`)
  }
  return issues.slice(0, 4)
}

function nearDuplicateParagraphIssues(meta, body = "") {
  const paragraphs = publicParagraphs(body)
  const seen = new Map()
  const issues = []
  for (let i = 0; i < paragraphs.length; i++) {
    const sig = textFingerprint(meta, paragraphs[i], meta.lang === "en" ? 140 : 80, meta.lang === "en" ? 260 : 180)
    if (!sig) continue
    if (seen.has(sig)) issues.push(`near-duplicate-paragraph:${seen.get(sig) + 1}->${i + 1}`)
    else seen.set(sig, i)
  }

  const introSig = textFingerprint(meta, paragraphs[0] || "", meta.lang === "en" ? 120 : 70, meta.lang === "en" ? 240 : 160)
  if (introSig) {
    for (let i = 1; i < paragraphs.length; i++) {
      const sig = textFingerprint(meta, paragraphs[i], meta.lang === "en" ? 120 : 70, meta.lang === "en" ? 240 : 160)
      if (sig && sig === introSig) issues.push(`intro-repeated-in-body:${i + 1}`)
    }
  }

  return issues.slice(0, 4)
}

function normalizeLatinAlias(value = "") {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function addLatinAlias(aliases, value = "") {
  const normalized = normalizeLatinAlias(value)
  if (!normalized || !/[a-z]/.test(normalized) || normalized.length < 3) return
  aliases.add(normalized)
  const compact = normalized.replace(/\s+/g, "")
  if (compact.length >= 3) aliases.add(compact)
  for (const token of normalized.split(" ")) {
    if (token.length >= 4) aliases.add(token)
  }
}

function loadRouteCityNameIndex() {
  if (routeCityNameIndexCache) return routeCityNameIndexCache
  routeCityNameIndexCache = new Map()
  if (!existsSync(MANIFEST_FILE)) return routeCityNameIndexCache
  const manifest = JSON.parse(readFileSync(MANIFEST_FILE, "utf8"))
  for (const entry of manifest.entries || []) {
    if (!entry?.citySlug) continue
    if (!routeCityNameIndexCache.has(entry.citySlug)) routeCityNameIndexCache.set(entry.citySlug, {})
    const names = routeCityNameIndexCache.get(entry.citySlug)
    if (entry.locale === "zh" && entry.cityNameLocalized) names.zh = entry.cityNameLocalized
    if (entry.locale === "en" && entry.cityNameLocalized) names.en = entry.cityNameLocalized
    if (entry.countryCode && !names.countryCode) names.countryCode = entry.countryCode
  }
  return routeCityNameIndexCache
}

function zhLatinCityAliasHits(meta, value = "") {
  if (meta.lang !== "zh") return []
  const routeMeta = routeMetaFor(meta)
  const indexEntry = loadRouteCityNameIndex().get(routeMeta?.citySlug) || {}
  const countryCode = String(routeMeta?.countryCode || indexEntry.countryCode || "CN").toUpperCase()
  if (!ZH_CITY_LOCALIZED_COUNTRIES.has(countryCode)) return []

  const aliases = new Set()
  addLatinAlias(aliases, routeMeta?.citySlug)
  addLatinAlias(aliases, String(routeMeta?.citySlug || "").replace(/-/g, " "))
  addLatinAlias(aliases, indexEntry.en)

  const haystack = ` ${normalizeLatinAlias(value)} `
  const compactHaystack = haystack.replace(/\s+/g, "")
  const hits = []
  for (const alias of aliases) {
    if (alias.includes(" ")) {
      if (haystack.includes(` ${alias} `) || compactHaystack.includes(alias.replace(/\s+/g, ""))) hits.push(alias)
    } else if (haystack.includes(` ${alias} `)) {
      hits.push(alias)
    }
  }
  return [...new Set(hits)].slice(0, 8)
}

const TOPIC_ALLOWLIST = {
  devops: ["devops", "ansible", "kubernetes", "docker", "terraform", "jenkins", "gitlab", "github", "cicd", "ci", "cd", "prometheus", "grafana", "linux", "nginx"],
  devtools: ["git", "github", "gitlab", "webpack", "vite", "eslint", "typescript", "javascript", "python", "rust", "docker", "kubernetes", "devops", "npm", "pnpm", "react", "vue", "node", "linux", "vscode", "terraform", "prometheus", "grafana", "jenkins", "ansible", "nginx"],
  tech: ["git", "github", "gitlab", "typescript", "javascript", "python", "rust", "docker", "kubernetes", "devops", "npm", "react", "vue", "node", "linux", "redis", "postgres", "mysql"],
}

function topicAllowedWords(topicSlug = "") {
  const extra = new Set()
  for (const [key, words] of Object.entries(TOPIC_ALLOWLIST)) {
    if (String(topicSlug || "").includes(key)) words.forEach((w) => extra.add(w))
  }
  return extra
}

function latinNoiseInZhHeading(value = "", topicSlug = "") {
  const allowed = new Set(["fanju", "app", "ai", "vc", "ceo", "cfo", "cto", "coo", "mba", "pm", "ip", "bd"])
  for (const w of topicAllowedWords(topicSlug)) allowed.add(w)
  return [...String(value || "").matchAll(/[A-Za-z][A-Za-z-]{2,}/g)]
    .map((m) => m[0].toLowerCase())
    .filter((word) => !allowed.has(word))
}

function zhHeadingLatinNoise(body = "", topicSlug = "") {
  const headings = [...String(body || "").matchAll(/^#{1,10}\s+(.+)$/gm)]
    .map((m) => m[1].trim())
    .filter(Boolean)
  const words = new Set()
  for (const heading of headings) {
    for (const word of latinNoiseInZhHeading(heading, topicSlug)) words.add(word)
  }
  return [...words]
}

function malformedHeadingIssues(body = "") {
  return String(body || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^#{1,6}\s+#{1,6}\s+/.test(line))
    .map((line) => line.slice(0, 80))
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
      const genericEnPattern = [
        /^who (is|should|can)\b/,
        /^who .*suitable for\b/,
        /^the core .*scenario\b/,
        /^choosing the right\b/,
        /^host (reliability|trust|quality) cues\b/,
        /^comfort boundaries\b/,
        /^decision criteria\b/,
        /^practical questions\b/,
        /^who it suits\b/,
        /^what to expect\b/,
        /^how (the|a) .*works\b/,
        /^judging (the )?host\b/,
        /^safety\b/,
        /^safety boundaries\b/,
        /^boundaries\b/,
        /^when not to join\b/,
        /^a practical first step\b/,
        /^building lasting connections\b/,
        /^embracing the unknown\b/,
        /^next steps\b/,
        /^conclusion\b/,
      ].some((pattern) => pattern.test(normalized))
      const genericZhPattern = (
        compact.startsWith("适合谁") ||
        compact.startsWith("核心饭局场景") ||
        compact.startsWith("安全重点") ||
        compact.startsWith("一桌饭") ||
        compact.startsWith("主理人信号") ||
        compact.startsWith("主理人的信号") ||
        compact.startsWith("舒适边界") ||
        compact.startsWith("下一步行动") ||
        compact.startsWith("如何判断") ||
        (compact.includes("边界") && compact.includes("安全")) ||
        compact.startsWith("什么情况不适合") ||
        compact.startsWith("一个实际的第一步") ||
        compact.startsWith("结语")
      )
      return genericEn.has(normalized) || genericZh.has(compact) || genericEnPattern || genericZhPattern || isTemplateTitle(meta, heading)
    })
    .map((heading) => heading.slice(0, 80))
}

function sourceBodyIssues(meta, body) {
  const issues = []
  const lang = meta.lang === "en" ? "en" : "zh"
  const haystack = `${meta.title || ""}\n${meta.description || ""}\n${body}`
  const h1 = markdownH1(body) || meta.title || ""
  const routeMeta = routeMetaFor(meta)
  const badPatterns = [
    /\bGroq\b/i,
    /\bCerebras\b/i,
    /\bCloudflare AI\b/i,
    /\bCloudflare\b/i,
    /\bGemini API\b/i,
    /\bNvidia API\b/i,
    /\bNVIDIA NIM\b/i,
    /\bautomation pipeline\b/i,
    /\bcron\s+job\b/i,
    /\bJSONL\b/,
    /\bModal\.com\b/i,
    /\bCloudflare\s+D1\b/i,
    /\bCloudflare\s+R2\b/i,
    /\bprompt\s*bank\b/i,
    /\brandom\s+prompt\b/i,
    /\bgenerated by AI\b/i,
    /\bgenerated by\b/i,
    /\broute manifest\b/i,
    /\bbodyHash\b/,
    /\bpromptHash\b/,
    /\bprofileHash\b/,
    /\bSEO script\b/i,
    /\binternal metadata\b/i,
    /\bworker pipeline\b/i,
    /\b(?:system\s+prompt|prompt\s+bank|prompt\s+hash|random\s+prompt|user\s*prompt|promptHash|promptId)\b/i,
    /^Here is\b/i,
    /^Below is\b/i,
    /\bmarkdown draft\b/i,
    /\bmarkdown link\b/i,
    /\bspecified page\b/i,
    /\bprovided rules\b/i,
    /\bIntro paragraph mentioning\b/i,
    /\bReturn valid JSON\b/i,
    /\bBody requirements\b/i,
    /\bmarkdown skeleton\b/i,
    /\bDraft Quality Check\b/i,
    /\bAI-readable summary\b/i,
    /\bSummary for AI Search Engines\b/i,
    /\bRelated Fanju Pages\b/i,
    /<a\s+href/i,
    /\bhref\s*=/i,
    /\[[^\]]+\]\([^)]+\)/,
    /https?:\/\/fanju\.app\/\S+/i,
    /\bwebmaster\b/i,
    /domain\s+for\s+sale/i,
    /advertising\s+cooperation/i,
    /parked\s+domain/i,
    /local\s+contact/i,
    /提示词/,
    /路由清单/,
    /发布流水线/,
    /定时任务/,
    /内部 ?metadata/i,
    /本站/,
    /联系QQ/i,
    /本地联系/,
    /站长/,
    /广告合作/,
    /域名出售/,
    /开头段落/,
    /正文要求/,
    /只返回合法 JSON/,
    /模型(输出|生成|推理|训练)/,
    /后台系统/,
    /后台管理/,
    /技术栈/,
    /自动化(脚本|部署|流水线|发布|生成)/,
  ]

  for (const pattern of badPatterns) {
    if (String(routeMeta?.topicSlug || "").includes("devops") && String(pattern) === "/自动化(脚本|部署|流水线|发布|生成)/") continue
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
  if (lang === "zh" && !/(饭局|饭搭子|Fanju)/i.test(meta.title || "")) issues.push("title-missing-core-keyword")
  if (lang === "en" && !/Fanju app/i.test(h1)) issues.push("h1-missing-primary-keyword:fanju-app")
  if (lang === "zh" && !/(饭局|饭搭子|Fanju)/i.test(h1)) issues.push("h1-missing-core-keyword")
  if (!includesRouteCity(meta, meta.title || "")) issues.push("title-missing-city")
  if (!includesRouteCity(meta, h1)) issues.push("h1-missing-city")
  if (!includesRouteCity(meta, meta.description || "")) issues.push("description-missing-city")
  const zhCityAliases = zhLatinCityAliasHits(meta, haystack)
  if (zhCityAliases.length) {
    issues.push(`pinyin-city-name-in-zh-public-text:${zhCityAliases.join("|")}`)
  }
  if (lang === "zh") {
    const titleNoise = latinNoiseInZhHeading(meta.title || "", routeMeta?.topicSlug)
    const h1Noise = latinNoiseInZhHeading(h1, routeMeta?.topicSlug)
    const headingNoise = zhHeadingLatinNoise(body, routeMeta?.topicSlug)
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
  if (duplicateMarkdownHeadingTexts(body) > 0) issues.push("duplicate-heading")
  if (duplicateParagraphs(body) > 0) issues.push("duplicate-paragraphs")
  issues.push(...repeatedOpeningIssues(meta, body))
  issues.push(...nearDuplicateParagraphIssues(meta, body))

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
  const malformedHeadings = malformedHeadingIssues(body)
  if (malformedHeadings.length > 0) issues.push(`malformed-heading:${malformedHeadings.join("|")}`)

  return issues
}

if (!existsSync(READY_DIR)) {
  console.error(`❌  content/seo-ready not found at ${READY_DIR}`)
  process.exit(1)
}

const requestedFiles = (process.env.SEO_READY_FILES || "")
  .split(",")
  .map((file) => file.trim().replace(/^content\/seo-ready\//, ""))
  .filter(Boolean)
const allReadyFiles = readdirSync(READY_DIR).filter((f) => f.endsWith(".md")).sort()
const missingRequestedFiles = requestedFiles.filter((f) => !existsSync(join(READY_DIR, f)))
const files = requestedFiles.length
  ? requestedFiles.filter((f) => f.endsWith(".md") && existsSync(join(READY_DIR, f)))
  : allReadyFiles
if (files.length === 0) {
  console.warn("⚠️  No .md files in content/seo-ready/")
}

let errors = 0
let skipped = 0
const seenPaths = new Map()

if (missingRequestedFiles.length) {
  console.error(`   ❌ Missing requested SEO_READY_FILES: ${missingRequestedFiles.join(", ")}`)
  errors += missingRequestedFiles.length
}

for (const file of files) {
  const raw = readFileSync(join(READY_DIR, file), "utf8")
  const meta = parseFrontmatter(raw)
  const body = bodyWithoutFrontmatter(raw)
  const score = parseInt(meta.aiQualityScore || "0", 10)

  if (!QUIET) {
    console.log(`\n📄 ${file}`)
    console.log(`   status: ${meta.status || "(missing)"}  score: ${score}  lang: ${meta.lang || "(none)"}`)
    console.log(`   canonicalPath: ${meta.canonicalPath || "(missing)"}`)
  }

  if (meta.status !== "ready" || score < MIN_SCORE) {
    skipped++
    if (!QUIET) console.log(`   ⚠️  Not ready or score < ${MIN_SCORE} — skipped`)
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
  if (!QUIET) console.log(`   ✅ canonicalPath OK  →  alternatePath: ${alt}`)

  if (meta.renderMode === "source") {
    const sourceIssues = sourceBodyIssues(meta, body)
    if (sourceIssues.length) {
      console.error(`   ❌ Source article body failed strict checks in content/seo-ready/${file}: ${sourceIssues.join(", ")}`)
      errors += sourceIssues.length
      continue
    }
    if (!QUIET) console.log(`   ✅ source body OK  →  paragraphs: ${countParagraphs(body)}, h2: ${countMarkdownHeadings(body, 2)}`)
  }
}

console.log(`\n─── Summary ────────────────────────────────────────────────────`)
console.log(`Files: ${files.length}  |  Ready & valid: ${seenPaths.size}  |  Skipped: ${skipped}  |  Errors: ${errors}`)

if (errors > 0) {
  console.error(`\n❌  ${errors} error(s). Fix before building.`)
  process.exit(1)
} else {
  console.log(`\n✅  All checks passed.`)
}
