"use client"

import { useEffect, useState } from "react"
import type { LabPlatformAccount } from "@/lib/lab/types"
import { PageHeader } from "@/components/lab/page-header"
import { labApi } from "@/lib/lab/api"

export default function PlatformAccountsPage() {
  const [platforms, setPlatforms] = useState<LabPlatformAccount[]>([])

  useEffect(() => {
    labApi
      .listPlatformAccounts()
      .then(setPlatforms)
      .catch(() => setPlatforms([]))
  }, [])

  const toggle = async (platform: string, isActive: boolean) => {
    await labApi.togglePlatform(platform, !isActive)
    setPlatforms((prev) =>
      prev.map((a) =>
        a.platform === platform ? { ...a, is_active: isActive ? 0 : 1 } : a,
      ),
    )
  }

  const activeCount = platforms.filter((p) => p.is_active).length
  const expiredCount = platforms.filter((p) => p.is_active && !p.session_valid).length

  return (
    <div>
      <PageHeader
        eyebrow="Section 04 — Network"
        title="Platform Accounts"
        subtitle="Fifteen channels, each with its own rhythm. Daily caps and session integrity, monitored continuously."
        actions={
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.25em]">
            <span className="text-[var(--gold)]">
              <span className="font-serif italic text-2xl mr-1 not-italic">{activeCount}</span>
              Active
            </span>
            {expiredCount > 0 && (
              <span className="text-[var(--wine)]">
                <span className="font-serif italic text-2xl mr-1">{expiredCount}</span>
                Expired
              </span>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {platforms.map((p) => {
          const active = !!p.is_active
          const ratio = p.daily_limit ? p.published_today / p.daily_limit : 0
          const ratioPct = Math.min(100, Math.round(ratio * 100))
          const ratioTone =
            ratio >= 1
              ? "var(--wine)"
              : ratio >= 0.7
                ? "oklch(0.78 0.16 70)"
                : "var(--gold)"
          return (
            <div
              key={p.platform}
              className={`group relative bg-card/40 backdrop-blur-sm border rounded-sm p-5 transition-all ${
                active
                  ? "border-border/50 hover:border-[var(--gold)]/50"
                  : "border-border/20 opacity-50"
              }`}
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="font-serif italic text-2xl text-foreground leading-none">
                    {p.display_name}
                  </div>
                  <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/70">
                    {p.platform}
                  </div>
                </div>
                <button
                  onClick={() => toggle(p.platform, active)}
                  aria-pressed={active}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                    active ? "bg-[var(--gold)]" : "bg-border/60"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-card transition-transform ${
                      active ? "translate-x-[22px]" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground mb-1.5">
                    <span>Today</span>
                    <span style={{ color: ratioTone }}>
                      {p.published_today} / {p.daily_limit}
                    </span>
                  </div>
                  <div className="h-px bg-border/30 relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 transition-all"
                      style={{ width: `${ratioPct}%`, background: ratioTone }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.25em]">
                  <span className="text-muted-foreground">Session</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className={`size-1 rounded-full ${
                        p.session_valid ? "bg-[var(--gold)]" : "bg-[var(--wine)]"
                      }`}
                    />
                    <span
                      className={p.session_valid ? "text-[var(--gold)]" : "text-[var(--wine)]"}
                    >
                      {p.session_valid ? "Valid" : "Expired"}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )
        })}

        {platforms.length === 0 && (
          <div className="col-span-full text-center py-20">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
              No platforms configured
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
