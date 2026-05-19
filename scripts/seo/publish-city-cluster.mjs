import { spawnSync } from "child_process"
import { createHash } from "crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const MANIFEST_FILE = join(ROOT, "data/seo/route-manifest.json")
const OUT_DIR = join(ROOT, "dist/seo/city-clusters")

const CITY = cleanSlug(process.env.CITY || "")
const LANG = (process.env.LANG || "zh").toLowerCase() === "en" ? "en" : "zh"
const TOPICS = (process.env.TOPICS || "")
  .split(",")
  .map((topic) => cleanSlug(topic))
  .filter(Boolean)
const MIN_SCORE = Number.parseInt(process.env.MIN_SCORE || "90", 10)

function cleanSlug(value = "") {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "")
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex")
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8",
    ...options,
  })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  return result
}

function requireOk(result, label) {
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status || 1}`)
  }
}

function loadManifest() {
  requireOk(run("node", ["scripts/seo/build-route-manifest.mjs"]), "build-route-manifest")
  if (!existsSync(MANIFEST_FILE)) throw new Error(`Missing ${MANIFEST_FILE}`)
  const manifest = JSON.parse(readFileSync(MANIFEST_FILE, "utf8"))
  if (!Array.isArray(manifest.entries)) throw new Error("route-manifest.json has no entries")
  return manifest
}

function routeFor(topicSlug) {
  if (topicSlug === "city-overview") return LANG === "en" ? `/en/city/${CITY}` : `/city/${CITY}`
  return LANG === "en" ? `/en/city/${CITY}/${topicSlug}` : `/city/${CITY}/${topicSlug}`
}

function systemInstruction(locale) {
  return locale === "en"
    ? [
        "Write one public Fanju city article as valid JSON only.",
        "Voice: human, practical, city-specific, calm.",
        "Never mention tools, production process, AI, prompt, provider, model, pipeline, worker, cron, D1, R2, Modal, Cloudflare, JSONL, hash, or generated.",
        "Never write Markdown links, raw URLs, href attributes, or HTML anchor tags. Mention page names as plain text only.",
        "Return exactly one JSON object and nothing else.",
      ].join("\n")
    : [
        "只写一个公开的饭局 Fanju 城市文章，输出必须是合法 JSON。",
        "声音：自然、具体、平静、实用。",
        "不要提及工具、后台、AI、prompt、提示词、provider、模型、pipeline、worker、cron、D1、R2、Modal、Cloudflare、JSONL、哈希或生成。",
        "不要写 Markdown 链接、裸 URL、href 或 HTML a 标签。可以提到页面名称，但不要写链接。",
        "只返回一个 JSON object，不要额外说明。",
      ].join("\n")
}

function userPrompt(entry) {
  if (entry.locale === "en") {
    return [
      `Write a high-quality long-form English article for route ${entry.route}.`,
      `City: ${entry.cityNameLocalized}. Topic: ${entry.topicNameLocalized}.`,
      `Title format: ${entry.cityNameLocalized} ${entry.topicNameLocalized} Guide. Put "Fanju app" in description and the first 120 words with the city name.`,
      "Quality: practical editorial guide, not a landing page. Include city rhythm, attendee concerns, host signals, safety context, and decision criteria.",
      "Linking rule: do not include [text](/path), https://fanju.app paths, raw URLs, <a href=\"...\">, the words markdown link, or any href.",
      `Body requirements: 4,200-6,200 characters; at least 12 natural paragraphs; blank lines between paragraphs; at least these H2 headings:\n## What is Fanju?\n## Who this page is for\n## How to join a ${entry.topicNameLocalized} in ${entry.cityNameLocalized}\n## How to assess safety and trust\n## How Fanju differs from social and dating apps\n## FAQ`,
      'Return valid JSON only, no code fence: {"title":"...","description":"...","body":"...","slug":"...","locale":"en"}',
    ].join("\n")
  }
  return [
    `为路由 ${entry.route} 写一篇高质量中文长文。`,
    `城市：${entry.cityNameLocalized}。主题：${entry.topicNameLocalized}。`,
    `标题格式：${entry.cityNameLocalized}${entry.topicNameLocalized}指南。description、正文前 200 字必须自然出现「饭局app」和「${entry.cityNameLocalized}」。`,
    "质量：像真实城市饭局指南，不像落地页。写出城市节奏、同桌人数、报名前顾虑、主理人信号、安全判断、报名建议。",
    "链接规则：不要出现 [文字](/path)、https://fanju.app 路径、裸 URL、<a href=\"...\">、markdown link 或任何 href。",
    `正文要求：3,800-5,800 字符；至少 12 个自然段；段落之间空行；至少使用这些 H2：\n## Fanju / 饭局app 是什么\n## 这个页面适合谁\n## 在${entry.cityNameLocalized}如何参加${entry.topicNameLocalized}\n## 如何判断安全和信任\n## 和普通社交/约会软件有什么不同\n## 常见问题`,
    '只返回合法 JSON，不要代码块：{"title":"...","description":"...","body":"...","slug":"...","locale":"zh"}',
  ].join("\n")
}

