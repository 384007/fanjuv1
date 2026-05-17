export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    let slug = url.pathname.replace(/^\/+/, "").replace(/\/+$/, "")

    if (!slug) {
      return new Response("Fanju article renderer OK", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      })
    }

    const cacheUrl = new URL(request.url)
    cacheUrl.search = ""
    const cacheKey = new Request(cacheUrl.toString(), { method: "GET" })
    const canCache = request.method === "GET"

    if (canCache) {
      const cached = await caches.default.match(cacheKey)
      if (cached) return cached
    }

    const article = await env.FANJU_DB.prepare(`
      SELECT slug, lang, title, description, canonical_path, alternate_path, r2_key, body_html, status, quality_score, updated_at
      FROM articles
      WHERE slug = ? AND status = 'ready'
      LIMIT 1
    `).bind(slug).first()

    if (!article) {
      const response = await fetchOrigin(request, env)
      if (canCache) ctx.waitUntil(caches.default.put(cacheKey, response.clone()))
      return response
    }

    const obj = article.r2_key ? await env.FANJU_ARTICLES.get(article.r2_key) : null
    if (!obj && !article.body_html) {
      return new Response(`Article body missing in R2 and D1: ${article.r2_key}`, {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      })
    }

    const body = obj ? await obj.text() : article.body_html
    const origin = `${url.protocol}//${url.host}`
    const canonicalUrl = `${origin}${article.canonical_path}`
    const alternateUrl = article.alternate_path ? `${origin}${article.alternate_path}` : ""
    const lang = article.lang === "zh" ? "zh-CN" : "en"
    const alternateLang = article.lang === "zh" ? "en" : "zh-CN"

    const html = `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(article.title)}</title>
  <meta name="description" content="${escapeHtml(article.description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <link rel="alternate" hreflang="${escapeHtml(lang)}" href="${escapeHtml(canonicalUrl)}">
  ${alternateUrl ? `<link rel="alternate" hreflang="${escapeHtml(alternateLang)}" href="${escapeHtml(alternateUrl)}">` : ""}
  <meta name="robots" content="index,follow">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    inLanguage: lang,
    url: canonicalUrl,
    dateModified: article.updated_at || undefined,
    publisher: {
      "@type": "Organization",
      name: "Fanju",
      url: origin,
    },
  })}</script>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:840px;margin:0 auto;padding:32px 20px;line-height:1.75;color:#171717}
    a{color:#8b1e3f}
    h1,h2,h3{line-height:1.25}
    article{font-size:18px}
    .dek{color:#525252;font-size:20px}
  </style>
</head>
<body>
  <main>
    ${body}
  </main>
</body>
</html>`

    const response = new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300, s-maxage=86400",
      },
    })

    if (canCache) ctx.waitUntil(caches.default.put(cacheKey, response.clone()))
    return response
  },
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
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}
