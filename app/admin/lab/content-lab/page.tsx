"use client"

import { useEffect, useRef, useState } from "react"
import { PageHeader } from "@/components/lab/page-header"
import { labApi } from "@/lib/lab/api"

const PLATFORMS = [
  { id: "zhihu",    name: "知乎" },
  { id: "csdn",     name: "CSDN" },
  { id: "juejin",   name: "掘金" },
  { id: "devto",    name: "Dev.to" },
  { id: "hashnode", name: "Hashnode" },
  { id: "medium",   name: "Medium" },
  { id: "weibo",    name: "微博" },
  { id: "xiaohongshu", name: "小红书" },
]

type JobStatus = "idle" | "pending" | "running" | "success" | "failed" | "skipped"

interface PlatformJob {
  status: JobStatus
  job_id?: string
  url?: string
  error?: string
}

const STATUS_STYLE: Record<JobStatus, { dot: string; text: string; label: string }> = {
  idle:    { dot: "bg-border/40",           text: "text-muted-foreground/50", label: "—" },
  pending: { dot: "bg-muted-foreground/60", text: "text-muted-foreground",    label: "Queued" },
  running: { dot: "bg-[var(--gold)] animate-pulse", text: "text-[var(--gold)]", label: "Publishing…" },
  success: { dot: "bg-[var(--gold)]",       text: "text-[var(--gold)]",       label: "Published" },
  failed:  { dot: "bg-[var(--wine)]",       text: "text-[var(--wine)]",       label: "Failed" },
  skipped: { dot: "bg-muted-foreground/30", text: "text-muted-foreground/60", label: "Skipped" },
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
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [jobs, setJobs] = useState<Record<string, PlatformJob>>({})
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll running/pending jobs
  useEffect(() => {
    const hasActive = Object.values(jobs).some(
      (j) => j.status === "running" || j.status === "pending",
    )
    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const allJobs = await labApi.listPublishJobs().catch(() => [])
        setJobs((prev) => {
          const next = { ...prev }
          for (const [plat, pj] of Object.entries(prev)) {
            if (!pj.job_id) continue
            const found = allJobs.find((j) => j.id === pj.job_id)
            if (found) {
              next[plat] = {
                ...pj,
                status: found.status as JobStatus,
                url: found.published_url ?? undefined,
                error: found.error_msg ?? undefined,
              }
            }
          }
          return next
        })
      }, 4000)
    }
    if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [jobs])

  const generate = async () => {
    setGenerating(true)
    setResult(null)
    setJobs({})
    const id = Date.now().toString(36)
    try {
      const data = (await labApi.generateArticle(topic, lang, id)) as GenerateResult
      setResult({ ...data, article_id: data.article_id ?? id })
    } catch (e) {
      setResult({ error: (e as Error).message })
    } finally {
      setGenerating(false)
    }
  }

  const dispatchOne = async (platformId: string) => {
    if (!result?.article_id) return
    setJobs((prev) => ({ ...prev, [platformId]: { status: "pending" } }))
    try {
      const data = await labApi.createPublishJob(result.article_id, platformId)
      setJobs((prev) => ({
        ...prev,
        [platformId]: {
          status: data.skipped ? "skipped" : "pending",
          job_id: data.job_id,
        },
      }))
    } catch (e) {
      setJobs((prev) => ({
        ...prev,
        [platformId]: { status: "failed", error: (e as Error).message },
      }))
    }
  }

  const dispatchAll = async () => {
    if (!result?.article_id) return
    for (const p of PLATFORMS) {
      await dispatchOne(p.id)
    }
  }

  const anyActive = Object.values(jobs).some(
    (j) => j.status === "pending" || j.status === "running",
  )

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
              disabled={generating || !topic}
              className="group w-full py-3 bg-[var(--gold)] hover:bg-[var(--gold)]/90 disabled:opacity-30 disabled:cursor-not-allowed text-[oklch(0.21_0.13_300)] font-mono text-[11px] uppercase tracking-[0.3em] transition-all"
            >
              {generating ? (
                <span className="inline-flex items-center gap-2">
                  <span className="size-1 rounded-full bg-current animate-pulse" />
                  Drafting…
                </span>
              ) : (
                <>Generate Article <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span></>
              )}
            </button>
          </div>
        </div>

        {/* Right: preview + dispatch */}
        <div className="lg:col-span-3 space-y-4">
          {!result && !generating && (
            <div className="min-h-[400px] border border-dashed border-border/40 rounded-sm grid place-items-center">
              <div className="text-center">
                <div className="font-serif italic text-3xl text-muted-foreground/50 mb-2">No manuscript yet</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/50">Compose a brief to begin</div>
              </div>
            </div>
          )}

          {generating && (
            <div className="min-h-[400px] border border-border/40 rounded-sm grid place-items-center">
              <div className="text-center">
                <div className="size-2 rounded-full bg-[var(--gold)] animate-pulse mx-auto mb-4" />
                <div className="font-serif italic text-3xl text-foreground">Drafting&hellip;</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">Claude is composing your article</div>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="border border-[var(--wine)]/60 bg-[var(--wine)]/10 rounded-sm p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--wine)] mb-2">Error</div>
              <div className="font-mono text-sm text-foreground">{result.error}</div>
            </div>
          )}

          {result?.github_path && (
            <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--gold)]/70 mb-1">Manuscript</div>
                  <div className="font-mono text-[11px] text-muted-foreground break-all">{result.github_path}</div>
                </div>
                <span className="size-2 rounded-full bg-[var(--gold)]" />
              </div>

              <pre className="px-6 py-6 font-mono text-[12px] text-foreground/85 whitespace-pre-wrap leading-[1.7] max-h-[300px] overflow-auto">
                {result.preview}
              </pre>

              {/* Per-platform dispatch grid */}
              <div className="border-t border-border/40 px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                    Dispatch
                  </div>
                  <button
                    onClick={dispatchAll}
                    disabled={anyActive}
                    className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--gold)] border border-[var(--gold)]/60 hover:bg-[var(--gold)]/10 disabled:opacity-40 px-5 py-2 transition-colors"
                  >
                    {anyActive ? "Publishing…" : "Dispatch All →"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => {
                    const job = jobs[p.id] ?? { status: "idle" as JobStatus }
                    const s = STATUS_STYLE[job.status]
                    return (
                      <button
                        key={p.id}
                        onClick={() => dispatchOne(p.id)}
                        disabled={job.status === "running" || job.status === "pending"}
                        className="flex items-center justify-between border border-border/40 hover:border-[var(--gold)]/40 px-3 py-2.5 rounded-sm transition-colors disabled:cursor-not-allowed group"
                        title={job.error ?? undefined}
                      >
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground group-hover:text-foreground transition-colors">
                          {p.name}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`size-1.5 rounded-full ${s.dot}`} />
                          <span className={`font-mono text-[9px] uppercase tracking-[0.2em] ${s.text}`}>
                            {s.label}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
