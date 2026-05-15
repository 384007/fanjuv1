import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const INPUT = join(ROOT, "data/seo/fanju-growth-map.json")
const OUT_DIR = join(ROOT, "dist/seo")
const OUT_FILE = join(OUT_DIR, "opportunities.json")

if (!existsSync(INPUT)) {
  console.error("Missing data/seo/fanju-growth-map.json")
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })

const map = JSON.parse(readFileSync(INPUT, "utf8"))

const citySlug = {
  "北京": "beijing",
  "上海": "shanghai",
  "深圳": "shenzhen",
  "广州": "guangzhou",
  "杭州": "hangzhou",
  "成都": "chengdu",
  "重庆": "chongqing",
  "南京": "nanjing",
  "苏州": "suzhou",
  "武汉": "wuhan",
  "西安": "xian",
  "长沙": "changsha",
  "郑州": "zhengzhou",
  "天津": "tianjin",
  "青岛": "qingdao",
  "厦门": "xiamen",
  "福州": "fuzhou",
  "宁波": "ningbo",
  "合肥": "hefei",
  "佛山": "foshan",
  "东莞": "dongguan",
  "珠海": "zhuhai",
  "济南": "jinan",
  "昆明": "kunming",
  "大连": "dalian",
  "沈阳": "shenyang",
  "南宁": "nanning",
  "香港": "hong-kong",
  "澳门": "macau",
  "台北": "taipei",
  "新加坡": "singapore",
  "吉隆坡": "kuala-lumpur",
  "曼谷": "bangkok",
  "东京": "tokyo",
  "首尔": "seoul",
  "纽约": "new-york",
  "旧金山": "san-francisco",
  "洛杉矶": "los-angeles",
  "温哥华": "vancouver",
  "多伦多": "toronto",
  "伦敦": "london",
  "悉尼": "sydney",
  "墨尔本": "melbourne"
}

const personaSlug = {
  "创业者": "founder",
  "单身人士": "singles",
  "新来城市的人": "newcomer",
  "留学生": "student",
  "华人": "chinese",
  "外派人士": "expat",
  "远程工作者": "remote-worker",
  "商务人士": "business",
  "创作者": "creator",
  "女生友好饭局": "women-friendly",
  "内向者": "introvert-friendly",
  "饭搭子": "dinner-buddy"
}

// Only slugs that exist in lib/seo-data.ts categories array
const REAL_CATEGORY_SLUGS = [
  "singles-dinner",
  "curated-dinner",
  "business-dinner",
  "founder-dinner",
  "weekend-dinner",
  "stranger-dinner",
  "chinese-social-dining",
  "student-dinner",
  "newcomer-dinner",
  "local-dinner",
  "high-quality-social-dining",
]

const dinnerSlug = {
  "创业者饭局": "founder-dinner",
  "商务饭局": "business-dinner",
  "单身饭局": "singles-dinner",
  "周末饭局": "weekend-dinner",
  "陌生人饭局": "stranger-dinner",
  "华人饭局": "chinese-social-dining",
  "留学生饭局": "student-dinner",
  "新人饭局": "newcomer-dinner",
  "高端饭局": "curated-dinner",
  "dinner networking": "business-dinner",
  "social dining": "chinese-social-dining",
  "dinner buddy": "newcomer-dinner",
  "dinner gathering": "weekend-dinner",
}

const comparisonSlug = {
  "Meetup": "meetup",
  "微信群": "wechat-groups",
  "小红书": "xiaohongshu",
  "Tinder": "tinder",
  "Bumble BFF": "bumble-bff",
  "Eventbrite": "eventbrite",
  "Facebook Groups": "facebook-groups",
  "Reddit": "reddit",
  "Discord": "discord",
  "豆瓣小组": "douban-groups"
}

