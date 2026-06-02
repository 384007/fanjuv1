export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const method = request.method

    // Intercept GET/HEAD for city article paths: /city/[city]/[topic] and /en/city/[city]/[topic]
    if ((method === "GET" || method === "HEAD") &&
        /^\/(?:en\/)?city\/[^/]+\/[^/]+$/.test(normalizePath(url.pathname))) {
      try {
        const path = normalizePath(url.pathname)
        const slug = path.replace(/^\//, "")
        let article = await _findReadyArticle(slug, env)
        if (!article) article = await _findAlternateReadyArticle(slug, env)
        if (article) {
          const body = await articleBody(article, env)
          if (body && !isBadPublicArticle(article, body)) {
            return buildPageResponse(url, article, body, env, method === "HEAD")
          }
        }
      } catch (err) {
        console.error("Worker article error:", err)
        // fall through to Pages
      }
    }

    return fetchPages(request, env)
  },
}

async function _findReadyArticle(slug, env) {
  const direct = await env.FANJU_DB.prepare(
    `SELECT slug, lang, title, description, canonical_path, alternate_path, r2_key, body_html, status, updated_at
     FROM articles WHERE slug = ? AND status = 'ready' LIMIT 1`,
  ).bind(slug).first()
  if (direct) return direct

  return null
}

