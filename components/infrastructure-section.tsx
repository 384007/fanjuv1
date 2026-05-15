"use client"

import { useLanguage } from "@/components/language-provider"
import { ChevronRight } from "lucide-react"

export function InfrastructureSection() {
  const { t } = useLanguage()

  return (
    <section id="cities" className="relative border-b border-border/60">
      <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] text-accent uppercase">
              <span className="h-px w-8 bg-accent/60" />
              <span>{t.infra.eyebrow}</span>
            </div>
            <h2 className="mt-6 font-serif text-3xl leading-[1.1] text-balance text-foreground md:text-5xl">
              {t.infra.title}
              <br />
              <span className="italic text-accent">{t.infra.titleB}</span>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:pt-20">
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
              {t.infra.sub}
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px border border-border/60 bg-border/60 md:grid-cols-2">
          {/* City Layer */}
          <div className="bg-card/40 p-8 md:p-10">
            <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              {t.infra.cityLayer}
            </div>
            <h3 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">{t.infra.cityName}</h3>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
              {t.infra.cityDesc}
            </p>

            <ul className="mt-10 grid grid-cols-1 gap-px border border-border/60 bg-border/60">
              {t.infra.cityItems.map(([k, v]) => (
                <li
                  key={k}
                  className="flex items-start justify-between gap-4 bg-card/60 p-4 font-mono text-[11px] tracking-[0.15em] uppercase md:p-5"
                >
                  <span className="text-muted-foreground">· {k}</span>
                  <span className="text-right text-foreground">{v}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* AI Layer */}
          <div className="bg-card/40 p-8 md:p-10">
            <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              {t.infra.aiLayer}
            </div>
            <h3 className="mt-3 font-serif text-3xl text-foreground md:text-4xl">{t.infra.aiName}</h3>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
              {t.infra.aiDesc}
            </p>

            <ul className="mt-10 grid grid-cols-1 gap-px border border-border/60 bg-border/60">
              {t.infra.aiItems.map(([k, v]) => (
                <li
                  key={k}
                  className="flex items-start justify-between gap-4 bg-card/60 p-4 font-mono text-[11px] tracking-[0.15em] uppercase md:p-5"
                >
                  <span className="text-muted-foreground">· {k}</span>
                  <span className="text-right text-foreground">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Lifecycle */}
        <div className="mt-16">
          <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
            {t.infra.lifecycleTitle}
          </div>

          <ol className="mt-6 grid grid-cols-1 gap-px border border-border/60 bg-border/60 md:grid-cols-5">
            {t.infra.lifecycle.map(([title, desc], i) => (
              <li
                key={title}
                className="relative flex flex-col gap-3 bg-card/40 p-5 md:p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] tracking-[0.25em] text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < t.infra.lifecycle.length - 1 && (
                    <ChevronRight className="hidden h-3 w-3 text-muted-foreground md:absolute md:right-3 md:top-5 md:block" />
                  )}
                </div>
                <div>
                  <div className="font-serif text-lg text-foreground">{title}</div>
                  <div className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                    {desc}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
