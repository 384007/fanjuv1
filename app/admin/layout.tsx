"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Languages } from "lucide-react"
import { LabOverview } from "@/components/lab/lab-overview"

const NAV = [
  { href: "/admin/lab/seo", en: "SEO", zh: "SEO" },
  { href: "/admin/lab/content-lab", en: "Content", zh: "内容" },
  { href: "/admin/lab/publish-jobs", en: "Jobs", zh: "任务" },
  { href: "/admin/lab/platform-accounts", en: "Platforms", zh: "平台" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [lang, setLang] = useState<"en" | "zh">("zh")
  const isLab = pathname?.startsWith("/admin/lab")

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
    <div className="min-h-screen bg-[oklch(0.15_0.04_285)] text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border/40 bg-background/90 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 text-sm font-mono md:gap-6">
          <Link href="/admin/lab/seo" className="font-bold tracking-[0.18em] text-[var(--gold)]">
            饭局 / FANJU LAB
          </Link>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors ${
                pathname?.startsWith(item.href)
                  ? "text-[var(--gold)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {lang === "zh" ? item.zh : item.en}
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/admin/login"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-[var(--gold)] transition-colors"
            >
              {lang === "zh" ? "登录" : "Login"}
            </Link>
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 border border-border/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-[var(--gold)]/60 hover:text-[var(--gold)]"
              title="Toggle language / 切换语言"
            >
              <Languages className="size-3" />
              {lang === "zh" ? "EN" : "中文"}
            </button>
          </div>
        </div>
      </nav>
      {isLab && <LabOverview />}
      <main className="mx-auto max-w-7xl p-4 md:p-6">{children}</main>
    </div>
  )
}
