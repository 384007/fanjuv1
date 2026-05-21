// Client-side fetch helpers for the Fanju AI SEO Lab admin UI.
// All requests are sent with Authorization: Bearer <admin_token cookie>.

import {
  mockArticles,
  mockJobs,
  mockPlatforms,
  mockSeoChecks,
  mockStats,
} from "@/lib/lab/mock"
import type {
  LabArticle,
  LabPlatformAccount,
  LabPublishJob,
  LabSeoCheck,
  LabStats,
} from "@/lib/lab/types"

// NEXT_PUBLIC_LAB_API_BASE → direct Cloudflare Worker call
// unset → /api/lab proxy (server-side LAB_API_BASE required)
// static export / demo → mock mode (API_BASE stays empty string)
const API_BASE = (process.env.NEXT_PUBLIC_LAB_API_BASE || (typeof window !== "undefined" ? "/api/lab" : "")).replace(/\/+$/, "")

function getToken(): string {
  if (typeof document === "undefined") return ""
  return document.cookie.match(/admin_token=([^;]+)/)?.[1] ?? ""
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE) return mockRequest<T>(path, init)

  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
  if (!res.ok) {
    throw new Error(`lab api ${path} failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function mockRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = String(init.method || "GET").toUpperCase()
  if (path === "/articles") return mockArticles as T
  if (path === "/seo-checks") return mockSeoChecks as T
  if (path === "/stats") return mockStats as T
  if (path === "/publish-jobs") {
    if (method === "POST") return { job_id: `job_${Date.now()}`, skipped: false } as T
    return mockJobs as T
  }
  if (path === "/platform-accounts") return mockPlatforms as T
  if (path.startsWith("/platform-accounts/") && method === "PATCH") {
    return { ok: true } as T
  }
  if (path.startsWith("/check-cookie") && method === "POST") {
    const body = JSON.parse(String(init.body || "{}")) as { platform?: string }
    const plat = body.platform ?? ""
    const found = mockPlatforms.find((p) => p.platform === plat)
    return {
      platform: plat,
      session_valid: found ? !!found.session_valid : false,
      configured: !!found,
      error: null,
    } as T
  }
  if (path.startsWith("/validate-all-cookies") && method === "POST") {
    const report: Record<string, { valid: boolean; configured: boolean }> = {}
    for (const p of mockPlatforms) {
      report[p.platform] = { valid: !!p.session_valid, configured: true }
    }
    return { updated: mockPlatforms.length, report } as T
  }
  if (path === "/generate" && method === "POST") {
    const body = JSON.parse(String(init.body || "{}")) as {
      topic?: string
      lang?: "zh" | "en"
      article_id?: string
    }
    const id = body.article_id ?? `art_${Date.now().toString(36)}`
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    return {
      article_id: id,
      github_path: `content/articles/${yyyy}/${mm}/${id}.md`,
      preview: `# ${body.topic ?? "Untitled"}\n\n[${body.lang ?? "zh"}] Mock draft. Set NEXT_PUBLIC_LAB_API_BASE to connect the deployed lab Worker.\n\n## Opening table\n\nThis local preview keeps the static export working while the production article pipeline continues through Modal, GitHub, and Cloudflare Pages.`,
    } as T
  }
  throw new Error(`mock lab api ${path} not implemented`)
}

export const labApi = {
  listArticles: () => request<LabArticle[]>("/articles"),
  listPublishJobs: () => request<LabPublishJob[]>("/publish-jobs"),
  listPlatformAccounts: () => request<LabPlatformAccount[]>("/platform-accounts"),
  listSeoChecks: () => request<LabSeoCheck[]>("/seo-checks"),
  stats: () => request<LabStats>("/stats"),

  generateArticle: (topic: string, lang: "zh" | "en", article_id: string) =>
    request<{ article_id?: string; github_path?: string; preview?: string; error?: string }>(
      "/generate",
      { method: "POST", body: JSON.stringify({ topic, lang, article_id }) },
    ),

  createPublishJob: (article_id: string, platform: string) =>
    request<{ job_id?: string; skipped?: boolean }>("/publish-jobs", {
      method: "POST",
      body: JSON.stringify({ article_id, platform }),
    }),

  togglePlatform: (platform: string, is_active: boolean) =>
    request<{ ok: true }>(`/platform-accounts/${platform}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: is_active ? 1 : 0 }),
    }),

  checkCookie: (platform: string) =>
    request<{ platform: string; session_valid: boolean; configured: boolean; error?: string | null }>(
      "/check-cookie",
      { method: "POST", body: JSON.stringify({ platform }) },
    ),

  validateAllCookies: () =>
    request<{ updated?: number; report?: Record<string, { valid: boolean; configured: boolean }>; skipped?: boolean }>(
      "/validate-all-cookies",
      { method: "POST", body: JSON.stringify({}) },
    ),
}
