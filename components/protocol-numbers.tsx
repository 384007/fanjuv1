"use client"

import { useLanguage } from "@/components/language-provider"

export function ProtocolNumbers() {
  const { t } = useLanguage()

  return (
    <section id="protocol" className="relative border-b border-border/60">
      <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] text-accent uppercase">
            <span className="h-px w-8 bg-accent/60" />
            <span>{t.protocol.eyebrow}</span>
          </div>
          <h2 className="mt-6 font-serif text-3xl leading-[1.1] text-balance text-foreground md:text-5xl">
            {t.protocol.title}
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
            {t.protocol.sub}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px border border-border/60 bg-border/60 md:grid-cols-2 lg:grid-cols-3">
          {t.protocol.stats.map(([value, label, desc], i) => (
            <article key={i} className="relative bg-card/40 p-8 md:p-10">
              <div className="font-serif text-5xl text-foreground tabular-nums md:text-6xl">
                <span className="text-accent">{value.charAt(0) === "¥" || value.charAt(0) === "$" ? value.charAt(0) : ""}</span>
                <span>
                  {value.charAt(0) === "¥" || value.charAt(0) === "$" ? value.slice(1) : value}
                </span>
              </div>
              <div className="mt-6 border-t border-border/60 pt-5">
                <div className="font-mono text-[11px] tracking-[0.22em] text-foreground uppercase">{label}</div>
                <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
