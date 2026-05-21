// Cloudflare Pages Function: proxy /api/lab/* → Lab Worker
// Runs at the edge; replaces the Next.js API route (which can't be statically exported).

interface Env {
  LAB_API_BASE?: string
  ADMIN_TOKEN?: string
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const env = ctx.env
  const req = ctx.request
  const adminToken = env.ADMIN_TOKEN ?? "demo"

  // Auth check
  const cookie = req.headers.get("cookie") ?? ""
  const tokenMatch = cookie.match(/(?:^|;\s*)admin_token=([^;]+)/)
  const token = tokenMatch?.[1]
  if (!token || token !== adminToken) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  const labBase = (env.LAB_API_BASE ?? "").replace(/\/+$/, "")
  if (!labBase) {
    return Response.json({ error: "LAB_API_BASE not configured" }, { status: 503 })
  }

  const url = new URL(req.url)
  const upstream = `${labBase}${url.pathname}${url.search}`

  const body = req.method !== "GET" ? await req.text() : undefined
  const res = await fetch(upstream, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body,
  })

  const data = await res.text()
  return new Response(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}
