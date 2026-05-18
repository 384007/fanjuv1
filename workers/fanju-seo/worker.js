export default {
  async fetch(request, env, ctx) {
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

function buildHtml(url, article, body) {
  const origin = `${url.protocol}//${url.host}`
  const canonicalPath = article.canonical_path || `/${article.slug || ""}`
  const canonicalUrl = `${origin}${canonicalPath}`
  const alternateUrl = ""
  const isZh = article.lang === "zh"
  const lang = isZh ? "zh-CN" : "en"
  const alternateLang = isZh ? "en" : "zh-CN"
  const title = article.title || "Fanju"
  const description = article.description || "Fanju city dinner guide."

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  ${alternateUrl ? `<link rel="alternate" hreflang="${escapeHtml(alternateLang)}" href="${escapeHtml(alternateUrl)}">` : ""}
  <meta name="robots" content="index,follow">
  <link rel="icon" href="/icon.svg?v=20260510-final" type="image/svg+xml">
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    inLanguage: lang,
    url: canonicalUrl,
    dateModified: article.updated_at || undefined,
    publisher: { "@type": "Organization", name: "Fanju", url: origin },
  })}</script>
  <style>
    :root{color-scheme:dark;--bg:#2b1266;--fg:#fbf8ff;--muted:#c7bdd7;--border:#7d55b8;--card:#3b1782;--accent:#e4c15d;--wine:#b43a58}
    *{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(120,59,214,.55),transparent 60%),radial-gradient(ellipse 60% 50% at 100% 100%,rgba(180,58,88,.25),transparent 55%),var(--bg);background-attachment:fixed;color:var(--fg);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    a{color:var(--fg);text-decoration:none}.top{border-bottom:1px solid rgba(125,85,184,.65);position:sticky;top:0;background:rgba(43,18,102,.9);backdrop-filter:blur(16px);z-index:10}
    .top-inner{max-width:1120px;margin:0 auto;height:64px;padding:0 20px;display:flex;align-items:center;justify-content:space-between}
    .brand{font-family:Georgia,"Times New Roman",serif;letter-spacing:.08em}.nav{display:flex;gap:18px;font:11px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}
    .hero{border-bottom:1px solid rgba(125,85,184,.65)}.hero-inner{max-width:980px;margin:0 auto;padding:56px 20px 42px}
    .eyebrow{font:11px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.22em;color:var(--accent)}
    h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(2rem,5vw,3.7rem);line-height:1.08;margin:18px 0 18px}
    .dek{font-size:1.08rem;line-height:1.75;color:rgba(250,250,250,.8);max-width:780px}
    main{max-width:980px;margin:0 auto;padding:44px 20px 72px}.article{font-size:17px;line-height:1.82;color:rgba(250,250,250,.88)}
    .article h1{display:none}.article h2{font-family:Georgia,"Times New Roman",serif;font-size:1.8rem;margin:2.1rem 0 .75rem;color:var(--fg)}
    .article h3{font-family:Georgia,"Times New Roman",serif;font-size:1.3rem;margin:1.5rem 0 .5rem;color:var(--fg)}
    .article p{margin:.85rem 0}.article ul{padding-left:1.35rem}.article li{margin:.4rem 0}.article .dek{display:none}
    footer{border-top:1px solid rgba(125,85,184,.65);padding:32px 20px;color:var(--muted);font:11px ui-monospace,SFMono-Regular,Menlo,monospace;text-transform:uppercase;letter-spacing:.16em}
    .foot-inner{max-width:1120px;margin:0 auto}
  </style>
</head>
<body>
  <header class="top"><div class="top-inner">
    <a class="brand" href="/">饭局 Fanju</a>
    <nav class="nav">
      <a href="${isZh ? "/cities" : "/en/cities"}">${isZh ? "城市" : "Cities"}</a>
      <a href="${isZh ? "/categories" : "/en/categories"}">${isZh ? "类型" : "Categories"}</a>
      ${alternateUrl ? `<a href="${escapeHtml(alternateUrl)}">${isZh ? "English" : "中文"}</a>` : ""}
    </nav>
  </div></header>
  <section class="hero"><div class="hero-inner">
    <div class="eyebrow">${isZh ? "饭局文章" : "Fanju Article"}</div>
    <h1>${escapeHtml(title)}</h1>
    <p class="dek">${escapeHtml(description)}</p>
  </div></section>
  <main><article class="article">${body}</article></main>
  <footer><div class="foot-inner">© ${new Date().getFullYear()} Fanju · fanju.app</div></footer>
</body>
</html>`
}

function escapeHtml(input = "") {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
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