function cleanSlug(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function uniquePush(list, seen, item) {
  if (!item.slug || seen.has(item.slug)) return
  seen.add(item.slug)
  list.push(item)
}

function schemaFor(pageType) {
  if (pageType === "question" || pageType === "faq") return ["FAQPage", "QAPage", "BreadcrumbList"]
  if (pageType === "comparison") return ["Article", "FAQPage", "BreadcrumbList"]
  if (pageType === "template") return ["HowTo", "FAQPage", "BreadcrumbList"]
  if (pageType === "city_landing" || pageType === "persona_city") return ["WebPage", "Event", "FAQPage", "BreadcrumbList"]
  if (pageType === "definition" || pageType === "glossary") return ["DefinedTerm", "FAQPage", "BreadcrumbList"]
  return ["Article", "FAQPage", "BreadcrumbList"]
}

function priorityScore({ canonicalPath, pageType, city, persona, dinnerType }) {
  let score = 30

  if (map.priority_pages.includes(canonicalPath)) score += 60
  if (["definition", "comparison", "template", "question", "glossary"].includes(pageType)) score += 20
  if (city) score += 10
  if (persona) score += 10
  if (dinnerType) score += 10

  if (["北京", "上海", "深圳", "广州", "杭州", "成都", "重庆", "南京", "苏州", "武汉", "西安", "长沙", "郑州", "天津", "青岛", "厦门", "宁波", "佛山", "东莞"].includes(city)) score += 18
  if (["创业者", "商务人士", "饭搭子", "单身人士", "外派人士"].includes(persona)) score += 10
  if (["同城饭局", "高质量社交饭局", "周末饭局", "陌生人饭局", "新人饭局", "创业者饭局", "商务饭局", "饭搭子", "约饭", "同城聚会", "线下聚会", "dinner buddy", "social dining", "dinner gathering"].includes(dinnerType)) score += 12

  return Math.min(score, 100)
}

function internalLinksFor({ canonicalPath, city, persona, dinnerType, pageType }) {
  const links = new Set([
    "/what-is-fanju",
    "/cities",
    "/categories",
    "/faq",
  ])

  if (city && citySlug[city]) links.add(`/city/${citySlug[city]}`)
  if (dinnerType && dinnerSlug[dinnerType]) links.add(`/category/${dinnerSlug[dinnerType]}`)
  if (persona && personaSlug[persona]) links.add(`/guides/${personaSlug[persona]}-dinner-guide`)
  if (pageType === "comparison") links.add("/fanju-vs-meetup")

  links.delete(canonicalPath)
  return [...links].slice(0, 8)
}

function makeItem({ slug, title, titleZh, market = "", city = "", persona = "", dinnerType = "", pageType, intent, canonicalPath }) {
  return {
    slug,
    title,
    titleZh,
    market,
    city,
    persona,
    dinnerType,
    pageType,
    intent,
    priorityScore: priorityScore({ canonicalPath, pageType, city, persona, dinnerType }),
    canonicalPath,
    suggestedInternalLinks: internalLinksFor({ canonicalPath, city, persona, dinnerType, pageType }),
    requiredSchemaTypes: schemaFor(pageType),
    llmsSummary: `${map.brand.name} / ${map.brand.zh} page about ${title}. ${map.brand.definition_en}`
  }
}

const opportunities = []
const seen = new Set()

// P0 definition / glossary pages — only pages that actually exist as app routes
const definitions = [
  ["what-is-fanju", "What Is Fanju?", "Fanju / 饭局是什么？", "/what-is-fanju"],
]

for (const [slug, title, titleZh, path] of definitions) {
  uniquePush(opportunities, seen, makeItem({
    slug,
    title,
    titleZh,
    pageType: "definition",
    intent: "Define Fanju and the social dining category for humans and AI answer engines.",
    canonicalPath: path
  }))
}

// P1 comparison pages
for (const target of map.comparison_targets) {
  const targetSlug = comparisonSlug[target] ?? cleanSlug(target)
  const path = `/fanju-vs-${targetSlug}`
  uniquePush(opportunities, seen, makeItem({
    slug: `fanju-vs-${targetSlug}`,
    title: `Fanju vs ${target}: Dinner-First Social Dining Alternative`,
    titleZh: `Fanju / 饭局 vs ${target}：饭局优先的线下社交替代方案`,
    pageType: "comparison",
    intent: `Compare Fanju with ${target} for users looking for dinner buddies, local gatherings, and dinner networking.`,
    canonicalPath: path
  }))
}

// P2 city + dinner type pages — only real category slugs
for (const city of map.cities) {
  const c = citySlug[city] ?? cleanSlug(city)

  uniquePush(opportunities, seen, makeItem({
    slug: `${c}-social-dining`,
    title: `${city} Social Dining Guide`,
    titleZh: `${city} social dining / 饭局社交指南`,
    market: marketForCity(city),
    city,
    pageType: "city_landing",
    intent: `Help users discover Fanju dinner gatherings and dinner buddies in ${city}.`,
    canonicalPath: `/city/${c}`
  }))

  for (const catSlug of REAL_CATEGORY_SLUGS) {
    const path = `/city/${c}/${catSlug}`
    uniquePush(opportunities, seen, makeItem({
      slug: `${c}-${catSlug}`,
      title: `${city} ${catSlug.replace(/-/g, " ")} Guide`,
      titleZh: `${city}${catSlug}指南`,
      market: marketForCity(city),
      city,
      dinnerType: catSlug,
      pageType: "city_landing",
      intent: `Capture city and dinner intent for ${city} users looking for ${catSlug}.`,
      canonicalPath: path
    }))
  }
}

// P3 persona×city×category: skipped — app only has /city/[city]/[category], not /city/[city]/[persona]-[category]

// P4 templates
const templateSlugs = ["dinner-invite","business-dinner-rsvp","founder-dinner-checklist","split-bill-message","first-dinner-introduction"]
for (const slug of templateSlugs) {
  uniquePush(opportunities, seen, makeItem({
    slug: `template-${slug}`,
    title: slug.replace(/-/g, " "),
    titleZh: slug.replace(/-/g, " "),
    pageType: "template",
    intent: "Provide immediately usable social dining templates for hosts and guests.",
    canonicalPath: `/templates/${slug}`
  }))
}

// P5 questions
const questionSlugs = ["how-to-find-dinner-buddies","is-social-dining-safe","what-to-wear-to-a-fanju-dinner","how-to-host-a-dinner-gathering","how-to-split-the-bill","what-to-say-at-founder-dinner"]
for (const slug of questionSlugs) {
  uniquePush(opportunities, seen, makeItem({
    slug: `question-${slug}`,
    title: slug.replace(/-/g, " "),
    titleZh: slug.replace(/-/g, " "),
    pageType: "question",
    intent: "Answer practical user questions that AI search engines can cite directly.",
    canonicalPath: `/questions/${slug}`
  }))
}

// P6 English city pages — /en/city/{city}/{dinnerType}
const enCities = [
  ["new-york", "New York"],
  ["san-francisco", "San Francisco"],
  ["los-angeles", "Los Angeles"],
  ["london", "London"],
  ["toronto", "Toronto"],
  ["vancouver", "Vancouver"],
  ["sydney", "Sydney"],
  ["melbourne", "Melbourne"],
  ["singapore", "Singapore"],
  ["tokyo", "Tokyo"],
  ["hong-kong", "Hong Kong"],
  ["taipei", "Taipei"],
  ["bangkok", "Bangkok"],
  ["shenzhen", "Shenzhen"],
  ["shanghai", "Shanghai"],
  ["beijing", "Beijing"],
  ["guangzhou", "Guangzhou"],
  ["hangzhou", "Hangzhou"],
  ["chengdu", "Chengdu"],
]

const enDinnerTypes = [
  ["singles-dinner", "Singles Dinner", "singles"],
  ["founder-dinner", "Founder Dinner", "founders"],
  ["business-dinner", "Business Dinner", "professionals"],
  ["social-dining", "Social Dining", "social diners"],
  ["dinner-buddy", "Dinner Buddy", "dinner buddies"],
  ["weekend-dinner", "Weekend Dinner", "weekend diners"],
  ["newcomer-dinner", "Newcomer Dinner", "newcomers"],
  ["curated-dinner", "Curated Dinner", "curated dinner seekers"],
]

for (const [citySlugEn, cityName] of enCities) {
  // city landing
  uniquePush(opportunities, seen, makeItem({
    slug: `en-${citySlugEn}-social-dining`,
    title: `${cityName} Social Dining Guide`,
    titleZh: `${cityName} Social Dining Guide`,
    pageType: "city_landing",
    market: "Global",
    city: cityName,
    intent: `Help English-speaking users discover Fanju dinner gatherings and dinner buddies in ${cityName}.`,
    canonicalPath: `/en/city/${citySlugEn}`,
  }))

  for (const [dinnerSlugEn, dinnerLabel, persona] of enDinnerTypes) {
    uniquePush(opportunities, seen, makeItem({
      slug: `en-${citySlugEn}-${dinnerSlugEn}`,
      title: `${cityName} ${dinnerLabel} Guide`,
      titleZh: `${cityName} ${dinnerLabel} Guide`,
      pageType: "city_landing",
      market: "Global",
      city: cityName,
      dinnerType: dinnerLabel,
      intent: `Help ${persona} in ${cityName} find Fanju dinner gatherings and connect over shared meals.`,
      canonicalPath: `/en/city/${citySlugEn}/${dinnerSlugEn}`,
    }))
  }
}

function marketForCity(city) {
  if ([
    "北京",
    "上海",
    "深圳",
    "广州",
    "杭州",
    "成都",
    "重庆",
    "南京",
    "苏州",
    "武汉",
    "西安",
    "长沙",
    "郑州",
    "天津",
    "青岛",
    "厦门",
    "福州",
    "宁波",
    "合肥",
    "佛山",
    "东莞",
    "珠海",
    "济南",
    "昆明",
    "大连",
    "沈阳",
    "南宁"
  ].includes(city)) return "中国大陆"

  if (city === "香港") return "香港"
  if (city === "澳门") return "澳门"
  if (city === "台北") return "台湾"
  if (city === "新加坡") return "新加坡"
  if (city === "吉隆坡") return "马来西亚"
  if (city === "曼谷") return "泰国"
  if (city === "东京") return "日本"
  if (city === "首尔") return "韩国"
  if (["纽约", "旧金山", "洛杉矶"].includes(city)) return "美国"
  if (["温哥华", "多伦多"].includes(city)) return "加拿大"
  if (city === "伦敦") return "英国"
  if (["悉尼", "墨尔本"].includes(city)) return "澳洲"
  return ""
}


const cityOrder = new Map([
  ["", 0],
  ["深圳", 1],
  ["上海", 2],
  ["香港", 3],
  ["新加坡", 4],
  ["台北", 5],
  ["广州", 6],
  ["北京", 7],
  ["杭州", 8],
  ["成都", 9],
  ["东京", 10],
  ["纽约", 11],
  ["伦敦", 12],
  ["洛杉矶", 13],
  ["温哥华", 14],
  ["多伦多", 15],
  ["悉尼", 16],
  ["墨尔本", 17],
])

const pageTypeOrder = new Map([
  ["definition", 1],
  ["comparison", 2],
  ["question", 3],
  ["template", 4],
  ["glossary", 5],
  ["city_landing", 6],
  ["persona_city", 7],
  ["guide", 8],
  ["faq", 9],
])

function curatedRank(item) {
  const index = map.priority_pages.indexOf(item.canonicalPath)
  return index === -1 ? 9999 : index
}

function cityRank(city) {
  return cityOrder.get(city || "") ?? 99
}

function pageTypeRank(pageType) {
  return pageTypeOrder.get(pageType || "") ?? 99
}

function hasBadRepeatedIntent(item) {
  const slug = item.slug || ""
  return /business-business|founder-founder|singles-singles|student-student|dinner-buddy-dinner-buddy|newcomer-newcomer/.test(slug)
}

const sorted = opportunities
  .filter((item) => !hasBadRepeatedIntent(item))
  .sort((a, b) => {
    return (
      curatedRank(a) - curatedRank(b) ||
      pageTypeRank(a.pageType) - pageTypeRank(b.pageType) ||
      cityRank(a.city) - cityRank(b.city) ||
      b.priorityScore - a.priorityScore ||
      a.slug.localeCompare(b.slug)
    )
  })
  .map((item, index) => ({ rank: index + 1, ...item }))

const output = {
  generatedAt: new Date().toISOString(),
  brand: map.brand,
  count: sorted.length,
  topCount: Math.min(sorted.length, 100),
  opportunities: sorted
}

writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), "utf8")

console.log(`Generated ${sorted.length} Fanju SEO/GEO opportunities.`)
console.log("Top priority:")
for (const item of sorted.slice(0, 12)) {
  console.log(`${item.rank}. ${item.canonicalPath} — ${item.titleZh} [${item.priorityScore}]`)
}