async function _findAlternateReadyArticle(slug, env) {
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

async function buildPageResponse(url, article, body, env, headOnly = false) {
  const path = normalizePath(url.pathname)
  const isEn = path.startsWith("/en/") || article.lang === "en"
  const lang = isEn ? "en" : "zh-CN"
  const alternatePath = alternatePathFor(path)
  const origin = `${url.protocol}//${url.host}`
  const canonicalUrl = `${origin}${path}`
  const title = article.title || path.split("/").at(-1) || "Fanju"
  const description = article.description || ""
  const route = routeContext(path, article, isEn)

  // Try R2 shell first (exact same CSS/fonts/JS as Pages static build)
  const [shellHead, shellTail] = await Promise.all([
    env.FANJU_ARTICLES?.get("shell/head.html").then((o) => o?.text()).catch(() => null),
    env.FANJU_ARTICLES?.get("shell/tail.html").then((o) => o?.text()).catch(() => null),
  ])

  let html
  if (shellHead && shellTail) {
    // Inject per-page <title>, <meta>, canonical, hreflang into shell head
    const zhUrl = `${origin}${isEn ? alternatePath : path}`
    const enUrl = `${origin}${isEn ? path : alternatePath}`
    const jsonLd = buildJsonLd({ origin, canonicalUrl, title, description, lang, route,
      faqItems: buildFaqItems(route, isEn, body), article, zhUrl, enUrl })

    const head = shellHead
      .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
      .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${escapeHtml(description)}">`)
      .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`)
      // inject hreflang + JSON-LD right before </head>
      .replace(
        /<\/head>/,
        `<link rel="alternate" hreflang="${isEn ? "zh" : "en"}" href="${escapeHtml(isEn ? zhUrl : enUrl)}">` +
        `<link rel="alternate" hreflang="x-default" href="${escapeHtml(enUrl)}">` +
        `<script type="application/ld+json">${escapeJsonForHtml(jsonLd)}</script>` +
        `</head>`,
      )

    const articleContent = buildArticleInnerHtml(url, article, body, env, isEn, route)
    html = head + articleContent + shellTail
  } else {
    // Fallback: standalone HTML (no shell — happens before first deploy)
    html = await buildHtml(url, article, body, env)
  }

  return new Response(headOnly ? null : html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      "x-fanju-served-by": "worker-r2",
    },
  })
}

/** Builds the inner HTML that replaces the static <main> in the shell */
function buildArticleInnerHtml(url, article, body, _env, isEn, route) {
  const path = normalizePath(url.pathname)
  const alternatePath = alternatePathFor(path)
  const origin = `${url.protocol}//${url.host}`
  const title = article.title || ""
  const description = article.description || ""
  const summary = answerSummary(route, isEn)

  const breadcrumbItems = [
    { href: "/", label: "Fanju" },
    { href: `${isEn ? "/en" : ""}/city/${route.citySlug}`, label: route.city },
    { href: path, label: title },
  ]
  const breadcrumbHtml = breadcrumbItems.map((crumb, i) =>
    `<li class="flex items-center gap-1">${i > 0 ? '<span aria-hidden>/</span>' : ""}` +
    (i < breadcrumbItems.length - 1
      ? `<a href="${escapeHtml(crumb.href)}" class="transition-colors hover:text-accent">${escapeHtml(crumb.label)}</a>`
      : `<span class="text-foreground">${escapeHtml(crumb.label)}</span>`) +
    `</li>`,
  ).join("")

  // Render the actual article body (H2/H3 + paragraphs) from body content
  const bodyHtml = renderBodyContent(body)

  // FAQ from actual article content when available, else topic-based
  const faqItems = buildFaqItems(route, isEn, body)
  const faqHtml = faqItems.map((item) =>
    `<div><h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p></div>`,
  ).join("\n")

  const relatedLinks = defaultRelatedLinks(isEn)
  const relatedLinksHtml = relatedLinks.length
    ? `<div><p class="mb-4 font-mono text-[10px] tracking-[0.24em] text-muted-foreground uppercase">${isEn ? "Related Pages" : "相关页面"}</p>` +
      `<div class="grid grid-cols-1 gap-px border border-border/60 bg-border/60">` +
      relatedLinks.map((l) => `<a href="${escapeHtml(l.href)}" class="bg-card/45 px-3 py-3 text-sm text-foreground transition-colors hover:text-accent">${escapeHtml(l.label)}</a>`).join("") +
      `</div></div>`
    : ""

  return `<main class="min-h-screen bg-background text-foreground" lang="${lang(isEn)}">` +
    `<nav aria-label="breadcrumb" class="border-b border-border/40 bg-card/20">` +
    `<div class="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-2 md:px-8">` +
    `<ol class="flex flex-wrap items-center gap-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">${breadcrumbHtml}</ol>` +
    `<a href="${escapeHtml(alternatePath)}" class="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-accent">${isEn ? "中文" : "English"}</a>` +
    `</div></nav>` +
    `<div class="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16 lg:grid lg:grid-cols-[1fr_280px] lg:gap-12">` +
    `<article class="prose-fanju">` +
    `<h1>${escapeHtml(title)}</h1>` +
    `<div class="answer-summary"><p>${escapeHtml(summary)}</p></div>` +
    bodyHtml +
    (faqItems.length ? `<section id="faq"><h2>${isEn ? "常见问题" : "常见问题"}</h2>${faqHtml}</section>` : "") +
    `</article>` +
    `<aside class="mt-12 space-y-6 lg:mt-0">` +
    relatedLinksHtml +
    `<a href="/" class="flex border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.18em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">${isEn ? "Back to Home" : "回到首页"}</a>` +
    `</aside></div>` +
    `</main>`
}

/**
 * 将文章 body（Markdown 或 HTML）渲染为完整 HTML，保留 H2/H3 标题结构
 * 去掉第一个 H1（已在 <h1> 标签中显示），跳过技术/AI 泄露文字
 */
function renderBodyContent(body = "") {
  const text = String(body || "").trim()
  if (!text) return ""

  // Detect if the body is already fully-converted HTML (has real block-level HTML tags)
  // A body that only has <article> wrapper but contains Markdown lines is NOT html
  const strippedOfWrapper = text.replace(/<\/?article[^>]*>/gi, "").trim()
  const isHtml = (strippedOfWrapper.includes("<h2") || strippedOfWrapper.includes("<h3"))
    && !strippedOfWrapper.match(/^#+\s/m)

  if (isHtml) {
    return strippedOfWrapper
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, "")
      // Remove <p> tags whose text content starts with # (leaked markdown heading)
      .replace(/<p[^>]*>\s*#[^<]*<\/p>/gi, "")
      .split("\n")
      .filter((line) => !BAD_PUBLIC_TEXT_RE.test(line))
      .join("\n")
  }

  // Markdown body (possibly wrapped in <article><p>...</p></article>)
  // Strip HTML wrapper tags and extract text content before parsing as Markdown
  const md = strippedOfWrapper
    .replace(/<p>/gi, "")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'")

  const lines = md.split("\n")
  const parts = []
  let skipFirst = true
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) { i++; continue }
    if (BAD_PUBLIC_TEXT_RE.test(trimmed)) { i++; continue }
    if (trimmed.startsWith("```")) {
      i++
      while (i < lines.length && !lines[i].trim().startsWith("```")) i++
      i++; continue
    }

    const h1 = trimmed.match(/^#\s+(.+)$/)
    if (h1) {
      if (skipFirst) { skipFirst = false; i++; continue }
      parts.push(`<h2>${escapeHtml(h1[1].trim())}</h2>`)
      i++; continue
    }
    const h2 = trimmed.match(/^##\s+(.+)$/)
    if (h2) { parts.push(`<h2>${escapeHtml(h2[1].trim())}</h2>`); i++; continue }
    const h3 = trimmed.match(/^###\s+(.+)$/)
    if (h3) { parts.push(`<h3>${escapeHtml(h3[1].trim())}</h3>`); i++; continue }
    if (trimmed === "---") { parts.push("<hr>"); i++; continue }

    if (/^[-*] /.test(trimmed)) {
      const items = []
      while (i < lines.length && /^[-*] /.test(lines[i].trim())) {
        const t = lines[i].trim().replace(/^[-*] /, "")
        if (!BAD_PUBLIC_TEXT_RE.test(t)) items.push(`<li>${escapeHtml(t)}</li>`)
        i++
      }
      if (items.length) parts.push(`<ul>${items.join("")}</ul>`)
      continue
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const t = lines[i].trim().replace(/^\d+\.\s/, "")
        if (!BAD_PUBLIC_TEXT_RE.test(t)) items.push(`<li>${escapeHtml(t)}</li>`)
        i++
      }
      if (items.length) parts.push(`<ol>${items.join("")}</ol>`)
      continue
    }

    const paraLines = []
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("#") &&
      !/^[-*] /.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      lines[i].trim() !== "---"
    ) {
      if (!BAD_PUBLIC_TEXT_RE.test(lines[i].trim())) paraLines.push(lines[i].trim())
      i++
    }
    if (paraLines.length) {
      const paraText = paraLines.join(" ")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      if (paraText.trim()) parts.push(`<p>${paraText}</p>`)
    }
  }

  return parts.join("\n")
}

function lang(isEn) { return isEn ? "en" : "zh-CN" }

async function _articleResponse(url, article, env, headOnly) {
  if (!article) return null
  const body = await articleBody(article, env)
  if (!body || isBadPublicArticle(article, body)) return null
  return htmlResponse(url, article, body, env, headOnly)
}

async function articleBody(article, env) {
  if (article.r2_key && env.FANJU_ARTICLES) {
    const object = await env.FANJU_ARTICLES.get(article.r2_key)
    if (object) return object.text()
  }
  return article.body_html || ""
}

async function htmlResponse(url, article, body, env, headOnly = false) {
  const html = await buildHtml(url, article, body, env)
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

const BAD_PUBLIC_TEXT_RE =
  /本站|联系QQ|本地联系|站长|广告合作|域名出售|\bQQ\b|domain\s+for\s+sale|parked\s+domain|Intro paragraph mentioning|Return valid JSON|Body requirements|markdown skeleton|"body"\s*:|"description"\s*:|开头段落|正文要求|只返回合法 JSON|\bAI\b|\bprompt\b|\bprovider\b|\bmodel\b|\bpipeline\b|\bD1\b|\bR2\b|\bModal\b|\bCloudflare\b|提示词|模型|后台|技术栈|流水线|自动化/i

const SAFE_STATIC_PATHS = new Set([
  "/",
  "/cities",
  "/en/cities",
  "/categories",
  "/en/categories",
  "/what-is-fanju",
  "/en/what-is-fanju",
  "/social-dining",
  "/faq",
])

async function buildHtml(url, article, body, env) {
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
  const title = article.title || (isEn ? `${route.city} ${route.topic.en} Guide` : `${route.city}${route.topic.zh}指南`)
  const description = article.description || answerSummary(route, isEn)
  const faqItems = buildFaqItems(route, isEn, body)
  const articleBodyHtml = renderBodyContent(body)
  const relatedLinks = await buildRelatedLinks(route, currentPath, isEn, env)
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
    <article class="article">${articleBodyHtml}</article>
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
  const CITY_ZH = {
    "shenzhen":"深圳","guangzhou":"广州","shanghai":"上海","beijing":"北京",
    "hangzhou":"杭州","chengdu":"成都","xiamen":"厦门","changsha":"长沙",
    "nanjing":"南京","suzhou":"苏州","wuhan":"武汉","chongqing":"重庆",
    "xian":"西安","qingdao":"青岛","zhengzhou":"郑州","foshan":"佛山",
    "dongguan":"东莞","zhuhai":"珠海","tianjin":"天津","ningbo":"宁波",
    "kunming":"昆明","hefei":"合肥","fuzhou":"福州","changchun":"长春",
    "harbin":"哈尔滨","shijiazhuang":"石家庄","jinan":"济南","taiyuan":"太原",
    "nanchang":"南昌","nanning":"南宁","guiyang":"贵阳","urumqi":"乌鲁木齐",
    "lanzhou":"兰州","xining":"西宁","hohhot":"呼和浩特","yinchuan":"银川",
    "lhasa":"拉萨","haikou":"海口","sanya":"三亚","wenzhou":"温州",
    "wuxi":"无锡","nantong":"南通","yangzhou":"扬州","hefei":"合肥",
    "zibo":"淄博","jiaxing":"嘉兴","taizhou":"台州","jinhua":"金华",
    "huzhou":"湖州","shaoxing":"绍兴","quanzhou":"泉州","zhangzhou":"漳州",
    "xinxiang":"新乡","luoyang":"洛阳","kaifeng":"开封","anyang":"安阳",
    "changzhou":"常州","xuzhou":"徐州","lianyungang":"连云港","huainan":"淮南",
    "baoding":"保定","tangshan":"唐山","langfang":"廊坊","handan":"邯郸",
    "yangquan":"阳泉","datong":"大同","linfen":"临汾","jinzhong":"晋中",
    "hefei":"合肥","wuhu":"芜湖","bengbu":"蚌埠","huainan":"淮南",
    "maanshan":"马鞍山","tongling":"铜陵","anqing":"安庆",
    "new-york":"纽约","san-francisco":"旧金山","los-angeles":"洛杉矶",
    "vancouver":"温哥华","toronto":"多伦多","london":"伦敦","tokyo":"东京",
    "sydney":"悉尼","melbourne":"墨尔本","singapore":"新加坡",
    "hong-kong":"香港","taipei":"台北","seoul":"首尔","bangkok":"曼谷",
    "kuala-lumpur":"吉隆坡","jakarta":"雅加达","ho-chi-minh":"胡志明市",
    "osaka":"大阪","nagoya":"名古屋","fukuoka":"福冈","kyoto":"京都",
    "paris":"巴黎","berlin":"柏林","amsterdam":"阿姆斯特丹","dubai":"迪拜",
    "chicago":"芝加哥","boston":"波士顿","seattle":"西雅图","houston":"休斯顿",
    "auckland":"奥克兰","brisbane":"布里斯班","perth":"珀斯",
    "lima":"利马","bogota":"波哥大","mexico-city":"墨西哥城",
    "cairo":"开罗","nairobi":"内罗毕","accra":"阿克拉","lagos":"拉各斯",
    "mumbai":"孟买","delhi":"德里","bangalore":"班加罗尔","chennai":"金奈",
  }
  return CITY_ZH[citySlug] || titleCase(citySlug || "饭局")
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

/**
 * Extract FAQ from article body HTML (h3 + following p pairs).
 * Falls back to template FAQ if body has fewer than 2 real items.
 */
function extractFaqFromBody(body = "", route, isEn) {
  const html = String(body || "")
  if (!html.includes("<h3")) return buildTemplateFaqItems(route, isEn)

  const items = []
  const h3Re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi
  let match
  while ((match = h3Re.exec(html)) !== null && items.length < 5) {
    const q = decodeEntities(stripTags(match[1])).trim()
    const a = decodeEntities(stripTags(match[2])).trim()
    if (q && a && q.length > 5 && a.length > 10 && !BAD_PUBLIC_TEXT_RE.test(q) && !BAD_PUBLIC_TEXT_RE.test(a)) {
      items.push({ question: q, answer: a })
    }
  }
  return items.length >= 2 ? items : buildTemplateFaqItems(route, isEn)
}

function buildFaqItems(route, isEn, body = "") {
  return extractFaqFromBody(body, route, isEn)
}

function buildTemplateFaqItems(route, isEn) {
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

async function hasReadyArticlePath(path, env) {
  if (!env?.FANJU_DB) return false
  const normalized = normalizePath(path)
  const slug = normalized.replace(/^\/+/, "")
  try {
    const row = await env.FANJU_DB.prepare(
      `SELECT slug, lang, title, description, canonical_path, alternate_path, r2_key, body_html, status, updated_at
       FROM articles
       WHERE status = 'ready' AND (slug = ? OR canonical_path = ? OR alternate_path = ?)
       LIMIT 1`,
    ).bind(slug, normalized, normalized).first()
    if (!row) return false
    const body = await articleBody(row, env)
    return Boolean(body && !isBadPublicArticle(row, body))
  } catch {
    return false
  }
}

async function isSafePath(path, env) {
  const normalized = normalizePath(path)
  if (SAFE_STATIC_PATHS.has(normalized)) return true
  return hasReadyArticlePath(normalized, env)
}

function addSafeRelatedLink(links, seen, link, currentPath) {
  const href = normalizePath(link.href)
  if (!link.label || !href || href === normalizePath(currentPath) || seen.has(href)) return
  seen.add(href)
  links.push({ label: link.label, href })
}

async function readyArticleLinksForCity(route, currentPath, isEn, env) {
  if (!route.citySlug || !env?.FANJU_DB) return []
  const lang = isEn ? "en" : "zh"
  const prefix = `${isEn ? "/en" : ""}/city/${route.citySlug}/`
  try {
    const result = await env.FANJU_DB.prepare(
      `SELECT canonical_path, title, topic_slug, updated_at
       FROM articles
       WHERE status = 'ready' AND lang = ? AND city_slug = ? AND canonical_path LIKE ?
       ORDER BY updated_at DESC
       LIMIT 16`,
    ).bind(lang, route.citySlug, `${prefix}%`).all()
    const rows = Array.isArray(result?.results) ? result.results : []
    return rows
      .map((row) => normalizePath(row.canonical_path || ""))
      .filter((path) => /^\/(?:en\/)?city\/[^/]+\/[^/]+$/.test(path) && path !== normalizePath(currentPath))
      .map((path) => {
        const slug = path.split("/").filter(Boolean).at(-1) || ""
        const label = topicLabel(slug)
        return {
          href: path,
          label: isEn ? `${route.city} ${label.en}` : `${route.city}${label.zh}`,
        }
      })
      .slice(0, 5)
  } catch {
    return []
  }
}

function defaultRelatedLinks(isEn) {
  return isEn
    ? [
        { href: "/en/cities", label: "All cities" },
        { href: "/en/categories", label: "All categories" },
        { href: "/en/what-is-fanju", label: "What is Fanju" },
        { href: "/social-dining", label: "Social dining" },
        { href: "/faq", label: "FAQ" },
      ]
    : [
        { href: "/cities", label: "全部城市" },
        { href: "/categories", label: "全部类型" },
        { href: "/what-is-fanju", label: "饭局是什么" },
        { href: "/social-dining", label: "饭局社交" },
        { href: "/faq", label: "常见问题" },
      ]
}

async function buildRelatedLinks(route, currentPath, isEn, env) {
  const links = []
  const seen = new Set()

  if (route.citySlug) {
    const cityHub = `${isEn ? "/en" : ""}/city/${route.citySlug}`
    if (await isSafePath(cityHub, env)) {
      addSafeRelatedLink(
        links,
        seen,
        { href: cityHub, label: isEn ? `${route.city} city hub` : `${route.city}城市页` },
        currentPath,
      )
    }

    for (const link of await readyArticleLinksForCity(route, currentPath, isEn, env)) {
      if (await isSafePath(link.href, env)) addSafeRelatedLink(links, seen, link, currentPath)
    }
  }

  for (const link of defaultRelatedLinks(isEn)) {
    if (await isSafePath(link.href, env)) addSafeRelatedLink(links, seen, link, currentPath)
  }

  return links
}

function renderRelatedLinks(links, isEn) {
  if (!links.length) return ""
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
  const text = String(body || "")
  // Detect markdown vs HTML
  if (!text.includes("<p") && !text.includes("<h")) {
    // Markdown: extract non-heading, non-empty lines as paragraphs
    const seen = new Set()
    return text.split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && !l.startsWith("-") && !l.startsWith("*") && !/^\d+\./.test(l) && !l.startsWith("|") && l !== "---")
      .map((l) => decodeEntities(l).replace(/\s+/g, " ").trim())
      .filter((l) => l.length > 30 && !BAD_PUBLIC_TEXT_RE.test(l))
      .filter((l) => { const k = l.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
  }
  const html = text.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "")
  const paragraphs = []
  for (const match of html.matchAll(/<p\b(?![^>]*class=["'][^"']*\bdek\b[^"']*["'])[^>]*>([\s\S]*?)<\/p>/gi)) {
    const t = decodeEntities(stripTags(match[1])).replace(/\s+/g, " ").trim()
    if (t && !BAD_PUBLIC_TEXT_RE.test(t)) paragraphs.push(t)
  }
  const seen = new Set()
  return paragraphs.filter((p) => { const k = p.replace(/\s+/g, "").toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
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
