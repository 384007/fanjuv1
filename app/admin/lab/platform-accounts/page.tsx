"use client"

import { useEffect, useMemo, useState } from "react"
import { Cookie, KeyRound, Loader2, Power, RefreshCw } from "lucide-react"
import type { LabCookieStatus, LabPlatformAccount } from "@/lib/lab/types"
import { PageHeader } from "@/components/lab/page-header"
import { labApi } from "@/lib/lab/api"

const API_KEY_PLATFORMS = new Set(["devto", "hashnode", "medium", "bluesky", "reddit"])

type CheckState = "idle" | "checking" | "done" | "error"

function formatTime(value?: string | null) {
  if (!value) return "never"
  return value.replace("T", " ").slice(0, 16)
}

function shortError(value?: string | null) {
  if (!value) return ""
  return value.replace(/\s+/g, " ").slice(0, 120)
}

function resolveStatus(
  platform: LabPlatformAccount,
  status: LabCookieStatus | undefined,
): {
  label: "Unknown" | "Not Set" | "Expired" | "Valid"
  tone: string
  dot: string
  configured: boolean | null
  valid: boolean
} {
  const configured = status ? status.configured : null
  const valid = status ? status.valid || Boolean(status.session_valid) : Boolean(platform.session_valid)
  if (configured === false) {
    return {
      label: "Not Set",
      tone: "text-muted-foreground",
      dot: "bg-muted-foreground/35",
      configured,
      valid: false,
    }
  }
  if (configured === null) {
    return {
      label: "Unknown",
      tone: "text-muted-foreground",
      dot: "bg-muted-foreground/35",
      configured,
      valid,
    }
  }
  if (valid) {
    return { label: "Valid", tone: "text-[var(--gold)]", dot: "bg-[var(--gold)]", configured, valid }
  }
  return { label: "Expired", tone: "text-[var(--wine)]", dot: "bg-[var(--wine)]", configured, valid }
}

