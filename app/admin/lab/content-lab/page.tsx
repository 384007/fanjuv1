"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, FileText, Loader2, Play, SearchCheck, Send } from "lucide-react"
import { PageHeader } from "@/components/lab/page-header"
import { labApi } from "@/lib/lab/api"
import type { LabPlatformAccount } from "@/lib/lab/types"

const SUPPORTED_PLATFORMS = [
  { id: "zhihu", name: "知乎", type: "cookie" },
  { id: "csdn", name: "CSDN", type: "cookie" },
  { id: "juejin", name: "掘金", type: "cookie" },
  { id: "jianshu", name: "简书", type: "cookie" },
  { id: "weibo", name: "微博", type: "cookie" },
  { id: "xiaohongshu", name: "小红书", type: "cookie" },
  { id: "douban", name: "豆瓣", type: "cookie" },
  { id: "toutiao", name: "今日头条", type: "cookie" },
  { id: "baijiahao", name: "百家号", type: "cookie" },
  { id: "bilibili", name: "Bilibili", type: "cookie" },
  { id: "devto", name: "Dev.to", type: "api-key" },
  { id: "hashnode", name: "Hashnode", type: "api-key" },
  { id: "medium", name: "Medium", type: "api-key" },
  { id: "bluesky", name: "Bluesky", type: "api-key" },
  { id: "reddit", name: "Reddit", type: "api-key" },
] as const

type JobStatus = "idle" | "pending" | "running" | "success" | "failed" | "skipped"

interface PlatformJob {
  status: JobStatus
  job_id?: string
  url?: string
  error?: string
}

interface GenerateResult {
  github_path?: string
  preview?: string
  article_id?: string
  error?: string
}

interface SeoReport {
  score?: number
  verdict?: string
  issues?: string[] | string | null
  error?: string
}

const STATUS_STYLE: Record<JobStatus, { dot: string; text: string; label: string }> = {
  idle: { dot: "bg-muted-foreground/30", text: "text-muted-foreground/60", label: "Ready" },
  pending: { dot: "bg-muted-foreground/60", text: "text-muted-foreground", label: "Queued" },
  running: { dot: "bg-[var(--gold)] animate-pulse", text: "text-[var(--gold)]", label: "Running" },
  success: { dot: "bg-[var(--gold)]", text: "text-[var(--gold)]", label: "Success" },
  failed: { dot: "bg-[var(--wine)]", text: "text-[var(--wine)]", label: "Failed" },
  skipped: { dot: "bg-muted-foreground/30", text: "text-muted-foreground/60", label: "Skipped" },
}

function issueText(issues: SeoReport["issues"]) {
  if (!issues) return "No issues returned"
  if (Array.isArray(issues)) return issues.join("; ") || "No issues returned"
  return issues
}

