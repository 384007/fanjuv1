"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLogin() {
  const [token, setToken] = useState("")
  const [remember, setRemember] = useState(true)
  const router = useRouter()

  const login = () => {
    if (!token) return
    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 // 30 days or 1 day
    document.cookie = `admin_token=${token}; path=/; max-age=${maxAge}; SameSite=Strict`
    router.push("/admin/lab/seo")
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg w-full max-w-sm">
        <h1 className="text-amber-400 font-mono font-bold mb-2 tracking-wider">FANJU LAB</h1>
        <p className="text-zinc-500 text-xs font-mono mb-6 leading-relaxed">
          Enter your admin token to access the SEO automation lab.
          <br />
          <span className="text-amber-400">Demo mode: use token</span>{" "}
          <code className="text-amber-300">demo</code>
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="Admin token"
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white font-mono text-sm mb-4 focus:outline-none focus:border-amber-500"
        />
        <label className="flex items-center gap-2 mb-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-amber-500 w-3.5 h-3.5"
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-400">
            Remember me · 30 days / 记住登录 30 天
          </span>
        </label>
        <button
          onClick={login}
          disabled={!token}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2 rounded font-mono text-sm transition-colors"
        >
          Enter Lab
        </button>
      </div>
    </div>
  )
}
