"use client"

import { useEffect, useState } from "react"
import type { LabSeoCheck, LabStats } from "@/lib/lab/types"

const API = "/api/lab"

function getToken(): string {
  if (typeof document === "undefined") return ""
  return document.cookie.match(/admin_token=([^;]+)/)?.[1] ?? ""
}

export default function SeoPage() {
  const [checks, setChecks] = useState<LabSeoCheck[]>([])
  const [stats, setStats] = useState<LabStats | null>(null)

  useEffect(() => {
    const token = getToken()
    const headers = { Authorization: `Bearer ${token}` }
    fetch(`${API}/seo-checks`, { headers })
      .then((r) => r.json())
      .then(setChecks)
      .catch(() => setChecks([]))
    fetch(`${API}/stats`, { headers })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-mono font-bold text-amber-400">SEO Quality Dashboard</h1>

      {stats && stats.articles && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.articles.map((s) => (
            <div key={s.status} className="bg-zinc-900 border border-zinc-800 rounded p-4">
              <div className="text-2xl font-mono font-bold text-white">{s.count}</div>
              <div className="text-xs text-zinc-500 uppercase font-mono">{s.status}</div>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500">
              <th className="text-left py-2 pr-4">Article</th>
              <th className="text-left py-2 pr-4">Score</th>
              <th className="text-left py-2 pr-4">Verdict</th>
              <th className="text-left py-2 pr-4">Issues</th>
              <th className="text-left py-2">Checked</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c.id} className="border-b border-zinc-900 hover:bg-zinc-900">
                <td className="py-2 pr-4 text-white">{c.slug ?? c.article_id}</td>
                <td
                  className={`py-2 pr-4 font-bold ${
                    c.score >= 80
                      ? "text-green-400"
                      : c.score >= 60
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  {c.score}
                </td>
                <td className="py-2 pr-4 text-zinc-400">{c.verdict ?? "-"}</td>
                <td className="py-2 pr-4 text-zinc-500 text-xs max-w-md truncate">{c.issues}</td>
                <td className="py-2 text-zinc-600 text-xs">{c.checked_at?.slice(0, 16)}</td>
              </tr>
            ))}
            {checks.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-zinc-600 text-xs">
                  No SEO checks yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
