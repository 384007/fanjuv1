"use client"

import { useLanguage } from "@/components/language-provider"
import { ArrowUpRight } from "lucide-react"

export function MarketsSection() {
  const { t } = useLanguage()

  return (
    <section id="markets" className="relative border-b border-border/60">
      <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] text-accent uppercase">
              <span className="h-px w-8 bg-accent/60" />
              <span>{t.markets.eyebrow}</span>
            </div>
            <h2 className="mt-6 font-serif text-3xl leading-[1.1] text-balance text-foreground md:text-5xl">
              {t.markets.title}
              <br />
              <span className="italic text-accent">{t.markets.titleB}</span>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:pt-20">
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
              {t.markets.sub}
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px border border-border/60 bg-border/60 md:grid-cols-2 lg:grid-cols-3">
          {t.markets.items.map((item) => (
            <article
              key={item.tag}
              className="group relative bg-card/40 p-8 transition-colors hover:bg-card md:p-10"
            >
              <div className="flex items-start justify-between">
                <span className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground">{item.tag}</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>

              <div className="mt-10">
                <h3 className="font-serif text-3xl text-foreground md:text-4xl">{item.name}</h3>
                <p className="mt-2 font-mono text-[11px] tracking-[0.22em] text-accent uppercase">{item.subtitle}</p>
              </div>

              <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground text-pretty md:text-base">
                {item.desc}
              </p>

              <div className="mt-10 flex items-end justify-between border-t border-border/60 pt-5">
                <span className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
                  {item.metricLabel}
                </span>
                <span className="font-serif text-2xl text-foreground tabular-nums md:text-3xl">{item.metricValue}</span>
              </div>

              {/* hover gold corner */}
              <span className="pointer-events-none absolute right-0 top-0 h-px w-12 bg-accent/0 transition-colors group-hover:bg-accent/80" />
              <span className="pointer-events-none absolute right-0 top-0 h-12 w-px bg-accent/0 transition-colors group-hover:bg-accent/80" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
