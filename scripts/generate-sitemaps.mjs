/**
 * scripts/generate-sitemaps.mjs
 * Run before `next build` to generate all sitemap XML files into public/.
 * Usage: node scripts/generate-sitemaps.mjs
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")
const PUBLIC = join(ROOT, "public")
const SITE = "https://fanju.app"
// Use a fixed default lastmod instead of today's date to avoid
// telling Google every URL was "updated" on every build.
// Update this date only when content actually changes.
const DEFAULT_LASTMOD = "2026-05-11"
const TODAY = DEFAULT_LASTMOD

// ─── Data (mirrors lib/seo-data.ts) ──────────────────────────────────────────
// We duplicate slugs here so the script has zero TS/Next.js dependencies.

const cities = [
  "shenzhen","guangzhou","shanghai","beijing","hangzhou","chengdu",
  "xiamen","changsha","nanjing","suzhou","wuhan","chongqing",
  "xian","qingdao","zhengzhou","foshan","dongguan","zhuhai","tianjin","ningbo",
  "new-york","san-francisco","los-angeles","vancouver","toronto",
  "london","tokyo","sydney","melbourne","singapore","hong-kong","taipei",
]

const categories = [
  "singles-dinner","curated-dinner","business-dinner","founder-dinner",
  "dinner-buddy",
  "weekend-dinner","stranger-dinner","chinese-social-dining",
  "student-dinner","newcomer-dinner","local-dinner","high-quality-social-dining",
]

const questions = [
  "what-is-fanju","how-to-join-dinner","is-fanju-safe",
  "which-cities-open-first","singles-dinner-worth-it",
  "business-dinner-vs-networking","what-to-prepare-before-dinner",
  "does-fanju-show-real-counts",
]

const questionPages = [
  "how-to-find-dinner-buddies","is-social-dining-safe",
  "what-to-wear-to-a-fanju-dinner","how-to-host-a-dinner-gathering",
  "how-to-split-the-bill","what-to-say-at-founder-dinner",
]

const templatePages = [
  "dinner-invite","business-dinner-rsvp","founder-dinner-checklist",
  "split-bill-message","first-dinner-introduction",
]

const guides = [
  "mainland-city-dinner-guide","singles-dinner-guide","business-dinner-guide",
  "weekend-dinner-guide","newcomer-dinner-guide","curated-dinner-guide",
  "host-recruitment-guide",
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function url(loc, changefreq, priority, lastmod = TODAY) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
}

function sitemap(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`
}

function write(filename, content) {
  const path = join(PUBLIC, filename)
  writeFileSync(path, content, "utf8")
  console.log(`✓ ${filename}`)
}

// ─── 1. Main SEO sitemap ──────────────────────────────────────────────────────

const staticPages = [
  ["/",                "daily",   "1.00"],
  ["/cities",          "weekly",  "0.90"],
  ["/categories",      "weekly",  "0.90"],
  ["/what-is-fanju",   "weekly",  "0.88"],
  ["/what-is-social-dining", "weekly", "0.88"],
  ["/what-is-dinner-buddy", "weekly", "0.88"],
  ["/what-is-fandazi", "weekly", "0.86"],
  ["/dinner-gathering-platform", "weekly", "0.86"],
  ["/faq",             "weekly",  "0.86"],
  ["/press",           "monthly", "0.82"],
  ["/social-dining",   "weekly",  "0.88"],
  ["/china-social-dining", "weekly", "0.86"],
  ["/hong-kong-social-dining", "weekly", "0.84"],
  ["/taiwan-social-dining", "weekly", "0.84"],
  ["/macau-social-dining", "weekly", "0.82"],
  ["/singapore-social-dining", "weekly", "0.86"],
  ["/southeast-asia-social-dining", "weekly", "0.84"],
  ["/bangkok-social-dining", "weekly", "0.82"],
  ["/tokyo-social-dining", "weekly", "0.84"],
  ["/kuala-lumpur-social-dining", "weekly", "0.82"],
  ["/seoul-social-dining", "weekly", "0.82"],
  ["/dinner-gathering-app", "weekly", "0.88"],
  ["/dinner-buddy-app", "weekly", "0.88"],
  ["/local-gatherings", "weekly", "0.86"],
  ["/ai-social-dining", "weekly", "0.86"],
  ["/fanju-vs-meetup", "monthly", "0.78"],
  ["/fanju-vs-tinder", "monthly", "0.78"],
  ["/fanju-vs-xiaohongshu", "monthly", "0.78"],
  ["/fanju-vs-wechat-groups", "monthly", "0.78"],
  ["/how-to-host-a-dinner-gathering", "monthly", "0.82"],
  ["/how-to-find-dinner-buddies", "monthly", "0.82"],
  ["/business-dinner-networking", "weekly", "0.84"],
  ["/startup-founder-dinners", "weekly", "0.84"],
  ["/private-dinner-club", "weekly", "0.82"],
  ["/safety", "monthly", "0.84"],
  ["/rules",           "monthly", "0.80"],
  ["/hosts",           "weekly",  "0.85"],
  ["/features",        "weekly",  "0.85"],
  ["/templates",       "weekly",  "0.80"],
  ["/create",          "weekly",  "0.88"],
  ["/invite",          "weekly",  "0.85"],
  ["/explore",         "weekly",  "0.85"],
  ["/rsvp",            "weekly",  "0.82"],
  ["/host-console",    "weekly",  "0.82"],
  // English mirrors
  ["/en/cities",       "weekly",  "0.88"],
  ["/en/categories",   "weekly",  "0.88"],
  ["/en/what-is-fanju","weekly",  "0.85"],
  ["/en/features",     "weekly",  "0.82"],
]

const seoUrls = [
  ...staticPages.map(([path, freq, pri]) => url(`${SITE}${path}`, freq, pri)),

  // /city/{city}
  ...cities.map((c) => url(`${SITE}/city/${c}`, "weekly", "0.85")),
  // /category/{category}
  ...categories.map((c) => url(`${SITE}/category/${c}`, "weekly", "0.85")),
  // /city/{city}/{category}
  ...cities.flatMap((c) => categories.map((cat) => url(`${SITE}/city/${c}/${cat}`, "monthly", "0.70"))),

  // /en/city/{city}
  ...cities.map((c) => url(`${SITE}/en/city/${c}`, "weekly", "0.82")),
  // /en/category/{category}
  ...categories.map((c) => url(`${SITE}/en/category/${c}`, "weekly", "0.82")),
  // /en/city/{city}/{category}
  ...cities.flatMap((c) => categories.map((cat) => url(`${SITE}/en/city/${c}/${cat}`, "monthly", "0.68"))),

  // /q/{question}
  ...questions.map((q) => url(`${SITE}/q/${q}`, "monthly", "0.80")),
  // /guides/{guide}
  ...guides.map((g) => url(`${SITE}/guides/${g}`, "monthly", "0.80")),
  // /questions/{question}
  ...questionPages.map((q) => url(`${SITE}/questions/${q}`, "monthly", "0.82")),
  // /templates/{template}
  ...templatePages.map((t) => url(`${SITE}/templates/${t}`, "monthly", "0.80")),

  // /en/q/{question}
  ...questions.map((q) => url(`${SITE}/en/q/${q}`, "monthly", "0.78")),
  // /en/guides/{guide}
  ...guides.map((g) => url(`${SITE}/en/guides/${g}`, "monthly", "0.78")),

  // /en/features/{feature}
  ...["one-link-invite","rsvp-tracking","guest-list","text-blast","date-poll",
      "guest-questions","chip-in","photo-album","public-events","singles-matching",
  ].map((f) => url(`${SITE}/en/features/${f}`, "monthly", "0.75")),
]

// ─── Ready article URLs ───────────────────────────────────────────────────────
// Only include URLs that have a dedicated ready article with canonicalPath
// pointing to that exact URL. Do NOT include derived alternate paths unless
// a separate ready file exists for them. This prevents redirect aliases and
// fallback-rendered pages from appearing in the sitemap.

const READY_DIR = join(ROOT, "content/seo-ready")
const REMEDIATED_DIR = join(ROOT, "content/seo-remediated")
const GENERATED_INDEX_DIR = join(ROOT, "content/articles/ready/index")
const MIN_SCORE = 90

function parseReadyFrontmatter(raw) {
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

function normalizeSitemapPath(p) {
  if (!p) return ""
  const n = p.startsWith("/") ? p : `/${p}`
  return n.endsWith("/") && n.length > 1 ? n.slice(0, -1) : n
}

const readyArticleUrls = []
const seenReadyArticleUrls = new Set()
if (existsSync(READY_DIR)) {
  for (const file of readdirSync(READY_DIR).filter((f) => f.endsWith(".md"))) {
    const raw = readFileSync(join(READY_DIR, file), "utf8")
    const meta = parseReadyFrontmatter(raw)
    const score = parseInt(meta.aiQualityScore || "0", 10)
    if (meta.status !== "ready" || score < MIN_SCORE) continue

    const cp = normalizeSitemapPath(meta.canonicalPath || `/${meta.slug || file.replace(/\.md$/, "")}`)
    if (!cp || seenReadyArticleUrls.has(cp)) continue
    seenReadyArticleUrls.add(cp)
    readyArticleUrls.push(cp)
  }
}

// Scan high-quality remediated articles (unique, locally rich content for AI/SEO priority)
if (existsSync(REMEDIATED_DIR)) {
  for (const file of readdirSync(REMEDIATED_DIR).filter((f) => f.endsWith(".md"))) {
    const raw = readFileSync(join(REMEDIATED_DIR, file), "utf8")
    const meta = parseReadyFrontmatter(raw)
    // Remediated articles are manually de-templated + locally enriched per v2 Checklist.
    // They are the highest-signal content for Chinese AI search and long-tail.
    // Include as long as status: ready (ignore missing aiQualityScore).
    if (meta.status !== "ready") continue

    const cp = normalizeSitemapPath(meta.canonicalPath || `/${meta.slug || file.replace(/\.md$/, "")}`)
    if (!cp || seenReadyArticleUrls.has(cp)) continue
    seenReadyArticleUrls.add(cp)
    readyArticleUrls.push(cp)
  }
}

if (existsSync(GENERATED_INDEX_DIR)) {
  for (const file of readdirSync(GENERATED_INDEX_DIR).filter((f) => f.endsWith(".json"))) {
    let article
    try {
      article = JSON.parse(readFileSync(join(GENERATED_INDEX_DIR, file), "utf8"))
    } catch {
      continue
    }
    if (article.status !== "publish" || article.robots !== "index,follow" || article.sitemapEligible === false) continue
    const cp = normalizeSitemapPath(article.canonicalPath || "")
    if (!cp || seenReadyArticleUrls.has(cp)) continue
    seenReadyArticleUrls.add(cp)
    readyArticleUrls.push(cp)
  }
}

// Merge ready + remediated article URLs into seoUrls, deduplicating
// Remediated articles (unique local deep content) get slightly higher priority for GSC/Bing + AI engines
const existingLocs = new Set(seoUrls.map((u) => {
  const m = u.match(/<loc>([^<]+)<\/loc>/)
  return m ? m[1] : ""
}))
for (const path of readyArticleUrls) {
  const loc = `${SITE}${path}`
  if (!existingLocs.has(loc)) {
    seoUrls.push(url(loc, "monthly", "0.75"))
    existingLocs.add(loc)
  }
}

write("sitemap.xml", sitemap(seoUrls))

// ─── 2. Product sitemap ───────────────────────────────────────────────────────

const productPages = [
  ["/create",          "weekly",  "0.90"],
  ["/invite",          "weekly",  "0.88"],
  ["/explore",         "weekly",  "0.88"],
  ["/rsvp",            "weekly",  "0.86"],
  ["/host-console",    "weekly",  "0.86"],
  ["/features",        "weekly",  "0.90"],
  ["/templates",       "weekly",  "0.84"],
  ["/guests",          "weekly",  "0.82"],
  ["/polls",           "weekly",  "0.82"],
  ["/photos",          "weekly",  "0.82"],
  ["/questions",       "weekly",  "0.82"],
  ["/table",           "weekly",  "0.82"],
  ["/matching",        "weekly",  "0.82"],
  ["/cohosts",         "weekly",  "0.82"],
  ["/reminders",       "weekly",  "0.82"],
  ["/comments",        "weekly",  "0.82"],
  ["/capacity",        "weekly",  "0.82"],
  ["/calendar",        "weekly",  "0.82"],
  ["/checkin",         "weekly",  "0.82"],
  ["/visibility",      "weekly",  "0.82"],
  ["/feedback",        "weekly",  "0.82"],
]

write("product-sitemap.xml", sitemap(productPages.map(([p, f, pri]) => url(`${SITE}${p}`, f, pri))))

// ─── 3. Sitemap index ─────────────────────────────────────────────────────────

const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE}/sitemap.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE}/product-sitemap.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
</sitemapindex>
`
write("sitemap-index.xml", sitemapIndex)

// ─── Done ─────────────────────────────────────────────────────────────────────
const total = seoUrls.length + productPages.length
console.log(`\n✅  Generated ${total} URLs across 3 sitemap files.`)
console.log(`   (Includes ready + ${REMEDIATED_DIR ? 'seo-remediated (high-signal local content)' : 'no remediated'} for GSC/Bing discoverability)`)
