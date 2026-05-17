export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const slug = url.pathname.replace(/^\/+/, "").replace(/\/+$/, "")

    if (!slug) {
      return new Response("Fanju article renderer OK", { headers: { "content-type": "text/plain; charset=utf-8" } })
    }

    const cacheUrl = new URL(request.url)
    cacheUrl.search = ""
    cacheUrl.searchParams.set("_v", "3")
    const cacheKey = new Request(cacheUrl.toString(), { method: "GET" })
    const canCache = request.method === "GET"

    if (canCache) {
      const cached = await caches.default.match(cacheKey)
      if (cached) return cached
    }

    let article = await env.FANJU_DB.prepare(
      `SELECT slug, lang, title, description, canonical_path, alternate_path, r2_key, body_html, status, updated_at
       FROM articles WHERE slug = ? AND status = 'ready' LIMIT 1`
    ).bind(slug).first()

    let body = null

    if (!article) {
      // CN slug missing → find EN counterpart, render with ZH UI but EN body
      const isZhRequest = !slug.startsWith("en/")
      if (isZhRequest) {
        const enArticle = await env.FANJU_DB.prepare(
          `SELECT slug, lang, title, description, canonical_path, alternate_path, r2_key, body_html, status, updated_at
           FROM articles WHERE slug = ? AND status = 'ready' LIMIT 1`
        ).bind("en/" + slug).first()

        if (enArticle) {
          const enObj = enArticle.r2_key ? await env.FANJU_ARTICLES.get(enArticle.r2_key) : null
          const enBody = enObj ? await enObj.text() : enArticle.body_html
          // Render with ZH UI (header/nav/labels in Chinese), body stays in English
          const syntheticArticle = {
            ...enArticle,
            lang: "zh",
            canonical_path: "/" + slug,
            alternate_path: enArticle.canonical_path,
          }
          const html = buildHtml(url, syntheticArticle, enBody)
          const response = new Response(html, {
            headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=86400" },
          })
          if (canCache) ctx.waitUntil(caches.default.put(cacheKey, response.clone()))
          return response
        }
      }

      const response = await fetchOrigin(request, env)
      if (canCache) ctx.waitUntil(caches.default.put(cacheKey, response.clone()))
      return response
    }

    if (body === null) {
      const obj = article.r2_key ? await env.FANJU_ARTICLES.get(article.r2_key) : null
      if (!obj && !article.body_html) {
        return new Response(`Article body missing: ${article.r2_key}`, { status: 500, headers: { "content-type": "text/plain" } })
      }
      body = obj ? await obj.text() : article.body_html
    }

    const html = buildHtml(url, article, body)
    const response = new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=86400" },
    })
    if (canCache) ctx.waitUntil(caches.default.put(cacheKey, response.clone()))
    return response
  },
}

