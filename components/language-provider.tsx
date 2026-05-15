"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { dict, type Lang, type Dict } from "@/lib/i18n"

type Ctx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: Dict
}

const LanguageContext = createContext<Ctx | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const routeLang = useMemo<Lang>(() => (pathname?.startsWith("/en") ? "en" : "zh"), [pathname])
  const [lang, setLangState] = useState<Lang>(routeLang)

  useEffect(() => {
    setLangState(routeLang)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("fanju-lang", routeLang)
      document.documentElement.lang = routeLang === "zh" ? "zh-CN" : "en"
    }
  }, [routeLang])

  const setLang = (l: Lang) => {
    setLangState(l)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("fanju-lang", l)
      document.documentElement.lang = l === "zh" ? "zh-CN" : "en"
    }
  }

  const t = dict[lang]

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider")
  return ctx
}