function StepFlow({
  hasTopic,
  generating,
  generated,
  qcRunning,
  qcPassed,
  publishing,
}: {
  hasTopic: boolean
  generating: boolean
  generated: boolean
  qcRunning: boolean
  qcPassed: boolean
  publishing: boolean
}) {
  const steps = [
    { label: "Topic", done: hasTopic, active: !generated },
    { label: "Generate", done: generated, active: generating },
    { label: "SEO QC", done: qcPassed, active: qcRunning },
    { label: "Publish", done: false, active: publishing },
  ]

  return (
    <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
      {steps.map((step, index) => {
        const tone = step.done
          ? "border-[var(--gold)]/50 text-[var(--gold)]"
          : step.active
            ? "border-[var(--gold)]/40 text-foreground"
            : "border-border/40 text-muted-foreground"
        return (
          <div key={step.label} className={`border bg-card/35 px-4 py-3 ${tone}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{step.label}</span>
              {step.done ? (
                <CheckCircle2 className="size-4" />
              ) : step.active ? (
                <span className="size-2 rounded-full bg-[var(--gold)] live-dot" />
              ) : (
                <span className="font-mono text-[10px] text-muted-foreground">{index + 1}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ContentLabPage() {
  const [topic, setTopic] = useState("")
  const [lang, setLang] = useState<"zh" | "en">("zh")
  const [generating, setGenerating] = useState(false)
  const [qcRunning, setQcRunning] = useState(false)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [seoReport, setSeoReport] = useState<SeoReport | null>(null)
  const [jobs, setJobs] = useState<Record<string, PlatformJob>>({})
  const [accounts, setAccounts] = useState<LabPlatformAccount[]>([])
  const [platformApiConnected, setPlatformApiConnected] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    labApi
      .listPlatformAccounts()
      .then((data) => {
        setAccounts(data)
        setPlatformApiConnected(true)
      })
      .catch(() => {
        setAccounts([])
        setPlatformApiConnected(false)
      })
  }, [])

  useEffect(() => {
    const hasActive = Object.values(jobs).some(
      (job) => job.status === "running" || job.status === "pending",
    )
    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(async () => {
        const allJobs = await labApi.listPublishJobs().catch(() => [])
        setJobs((prev) => {
          const next = { ...prev }
          for (const [platform, publishJob] of Object.entries(prev)) {
            if (!publishJob.job_id) continue
            const found = allJobs.find((job) => job.id === publishJob.job_id)
            if (found) {
              next[platform] = {
                ...publishJob,
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

  const platformRows = useMemo(
    () =>
      SUPPORTED_PLATFORMS.map((platform) => ({
        ...platform,
        account: accounts.find((account) => account.platform === platform.id),
      })),
    [accounts],
  )
  const qcPassed = Number(seoReport?.score ?? 0) >= 90 && seoReport?.verdict !== "reject"
  const anyActive = Object.values(jobs).some(
    (job) => job.status === "pending" || job.status === "running",
  )

  const generate = async () => {
    setGenerating(true)
    setResult(null)
    setSeoReport(null)
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

  const runSeoQc = async () => {
    if (!result?.article_id || !result.github_path) return
    setQcRunning(true)
    setSeoReport(null)
    try {
      const report = await labApi.seoCheck(result.article_id, result.github_path)
      setSeoReport(report)
    } catch (e) {
      setSeoReport({ error: (e as Error).message })
    } finally {
      setQcRunning(false)
    }
  }

  const dispatchOne = async (platformId: string) => {
    if (!result?.article_id || !qcPassed) return
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
    if (!result?.article_id || !qcPassed) return
    for (const platform of platformRows) {
      if (platform.account && !platform.account.is_active) continue
      await dispatchOne(platform.id)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Section 02 - Content Pipeline"
        title="Content Lab"
        subtitle="Topic -> Generate -> SEO QC -> Publish. 发布按钮只在真实 SEO QC 达到 90 分后启用。"
      />

      <StepFlow
        hasTopic={Boolean(topic.trim())}
        generating={generating}
        generated={Boolean(result?.github_path)}
        qcRunning={qcRunning}
        qcPassed={qcPassed}
        publishing={anyActive}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="space-y-4 lg:col-span-2">
          <div className="border border-border/40 bg-card/40 p-5">
            <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--gold)]">
              <FileText className="size-4" />
              Topic
            </div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Article brief
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="深圳社交聚餐如何认识新朋友"
              rows={4}
              className="w-full resize-none border border-border/50 bg-background/40 p-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-[var(--gold)]/70"
            />

            <div className="mt-4 flex items-center gap-2">
              {(["zh", "en"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setLang(item)}
                  className={`border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                    lang === item
                      ? "border-[var(--gold)]/60 text-[var(--gold)]"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item === "zh" ? "中文" : "English"}
                </button>
              ))}
            </div>

            <button
              onClick={generate}
              disabled={generating || !topic.trim()}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[var(--gold)] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-[oklch(0.21_0.13_300)] transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            >
              {generating ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              {generating ? "Running" : "Generate"}
            </button>
          </div>

          <div className="border border-border/40 bg-card/35 p-5">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--gold)]">
              <SearchCheck className="size-4" />
              SEO QC
            </div>
            <button
              onClick={runSeoQc}
              disabled={!result?.github_path || qcRunning}
              className="inline-flex w-full items-center justify-center gap-2 border border-border/60 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:border-[var(--gold)]/60 hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {qcRunning ? <Loader2 className="size-4 animate-spin" /> : <SearchCheck className="size-4" />}
              {qcRunning ? "Running" : "Run SEO QC"}
            </button>
            {seoReport && (
              <div className="mt-4 space-y-2 font-mono text-[11px] text-muted-foreground">
                {seoReport.error ? (
                  <div className="text-[var(--wine)]">{seoReport.error}</div>
                ) : (
                  <>
                    <div className={qcPassed ? "text-[var(--gold)]" : "text-[var(--wine)]"}>
                      Score: {seoReport.score ?? "unknown"} / 100
                    </div>
                    <div>Verdict: {seoReport.verdict ?? "unknown"}</div>
                    <details>
                      <summary className="cursor-pointer list-none uppercase tracking-[0.18em]">
                        Issues
                      </summary>
                      <div className="mt-2 leading-relaxed">{issueText(seoReport.issues)}</div>
                    </details>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4 lg:col-span-3">
          {!result && !generating && (
            <div className="grid min-h-[320px] place-items-center border border-dashed border-border/45 bg-card/20 p-6 text-center">
              <div>
                <div className="font-serif text-3xl italic text-muted-foreground/70">
                  API 未连接 / 暂无数据
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/60">
                  Generate a draft to start the lab flow
                </div>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="border border-[var(--wine)]/60 bg-[var(--wine)]/10 p-5">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--wine)]">
                Failed
              </div>
              <div className="break-words font-mono text-sm text-foreground">{result.error}</div>
            </div>
          )}

          {result?.github_path && (
            <div className="overflow-hidden border border-border/40 bg-card/40">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
                <div className="min-w-0">
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--gold)]">
                    Generated draft
                  </div>
                  <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                    {result.github_path}
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--gold)]">
                  <CheckCircle2 className="size-4" />
                  Queued
                </span>
              </div>
              <pre className="max-h-[280px] overflow-auto whitespace-pre-wrap px-5 py-5 font-mono text-[12px] leading-7 text-foreground/85">
                {result.preview}
              </pre>
            </div>
          )}

          <div className="border border-border/40 bg-card/35">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  Publish
                </div>
                {!platformApiConnected && (
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                    Platform API 未连接 / 暂无数据
                  </div>
                )}
              </div>
              <button
                onClick={dispatchAll}
                disabled={!qcPassed || anyActive}
                className="inline-flex items-center gap-2 border border-[var(--gold)]/60 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--gold)] transition-colors hover:bg-[var(--gold)]/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Send className="size-4" />
                {anyActive ? "Running" : "Dispatch All"}
              </button>
            </div>

            <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
              {platformRows.map((platform) => {
                const job = jobs[platform.id] ?? { status: "idle" as JobStatus }
                const status = STATUS_STYLE[job.status]
                const inactive = platform.account ? !platform.account.is_active : false
                return (
                  <button
                    key={platform.id}
                    onClick={() => dispatchOne(platform.id)}
                    disabled={!qcPassed || inactive || job.status === "running" || job.status === "pending"}
                    className="min-w-0 border border-border/40 px-3 py-3 text-left transition-colors hover:border-[var(--gold)]/45 disabled:cursor-not-allowed disabled:opacity-45"
                    title={job.error ?? undefined}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-foreground">
                          {platform.name}
                        </div>
                        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                          {platform.type === "api-key" ? "API Key" : "Cookie"}
                          {inactive ? " / inactive" : ""}
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${status.dot}`} />
                        <span className={`font-mono text-[9px] uppercase tracking-[0.16em] ${status.text}`}>
                          {status.label}
                        </span>
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
