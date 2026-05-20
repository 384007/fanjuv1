import { existsSync, mkdirSync, unlinkSync } from "fs"
import { dirname, extname } from "path"
import { abs, readJson, walk, writeJson } from "./_content-factory-runtime.mjs"
import { normalizePath } from "./_content-factory-catalog.mjs"

const INPUT_DIRS = [
  abs("content/articles/ready/index"),
  abs("content/articles/ready/noindex"),
]

const FORBIDDEN_RE = /保证脱单|保证成交|保证融资|保证收益|稳赚|必赚|100%成功|官方认证|上万人参加|合作餐厅|媒体报道|赌场|赌博|PUA|性暗示/i
const TECH_LEAK_RE = /prompt|route manifest|sitemap|Google 收录|SEO 策略|AI 生成|提示词|路由清单|站点地图/i

function textOf(article) {
  return [
    article.title,
    article.metaDescription,
    article.directAnswer,
    ...(article.sections || []).flatMap((section) => [section.h2, section.body]),
    ...(article.faq || []).flatMap((item) => [item.question, item.answer]),
  ].filter(Boolean).join("\n")
}

function lengthOf(article) {
  const text = textOf(article)
  if (article.language === "en") return text.split(/\s+/).filter(Boolean).length
  return (text.match(/[\u4e00-\u9fff]/g) || []).length
}

function scoreArticle(article, duplicateScore) {
  const text = textOf(article)
  const validLinks = article.audit?.linkAudit?.validLinks || (article.internalLinks || []).map((link) => link.url)
  const invalidLinks = article.audit?.linkAudit?.invalidLinks || []
  const length = lengthOf(article)
  const minLength = article.language === "en" ? 1200 : 1600
  const hasScenario = /饭局|小桌|饭搭子|同城|dinner|small-table|social dining/i.test(text)
  const hasBoundaries = /边界|安全|不适合|不要|public|boundary|avoid|respect/i.test(text)
  const hasSpecific = /人数|4 到 8|4 to 8|话题|适合|第一次|group size|first table/i.test(text)

  const scores = {
    searchIntentClarity: article.searchIntent && article.primaryKeyword ? 5 : 3,
    fanjuRelevance: hasScenario ? 5 : 1,
    originalValue: (article.sections || []).length >= 9 && length >= minLength ? 5 : 3,
    specificity: hasSpecific ? 5 : 3,
    aiSearchSuitability: article.directAnswer && article.entitySummary && (article.faq || []).length >= 3 ? 5 : 3,
    internalLinkSafety: invalidLinks.length === 0 && validLinks.length >= 3 ? 5 : 1,
    nonDuplication: duplicateScore < 0.82 ? 5 : 1,
    trustSafety: FORBIDDEN_RE.test(text) || TECH_LEAK_RE.test(text) ? 0 : 5,
    readability: length >= minLength ? 5 : 4,
    conversionUsefulness: (article.internalLinks || []).some((link) => ["/create", "/invite", "/how-to-find-dinner-buddies"].includes(link.url)) ? 5 : 4,
  }
  const score = Object.values(scores).reduce((sum, value) => sum + value, 0)
  const hardReject = scores.internalLinkSafety < 3 || scores.trustSafety === 0 || !hasScenario || duplicateScore >= 0.82
  const decision = hardReject ? "reject" : score >= 43 ? "index" : score >= 34 ? "noindex" : "reject"
  return {
    decision,
    score,
    scores,
    reasons: [
      `length=${length}`,
      `duplicateScore=${duplicateScore.toFixed(2)}`,
      decision === "index" ? "质量分达到 index 门槛。" : "质量、独特性或链接安全不足。",
    ],
    requiredFixes: decision === "index" ? [] : ["补充更具体场景、有效内链或独特内容后重新审核。"],
    publishable: decision !== "reject",
    sitemapEligible: decision === "index",
    robots: decision === "index" ? "index,follow" : "noindex,follow",
    finalNotes: hasBoundaries ? "包含安全和边界说明。" : "需要补充安全和边界说明。",
  }
}

function destinationFor(article, file) {
  const name = file.split("/").pop()
  if (article.status === "publish") return abs("content/articles/ready/index", name)
  if (article.status === "noindex") return abs("content/articles/ready/noindex", name)
  return abs("content/articles/rejected", name)
}

const currentPathCount = new Map()
for (const dir of INPUT_DIRS) {
  for (const file of walk(dir)) {
    if (extname(file) !== ".json") continue
    const article = readJson(file)
    const path = normalizePath(article?.canonicalPath || "")
    if (!path) continue
    currentPathCount.set(path, (currentPathCount.get(path) || 0) + 1)
  }
}

const report = {
  scanned: 0,
  index: 0,
  noindex: 0,
  reject: 0,
  scoreTotal: 0,
  items: [],
}

for (const dir of INPUT_DIRS) {
  for (const file of walk(dir)) {
    if (extname(file) !== ".json") continue
    const article = readJson(file)
    if (!article) continue
    const path = normalizePath(article.canonicalPath || "")
    const duplicateScore = (currentPathCount.get(path) || 0) > 1 ? 1 : 0.08
    const quality = scoreArticle(article, duplicateScore)
    article.audit = { ...(article.audit || {}), qualityAudit: quality }
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

    const dest = destinationFor(article, file)
    mkdirSync(dirname(dest), { recursive: true })
    writeJson(dest, article)
    if (dest !== file && existsSync(file)) {
      try { unlinkSync(file) } catch { /* non-fatal */ }
    }

    report.scanned++
    report.scoreTotal += quality.score
    report[quality.decision]++
    report.items.push({ path, decision: quality.decision, score: quality.score, file: dest.replace(`${abs()}/`, "") })
  }
}

writeJson(abs("data/seo/quality-audit-report.json"), report)
console.log(`qualityScanned=${report.scanned}`)
console.log(`index=${report.index}`)
console.log(`noindex=${report.noindex}`)
console.log(`reject=${report.reject}`)
console.log(`averageScore=${report.scanned ? (report.scoreTotal / report.scanned).toFixed(1) : "0.0"}`)
