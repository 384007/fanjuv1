export default {
  async fetch(request, env) {
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
  },
}
