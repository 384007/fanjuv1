"use client"

import { useLanguage } from "@/components/language-provider"
import { ChevronRight } from "lucide-react"
import { usePathname } from "next/navigation"

const navLinks = {
  zh: [
    ["产品", "/product-map"],
    ["城市", "/cities"],
    ["类型", "/categories"],
    ["主办方", "/host-tools"],
    ["市场", "/market"],
  ],
  en: [
    ["Product", "/product-map"],
    ["Cities", "/en/cities"],
    ["Categories", "/en/categories"],
    ["Hosts", "/host-tools"],
    ["Market", "/market"],
  ],
}

const headerText = {
  zh: {
    topLine: "饭局 · 全球同频饭局",
    brandLine: "同频饭局",
    create: "创建",
    invite: "邀请",
    brandAlt: "饭局 Fanju",
  },
  en: {
    topLine: "FANJU · GLOBAL SOCIAL DINING",
    brandLine: "Chinese Social Dining",
    create: "Create",
    invite: "Invite",
    brandAlt: "Fanju",
  },
}

function toEnglishPath(pathname: string) {
  if (pathname === "/") return "/en/what-is-fanju"
  if (pathname.startsWith("/en/")) return pathname
  if (pathname === "/cities") return "/en/cities"
  if (pathname === "/categories") return "/en/categories"
  if (pathname === "/features") return "/en/features"
  if (pathname === "/what-is-fanju") return "/en/what-is-fanju"
  if (pathname.startsWith("/city/")) return `/en${pathname}`
  if (pathname.startsWith("/category/")) return `/en${pathname}`
  return "/en/what-is-fanju"
}

function toChinesePath(pathname: string) {
  if (pathname === "/") return "/"
  if (pathname === "/en/what-is-fanju") return "/what-is-fanju"
  if (pathname === "/en/cities") return "/cities"
  if (pathname === "/en/categories") return "/categories"
  if (pathname === "/en/features") return "/features"
  if (pathname.startsWith("/en/city/")) return pathname.replace(/^\/en/, "")
  if (pathname.startsWith("/en/category/")) return pathname.replace(/^\/en/, "")
  if (pathname.startsWith("/en/")) return "/"
  return pathname
}

export function SiteHeader() {
  const { lang, setLang, t } = useLanguage()
  const currentPathname = usePathname()
  const pathname = currentPathname?.replace(/\/$/, "") || "/"
  const enHref = toEnglishPath(pathname)
  const cnHref = toChinesePath(pathname)
  const nav = navLinks[lang]
  const copy = headerText[lang]

  return (
    <>
      <div className="border-b border-border/60 bg-background">
        <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-mono">{t.statusBar}</span>
          </div>
          <div className="hidden font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase md:block">
            {copy.topLine}
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center">
              <img src="/icon.svg?v=20260510-final" alt={copy.brandAlt} className="h-8 w-8 object-contain" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif text-base font-medium tracking-wide text-foreground">FANJU</span>
              <span className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground uppercase">{copy.brandLine}</span>
            </div>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            {nav.map(([label, href]) => (
              <a key={href} href={href} className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-foreground">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border/80 bg-secondary/40 p-0.5">
              <a href={enHref} onClick={() => setLang("en")} className={`px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors ${lang === "en" || pathname.startsWith("/en") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>EN</a>
              <a href={cnHref} onClick={() => setLang("zh")} className={`px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors ${lang === "zh" && !pathname.startsWith("/en") ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>CN</a>
            </div>
            <a href="/create" className="hidden items-center gap-1.5 border border-border/80 bg-secondary/40 px-3 py-2 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase transition-colors hover:border-accent/60 hover:text-accent sm:flex">{copy.create}</a>
            <a href="/invite" className="group flex items-center gap-1.5 bg-accent px-3.5 py-2 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase transition-colors hover:bg-accent/90">
              <span>{copy.invite}</span>
              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </header>
    </>
  )
}
