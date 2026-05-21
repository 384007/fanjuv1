// Client-side fetch helpers for the Fanju AI SEO Lab admin UI.
// All requests are sent with Authorization: Bearer <admin_token cookie>.

const API_BASE = "/api/lab"

function getToken(): string {
  if (typeof document === "undefined") return ""
  return document.cookie.match(/admin_token=([^;]+)/)?.[1] ?? ""
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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

export const labApi = {
  listArticles: () => request<unknown[]>("/articles"),
  listPublishJobs: () => request<unknown[]>("/publish-jobs"),
  listPlatformAccounts: () => request<unknown[]>("/platform-accounts"),
  listSeoChecks: () => request<unknown[]>("/seo-checks"),
  stats: () => request<unknown>("/stats"),

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
}
