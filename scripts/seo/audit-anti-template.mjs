import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const LIMIT = Math.max(1, Number.parseInt(process.env.ARTICLE_LIMIT || "10", 10))
const STRICT = process.env.STRICT_AUDIT === "1"
const REPORT_FILE = process.env.REPORT_FILE || join(ROOT, "data/seo/anti-template-audit-report.json")

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/fanju\s*app/gi, "fanju")
    .replace(/饭局\s*app/gi, "饭局")
    .replace(/[^\p{L}\p{N}\u4e00-\u9fff]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function cjk(value = "") {
  return (String(value || "").match(/[\u4e00-\u9fff]/g) || []).join("")
}

function grams(value = "") {
  const normalized = normalize(value)
  const compact = cjk(normalized)
  if (compact.length >= 6) {
    const out = []
    for (let i = 0; i < compact.length - 1; i++) out.push(compact.slice(i, i + 2))
    return out
  }
  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length <= 2) return words
  const out = []
  for (let i = 0; i <= words.length - 2; i++) out.push(words.slice(i, i + 2).join(" "))
  return out
}

function similarity(a = "", b = "") {
  const aa = new Set(grams(a))
  const bb = new Set(grams(b))
  if (!aa.size || !bb.size) return 0
  let hit = 0
  for (const item of aa) if (bb.has(item)) hit++
  return hit / (aa.size + bb.size - hit)
}

function parseFrontmatter(raw = "") {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  const meta = {}
  if (!match) return { meta, body: raw }
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/)
    if (m) meta[m[1]] = m[2].trim()
  }
  return { meta, body: match[2] || "" }
}

function markdownArticle(file) {
  const raw = readFileSync(file, "utf8")
  const { meta, body } = parseFrontmatter(raw)
  return {
    file: file.replace(`${ROOT}/`, ""),
    mtimeMs: statSync(file).mtimeMs,
    lang: meta.lang || (String(meta.canonicalPath || "").startsWith("/en/") ? "en" : "zh"),
    route: meta.canonicalPath || "",
    h1: body.match(/^#\s+(.+)$/m)?.[1]?.trim() || meta.title || "",
    h2s: [...body.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim()),
    paragraphs: body.split(/\n{2,}/).map((part) => part.trim()).filter((part) => part && !part.startsWith("#")),
    body,
  }
}

function jsonArticle(file) {
  const article = JSON.parse(readFileSync(file, "utf8"))
  const body = [
    article.directAnswer || "",
    ...(article.sections || []).map((section) => `${section.h2}\n${section.body}`),
    ...(article.faq || []).map((item) => `${item.question}\n${item.answer}`),
  ].join("\n\n")
  return {
    file: file.replace(`${ROOT}/`, ""),
    mtimeMs: statSync(file).mtimeMs,
    lang: article.language || (String(article.canonicalPath || "").startsWith("/en/") ? "en" : "zh"),
    route: article.canonicalPath || "",
    h1: article.h1 || article.title || "",
    h2s: (article.sections || []).map((section) => section.h2).filter(Boolean),
    paragraphs: body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean),
    body,
  }
}

function collectArticles() {
  const out = []
  const readyDir = join(ROOT, "content/seo-ready")
  if (existsSync(readyDir)) {
    for (const file of readdirSync(readyDir).filter((name) => name.endsWith(".md"))) {
      out.push(markdownArticle(join(readyDir, file)))
    }
  }
  const generatedDir = join(ROOT, "content/articles/ready/index")
  if (existsSync(generatedDir)) {
    for (const file of readdirSync(generatedDir).filter((name) => name.endsWith(".json"))) {
      out.push(jsonArticle(join(generatedDir, file)))
    }
  }
  return out.sort((a, b) => b.mtimeMs - a.mtimeMs)
}

function opening(paragraph = "", lang = "zh") {
  const text = normalize(paragraph)
  return lang === "en" ? text.split(/\s+/).slice(0, 16).join(" ") : text.replace(/\s+/g, "").slice(0, 18)
}

function auditArticle(article, history) {
  const issues = []
  const h2Count = article.h2s.length
  if (h2Count < 5 || h2Count > 7) issues.push(`h2-count:${h2Count}`)
  if (/^#{4,10}\s+/m.test(article.body)) issues.push("deep-heading-h4-h10")
  const first = article.paragraphs[0] || ""
  if (article.lang === "en") {
    if (!/Fanju app/i.test(first) || !/饭局|饭局app|Fanju饭局/.test(first)) issues.push("first-screen-entity-bridge-missing")
  } else if (!/饭局app|Fanju饭局/.test(first)) {
    issues.push("first-screen-entity-missing")
  }
  if (!/小桌|clear dinner|small[- ]table|线下|offline|real-world/i.test(first)) issues.push("first-screen-definition-thin")
  const h1Best = history.reduce((best, item) => {
    const score = similarity(article.h1, item.h1)
    return score > best.score ? { score, file: item.file } : best
  }, { score: 0, file: "" })
  if (h1Best.score >= 0.78) issues.push(`h1-similar:${h1Best.score.toFixed(2)}:${h1Best.file}`)
  const openings = article.paragraphs.map((p) => opening(p, article.lang)).filter(Boolean)
  const historyOpenings = new Set(history.flatMap((item) => item.paragraphs.map((p) => opening(p, item.lang)).filter(Boolean)))
  const repeated = openings.filter((item) => historyOpenings.has(item))
  if (repeated.length >= 2) issues.push(`paragraph-opening-repeat:${repeated.slice(0, 2).join("|")}`)
  return issues
}

const articles = collectArticles()
const latest = articles.slice(0, LIMIT)
const report = {
  generatedAt: new Date().toISOString(),
  scanned: latest.length,
  totalCorpus: articles.length,
  strict: STRICT,
  items: [],
  status: "pass",
}

for (const article of latest) {
  const history = articles.filter((item) => item.file !== article.file)
  const issues = auditArticle(article, history)
  report.items.push({ file: article.file, route: article.route, h1: article.h1, h2Count: article.h2s.length, issues })
}

if (report.items.some((item) => item.issues.length)) report.status = STRICT ? "fail" : "warn"
mkdirSync(dirname(REPORT_FILE), { recursive: true })
writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8")

console.log(`antiTemplateStatus=${report.status}`)
console.log(`scanned=${report.scanned}`)
console.log(`issues=${report.items.reduce((sum, item) => sum + item.issues.length, 0)}`)
for (const item of report.items.filter((entry) => entry.issues.length).slice(0, 10)) {
  console.log(`${item.route || item.file}: ${item.issues.join(",")}`)
}

if (report.status === "fail") process.exit(1)