function buildHtml(url, article, body) {
  const origin = `${url.protocol}//${url.host}`
  const canonicalUrl = `${origin}${article.canonical_path}`
  const alternateUrl = article.alternate_path ? `${origin}${article.alternate_path}` : ""
  const isZh = article.lang === "zh"
  const lang = isZh ? "zh-CN" : "en"
  const alternateLang = isZh ? "en" : "zh-CN"
  const enHref = isZh ? (alternateUrl || canonicalUrl) : canonicalUrl
  const cnHref = isZh ? canonicalUrl : (alternateUrl || canonicalUrl)
  const isEnPage = !isZh

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(article.title)}</title>
  <meta name="description" content="${escapeHtml(article.description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <link rel="alternate" hreflang="${escapeHtml(lang)}" href="${escapeHtml(canonicalUrl)}">
  ${alternateUrl ? `<link rel="alternate" hreflang="${escapeHtml(alternateLang)}" href="${escapeHtml(alternateUrl)}">` : ""}
  <meta name="robots" content="index,follow">
  <link rel="icon" href="/icon.svg?v=20260510-final" type="image/svg+xml">
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "Article",
    headline: article.title, description: article.description,
    inLanguage: lang, url: canonicalUrl,
    dateModified: article.updated_at || undefined,
    publisher: { "@type": "Organization", name: "Fanju", url: origin },
  })}</script>
  <style>
    *,*::before,*::after{box-sizing:border-box}
    :root{--bg:#0a0a0a;--fg:#fafafa;--muted:#a3a3a3;--border:#262626;--card:#141414;--accent:#8b1e3f;--accent-fg:#fafafa;--secondary:#1a1a1a;--font-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--font-mono:"Geist Mono","SF Mono","Fira Code",monospace;--font-serif:Georgia,"Times New Roman",serif}
    html{background:var(--bg);color:var(--fg);font-family:var(--font-sans)}
    body{margin:0;min-height:100vh;background:var(--bg)}
    a{color:var(--accent);text-decoration:none}
    a:hover{text-decoration:underline}
    .topbar{border-bottom:1px solid var(--border);background:var(--bg);padding:0 1rem}
    .topbar-inner{max-width:1400px;margin:0 auto;height:36px;display:flex;align-items:center;justify-content:space-between}
    .topbar-left{display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;color:var(--muted);text-transform:uppercase}
    .live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent)}
    .site-header{position:sticky;top:0;z-index:40;border-bottom:1px solid var(--border);background:rgba(10,10,10,.85);backdrop-filter:blur(20px)}
    .header-inner{max-width:1400px;margin:0 auto;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 1rem}
    .brand{display:flex;align-items:center;gap:12px;text-decoration:none}
    .brand-icon{width:32px;height:32px;object-fit:contain}
    .brand-text{display:flex;flex-direction:column;line-height:1}
    .brand-name{font-family:var(--font-serif);font-size:16px;font-weight:500;letter-spacing:.05em;color:var(--fg)}
    .brand-sub{font-family:var(--font-mono);font-size:9px;letter-spacing:.25em;color:var(--muted);text-transform:uppercase;margin-top:2px}
    .header-nav{display:none}
    @media(min-width:768px){.header-nav{display:flex;align-items:center;gap:28px}}
    .header-nav a{font-family:var(--font-mono);font-size:11px;letter-spacing:.2em;color:var(--muted);text-transform:uppercase;transition:color .15s}
    .header-nav a:hover{color:var(--fg);text-decoration:none}
    .header-actions{display:flex;align-items:center;gap:12px}
    .lang-switch{display:flex;align-items:center;border:1px solid var(--border);background:var(--secondary);padding:2px}
    .lang-switch a{padding:4px 10px;font-family:var(--font-mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);transition:color .15s;text-decoration:none}
    .lang-switch a:hover{color:var(--fg)}
    .lang-switch a.active{background:var(--accent);color:var(--accent-fg)}
    .btn-invite{display:flex;align-items:center;gap:6px;background:var(--accent);padding:8px 14px;font-family:var(--font-mono);font-size:11px;letter-spacing:.2em;color:var(--accent-fg);text-transform:uppercase;transition:background .15s;text-decoration:none}
    .btn-invite:hover{background:#7a1a37;text-decoration:none}
    .breadcrumb{border-bottom:1px solid rgba(38,38,38,.4);background:rgba(20,20,20,.2)}
    .breadcrumb-inner{max-width:1100px;margin:0 auto;padding:8px 1rem;display:flex;align-items:center;justify-content:space-between}
    .breadcrumb ol{display:flex;flex-wrap:wrap;align-items:center;gap:4px;font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;color:var(--muted);text-transform:uppercase;list-style:none;margin:0;padding:0}
    .breadcrumb ol li{display:flex;align-items:center;gap:4px}
    .breadcrumb ol a{color:var(--muted);transition:color .15s}
    .breadcrumb ol a:hover{color:var(--accent);text-decoration:none}
    .breadcrumb-lang{font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;color:var(--muted);text-transform:uppercase;transition:color .15s}
    .breadcrumb-lang:hover{color:var(--accent);text-decoration:none}
    .hero{position:relative;overflow:hidden;border-bottom:1px solid rgba(38,38,38,.6)}
    .hero-inner{position:relative;max-width:1100px;margin:0 auto;padding:56px 1rem 80px}
    .eyebrow{display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:11px;letter-spacing:.25em;color:var(--accent);text-transform:uppercase}
    .eyebrow-line{height:1px;width:32px;background:rgba(139,30,63,.6)}
    h1{margin:28px 0 0;font-family:var(--font-serif);font-size:clamp(2rem,5vw,3.75rem);line-height:1.08;color:var(--fg)}
    .direct-answer{margin-top:32px;border-left:1px solid rgba(139,30,63,.7);background:rgba(20,20,20,.35);padding:20px 24px}
    .direct-answer-label{font-family:var(--font-mono);font-size:10px;letter-spacing:.22em;color:var(--accent);text-transform:uppercase}
    .direct-answer p{margin:12px 0 0;font-size:1.05rem;line-height:1.7;color:var(--fg)}
    .content-wrap{border-bottom:1px solid rgba(38,38,38,.6)}
    .content-inner{max-width:1100px;margin:0 auto;padding:48px 1rem 64px;display:grid;grid-template-columns:1fr;gap:40px}
    @media(min-width:1024px){.content-inner{grid-template-columns:1fr 320px}}
    .article-body{font-size:17px;line-height:1.8;color:var(--fg)}
    .article-body h2{font-family:var(--font-serif);font-size:1.75rem;color:var(--fg);margin:2rem 0 .75rem}
    .article-body h3{font-family:var(--font-serif);font-size:1.3rem;color:var(--fg);margin:1.5rem 0 .5rem}
    .article-body p{margin:.75rem 0;color:rgba(250,250,250,.85)}
    .article-body ul,.article-body ol{padding-left:1.5rem;margin:.75rem 0}
    .article-body li{margin:.35rem 0;color:rgba(250,250,250,.85)}
    .article-body a{color:var(--accent)}
    .article-body strong{color:var(--fg)}
    .article-body blockquote{border-left:3px solid var(--accent);margin:1rem 0;padding:.5rem 1rem;background:var(--card);color:var(--muted)}
    .sidebar{display:flex;flex-direction:column;gap:32px}
    .sidebar-section h2{font-family:var(--font-mono);font-size:10px;letter-spacing:.24em;color:var(--muted);text-transform:uppercase;margin:0 0 16px}
    .link-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;border:1px solid rgba(38,38,38,.6);background:rgba(38,38,38,.6)}
    .link-grid a{background:rgba(20,20,20,.45);padding:12px;font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;color:var(--fg);text-transform:uppercase;transition:color .15s;text-decoration:none}
    .link-grid a:hover{color:var(--accent)}
    .sidebar-btn{display:flex;border:1px solid var(--border);background:var(--secondary);padding:12px 16px;font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;color:var(--fg);text-transform:uppercase;transition:border-color .15s,color .15s;text-decoration:none;margin-bottom:8px}
    .sidebar-btn:hover{border-color:rgba(139,30,63,.7);color:var(--accent)}
    .site-footer{border-top:1px solid var(--border);background:var(--bg);padding:48px 1rem 32px}
    .footer-inner{max-width:1400px;margin:0 auto}
    .footer-brand{font-family:var(--font-serif);font-size:1.1rem;color:var(--fg);margin-bottom:8px}
    .footer-tagline{font-family:var(--font-mono);font-size:10px;letter-spacing:.2em;color:var(--muted);text-transform:uppercase;margin-bottom:32px}
    .footer-links{display:flex;flex-wrap:wrap;gap:16px;margin-bottom:32px}
    .footer-links a{font-family:var(--font-mono);font-size:10px;letter-spacing:.15em;color:var(--muted);text-transform:uppercase;transition:color .15s}
    .footer-links a:hover{color:var(--fg);text-decoration:none}
    .footer-copy{font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;color:rgba(163,163,163,.5);text-transform:uppercase}
  </style>
