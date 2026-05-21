"use client"

import { useState } from "react"
import { PageHeader } from "@/components/lab/page-header"

const PLATFORMS = [
  { id: "zhihu", name: "Zhihu" },
  { id: "csdn", name: "CSDN" },
  { id: "juejin", name: "Juejin" },
  { id: "devto", name: "dev.to" },
  { id: "hashnode", name: "Hashnode" },
]

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
      const res = await fetch(`/api/lab/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ topic, lang, article_id: id }),
      })
      const data = (await res.json()) as GenerateResult
      setResult({ ...data, article_id: data.article_id ?? id })
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
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ article_id: result.article_id, platform: p.id }),
        })
        const data = (await res.json()) as { skipped?: boolean }
        if (data.skipped) skipped += 1
        else queued += 1
      } catch {
        skipped += 1
      }
    }
    setQueueMsg(`Queued ${queued} · Skipped ${skipped}`)
    setQueueing(false)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Section 02 — Atelier"
        title="Content Lab"
        subtitle="Compose a topic. Claude drafts the manuscript. Review, then dispatch across the publication network."
      />

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: composer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative bg-card/50 backdrop-blur-sm border border-border/40 rounded-sm p-7">
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--gold)]/70 mb-4">
              The Brief
            </div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
              Topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="深圳社交聚餐如何认识新朋友"
              rows={3}
              className="w-full bg-transparent border-b border-border/60 focus:border-[var(--gold)] outline-none resize-none px-0 py-2 text-foreground font-serif italic text-2xl placeholder:text-muted-foreground/40 placeholder:not-italic placeholder:font-mono placeholder:text-sm transition-colors"
            />

            <div className="mt-6 flex items-center gap-1 border-b border-border/40 pb-1 mb-6">
              {(["zh", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] transition-colors ${
                    lang === l
                      ? "text-[var(--gold)] border-b border-[var(--gold)] -mb-px"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l === "zh" ? "中文" : "English"}
                </button>
              ))}
            </div>

            <button
              onClick={generate}
              disabled={loading || !topic}
              className="group w-full py-3 bg-[var(--gold)] hover:bg-[var(--gold)]/90 disabled:opacity-30 disabled:cursor-not-allowed text-[oklch(0.21_0.13_300)] font-mono text-[11px] uppercase tracking-[0.3em] transition-all"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-1 rounded-full bg-current animate-pulse" />
                  Drafting
                </span>
              ) : (
                <>
                  Generate Article{" "}
                  <span className="inline-block transition-transform group-hover:translate-x-1">
                    &rarr;
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/70 leading-relaxed px-2">
            Powered by Claude Sonnet · GitHub-versioned · Idempotent dispatch
          </div>
        </div>

        {/* Right: preview */}
        <div className="lg:col-span-3">
          {!result && !loading && (
            <div className="h-full min-h-[400px] border border-dashed border-border/40 rounded-sm grid place-items-center">
              <div className="text-center">
                <div className="font-serif italic text-3xl text-muted-foreground/50 mb-2">
                  No manuscript yet
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50">
                  Compose a brief to begin
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="h-full min-h-[400px] border border-border/40 rounded-sm grid place-items-center">
              <div className="text-center">
                <div className="size-2 rounded-full bg-[var(--gold)] live-dot mx-auto mb-4" />
                <div className="font-serif italic text-3xl text-foreground">
                  Drafting&hellip;
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">
                  Claude is composing your article
                </div>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="border border-[var(--wine)]/60 bg-[var(--wine)]/10 rounded-sm p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--wine)] mb-2">
                Error
              </div>
              <div className="font-mono text-sm text-foreground">{result.error}</div>
            </div>
          )}

          {result?.github_path && (
            <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--gold)]/70 mb-1">
                    Manuscript
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground break-all">
                    {result.github_path}
                  </div>
                </div>
                <span className="size-2 rounded-full bg-[var(--gold)]" />
              </div>

              <pre className="px-6 py-6 font-mono text-[12px] text-foreground/85 whitespace-pre-wrap leading-[1.7] max-h-[400px] overflow-auto">
                {result.preview}
              </pre>

              <div className="border-t border-border/40 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {PLATFORMS.map((p) => (
                    <span
                      key={p.id}
                      className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground border border-border/60 px-2 py-1 rounded-sm"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
                <button
                  onClick={publishAll}
                  disabled={queueing}
                  className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] border border-[var(--gold)]/60 hover:bg-[var(--gold)]/10 disabled:opacity-40 px-5 py-2.5 transition-colors"
                >
                  {queueing ? "Dispatching…" : "Dispatch All →"}
                </button>
              </div>
              {queueMsg && (
                <div className="px-6 pb-5 font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--gold)]/80">
                  {queueMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
