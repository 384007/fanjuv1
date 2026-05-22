"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, RefreshCw, SearchCheck } from "lucide-react"
import type { LabSeoCheck, LabStats } from "@/lib/lab/types"
import { PageHeader } from "@/components/lab/page-header"
import { StatCard } from "@/components/lab/stat-card"
import { labApi } from "@/lib/lab/api"

function parseIssues(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value) as unknown
    if (Array.isArray(parsed)) return parsed.map((item) => String(item))
  } catch {
    // D1 may hold a plain-text issue summary from older runs.
  }
  return value
    .split(/;|\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  return value.replace("T", " ").slice(0, 16)
}

function ScoreRing({ score }: { score: number }) {
  const tone =
    score >= 90
      ? { color: "var(--gold)", label: "Ready" }
      : score >= 70
        ? { color: "oklch(0.78 0.16 70)", label: "Review" }
        : { color: "var(--wine)", label: "Fix First" }
  const pct = Math.max(0, Math.min(100, score))
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative grid size-10 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${tone.color} ${pct * 3.6}deg, oklch(0.36 0.16 300 / 0.4) 0deg)`,
        }}
      >
        <div className="absolute inset-[3px] grid place-items-center rounded-full bg-card">
          <span className="font-mono text-[11px] font-bold" style={{ color: tone.color }}>
            {score}
          </span>
        </div>
      </div>
      <span
        className="font-mono text-[9px] uppercase tracking-[0.18em]"
        style={{ color: tone.color }}
      >
        {tone.label}
      </span>
    </div>
  )
}

export default function SeoPage() {
  const [checks, setChecks] = useState<LabSeoCheck[]>([])
  const [stats, setStats] = useState<LabStats | null>(null)
  const [connected, setConnected] = useState(true)

  const load = () => {
    Promise.all([labApi.listSeoChecks(), labApi.stats()])
      .then(([seoChecks, summary]) => {
        setChecks(seoChecks)
        setStats(summary)
        setConnected(true)
      })
      .catch(() => {
        setChecks([])
        setStats(null)
        setConnected(false)
      })
  }

  useEffect(() => {
    load()
  }, [])

  const sortedChecks = useMemo(
    () => [...checks].sort((a, b) => a.score - b.score || a.checked_at.localeCompare(b.checked_at)),
    [checks],
  )
  const avg = checks.length
    ? Math.round(checks.reduce((sum, check) => sum + check.score, 0) / checks.length)
    : stats?.seo?.average_score ?? 0
  const lowScoreCount = checks.filter((check) => check.score < 90).length
  const issueCount = checks.reduce((sum, check) => sum + parseIssues(check.issues).length, 0)

  return (
    <div>
      <PageHeader
        eyebrow="Section 01 - Quality Control"
        title="SEO Control"
        subtitle="低分文章优先显示。没有 Worker / D1 / Modal 返回的真实数据时，页面只显示未连接状态。"
        actions={
          <button
            onClick={load}
            className="inline-flex items-center gap-2 border border-border/60 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
          >
            <RefreshCw className="size-3" />
            Refresh
          </button>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Average Score" value={avg || "—"} hint="Real checks only" accent="gold" />
        <StatCard label="Below 90" value={lowScoreCount} hint="Fix first" accent="wine" />
        <StatCard label="Issues" value={issueCount} hint="Expandable" />
        <StatCard label="Checks" value={checks.length} hint="D1 records" />
      </div>

      {!connected && (
        <div className="mb-6 border border-border/40 bg-card/35 p-5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            <AlertTriangle className="size-4 text-[var(--wine)]" />
            API 未连接 / 暂无数据
          </div>
        </div>
      )}

      <section className="overflow-hidden border border-border/40 bg-card/35">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 px-4 py-4 md:px-6">
          <div>
            <h2 className="font-serif text-2xl italic text-foreground">Review Queue</h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Sorted by lowest score
            </p>
          </div>
          <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <SearchCheck className="size-4 text-[var(--gold)]" />
            {checks.length} {checks.length === 1 ? "Entry" : "Entries"}
          </div>
        </div>

        <div className="hidden md:block">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="text-left font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                <th className="w-[28%] px-6 py-3 font-normal">Article</th>
                <th className="w-[18%] px-6 py-3 font-normal">Score</th>
                <th className="w-[16%] px-6 py-3 font-normal">Verdict</th>
                <th className="px-6 py-3 font-normal">Issues</th>
                <th className="w-[16%] px-6 py-3 text-right font-normal">Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {sortedChecks.map((check) => {
                const issues = parseIssues(check.issues)
                return (
                  <tr
                    key={check.id}
                    className="border-t border-border/30 transition-colors hover:bg-[var(--gold)]/[0.03]"
                  >
                    <td className="px-6 py-5">
                      <div className="break-words font-serif text-lg italic text-foreground">
                        {check.title || check.slug || check.article_id}
                      </div>
                      {check.slug && (
                        <div className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                          {check.slug}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <ScoreRing score={check.score} />
                    </td>
                    <td className="px-6 py-5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {check.verdict ?? "unknown"}
                    </td>
                    <td className="px-6 py-5">
                      {issues.length ? (
                        <details className="group">
                          <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-[var(--gold)]">
                            {issues.length} issue{issues.length === 1 ? "" : "s"} - expand
                          </summary>
                          <ul className="mt-3 space-y-2 font-mono text-[11px] leading-relaxed text-muted-foreground/85">
                            {issues.map((issue) => (
                              <li key={issue} className="break-words">
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : (
                        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--gold)]">
                          Clear
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                      {formatDate(check.checked_at)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border/30 md:hidden">
          {sortedChecks.map((check) => {
            const issues = parseIssues(check.issues)
            return (
              <article key={check.id} className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="break-words font-serif text-xl italic text-foreground">
                      {check.title || check.slug || check.article_id}
                    </div>
                    <div className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                      {formatDate(check.checked_at)}
                    </div>
                  </div>
                  <ScoreRing score={check.score} />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Verdict: {check.verdict ?? "unknown"}
                </div>
                {issues.length ? (
                  <details>
                    <summary className="cursor-pointer list-none font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {issues.length} issue{issues.length === 1 ? "" : "s"} - expand
                    </summary>
                    <ul className="mt-3 space-y-2 font-mono text-[11px] leading-relaxed text-muted-foreground/85">
                      {issues.map((issue) => (
                        <li key={issue} className="break-words">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--gold)]">
                    Clear
                  </div>
                )}
              </article>
            )
          })}
        </div>

        {checks.length === 0 && (
          <div className="px-6 py-16 text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70">
              API 未连接 / 暂无数据
            </span>
          </div>
        )}
      </section>
    </div>
  )
}
