"use client"

import { useState } from "react"

const MODAL_URL =
  process.env.NEXT_PUBLIC_MODAL_BASE_URL ?? "https://fanju-backend--lab-worker-web.modal.run"

const PLATFORMS = ["zhihu", "csdn", "juejin", "devto", "hashnode"]

function getToken(): string {
  if (typeof document === "undefined") return ""
  return document.cookie.match(/admin_token=([^;]+)/)?.[1] ?? ""
}

interface GenerateResult {
  github_path?: string
  preview?: string
  article_id?: string
  error?: string
}

export default function ContentLabPage() {
  const [topic, setTopic] = useState("")
  const [lang, setLang] = useState<"zh" | "en">("zh")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [queueing, setQueueing] = useState(false)
  const [queueMsg, setQueueMsg] = useState("")

  const generate = async () => {
    setLoading(true)
    setResult(null)
    setQueueMsg("")
    const token = getToken()
    const id = Date.now().toString(36)

    try {
      const res = await fetch(`${MODAL_URL}/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, lang, article_id: id }),
      })
      const data = (await res.json()) as GenerateResult
      setResult({ ...data, article_id: id })
    } catch (e) {
      setResult({ error: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  const publishAll = async () => {
    if (!result?.article_id) return
    setQueueing(true)
    const token = getToken()
    let queued = 0
    let skipped = 0

    for (const p of PLATFORMS) {
      try {
        const res = await fetch("/api/lab/publish-jobs", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ article_id: result.article_id, platform: p }),
        })
        const data = (await res.json()) as { skipped?: boolean }
        if (data.skipped) skipped += 1
        else queued += 1
      } catch {
        skipped += 1
      }
    }

    setQueueMsg(`Queued ${queued}, skipped ${skipped}.`)
    setQueueing(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-mono font-bold text-amber-400">Content Lab</h1>

      <div className="space-y-3">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (e.g. 深圳社交聚餐如何认识新朋友)"
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "zh" | "en")}
            className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white font-mono text-sm"
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
          <button
            onClick={generate}
            disabled={loading || !topic}
            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-6 py-2 rounded font-mono text-sm transition-colors"
          >
            {loading ? "Generating..." : "Generate Article"}
          </button>
        </div>
      </div>

      {result?.error && (
        <div className="bg-red-950 border border-red-900 rounded p-4 font-mono text-sm text-red-300">
          Error: {result.error}
        </div>
      )}

      {result?.github_path && (
        <div className="bg-zinc-900 border border-zinc-700 rounded p-4 space-y-3">
          <div className="text-green-400 font-mono text-sm break-all">
            Generated: {result.github_path}
          </div>
          {result.preview && (
            <pre className="text-zinc-400 font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {result.preview}
            </pre>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={publishAll}
              disabled={queueing}
              className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white font-mono text-sm px-4 py-2 rounded transition-colors"
            >
              {queueing ? "Queueing..." : "Queue All Platforms"}
            </button>
            {queueMsg && <span className="text-xs font-mono text-zinc-400">{queueMsg}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
