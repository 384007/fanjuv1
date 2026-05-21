"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLogin() {
  const [token, setToken] = useState("")
  const router = useRouter()

  const login = () => {
    document.cookie = `admin_token=${token}; path=/; max-age=86400; SameSite=Strict`
    router.push("/admin/lab/seo")
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg w-full max-w-sm">
        <h1 className="text-amber-400 font-mono font-bold mb-6 tracking-wider">FANJU LAB</h1>
        <p className="text-zinc-500 text-xs font-mono mb-4 leading-relaxed">
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
        <button
          onClick={login}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 rounded font-mono text-sm transition-colors"
        >
          Enter Lab
        </button>
      </div>
    </div>
  )
}
