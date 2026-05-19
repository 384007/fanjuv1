export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url)
    const slug = requestUrl.pathname.replace(/^\/+/, "").replace(/\/+$/, "")
    if (slug && env.FANJU_DB) {
      const direct = await findReadyArticle(slug, env)
      const directResponse = await articleResponse(requestUrl, direct, env, request.method === "HEAD")
      if (directResponse) return directResponse

      const alternate = await findAlternateReadyArticle(slug, env)
      const alternateResponse = await articleResponse(requestUrl, alternate, env, request.method === "HEAD")
      if (alternateResponse) return alternateResponse
    }

    return fetchPages(request, env)
  },
}

async function findReadyArticle(slug, env) {
  const direct = await env.FANJU_DB.prepare(
    `SELECT slug, lang, title, description, canonical_path, alternate_path, r2_key, body_html, status, updated_at
     FROM articles WHERE slug = ? AND status = 'ready' LIMIT 1`,
  ).bind(slug).first()
  if (direct) return direct

  return null
}

async function findAlternateReadyArticle(slug, env) {
  if (!slug.startsWith("en/")) {
    const alternate = await env.FANJU_DB.prepare(
      `SELECT slug, lang, title, description, canonical_path, alternate_path, r2_key, body_html, status, updated_at
       FROM articles WHERE slug = ? AND status = 'ready' LIMIT 1`,
    ).bind(`en/${slug}`).first()
    if (alternate) return { ...alternate, alternate_path: "" }
  }

  if (slug.startsWith("en/")) {
    const alternate = await env.FANJU_DB.prepare(
      `SELECT slug, lang, title, description, canonical_path, alternate_path, r2_key, body_html, status, updated_at
       FROM articles WHERE slug = ? AND status = 'ready' LIMIT 1`,
    ).bind(slug.replace(/^en\//, "")).first()
    if (alternate) return { ...alternate, alternate_path: "" }
  }

  return null
}

async function articleResponse(url, article, env, headOnly) {
  if (!article) return null
  const body = await articleBody(article, env)
  if (!body || isBadPublicArticle(article, body)) return null
  return htmlResponse(url, article, body, headOnly)
}

async function articleBody(article, env) {
  if (article.r2_key && env.FANJU_ARTICLES) {
    const object = await env.FANJU_ARTICLES.get(article.r2_key)
    if (object) return object.text()
  }
  return article.body_html || ""
}

function htmlResponse(url, article, body, headOnly = false) {
  const html = buildHtml(url, article, body)
  return new Response(headOnly ? null : html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-fanju-city-proxy": "d1",
    },
  })
}