</head>
<body>
<div class="topbar"><div class="topbar-inner">
  <div class="topbar-left"><span class="live-dot"></span><span>${isZh ? "饭局 · 全球同频饭局" : "FANJU · GLOBAL SOCIAL DINING"}</span></div>
</div></div>
<header class="site-header"><div class="header-inner">
  <a href="/" class="brand">
    <img src="/icon.svg?v=20260510-final" alt="Fanju" class="brand-icon">
    <div class="brand-text"><span class="brand-name">FANJU</span><span class="brand-sub">${isZh ? "同频饭局" : "Chinese Social Dining"}</span></div>
  </a>
  <nav class="header-nav">
    ${isZh
      ? `<a href="/product-map">产品</a><a href="/cities">城市</a><a href="/categories">类型</a><a href="/host-tools">主办方</a>`
      : `<a href="/product-map">Product</a><a href="/en/cities">Cities</a><a href="/en/categories">Categories</a><a href="/host-tools">Hosts</a>`}
  </nav>
  <div class="header-actions">
    <div class="lang-switch">
      <a href="${escapeHtml(enHref)}" class="${isEnPage ? "active" : ""}">EN</a>
      <a href="${escapeHtml(cnHref)}" class="${!isEnPage ? "active" : ""}">CN</a>
    </div>
    <a href="/invite" class="btn-invite">${isZh ? "邀请" : "Invite"} →</a>
  </div>
