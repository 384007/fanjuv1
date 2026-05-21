"use client"

import { useEffect, useState } from "react"
import type { LabPlatformAccount } from "@/lib/lab/types"
import { PageHeader } from "@/components/lab/page-header"
import { labApi } from "@/lib/lab/api"

// Platforms that use API keys instead of cookies
const API_KEY_PLATFORMS = new Set(["devto", "hashnode", "medium", "bluesky", "reddit"])

type CheckState = "idle" | "checking" | "done" | "error"

interface CookieStatus {
  valid: boolean
  configured: boolean
  error?: string | null
}

export default function PlatformAccountsPage() {
  const [platforms, setPlatforms] = useState<LabPlatformAccount[]>([])
  const [checking, setChecking] = useState<Record<string, CheckState>>({})
  const [cookieStatus, setCookieStatus] = useState<Record<string, CookieStatus>>({})
  const [batchChecking, setBatchChecking] = useState(false)

  useEffect(() => {
    labApi.listPlatformAccounts().then(setPlatforms).catch(() => setPlatforms([]))
  }, [])

  const toggle = async (platform: string, isActive: boolean) => {
    await labApi.togglePlatform(platform, !isActive)
    setPlatforms((prev) =>
      prev.map((a) => (a.platform === platform ? { ...a, is_active: isActive ? 0 : 1 } : a)),
    )
  }

  const checkOne = async (platform: string) => {
    setChecking((s) => ({ ...s, [platform]: "checking" }))
    try {
      const res = await labApi.checkCookie(platform)
      const cs: CookieStatus = {
        valid: res.session_valid,
        configured: res.configured,
        error: res.error,
      }
      setCookieStatus((s) => ({ ...s, [platform]: cs }))
      setPlatforms((prev) =>
        prev.map((a) =>
          a.platform === platform ? { ...a, session_valid: cs.valid ? 1 : 0 } : a,
        ),
      )
      setChecking((s) => ({ ...s, [platform]: "done" }))
    } catch {
      setChecking((s) => ({ ...s, [platform]: "error" }))
    }
  }

  const checkAll = async () => {
    setBatchChecking(true)
    try {
      const res = await labApi.validateAllCookies()
      if (res.report) {
        const report = res.report as Record<string, CookieStatus>
        setCookieStatus((s) => ({ ...s, ...report }))
        setPlatforms((prev) =>
          prev.map((a) =>
            report[a.platform] !== undefined
              ? { ...a, session_valid: report[a.platform].valid ? 1 : 0 }
              : a,
          ),
        )
      }
    } catch {
      // ignore
    } finally {
      setBatchChecking(false)
    }
  }

  const activeCount = platforms.filter((p) => p.is_active).length
  const expiredCount = platforms.filter((p) => p.is_active && !p.session_valid).length

  return (
    <div>
      <PageHeader
        eyebrow="Section 04 — Network"
        title="Platform Accounts"
        subtitle="Fifteen channels. Cookie health monitored via Modal. All secrets live in custom-secret only."
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.25em]">
              <span className="text-[var(--gold)]">
                <span className="font-serif italic text-2xl mr-1">{activeCount}</span>
                Active
              </span>
              {expiredCount > 0 && (
                <span className="text-[var(--wine)]">
                  <span className="font-serif italic text-2xl mr-1">{expiredCount}</span>
                  Expired
                </span>
              )}
            </div>
            <button
              onClick={checkAll}
              disabled={batchChecking}
              className="font-mono text-[10px] uppercase tracking-[0.3em] border border-border/60 hover:border-[var(--gold)]/60 text-muted-foreground hover:text-[var(--gold)] px-4 py-2 transition-colors disabled:opacity-40"
            >
              {batchChecking ? "Checking…" : "Test All Cookies"}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {platforms.map((p) => {
          const active = !!p.is_active
          const ratio = p.daily_limit ? p.published_today / p.daily_limit : 0
          const ratioPct = Math.min(100, Math.round(ratio * 100))
          const ratioTone =
            ratio >= 1 ? "var(--wine)" : ratio >= 0.7 ? "oklch(0.78 0.16 70)" : "var(--gold)"

          const cs = cookieStatus[p.platform]
          const checkState = checking[p.platform] ?? "idle"
          const isApiKey = API_KEY_PLATFORMS.has(p.platform)

          // Determine session display
          const sessionValid = cs ? cs.valid : !!p.session_valid
          const configured = cs ? cs.configured : true // assume configured if row exists
          const sessionLabel = !configured
            ? "Not Set"
            : sessionValid
              ? "Valid"
              : "Expired"
          const sessionColor = !configured
            ? "text-muted-foreground/50"
            : sessionValid
              ? "text-[var(--gold)]"
              : "text-[var(--wine)]"
          const dotColor = !configured
            ? "bg-muted-foreground/30"
            : sessionValid
              ? "bg-[var(--gold)]"
              : "bg-[var(--wine)]"

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
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/70">
                    {p.platform}
                  </div>
                  <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/40">
                    {isApiKey ? "api-key" : "cookie"}
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
                {/* Daily progress */}
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

                {/* Session status */}
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.25em]">
                  <span className="text-muted-foreground">Session</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`size-1 rounded-full ${dotColor}`} />
                    <span className={sessionColor}>{sessionLabel}</span>
                  </span>
                </div>

                {/* Error hint */}
                {cs?.error && (
                  <div className="font-mono text-[8px] text-[var(--wine)]/70 truncate" title={cs.error}>
                    {cs.error}
                  </div>
                )}

                {/* Test button */}
                <button
                  onClick={() => checkOne(p.platform)}
                  disabled={checkState === "checking"}
                  className="w-full mt-1 font-mono text-[9px] uppercase tracking-[0.2em] border border-border/40 hover:border-[var(--gold)]/50 text-muted-foreground hover:text-[var(--gold)] py-1.5 transition-colors disabled:opacity-40"
                >
                  {checkState === "checking" ? (
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <span className="size-1 rounded-full bg-current animate-pulse" />
                      Testing…
                    </span>
                  ) : checkState === "done" ? (
                    "✓ Tested"
                  ) : (
                    "Test Cookie"
                  )}
                </button>
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
