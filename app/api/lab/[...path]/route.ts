import { NextRequest, NextResponse } from "next/server"

// Proxy /api/lab/* → Cloudflare Lab Worker
// Falls back to mock mode when LAB_API_BASE is not set (static export / demo).
const LAB_API_BASE = (process.env.LAB_API_BASE ?? "").replace(/\/+$/, "")
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "demo"

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params)
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params)
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, await params)
}

async function proxy(req: NextRequest, params: { path: string[] }) {
  // Auth check
  const token = req.cookies.get("admin_token")?.value
  if (!token || token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  if (!LAB_API_BASE) {
    return NextResponse.json({ error: "LAB_API_BASE not configured" }, { status: 503 })
  }

  const path = "/" + params.path.join("/")
  const url = `${LAB_API_BASE}/api/lab${path}${req.nextUrl.search}`

  const body = req.method !== "GET" ? await req.text() : undefined
  const res = await fetch(url, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ADMIN_TOKEN}`,
    },
    body,
  })

  const data = await res.text()
  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  })
}