</div></header>
<nav class="breadcrumb"><div class="breadcrumb-inner">
  <ol><li><a href="/">${isZh ? "饭局 Fanju" : "Fanju"}</a></li><li><span>/</span><span>${escapeHtml(article.title)}</span></li></ol>
  ${alternateUrl ? `<a href="${escapeHtml(alternateUrl)}" class="breadcrumb-lang">${isZh ? "English" : "中文"}</a>` : ""}
</div></nav>
<section class="hero"><div class="hero-inner">
  <div class="eyebrow"><span class="eyebrow-line"></span><span>${isZh ? "饭局文章" : "Fanju Article"}</span></div>
  <h1>${escapeHtml(article.title)}</h1>
  <div class="direct-answer">
    <div class="direct-answer-label">${isZh ? "直接答案" : "Direct Answer"}</div>
    <p>${escapeHtml(article.description)}</p>
  </div>
</div></section>
<section class="content-wrap"><div class="content-inner">
  <article class="article-body">${body}</article>
  <aside class="sidebar">
    <div class="sidebar-section">
      <h2>${isZh ? "相关链接" : "Related"}</h2>
      <div class="link-grid">
        <a href="${isZh ? "/cities" : "/en/cities"}">${isZh ? "全部城市" : "All Cities"}</a>
        <a href="${isZh ? "/categories" : "/en/categories"}">${isZh ? "全部类型" : "All Categories"}</a>
        <a href="${isZh ? "/social-dining" : "/en/what-is-fanju"}">${isZh ? "社交饭局" : "What is Fanju"}</a>
        <a href="/host-tools">${isZh ? "主办方工具" : "Host Tools"}</a>
      </div>
    </div>
    <div>
      <a href="${isZh ? "/guides/mainland-city-dinner-guide" : "/en/guides/mainland-city-dinner-guide"}" class="sidebar-btn">${isZh ? "报名指南" : "Dinner Guide"}</a>
      <a href="/" class="sidebar-btn">${isZh ? "回到首页" : "Back to Home"}</a>
    </div>
  </aside>
</div></section>
<footer class="site-footer"><div class="footer-inner">
  <div class="footer-brand">饭局 Fanju</div>
  <div class="footer-tagline">${isZh ? "全球同频饭局网络" : "Global Social Dining Network"}</div>
  <div class="footer-links">
    <a href="/">${isZh ? "首页" : "Home"}</a>
    <a href="${isZh ? "/cities" : "/en/cities"}">${isZh ? "城市" : "Cities"}</a>
    <a href="${isZh ? "/categories" : "/en/categories"}">${isZh ? "类型" : "Categories"}</a>
    <a href="/social-dining">${isZh ? "社交饭局" : "Social Dining"}</a>
    <a href="/safety">${isZh ? "安全" : "Safety"}</a>
    <a href="/faq">FAQ</a>
    <a href="/host-tools">${isZh ? "主办方" : "Hosts"}</a>
  </div>
  <div class="footer-copy">© ${new Date().getFullYear()} Fanju · fanju.app</div>
</div></footer>
</body></html>`
}

async function fetchOrigin(request, env) {
  const originBase = String(env.ORIGIN_BASE || "https://fanju.pages.dev").replace(/\/$/, "")
  const url = new URL(request.url)
  const originUrl = new URL(`${url.pathname}${url.search}`, originBase)
  const headers = new Headers(request.headers)
  headers.set("x-fanju-seo-worker-fallback", "1")
  return fetch(new Request(originUrl.toString(), {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "follow",
  }))
}

function escapeHtml(input = "") {
  return String(input).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;")
}
