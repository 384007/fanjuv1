"use client"

import { useEffect, useState } from "react"
import type { LabSeoCheck, LabStats } from "@/lib/lab/types"
import { PageHeader } from "@/components/lab/page-header"
import { StatCard } from "@/components/lab/stat-card"
import { labApi } from "@/lib/lab/api"

function ScoreRing({ score }: { score: number }) {
  const tone =
    score >= 80
      ? { color: "var(--gold)", label: "Excellent" }
      : score >= 60
        ? { color: "oklch(0.78 0.16 70)", label: "Acceptable" }
        : { color: "var(--wine)", label: "At Risk" }
  const pct = Math.max(0, Math.min(100, score))
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative size-10 rounded-full grid place-items-center"
        style={{
          background: `conic-gradient(${tone.color} ${pct * 3.6}deg, oklch(0.36 0.16 300 / 0.4) 0deg)`,
        }}
      >
        <div className="absolute inset-[3px] rounded-full bg-card grid place-items-center">
          <span className="font-mono text-[11px] font-bold" style={{ color: tone.color }}>
            {score}
          </span>
        </div>
      </div>
      <span
        className="font-mono text-[9px] uppercase tracking-[0.2em]"
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

  useEffect(() => {
    labApi
      .listSeoChecks()
      .then(setChecks)
      .catch(() => setChecks([]))
    labApi
      .stats()
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  const avg = checks.length
    ? Math.round(checks.reduce((s, c) => s + c.score, 0) / checks.length)
    : 0

  return (
    <div>
      <PageHeader
        eyebrow="Section 01 — Quality Control"
        title="SEO Atelier"
        subtitle="A curated review of every published draft. Each verdict is hand-graded by Claude across structure, density, and intent."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <StatCard label="Average Score" value={avg} hint="Across all reviews" accent="gold" />
        {stats?.articles?.slice(0, 3).map((s, i) => (
          <StatCard
            key={s.status}
            label={s.status}
            value={s.count}
            hint="Articles"
            accent={i === 0 ? "wine" : "default"}
          />
        ))}
      </div>

      <div className="bg-card/40 backdrop-blur-sm border border-border/40 rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
          <h2 className="font-serif italic text-2xl text-foreground">Review Ledger</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {checks.length} {checks.length === 1 ? "Entry" : "Entries"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                <th className="px-6 py-3 font-normal">Article</th>
                <th className="px-6 py-3 font-normal">Score</th>
                <th className="px-6 py-3 font-normal">Verdict</th>
                <th className="px-6 py-3 font-normal">Issues</th>
                <th className="px-6 py-3 font-normal text-right">Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-border/30 hover:bg-[var(--gold)]/[0.03] transition-colors"
                >
                  <td className="px-6 py-5 font-serif italic text-lg text-foreground">
                    {c.slug ?? c.article_id}
                  </td>
                  <td className="px-6 py-5">
                    <ScoreRing score={c.score} />
                  </td>
                  <td className="px-6 py-5 font-mono text-xs text-muted-foreground">
                    {c.verdict ?? "—"}
                  </td>
                  <td className="px-6 py-5 font-mono text-[11px] text-muted-foreground/80 max-w-md truncate">
                    {c.issues}
                  </td>
                  <td className="px-6 py-5 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                    {c.checked_at?.slice(0, 16)}
                  </td>
                </tr>
              ))}
              {checks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
                      No reviews yet
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
