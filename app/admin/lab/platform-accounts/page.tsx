"use client"

import { useEffect, useState } from "react"
import type { LabPlatformAccount } from "@/lib/lab/types"

function getToken(): string {
  if (typeof document === "undefined") return ""
  return document.cookie.match(/admin_token=([^;]+)/)?.[1] ?? ""
}

export default function PlatformAccountsPage() {
  const [platforms, setPlatforms] = useState<LabPlatformAccount[]>([])

  useEffect(() => {
    const token = getToken()
    fetch("/api/lab/platform-accounts", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setPlatforms)
      .catch(() => setPlatforms([]))
  }, [])

  const toggle = async (platform: string, isActive: boolean) => {
    const token = getToken()
    await fetch(`/api/lab/platform-accounts/${platform}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_active: isActive ? 0 : 1 }),
    })
    setPlatforms((prev) =>
      prev.map((a) =>
        a.platform === platform ? { ...a, is_active: isActive ? 0 : 1 } : a,
      ),
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-mono font-bold text-amber-400">Platform Accounts</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {platforms.map((p) => {
          const active = !!p.is_active
          return (
            <div
              key={p.platform}
              className={`border rounded p-4 ${
                active ? "border-zinc-700 bg-zinc-900" : "border-zinc-900 bg-zinc-950 opacity-60"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-mono font-bold text-white">{p.display_name}</span>
                <button
                  onClick={() => toggle(p.platform, active)}
                  className={`text-xs px-2 py-1 rounded font-mono ${
                    active ? "bg-green-900 text-green-300" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {active ? "ON" : "OFF"}
                </button>
              </div>
              <div className="text-xs text-zinc-500 font-mono space-y-1">
                <div>
                  Today:{" "}
                  <span className="text-white">
                    {p.published_today}/{p.daily_limit}
                  </span>
                </div>
                <div>
                  Session:{" "}
                  <span className={p.session_valid ? "text-green-400" : "text-red-400"}>
                    {p.session_valid ? "valid" : "expired"}
                  </span>
                </div>
                <div className="text-zinc-600 text-[10px] uppercase tracking-wider">
                  {p.platform}
                </div>
              </div>
            </div>
          )
        })}
        {platforms.length === 0 && (
          <div className="col-span-full text-center text-zinc-600 text-xs font-mono py-6">
            No platforms configured
          </div>
        )}
      </div>
    </div>
  )
}