export default function PlatformAccountsPage() {
  const [platforms, setPlatforms] = useState<LabPlatformAccount[]>([])
  const [checking, setChecking] = useState<Record<string, CheckState>>({})
  const [cookieStatus, setCookieStatus] = useState<Record<string, LabCookieStatus>>({})
  const [batchChecking, setBatchChecking] = useState(false)
  const [connected, setConnected] = useState(true)

  const load = () => {
    labApi
      .listPlatformAccounts()
      .then((data) => {
        setPlatforms(data)
        setConnected(true)
      })
      .catch(() => {
        setPlatforms([])
        setConnected(false)
      })
  }

  useEffect(() => {
    load()
  }, [])

  const toggle = async (platform: string, isActive: boolean) => {
    await labApi.togglePlatform(platform, !isActive)
    setPlatforms((prev) =>
      prev.map((account) =>
        account.platform === platform ? { ...account, is_active: isActive ? 0 : 1 } : account,
      ),
    )
  }

  const checkOne = async (platform: string) => {
    setChecking((state) => ({ ...state, [platform]: "checking" }))
    try {
      const res = await labApi.checkCookie(platform)
      const status: LabCookieStatus = {
        ...res,
        platform,
        valid: res.valid || Boolean(res.session_valid),
        configured: res.configured,
      }
      setCookieStatus((state) => ({ ...state, [platform]: status }))
      setPlatforms((prev) =>
        prev.map((account) =>
          account.platform === platform
            ? {
                ...account,
                session_valid: status.valid ? 1 : 0,
                last_check_at:
                  res.last_check_at ??
                  (res.configured === null ? account.last_check_at : new Date().toISOString()),
              }
            : account,
        ),
      )
      setChecking((state) => ({ ...state, [platform]: "done" }))
    } catch {
      setChecking((state) => ({ ...state, [platform]: "error" }))
    }
  }

  const checkAll = async () => {
    setBatchChecking(true)
    try {
      const res = await labApi.validateAllCookies()
      const report = res.report ?? {}
      setCookieStatus((state) => ({ ...state, ...report }))
      setPlatforms((prev) =>
        prev.map((account) =>
          report[account.platform]
            ? {
                ...account,
                session_valid: report[account.platform].valid ? 1 : 0,
                last_check_at: new Date().toISOString(),
              }
            : account,
        ),
      )
    } catch {
      // The page keeps cached D1 data and marks explicit check buttons as retryable.
    } finally {
      setBatchChecking(false)
    }
  }

  const counts = useMemo(() => {
    let valid = 0
    let expired = 0
    let notSet = 0
    for (const platform of platforms) {
      const status = resolveStatus(platform, cookieStatus[platform.platform])
      if (status.label === "Valid") valid += 1
      if (status.label === "Expired") expired += 1
      if (status.label === "Not Set") notSet += 1
    }
    return {
      active: platforms.filter((platform) => platform.is_active).length,
      valid,
      expired,
      notSet,
    }
  }, [cookieStatus, platforms])

  return (
    <div>
      <PageHeader
        eyebrow="Section 04 - Network"
        title="Platform Accounts"
        subtitle="状态来自 Modal /validate-cookies。D1 有平台行不代表 custom-secret 已配置登录态。"
        actions={
          <>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 border border-border/60 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
            >
              <RefreshCw className="size-3" />
              Refresh
            </button>
            <button
              onClick={checkAll}
              disabled={batchChecking || !platforms.length}
              className="inline-flex items-center gap-2 border border-[var(--gold)]/60 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--gold)] transition-colors hover:bg-[var(--gold)]/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {batchChecking ? <Loader2 className="size-3 animate-spin" /> : <Cookie className="size-3" />}
              {batchChecking ? "Testing" : "Test All Cookies"}
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ["Active", counts.active, "text-[var(--gold)]"],
          ["Valid", counts.valid, "text-[var(--gold)]"],
          ["Expired", counts.expired, "text-[var(--wine)]"],
          ["Not Set", counts.notSet, "text-muted-foreground"],
        ].map(([label, value, tone]) => (
          <div key={label} className="border border-border/40 bg-card/35 px-4 py-3">
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </div>
            <div className={`mt-2 font-serif text-3xl leading-none ${tone}`}>{value}</div>
          </div>
        ))}
      </div>

      {!connected && (
        <div className="mb-6 border border-border/40 bg-card/35 p-5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          API 未连接 / 暂无数据
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {platforms.map((platform) => {
          const active = Boolean(platform.is_active)
          const ratio = platform.daily_limit ? platform.published_today / platform.daily_limit : 0
          const ratioPct = Math.min(100, Math.round(ratio * 100))
          const ratioTone =
            ratio >= 1 ? "var(--wine)" : ratio >= 0.7 ? "oklch(0.78 0.16 70)" : "var(--gold)"

          const status = resolveStatus(platform, cookieStatus[platform.platform])
          const checkState = checking[platform.platform] ?? "idle"
          const isApiKey = API_KEY_PLATFORMS.has(platform.platform)
          const error = shortError(cookieStatus[platform.platform]?.error)
          const TypeIcon = isApiKey ? KeyRound : Cookie

          return (
            <article
              key={platform.platform}
              className={`min-w-0 border bg-card/35 p-4 transition-colors ${
                active
                  ? "border-border/45 hover:border-[var(--gold)]/45"
                  : "border-border/25 opacity-65"
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-serif text-2xl italic leading-none text-foreground">
                    {platform.display_name}
                  </h2>
                  <div className="mt-2 break-all font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    {platform.platform}
                  </div>
                </div>
                <button
                  onClick={() => toggle(platform.platform, active)}
                  aria-pressed={active}
                  className={`inline-flex h-8 w-12 shrink-0 items-center rounded-full border transition-colors ${
                    active ? "border-[var(--gold)]/60 bg-[var(--gold)]/20" : "border-border/60 bg-border/20"
                  }`}
                  title={active ? "Active" : "Inactive"}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full bg-card transition-transform ${
                      active ? "translate-x-5 text-[var(--gold)]" : "translate-x-1 text-muted-foreground"
                    }`}
                  >
                    <Power className="size-3" />
                  </span>
                </button>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 border border-border/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  <TypeIcon className="size-3" />
                  {isApiKey ? "API Key" : "Cookie"}
                </span>
                <span className={`inline-flex items-center gap-1.5 border border-border/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${status.tone}`}>
                  <span className={`size-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-1.5 flex justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    <span>Daily Limit</span>
                    <span style={{ color: ratioTone }}>
                      {platform.published_today} / {platform.daily_limit}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden bg-border/35">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${ratioPct}%`, background: ratioTone }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.18em]">
                  <span className="text-muted-foreground">Last Check</span>
                  <span className="text-muted-foreground/80">{formatTime(platform.last_check_at)}</span>
                </div>

                {error && (
                  <div
                    className="break-words font-mono text-[9px] leading-relaxed text-[var(--wine)]/85"
                    title={error}
                  >
                    {error}
                  </div>
                )}

                <button
                  onClick={() => checkOne(platform.platform)}
                  disabled={checkState === "checking"}
                  className="inline-flex w-full items-center justify-center gap-2 border border-border/50 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-[var(--gold)]/55 hover:text-[var(--gold)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {checkState === "checking" ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : isApiKey ? (
                    <KeyRound className="size-3" />
                  ) : (
                    <Cookie className="size-3" />
                  )}
                  {checkState === "checking"
                    ? "Testing"
                    : checkState === "done"
                      ? "Tested"
                      : isApiKey
                        ? "Test API Key"
                        : "Test Cookie"}
                </button>
              </div>
            </article>
          )
        })}

        {platforms.length === 0 && (
          <div className="col-span-full border border-border/40 bg-card/35 px-6 py-16 text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/70">
              API 未连接 / 暂无数据
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
