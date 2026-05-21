"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const NAV = [
  { href: "/admin/lab/seo",               en: "SEO",       zh: "SEO" },
  { href: "/admin/lab/content-lab",        en: "Content",   zh: "内容" },
  { href: "/admin/lab/publish-jobs",       en: "Jobs",      zh: "任务" },
  { href: "/admin/lab/platform-accounts",  en: "Platforms", zh: "平台" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [lang, setLang] = useState<"en" | "zh">("zh")

  useEffect(() => {
    const saved = localStorage.getItem("admin_lang") as "en" | "zh" | null
    if (saved) setLang(saved)
  }, [])

  const toggleLang = () => {
    const next = lang === "zh" ? "en" : "zh"
    setLang(next)
    localStorage.setItem("admin_lang", next)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 px-6 py-3 flex flex-wrap items-center gap-6 text-sm font-mono">
        <Link href="/admin" className="text-amber-400 font-bold tracking-wider">
          FANJU LAB
        </Link>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`transition-colors ${
              pathname?.startsWith(item.href)
                ? "text-amber-400"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {lang === "zh" ? item.zh : item.en}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/admin/login"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500 hover:text-amber-400 transition-colors"
          >
            {lang === "zh" ? "登录" : "Login"}
          </Link>
          <button
            onClick={toggleLang}
            className="font-mono text-[10px] uppercase tracking-[0.25em] border border-zinc-700 hover:border-amber-500 text-zinc-400 hover:text-amber-400 px-3 py-1 rounded transition-colors"
            title="Toggle language / 切换语言"
          >
            {lang === "zh" ? "EN" : "中文"}
          </button>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
