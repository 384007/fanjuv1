"use client"

import { useState } from "react"

type Result = { ok: boolean; data?: unknown; error?: string }

const API_BASE = process.env.NEXT_PUBLIC_FANJU_API_BASE || ""

export function CreateDinnerForm() {
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(formData: FormData) {
    setLoading(true)
    const payload = Object.fromEntries(formData.entries())
    if (!API_BASE) {
      setResult({ ok: true, data: { id: `local-${Date.now()}`, state: "draft", ...payload } })
      setLoading(false)
      return
    }
    const res = await fetch(`${API_BASE}/dinners`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
    setResult(await res.json())
    setLoading(false)
  }

  return (
    <form action={submit} className="grid gap-4 border border-border/60 bg-card/30 p-5">
      <input name="title" className="border border-border bg-background px-4 py-3 text-sm" placeholder="饭局标题" />
      <input name="city" className="border border-border bg-background px-4 py-3 text-sm" placeholder="城市" />
      <input name="area" className="border border-border bg-background px-4 py-3 text-sm" placeholder="区域" />
      <input name="type" className="border border-border bg-background px-4 py-3 text-sm" placeholder="饭局类型" />
      <input name="date" className="border border-border bg-background px-4 py-3 text-sm" placeholder="日期" />
      <input name="time" className="border border-border bg-background px-4 py-3 text-sm" placeholder="时间" />
      <input name="seats" className="border border-border bg-background px-4 py-3 text-sm" placeholder="人数" />
      <textarea name="summary" className="min-h-24 border border-border bg-background px-4 py-3 text-sm" placeholder="饭局说明" />
      <button disabled={loading} className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase disabled:opacity-60">{loading ? "Saving..." : "Create"}</button>
      {result ? <pre className="max-h-64 overflow-auto whitespace-pre-wrap border border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">{JSON.stringify(result, null, 2)}</pre> : null}
    </form>
  )
}
