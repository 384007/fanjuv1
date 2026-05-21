"use client"

import { useEffect, useState } from "react"
import type { LabPublishJob } from "@/lib/lab/types"

const STATUS_COLOR: Record<string, string> = {
  success: "text-green-400",
  failed: "text-red-400",
  running: "text-amber-400",
  pending: "text-zinc-400",
  skipped: "text-zinc-600",
}

function getToken(): string {
  if (typeof document === "undefined") return ""
  return document.cookie.match(/admin_token=([^;]+)/)?.[1] ?? ""
}

export default function PublishJobsPage() {
  const [jobs, setJobs] = useState<LabPublishJob[]>([])

  const load = () => {
    const token = getToken()
    fetch("/api/lab/publish-jobs", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setJobs)
      .catch(() => setJobs([]))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-mono font-bold text-amber-400">Publish Jobs</h1>
        <button
          onClick={load}
          className="text-xs font-mono text-zinc-400 hover:text-white border border-zinc-700 px-3 py-1 rounded"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm font-mono border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500">
              <th className="text-left py-2 pr-4">Article</th>
              <th className="text-left py-2 pr-4">Platform</th>
              <th className="text-left py-2 pr-4">Status</th>
              <th className="text-left py-2 pr-4">URL</th>
              <th className="text-left py-2 pr-4">Attempts</th>
              <th className="text-left py-2">Finished</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b border-zinc-900 hover:bg-zinc-900">
                <td className="py-2 pr-4 text-white text-xs">{j.article_slug ?? j.article_id}</td>
                <td className="py-2 pr-4 text-zinc-300">{j.platform}</td>
                <td className={`py-2 pr-4 font-bold ${STATUS_COLOR[j.status] ?? "text-zinc-400"}`}>
                  {j.status}
                </td>
                <td className="py-2 pr-4">
                  {j.published_url && (
                    <a
                      href={j.published_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 text-xs hover:underline"
                    >
                      view
                    </a>
                  )}
                </td>
                <td className="py-2 pr-4 text-zinc-500">{j.attempt_count}</td>
                <td className="py-2 text-zinc-600 text-xs">{j.finished_at?.slice(0, 16) ?? "-"}</td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-zinc-600 text-xs">
                  No publish jobs yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
