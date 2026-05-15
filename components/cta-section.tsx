"use client"

import { useLanguage } from "@/components/language-provider"
import { ArrowUpRight } from "lucide-react"

export function CtaSection() {
  const { t } = useLanguage()

  return (
    <section id="cta" className="relative overflow-hidden border-b border-border/60">
      {/* wine red + purple glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-75"
        style={{
          background:
            "radial-gradient(ellipse 900px 500px at 50% 100%, oklch(0.55 0.23 22 / 0.45) 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-55"
        style={{
          background:
            "radial-gradient(ellipse 700px 350px at 20% 0%, oklch(0.62 0.30 300 / 0.40) 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 600px 300px at 80% 50%, oklch(0.84 0.14 82 / 0.30) 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-grid opacity-25" aria-hidden />

      <div className="relative mx-auto max-w-[1400px] px-4 py-24 text-center md:px-8 md:py-36">
        <div className="flex items-center justify-center gap-2 font-mono text-[11px] tracking-[0.25em] text-accent uppercase">
          <span className="h-px w-8 bg-accent/60" />
          <span>{t.cta.eyebrow}</span>
          <span className="h-px w-8 bg-accent/60" />
        </div>

        <h2 className="mx-auto mt-8 max-w-4xl font-serif text-4xl leading-[1.1] text-balance text-foreground md:text-6xl lg:text-7xl">
          {t.cta.title}
          <br />
          <span className="italic text-accent">{t.cta.titleB}</span>
        </h2>

        <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
          {t.cta.sub}
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#"
            className="group inline-flex items-center gap-2 bg-accent px-6 py-4 font-mono text-xs tracking-[0.22em] text-accent-foreground uppercase transition-colors hover:bg-accent/90"
          >
            <span>{t.cta.btn1}</span>
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 border border-border bg-transparent px-6 py-4 font-mono text-xs tracking-[0.22em] text-foreground uppercase transition-colors hover:border-accent/60 hover:text-accent"
          >
            {t.cta.btn2}
          </a>
        </div>
      </div>
    </section>
  )
}
