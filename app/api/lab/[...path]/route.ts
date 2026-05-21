// Catch-all Next.js route that proxies to the Cloudflare Worker (LAB_API_BASE)
// when configured. Otherwise serves mock data so the dashboard works in demo mode.

import { NextResponse } from "next/server"
import {
  mockArticles,
  mockJobs,
  mockPlatforms,
  mockSeoChecks,
  mockStats,
} from "@/lib/lab/mock"

export const dynamic = "force-dynamic"

const LAB_API_BASE = process.env.LAB_API_BASE
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "demo"

function authorize(req: Request): boolean {
  const header = req.headers.get("authorization") ?? ""
  const token = header.replace(/^Bearer\s+/i, "")
  return token === ADMIN_TOKEN
}

async function proxy(req: Request, path: string[]): Promise<Response> {
  const url = `${LAB_API_BASE}/${path.join("/")}`
  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      "Content-Type": "application/json",
    },
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text()
  }
  const upstream = await fetch(url, init)
  const body = await upstream.text()
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  })
}

function mock(method: string, path: string[], body: unknown): Response {
  const [head, sub] = path
  if (head === "stats") return NextResponse.json(mockStats)
  if (head === "articles") return NextResponse.json(mockArticles)
  if (head === "seo-checks") return NextResponse.json(mockSeoChecks)
  if (head === "generate") {
    const b = (body ?? {}) as { topic?: string; lang?: string; article_id?: string }
    const id = b.article_id ?? `art_${Date.now().toString(36)}`
    const yyyy = new Date().getFullYear()
    const mm = String(new Date().getMonth() + 1).padStart(2, "0")
    return NextResponse.json({
      article_id: id,
      github_path: `content/articles/${yyyy}/${mm}/${id}.md`,
      preview: `# ${b.topic ?? "Untitled"}\n\n[${b.lang ?? "zh"}] Mock-generated draft. Connect Modal worker to enable real AI generation.\n\n## 1. 介绍\n\n这里是 demo 内容，用于演示 Content Lab 流程...`,
    })
  }
  if (head === "publish-jobs") {
    if (method === "POST") {
      return NextResponse.json({ job_id: `job_${Date.now()}`, skipped: false })
    }
    return NextResponse.json(mockJobs)
  }
  if (head === "platform-accounts") {
    if (method === "PATCH" && sub) {
      const b = (body ?? {}) as { is_active?: number }
      return NextResponse.json({ ok: true, platform: sub, is_active: b.is_active ?? 0 })
    }
    return NextResponse.json(mockPlatforms)
  }
  return NextResponse.json({ error: "not found" }, { status: 404 })
}

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  const { path } = await ctx.params
  if (LAB_API_BASE) return proxy(req, path)

  let body: unknown = null
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.json()
    } catch {
      body = null
    }
  }
  return mock(req.method, path, body)
}

export const GET = handle
export const POST = handle
export const PATCH = handle
export const DELETE = handle
