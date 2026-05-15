"use client"

import { useState } from "react"

type Result = { ok: boolean; data?: unknown; error?: string }

const API_BASE = process.env.NEXT_PUBLIC_FANJU_API_BASE || ""

export function SeatForm({ table = "demo-table" }: { table?: string }) {
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(formData: FormData) {
    setLoading(true)
    const payload = Object.fromEntries(formData.entries())
    if (!API_BASE) {
      setResult({ ok: true, data: { id: `seat-${Date.now()}`, table, state: "pending", ...payload } })
      setLoading(false)
      return
    }
    const res = await fetch(`${API_BASE}/seat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ table, ...payload }),
    })
    setResult(await res.json())
    setLoading(false)
  }

  return (
    <form action={submit} className="grid gap-4 border border-border/60 bg-card/30 p-5">
      <input name="displayName" className="border border-border bg-background px-4 py-3 text-sm" placeholder="你的称呼" />
      <input name="city" className="border border-border bg-background px-4 py-3 text-sm" placeholder="所在城市" />
      <input name="role" className="border border-border bg-background px-4 py-3 text-sm" placeholder="行业/身份" />
      <textarea name="message" className="min-h-24 border border-border bg-background px-4 py-3 text-sm" placeholder="想认识什么样的人？有什么饮食偏好？" />
      <button disabled={loading} className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase disabled:opacity-60">{loading ? "Sending..." : "提交席位"}</button>
      {result ? <pre className="max-h-64 overflow-auto whitespace-pre-wrap border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">{JSON.stringify(result, null, 2)}</pre> : null}
    </form>
  )
}