function promptFor(entry, index) {
  const system = systemInstruction(entry.locale)
  const prompt = userPrompt(entry)
  const profileKey = `${entry.route}|${entry.locale}|${entry.topicSlug}|city-cluster`
  return {
    promptId: `fanju-city-cluster-${LANG}-${CITY}-${String(index + 1).padStart(3, "0")}`,
    seed: `${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${CITY}-${entry.topicSlug}`,
    locale: entry.locale,
    citySlug: entry.citySlug,
    cityNameLocalized: entry.cityNameLocalized,
    topicSlug: entry.topicSlug,
    topicNameLocalized: entry.topicNameLocalized,
    route: entry.route,
    routeExistsInManifest: true,
    angle: { id: "city_cluster", name: "City cluster completion", instruction: "Complete a safe city article cluster with no body links." },
    structure: "city_cluster",
    openingStyle: "direct_city_need",
    faqMode: "faq_end",
    ctaPosition: "no_hard_cta",
    exampleType: "city_cluster_example",
    tone: entry.locale === "en" ? "practical" : "实用",
    titlePattern: "city_first",
    systemInstruction: system,
    userPrompt: prompt,
    promptHash: sha256Hex(`${system}\n---\n${prompt}`),
    profileHash: sha256Hex(profileKey),
  }
}

function parseCheckerOutput(output = "") {
  const results = []
  for (const line of String(output || "").split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed.startsWith("{")) continue
    try {
      results.push(JSON.parse(trimmed))
    } catch {
      // ignore non-JSON status lines
    }
  }
  return results
}

async function main() {
  if (!CITY) throw new Error("CITY is required")
  if (!TOPICS.length) throw new Error("TOPICS is required")

  const manifest = loadManifest()
  const wantedTopics = ["city-overview", ...TOPICS]
  const wantedRoutes = wantedTopics.map(routeFor)
  const entries = wantedRoutes.map((route) => {
    const entry = manifest.entries.find((item) => item.locale === LANG && item.route === route && item.enabled === true)
    if (!entry) throw new Error(`Route not found in candidate manifest: ${route}`)
    return entry
  })

  mkdirSync(OUT_DIR, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, "-")
  const promptBank = join(OUT_DIR, `${LANG}-${CITY}-${stamp}.jsonl`)
  const publishedFile = `dist/seo/city-clusters/${LANG}-${CITY}-${stamp}-published.json`
  const failedFile = `dist/seo/city-clusters/${LANG}-${CITY}-${stamp}-failed.json`

  writeFileSync(promptBank, entries.map((entry, index) => JSON.stringify(promptFor(entry, index))).join("\n") + "\n", "utf8")

  const publish = run("pnpm", ["seo:prompt-bank:cloudflare"], {
    stdio: "pipe",
    env: {
      ...process.env,
      PROMPT_BANK_FILE: promptBank.replace(`${ROOT}/`, ""),
      PUBLISHED_FILE: publishedFile,
      FAILED_LOG_FILE: failedFile,
      RUN_LIMIT: String(entries.length),
      ONLY_LOCALE: LANG,
      MIN_SCORE: String(MIN_SCORE),
      QUALITY_ATTEMPTS: process.env.QUALITY_ATTEMPTS || "4",
      BATCH_SIZE: "1",
      CONCURRENCY: process.env.CONCURRENCY || "1",
      RATE_DELAY_MS: process.env.RATE_DELAY_MS || "1500",
    },
  })

  const publishedPath = join(ROOT, publishedFile)
  const failedPath = join(ROOT, failedFile)
  const published = existsSync(publishedPath) ? JSON.parse(readFileSync(publishedPath, "utf8")) : { drafts: [] }
  const failed = existsSync(failedPath) ? JSON.parse(readFileSync(failedPath, "utf8")) : { drafts: [] }
  const ready = (published.drafts || []).filter((entry) => entry.status === "ready" && wantedRoutes.includes(entry.route))
  const readyRoutes = ready.map((entry) => entry.route)

  let checkerResults = []
  if (readyRoutes.length) {
    const checker = run("node", ["scripts/seo/check-live-article-content.mjs"], {
      stdio: "pipe",
      env: {
        ...process.env,
        BASE_URL: process.env.BASE_URL || "https://fanju.app",
        URLS: readyRoutes.join(","),
      },
    })
    checkerResults = parseCheckerOutput(`${checker.stdout || ""}\n${checker.stderr || ""}`)
  }

  const badLinks = checkerResults.flatMap((result) =>
    (result.badInternalLinks || []).map((link) => ({ page: result.url, ...link })),
  )
  const summary = {
    city: CITY,
    lang: LANG,
    ready: readyRoutes,
    failed: (failed.drafts || []).map((entry) => ({ route: entry.route, status: entry.status, error: entry.error, issues: entry.issues })),
    routes: wantedRoutes,
    badLinks,
    publishedFile,
    failedFile,
  }

  console.log(JSON.stringify(summary, null, 2))
  if (publish.status !== 0 || readyRoutes.length !== wantedRoutes.length || badLinks.length) process.exit(1)
}

main().catch((err) => {
  console.error(err?.message || String(err))
  process.exit(1)
})
