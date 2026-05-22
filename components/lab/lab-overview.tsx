"use client"

import { useEffect, useMemo, useState } from "react"
import type { ComponentType } from "react"
import { AlertTriangle, CheckCircle2, Clock3, Cookie, FileText, Gauge } from "lucide-react"
import { labApi } from "@/lib/lab/api"
import type { LabStats } from "@/lib/lab/types"

type OverviewItem = {
  label: string
  value: string | number
  tone: "gold" | "wine" | "muted"
  icon: ComponentType<{ className?: string }>
}

function countByStatus<T extends { status: string; count: number }>(
  rows: T[] | undefined,
  status: string,
) {
  return rows?.find((row) => row.status === status)?.count ?? 0
}

function OverviewCell({ item }: { item: OverviewItem }) {
  const tone =
    item.tone === "gold"
      ? "text-[var(--gold)] border-[var(--gold)]/30"
      : item.tone === "wine"
        ? "text-[var(--wine)] border-[var(--wine)]/30"
        : "text-muted-foreground border-border/40"
  const Icon = item.icon

  return (
    <div className={`min-w-0 border bg-card/35 px-4 py-3 ${tone}`}>
      <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
        <Icon className="size-3 shrink-0" />
        <span className="truncate">{item.label}</span>
      </div>
      <div className="mt-2 font-serif text-3xl leading-none text-foreground">{item.value}</div>
    </div>
  )
}

export function LabOverview() {
  const [stats, setStats] = useState<LabStats | null>(null)
  const [connected, setConnected] = useState(true)

  useEffect(() => {
    labApi
      .stats()
      .then((data) => {
        setStats(data)
        setConnected(true)
      })
      .catch(() => {
        setStats(null)
        setConnected(false)
      })
  }, [])

  const items = useMemo<OverviewItem[]>(() => {
    const ready = countByStatus(stats?.articles, "ready")
    const pending = countByStatus(stats?.jobs, "pending")
    const failed = countByStatus(stats?.jobs, "failed")
    const validCookies = stats?.platforms?.filter((p) => p.session_valid).length ?? 0
    const expiredCookies =
      stats?.platforms?.filter((p) => p.is_active && !p.session_valid).length ?? 0
    const average = stats?.seo?.average_score ?? "—"

    return [
      { label: "Ready Articles", value: ready, tone: "gold", icon: FileText },
      { label: "Pending Jobs", value: pending, tone: pending ? "muted" : "gold", icon: Clock3 },
      { label: "Failed Jobs", value: failed, tone: failed ? "wine" : "muted", icon: AlertTriangle },
      { label: "Valid Cookies", value: validCookies, tone: "gold", icon: CheckCircle2 },
      {
        label: "Expired Cookies",
        value: expiredCookies,
        tone: expiredCookies ? "wine" : "muted",
        icon: Cookie,
      },
      { label: "Average SEO Score", value: average, tone: "gold", icon: Gauge },
    ]
  }, [stats])

  return (
    <section className="border-b border-border/35 bg-background/75 px-4 py-4 backdrop-blur md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
            AI SEO Lab Overview
          </div>
          {!connected && (
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              API 未连接 / 暂无数据
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {items.map((item) => (
            <OverviewCell key={item.label} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