async function fetchPages(request, env) {
  const requestUrl = new URL(request.url)
  const originBase = String(env.ORIGIN_BASE || "https://fanjuv1.pages.dev").replace(/\/$/, "")
  const origin = new URL(originBase)
  const originUrl = new URL(`${requestUrl.pathname}${requestUrl.search}`, origin)

  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.set("x-forwarded-host", requestUrl.host)
  headers.set("x-fanju-city-proxy", "pages")

  const originRequest = new Request(originUrl.toString(), {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "follow",
  })

  const response = await fetch(originRequest)
  const responseHeaders = new Headers(response.headers)
  responseHeaders.set("x-fanju-city-proxy", "pages")

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

const TOPIC_LABELS = {
  "singles-dinner": { zh: "单身饭局", en: "Singles Dinner" },
  "curated-dinner": { zh: "精选饭局", en: "Curated Dinner" },
  "curated-table": { zh: "精选餐桌", en: "Curated Table" },
  "business-dinner": { zh: "商务饭局", en: "Business Dinner" },
  "founder-dinner": { zh: "创业者饭局", en: "Founder Dinner" },
  "weekend-dinner": { zh: "周末饭局", en: "Weekend Dinner" },
  "stranger-dinner": { zh: "陌生人饭局", en: "Stranger Dinner" },
  "chinese-social-dining": { zh: "华人饭局社交", en: "Chinese Social Dining" },
  "student-dinner": { zh: "留学生饭局", en: "Student Dinner" },
  "newcomer-dinner": { zh: "新人饭局", en: "Newcomer Dinner" },
  "local-dinner": { zh: "同城饭局", en: "Local Dinner" },
  "high-quality-social-dining": { zh: "高质量饭局社交", en: "High-Quality Social Dining" },
  "designer-dinner": { zh: "设计师饭局", en: "Designer Dinner" },
  "industry-dinner": { zh: "行业饭局", en: "Industry Dinner" },
  "valentines-dinner": { zh: "情人节饭局", en: "Valentine's Dinner" },
  "dinner-buddy": { zh: "饭搭子饭局", en: "Dinner Buddy" },
  "social-dining": { zh: "饭局社交", en: "Social Dining" },
}

const RELATED_TOPIC_SLUGS = [
  "newcomer-dinner",
  "business-dinner",
  "curated-dinner",
  "weekend-dinner",
  "founder-dinner",
  "high-quality-social-dining",
]

const BAD_PUBLIC_TEXT_RE =
  /本站|联系QQ|本地联系|站长|广告合作|域名出售|\bQQ\b|domain\s+for\s+sale|parked\s+domain|Intro paragraph mentioning|Return valid JSON|Body requirements|markdown skeleton|"body"\s*:|"description"\s*:|开头段落|正文要求|只返回合法 JSON/i

function buildHtml(url, article, body) {
  const origin = `${url.protocol}//${url.host}`
  const currentPath = normalizePath(url.pathname || article.canonical_path || `/${article.slug || ""}`)
  const isEn = currentPath.startsWith("/en/") || article.lang === "en"
  const isZh = !isEn
  const lang = isZh ? "zh-CN" : "en"
  const alternatePath = alternatePathFor(currentPath)
  const zhPath = isEn ? alternatePath : currentPath
  const enPath = isEn ? currentPath : alternatePath
  const canonicalUrl = `${origin}${currentPath}`
  const zhUrl = `${origin}${zhPath}`
  const enUrl = `${origin}${enPath}`
  const alternateUrl = isEn ? zhUrl : enUrl
  const route = routeContext(currentPath, article, isEn)
  const title = isEn ? `${route.city} ${route.topic.en} Guide` : `${route.city}${route.topic.zh}指南`
  const description = answerSummary(route, isEn)
  const sourceParagraphs = extractBodyParagraphs(body)
  const faqItems = buildFaqItems(route, isEn)
  const articleSections = buildArticleSections(route, isEn, sourceParagraphs, faqItems)
  const relatedLinks = buildRelatedLinks(route, currentPath, isEn)
  const jsonLd = buildJsonLd({
    origin,
    canonicalUrl,
    title,
    description,
    lang,
    route,
    faqItems,
    article,
    zhUrl,
    enUrl,
  })

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <link rel="alternate" hreflang="zh" href="${escapeHtml(zhUrl)}">
  <link rel="alternate" hreflang="zh-CN" href="${escapeHtml(zhUrl)}">
  <link rel="alternate" hreflang="en" href="${escapeHtml(enUrl)}">
  <link rel="alternate" hreflang="x-default" href="${escapeHtml(enUrl)}">
  <meta name="robots" content="index,follow">
  <link rel="icon" href="/icon.svg?v=20260510-final" type="image/svg+xml">
  <script type="application/ld+json">${escapeJsonForHtml(jsonLd)}</script>
  <style>
    :root{color-scheme:dark;--bg:#201339;--fg:#fbf8ff;--muted:#d8d1e5;--border:#6e5a8a;--card:#2c1a49;--accent:#e5bf58;--green:#5abf93}
    *{box-sizing:border-box}body{margin:0;background:linear-gradient(180deg,#201339 0%,#171025 52%,#120d1c 100%);color:var(--fg);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    a{color:var(--fg);text-decoration:none}.top{border-bottom:1px solid rgba(110,90,138,.65);position:sticky;top:0;background:rgba(32,19,57,.9);backdrop-filter:blur(16px);z-index:10}
    .top-inner{max-width:1120px;margin:0 auto;height:64px;padding:0 20px;display:flex;align-items:center;justify-content:space-between}
    .brand{font-family:Georgia,"Times New Roman",serif;letter-spacing:.08em}.nav{display:flex;gap:18px;font:11px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
    .hero{border-bottom:1px solid rgba(110,90,138,.65)}.hero-inner{max-width:980px;margin:0 auto;padding:48px 20px 36px}
    .eyebrow{font:11px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.22em;color:var(--accent)}
    h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(2rem,5vw,3.7rem);line-height:1.08;margin:16px 0 18px}
    .dek,.answer-summary p{font-size:1.06rem;line-height:1.75;color:rgba(250,250,250,.84);max-width:820px}
    .answer-summary{margin-top:20px;border-left:3px solid var(--accent);background:rgba(255,255,255,.055);padding:16px 18px}
    .answer-summary p{margin:0}.key-points{display:grid;gap:10px;margin:22px 0 0;padding:0;list-style:none;max-width:860px}.key-points li{border:1px solid rgba(110,90,138,.65);background:rgba(255,255,255,.04);padding:12px 14px;color:rgba(250,250,250,.86);line-height:1.6}.key-points strong{color:var(--fg)}
    main{max-width:980px;margin:0 auto;padding:38px 20px 72px}.article{font-size:17px;line-height:1.82;color:rgba(250,250,250,.9)}
    .article h2{font-family:Georgia,"Times New Roman",serif;font-size:1.8rem;margin:2.1rem 0 .75rem;color:var(--fg)}
    .article h3{font-family:Georgia,"Times New Roman",serif;font-size:1.3rem;margin:1.5rem 0 .5rem;color:var(--fg)}
    .article p{margin:.85rem 0}.article ol,.article ul{padding-left:1.35rem}.article li{margin:.45rem 0}
    .internal-links{margin-top:42px;border-top:1px solid rgba(110,90,138,.65);padding-top:24px}.module-title{font:11px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.2em;color:var(--accent);margin:0 0 12px}.internal-links ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;list-style:none;margin:0;padding:0}.internal-links a{display:block;border:1px solid rgba(110,90,138,.7);background:rgba(255,255,255,.045);padding:12px 14px;color:rgba(250,250,250,.88)}.internal-links a:hover{border-color:var(--accent);color:var(--accent)}
    footer{border-top:1px solid rgba(110,90,138,.65);padding:32px 20px;color:var(--muted);font:11px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.16em}
    .foot-inner{max-width:1120px;margin:0 auto}
  </style>
</head>
<body>
  <header class="top"><div class="top-inner">
    <a class="brand" href="/">饭局 Fanju</a>
    <nav class="nav">
      <a href="${isZh ? "/cities" : "/en/cities"}">${isZh ? "城市" : "Cities"}</a>
      <a href="${isZh ? "/categories" : "/en/categories"}">${isZh ? "类型" : "Categories"}</a>
      <a href="${escapeHtml(alternateUrl)}">${isZh ? "English" : "中文"}</a>
    </nav>
  </div></header>
  <section class="hero"><div class="hero-inner">
    <div class="eyebrow">${isZh ? "饭局文章" : "Fanju Article"}</div>
    <h1>${escapeHtml(title)}</h1>
    <div class="answer-summary"><p>${escapeHtml(description)}</p></div>
    ${renderKeyPoints(route, isEn)}
  </div></section>
  <main>
    <article class="article">${articleSections}</article>
    ${renderRelatedLinks(relatedLinks, isEn)}
  </main>
  <footer><div class="foot-inner">© ${new Date().getFullYear()} Fanju · fanju.app</div></footer>
</body>
</html>`
}

function normalizePath(path = "") {
  const clean = String(path || "").split("?")[0].replace(/\/+$/, "")
  if (!clean || clean === "/") return "/"
  return clean.startsWith("/") ? clean : `/${clean}`
}

function alternatePathFor(path = "") {
  const normalized = normalizePath(path)
  if (normalized.startsWith("/en/")) return normalized.replace(/^\/en/, "") || "/"
  return `/en${normalized}`
}

function routeContext(path, article, isEn) {
  const parts = normalizePath(path).split("/").filter(Boolean)
  const offset = parts[0] === "en" ? 1 : 0
  const citySlug = parts[offset] === "city" ? parts[offset + 1] || "" : ""
  const topicSlug = parts[offset] === "city" ? parts[offset + 2] || "social-dining" : "social-dining"
  const topic = topicLabel(topicSlug)
  const city = isEn ? titleCase(citySlug || "fanju") : inferZhCity(article.title || "", topic.zh, citySlug)
  return { city, citySlug, topicSlug, topic }
}

function topicLabel(slug = "") {
  const key = String(slug || "social-dining").toLowerCase()
  const known = TOPIC_LABELS[key]
  if (known) return { slug: key, ...known, joinZh: known.zh }

  const zhWords = {
    designer: "设计师",
    industry: "行业",
    valentine: "情人节",
    valentines: "情人节",
    curated: "精选",
    table: "餐桌",
    newcomer: "新人",
    local: "同城",
    business: "商务",
    founder: "创业者",
    weekend: "周末",
    student: "留学生",
    dinner: "饭局",
    social: "社交",
    dining: "饭局",
  }
  const zh = key
    .split("-")
    .map((word) => zhWords[word] || "")
    .join("")
    .replace(/饭局饭局/g, "饭局") || titleCase(key)
  const topicZh = /饭局|餐桌|社交/.test(zh) ? zh : `${zh}饭局`
  return { slug: key, zh: topicZh, joinZh: topicZh, en: titleCase(key) }
}

function inferZhCity(title, topicZh, citySlug) {
  const compact = stripTags(title)
    .replace(/&[#a-z0-9]+;/gi, "")
    .split(/[：:|｜-]/)[0]
    .replace(/\s+/g, "")
  const beforeGuide = compact.replace(/指南.*$/, "")
  const topicForms = [
    topicZh,
    topicZh.replace(/饭局社交$/, "饭局"),
    topicZh.replace(/饭局社交$/, ""),
    topicZh.replace(/社交$/, ""),
    topicZh.replace(/饭局$/, ""),
    topicZh.replace(/餐桌$/, ""),
  ]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  for (const form of topicForms) {
    if (beforeGuide.endsWith(form)) {
      const city = beforeGuide.slice(0, -form.length)
      if (city) return city
    }
  }
  return titleCase(citySlug || "饭局")
}

function titleCase(slug = "") {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part ? part.charAt(0).toUpperCase() + part.slice(1) : "")
    .join(" ")
}

function answerSummary(route, isEn) {
  if (isEn) {
    return `Fanju app is a social dining app for meeting people through small, clearly described meals instead of swipe feeds or noisy group chats. This ${route.city} ${route.topic.en} guide explains who the page is for, how to join a table, what safety and trust signals to review, and how Fanju keeps the focus on real-world dinner plans.`
  }
  return `饭局app（Fanju）是一个围绕线下小桌吃饭建立连接的社交应用，帮助用户在${route.city}找到主题明确、人数较小、预期清楚的${route.topic.joinZh}。它不是刷脸匹配或群聊灌水工具，这页会说明谁适合参加、怎样报名、如何判断主理人和同桌信息，以及怎样把安全边界说清楚。`
}

function renderKeyPoints(route, isEn) {
  const points = isEn
    ? [
        ["Who it suits", `People in ${route.city} who want a dinner-first way to meet peers, newcomers, hosts, or local community around ${route.topic.en.toLowerCase()}.`],
        ["Core scenario", "A small public meal with a clear table theme, expected group size, time window, and basic cost expectations."],
        ["Safety focus", "Check the host description, venue, table rules, payment expectations, and whether the plan feels specific enough before joining."],
      ]
    : [
        ["适合谁", `适合在${route.city}想通过吃饭认识同频同桌、主理人或本地朋友的人，尤其是关注${route.topic.joinZh}的人。`],
        ["核心场景", "小桌、公共场所、主题清楚、人数和预算提前说明的线下饭局，而不是无限群聊或临时拼局。"],
        ["安全重点", "报名先看主理人介绍、餐厅或场地、同桌预期、费用说明和退出边界，信息越具体越值得信任。"],
      ]
  return `<ul class="key-points">${points.map(([label, text]) => `<li><strong>${escapeHtml(label)}：</strong>${escapeHtml(text)}</li>`).join("")}</ul>`
}

function buildArticleSections(route, isEn, sourceParagraphs, faqItems) {
  const source = sourceParagraphs.filter((p) => p.length >= (isEn ? 90 : 35)).slice(0, 3)
  const sections = isEn
    ? [
        {
          id: "what-is-fanju",
          title: "What is Fanju?",
          paragraphs: [
            "Fanju is built around the idea that a meal is easier to understand than an open-ended social feed. A table can say who it is for, what the conversation is about, how many people are expected, and what kind of venue is being used.",
            `For a ${route.topic.en.toLowerCase()} in ${route.city}, that means the decision is not just whether someone looks interesting. The useful question is whether the table description, host intent, and dinner context match what you want from an offline meeting.`,
          ],
        },
        {
          id: "who-this-page-is-for",
          title: "Who this page is for",
          paragraphs: [
            `This page is for people considering a ${route.city} dinner with a clear ${route.topic.en.toLowerCase()} theme: newcomers, locals, professionals, friends-of-friends, or hosts who prefer a smaller table over a broad event listing.`,
            source[0] || `It is also useful if you want to compare Fanju with ordinary social apps, because the decision process starts with the table plan instead of a profile stream.`,
          ],
        },
        {
          id: "how-to-join",
          title: `How to join a ${route.topic.en} in ${route.city}`,
          paragraphs: [
            "Start by reading the table theme, time window, approximate group size, venue type, and cost notes. A strong listing should make the meal easy to picture before you ask to join.",
            source[1] || "After that, check whether the host has written clear expectations for conversation style, dietary needs, payment, and follow-up. If key details are missing, ask before committing.",
          ],
          ordered: ["Review the table description.", "Check the host and venue signals.", "Confirm time, cost, and expectations.", "Join only when the plan feels specific and comfortable."],
        },
        {
          id: "safety-and-trust",
          title: "How to assess safety and trust",
          paragraphs: [
            "Prefer public venues, clear start times, simple payment expectations, and hosts who explain the purpose of the table. Specific plans are easier to evaluate than vague invitations.",
            "Share the plan with someone you trust, keep your own boundaries clear, and leave space to decline if the table no longer matches the description. Fanju can organize the context, but participants still need practical judgment.",
          ],
        },
        {
          id: "difference",
          title: "How Fanju differs from social and dating apps",
          paragraphs: [
            "Many social and dating apps begin with profiles, likes, or open chat. Fanju begins with the meal: the table theme, the host, the venue, the expected mix of guests, and the reason people are sitting down together.",
            source[2] || "That dinner-first format makes the experience more concrete. Instead of trying to keep a conversation alive online, people can decide whether a real table fits their interests, schedule, and comfort level.",
          ],
        },
      ]
    : [
        {
          id: "what-is-fanju",
          title: "Fanju / 饭局app 是什么",
          paragraphs: [
            "Fanju / 饭局app 的核心不是让用户无止境刷资料，而是把一次线下吃饭先说明白：谁来、为什么见面、在哪吃、人数大概多少、费用和边界如何处理。",
            `放到${route.city}${route.topic.joinZh}场景里，判断重点不是“谁看起来有趣”，而是这桌饭的主题、主理人意图、餐厅或场地和同桌预期是否清楚。`,
          ],
        },
        {
          id: "who-this-page-is-for",
          title: "这个页面适合谁",
          paragraphs: [
            `这页适合在${route.city}想参加${route.topic.joinZh}的人：刚到本地的新朋友、想拓展线下圈子的本地用户、希望认识同行的人，或者想组织小桌饭局的主理人。`,
            source[0] || "如果你不想把社交完全交给刷脸、群聊或临时邀约，也可以用这页快速判断 Fanju 的饭局优先方式是否适合自己。",
          ],
        },
        {
          id: "how-to-join",
          title: `在${route.city}如何参加${route.topic.joinZh}`,
          paragraphs: [
            "先看饭局主题、时间窗口、人数范围、餐厅或场地类型、预算说明和主理人写法。一条合格的饭局信息，应该让你在报名之前就能想象这顿饭大概是什么氛围。",
            source[1] || "再确认同桌预期、聊天边界、费用处理和是否需要提前沟通饮食限制。信息不清楚时先问，不要只凭标题报名。",
          ],
          ordered: ["阅读饭局描述和主理人说明。", "确认餐厅、时间、人数和费用。", "判断同桌主题是否匹配自己的目标。", "只在信息具体且自己感到舒适时参加。"],
        },
        {
          id: "safety-and-trust",
          title: "如何判断安全和信任",
          paragraphs: [
            "优先选择公共场所、时间明确、费用简单、主题清楚的饭局。主理人越能说明为什么组局、适合谁、不适合谁，参与者越容易做出判断。",
            "参加前可以把计划告诉朋友，保留自己的退出边界，并在现场继续观察实际安排是否和描述一致。饭局app 能帮助把信息结构化，但安全判断仍然需要用户自己保持清醒。",
          ],
        },
        {
          id: "difference",
          title: "和普通社交/约会软件有什么不同",
          paragraphs: [
            "普通社交或约会软件常从头像、资料、滑动和聊天开始；Fanju / 饭局app 从一桌饭开始：主题、主理人、餐厅、同桌组合和见面理由都先摆出来。",
            source[2] || "这种饭局优先的方式更具体，也更容易拒绝不合适的邀约。你不是被动等待聊天推进，而是在判断一场真实饭局是否符合自己的时间、兴趣和舒适边界。",
          ],
        },
      ]

  const faqHtml = [
    `<section id="faq">`,
    `<h2>${isEn ? "FAQ" : "常见问题"}</h2>`,
    ...faqItems.map((item) => `<div class="faq-item"><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></div>`),
    `</section>`,
  ].join("\n")

  return [
    ...sections.map((section) => renderArticleSection(section)),
    faqHtml,
  ].join("\n")
}

function renderArticleSection(section) {
  const ordered = section.ordered?.length
    ? `<ol>${section.ordered.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`
    : ""
  return [
    `<section id="${escapeHtml(section.id)}">`,
    `<h2>${escapeHtml(section.title)}</h2>`,
    ...section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    ordered,
    `</section>`,
  ].join("\n")
}

function buildFaqItems(route, isEn) {
  if (isEn) {
    return [
      {
        question: `What is Fanju app in ${route.city}?`,
        answer: `Fanju app is a social dining app that helps people in ${route.city} meet through small, clearly described meals, including ${route.topic.en.toLowerCase()} tables.`,
      },
      {
        question: `Who should consider a ${route.topic.en.toLowerCase()}?`,
        answer: `It suits people who want an offline meal with a clear theme, a readable host intent, and a guest mix that feels more specific than a broad meetup or group chat.`,
      },
      {
        question: "Is Fanju a dating app?",
        answer: "Fanju can be social, but the page is dinner-first rather than swipe-first: the table plan, venue, topic, and expectations matter more than profile browsing.",
      },
      {
        question: "How can I make a safer decision before joining?",
        answer: "Choose public venues, read the host and table description carefully, confirm time and cost expectations, and avoid plans that are vague or uncomfortable.",
      },
    ]
  }
  return [
    {
      question: `在${route.city}使用饭局app 是什么体验？`,
      answer: `饭局app 会把${route.city}${route.topic.joinZh}的主题、主理人、场地、人数和预期先说明清楚，让用户在报名之前判断这桌饭是否适合自己。`,
    },
    {
      question: `谁适合参加${route.topic.joinZh}？`,
      answer: "适合想通过线下吃饭认识同频同桌、同行、本地朋友或主理人的用户，尤其适合不想只靠刷资料和群聊推进社交的人。",
    },
    {
      question: "饭局app 是约会软件吗？",
      answer: "Fanju / 饭局app 可以承载社交关系，但页面重点是饭局优先：先看主题、餐厅、主理人和同桌预期，而不是先做滑动匹配。",
    },
    {
      question: "参加前怎样判断更安全？",
      answer: "优先看公共场所、时间、费用、退出边界和主理人说明是否清楚；如果信息含糊，先提问或暂时不参加。",
    },
  ]
}

function buildRelatedLinks(route, currentPath, isEn) {
  const cityHub = route.citySlug ? `${isEn ? "/en" : ""}/city/${route.citySlug}` : (isEn ? "/en/cities" : "/cities")
  const links = [
    { href: "/what-is-fanju", label: isEn ? "What is Fanju / 饭局app" : "Fanju / 饭局app 是什么" },
    { href: "/faq", label: isEn ? "FAQ" : "常见问题" },
    { href: cityHub, label: isEn ? `${route.city} city hub` : `${route.city}城市页` },
    { href: alternatePathFor(currentPath), label: isEn ? "中文版本" : "English version" },
  ]
  for (const slug of RELATED_TOPIC_SLUGS) {
    if (slug === route.topicSlug || links.length >= 8 || !route.citySlug) continue
    const label = topicLabel(slug)
    links.push({
      href: `${isEn ? "/en" : ""}/city/${route.citySlug}/${slug}`,
      label: isEn ? `${route.city} ${label.en}` : `${route.city}${label.zh}`,
    })
  }
  return links
}

function renderRelatedLinks(links, isEn) {
  return `<aside class="internal-links" aria-label="${isEn ? "Internal links" : "内链"}">
    <p class="module-title">${isEn ? "Related Fanju Pages" : "相关 Fanju 页面"}</p>
    <ul>${links.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`).join("")}</ul>
  </aside>`
}

function buildJsonLd({ origin, canonicalUrl, title, description, lang, route, faqItems, article, zhUrl, enUrl }) {
  const organizationId = `${origin}/#organization`
  const websiteId = `${origin}/#website`
  const appId = `${origin}/#mobile-application`
  const pageId = `${canonicalUrl}#article`
  const breadcrumbId = `${canonicalUrl}#breadcrumb`
  const faqId = `${canonicalUrl}#faq`
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "Fanju",
        alternateName: ["饭局", "饭局app", "Fanju app"],
        url: origin,
        logo: `${origin}/icon-512.png`,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: "Fanju",
        url: origin,
        publisher: { "@id": organizationId },
        inLanguage: ["zh-CN", "en"],
      },
      {
        "@type": "MobileApplication",
        "@id": appId,
        name: "Fanju app",
        alternateName: "饭局app",
        applicationCategory: "SocialNetworkingApplication",
        operatingSystem: "iOS, Android",
        url: origin,
        publisher: { "@id": organizationId },
      },
      {
        "@type": "Article",
        "@id": pageId,
        headline: title,
        description,
        inLanguage: lang,
        url: canonicalUrl,
        mainEntityOfPage: canonicalUrl,
        articleSection: route.topic.en,
        dateModified: article.updated_at || undefined,
        publisher: { "@id": organizationId },
        about: ["Fanju app", route.city, route.topic.en],
      },
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Fanju", item: origin },
          { "@type": "ListItem", position: 2, name: route.city, item: `${origin}${route.citySlug ? `/city/${route.citySlug}` : "/cities"}` },
          { "@type": "ListItem", position: 3, name: title, item: canonicalUrl },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": faqId,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "WebPage",
        "@id": canonicalUrl,
        url: canonicalUrl,
        name: title,
        description,
        inLanguage: lang,
        isPartOf: { "@id": websiteId },
        primaryImageOfPage: `${origin}/og.jpg`,
        mainEntity: { "@id": pageId },
        alternateName: [zhUrl, enUrl],
      },
    ],
  }
}

function extractBodyParagraphs(body = "") {
  const html = String(body || "").replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "")
  const paragraphs = []
  for (const match of html.matchAll(/<p\b(?![^>]*class=["'][^"']*\bdek\b[^"']*["'])[^>]*>([\s\S]*?)<\/p>/gi)) {
    const text = decodeEntities(stripTags(match[1])).replace(/\s+/g, " ").trim()
    if (text && !BAD_PUBLIC_TEXT_RE.test(text)) paragraphs.push(text)
  }
  const seen = new Set()
  return paragraphs.filter((paragraph) => {
    const key = paragraph.replace(/\s+/g, "").toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function stripTags(input = "") {
  return String(input || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function decodeEntities(input = "") {
  return String(input || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}

function escapeHtml(input = "") {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

function isBadPublicArticle(article, body) {
  const text = `${article?.title || ""}\n${article?.description || ""}\n${body || ""}`
  const patterns = [
    /本站/i,
    /联系QQ/i,
    /本地联系/i,
    /站长/i,
    /广告合作/i,
    /域名出售/i,
    /\bQQ\b/i,
    /domain\s+for\s+sale/i,
    /parked\s+domain/i,
    /\bIntro paragraph mentioning\b/i,
    /\bReturn valid JSON\b/i,
    /\bBody requirements\b/i,
    /\bmarkdown skeleton\b/i,
    /"body"\s*:/i,
    /"description"\s*:/i,
    /开头段落/,
    /正文要求/,
    /只返回合法 JSON/,
  ]
  return patterns.some((pattern) => pattern.test(text))
}
