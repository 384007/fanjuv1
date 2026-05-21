"use client"

import { useEffect, useState } from "react"
import type { LabPublishJob } from "@/lib/lab/types"
import { PageHeader } from "@/components/lab/page-header"
import { StatCard } from "@/components/lab/stat-card"
import { labApi } from "@/lib/lab/api"

const STATUS_STYLE: Record<string, { dot: string; text: string; label: string }> = {
  success: { dot: "bg-[var(--gold)]", text: "text-[var(--gold)]", label: "Published" },
  failed: { dot: "bg-[var(--wine)]", text: "text-[var(--wine)]", label: "Failed" },
  running: {
    dot: "bg-[var(--gold)] live-dot",
    text: "text-[var(--gold)]",
    label: "In Flight",
  },
  pending: { dot: "bg-muted-foreground/60", text: "text-muted-foreground", label: "Pending" },
  skipped: { dot: "bg-muted-foreground/30", text: "text-muted-foreground/60", label: "Skipped" },
}

export default function PublishJobsPage() {
  const [jobs, setJobs] = useState<LabPublishJob[]>([])

  const load = () => {
    labApi
      .listPublishJobs()
      .then(setJobs)
      .catch(() => setJobs([]))
  }

  useEffect(() => {
    load()
  }, [])

  const counts = jobs.reduce(
    (acc, j) => {
      acc[j.status] = (acc[j.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div>
      <PageHeader
        eyebrow="Section 03 — Dispatch"
        title="Publish Jobs"
        subtitle="The dispatch ledger: every article, every platform, every attempt — preserved with care."
        actions={
          <button
            onClick={load}
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-[var(--gold)] border border-border/60 hover:border-[var(--gold)]/60 px-4 py-2 transition-colors"
          >
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <StatCard label="Published" value={counts.success ?? 0} accent="gold" hint="Successful" />
        <StatCard label="In Flight" value={counts.running ?? 0} hint="Active" />
        <StatCard label="Pending" value={counts.pending ?? 0} hint="Queued" />
        <StatCard label="Failed" value={counts.failed ?? 0} accent="wine" hint="Need attention" />
      </div>

      <div className="bg-card/40 backdrop-blur-sm border border-border/40 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                <th className="px-6 py-4 font-normal">Article</th>
                <th className="px-6 py-4 font-normal">Platform</th>
                <th className="px-6 py-4 font-normal">Status</th>
                <th className="px-6 py-4 font-normal">URL</th>
                <th className="px-6 py-4 font-normal">Attempts</th>
                <th className="px-6 py-4 font-normal text-right">Finished</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const s = STATUS_STYLE[j.status] ?? STATUS_STYLE.pending
                return (
                  <tr
                    key={j.id}
                    className="border-t border-border/30 hover:bg-[var(--gold)]/[0.03] transition-colors"
                  >
                    <td className="px-6 py-5 font-serif italic text-base text-foreground">
                      {j.article_slug ?? j.article_id}
                    </td>
                    <td className="px-6 py-5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {j.platform}
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center gap-2">
                        <span className={`size-1.5 rounded-full ${s.dot}`} />
                        <span
                          className={`font-mono text-[10px] uppercase tracking-[0.25em] ${s.text}`}
                        >
                          {s.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {j.published_url ? (
                        <a
                          href={j.published_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--gold)] hover:underline"
                        >
                          View →
                        </a>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 font-mono text-xs text-muted-foreground">
                      {j.attempt_count}
                    </td>
                    <td className="px-6 py-5 text-right font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                      {j.finished_at?.slice(0, 16) ?? "—"}
                    </td>
                  </tr>
                )
              })}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
                      No dispatches recorded
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
