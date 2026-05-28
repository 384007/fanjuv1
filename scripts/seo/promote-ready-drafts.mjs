import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

const DRAFT_DIR = "content/seo-ai-drafts"
const READY_DIR = "content/seo-ready"
const MIN_SCORE = Number.parseInt(process.env.MIN_SCORE || "100", 10)
const GENERATED_DRAFTS_FILE = process.env.GENERATED_DRAFTS_FILE || "dist/seo/generated-drafts.json"

const dangerRe = /(Modal|NVIDIA|Gemini|Groq|Cerebras|Cloudflare|Next\.js|API|backend|后端|技术栈|Below is|Here is|markdown draft|Verified Profiles|Rating System|Secure Communication|Emergency Contact|ID verification|background checks|payment protection|已认证|评分系统|安全通信|紧急联系人|身份认证|背景调查|支付保护|本站|联系QQ|本地联系|站长|广告合作|域名出售|QQ|model|prompt|generator)/i

if (!existsSync(DRAFT_DIR)) {
  console.error(`Missing ${DRAFT_DIR}`)
  process.exit(1)
}

mkdirSync(READY_DIR, { recursive: true })

function getScore(md) {
  const match = md.match(/aiQualityScore:\s*(\d+)/)
  return match ? Number.parseInt(match[1], 10) : 0
}

function bodyForDanger(md) {
  return md
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/\n---\n\n## Draft Quality Check\n\n```json\n[\s\S]*?\n```\s*$/m, "")
}

function setStatus(md, status) {
  if (/status:\s*".*?"/.test(md)) {
    return md.replace(/status:\s*".*?"/, `status: "${status}"`)
  }
  return md.replace(/^---\n/, `---\nstatus: "${status}"\n`)
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

function getField(md, field) {
  const m = md.match(new RegExp(`^${field}:\\s*"?([^"\\n]+)"?\\s*$`, "m"))
  return m ? m[1].trim() : ""
}

let promoted = 0
let skipped = 0
const allowedFiles = generatedDraftFiles()

for (const file of readdirSync(DRAFT_DIR).filter((x) => x.endsWith(".md") && (!allowedFiles || allowedFiles.has(x)))) {
  const src = join(DRAFT_DIR, file)
  const md = readFileSync(src, "utf8")
  const score = getScore(md)
  const hasDanger = dangerRe.test(bodyForDanger(md))

  const slug = getField(md, "slug")
  if (!slug) { console.log(`SKIP: ${file} — missing slug`); skipped++; continue }

  const canonicalPath = getField(md, "canonicalPath")
  if (!canonicalPath) { console.log(`SKIP: ${file} — missing canonicalPath`); skipped++; continue }
  if (!canonicalPath.startsWith("/")) { console.log(`SKIP: ${file} — canonicalPath must start with /`); skipped++; continue }
  if (/\s/.test(canonicalPath)) { console.log(`SKIP: ${file} — canonicalPath contains whitespace`); skipped++; continue }

  // New: require lang, translationKey, alternatePath
  const lang = getField(md, "lang")
  if (!lang) { console.log(`SKIP: ${file} — missing lang (required for bilingual system)`); skipped++; continue }
  if (lang !== "zh" && lang !== "en") { console.log(`SKIP: ${file} — lang must be zh or en, got "${lang}"`); skipped++; continue }
  if (lang === "en" && !canonicalPath.startsWith("/en/")) {
    console.log(`SKIP: ${file} — lang=en but canonicalPath does not start with /en/: ${canonicalPath}`)
    skipped++
    continue
  }
  if (lang === "zh" && canonicalPath.startsWith("/en/")) {
    console.log(`SKIP: ${file} — lang=zh but canonicalPath starts with /en/: ${canonicalPath}`)
    skipped++
    continue
  }

  const translationKey = getField(md, "translationKey")
  if (!translationKey) { console.log(`SKIP: ${file} — missing translationKey (required for bilingual pairing)`); skipped++; continue }

  const alternatePath = getField(md, "alternatePath")
  if (!alternatePath) { console.log(`SKIP: ${file} — missing alternatePath (pair not ready, keep in seo-ai-drafts)`); skipped++; continue }

  if (score >= MIN_SCORE && !hasDanger) {
    const readyMd = setStatus(md, "ready")
    writeFileSync(join(READY_DIR, file), readyMd, "utf8")
    console.log(`READY: ${file} score=${score} lang=${lang} canonicalPath=${canonicalPath}`)
    promoted++
  } else {
    console.log(`SKIP: ${file} score=${score} danger=${hasDanger}`)
    skipped++
  }
}

console.log(`Promoted ${promoted}, skipped ${skipped}.`)

if (promoted === 0) {
  process.exit(0)
}
