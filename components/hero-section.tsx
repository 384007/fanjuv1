"use client"

import { useLanguage } from "@/components/language-provider"
import { ArrowUpRight } from "lucide-react"

const sparkPoints = [
  18, 22, 19, 26, 24, 30, 28, 34, 32, 38, 36, 42, 40, 47, 44, 52, 49, 58, 54, 62, 60, 68, 65, 72, 70, 78, 76, 84, 80,
  88, 92, 96,
]

export function HeroSection() {
  const { t, lang } = useLanguage()
  const isZh = lang === "zh"

  // build sparkline polyline
  const max = Math.max(...sparkPoints)
  const min = Math.min(...sparkPoints)
  const w = 320
  const h = 80
  const points = sparkPoints
    .map((p, i) => {
      const x = (i / (sparkPoints.length - 1)) * w
      const y = h - ((p - min) / (max - min)) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* grid bg */}
      <div className="absolute inset-0 bg-grid opacity-[0.35]" aria-hidden />
      {/* bright Yahoo purple top aurora */}
      <div
        className="aurora-purple pointer-events-none absolute -top-48 left-1/2 h-[760px] w-[1300px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.62 0.30 300 / 0.65) 0%, oklch(0.52 0.30 300 / 0.25) 40%, transparent 65%)",
        }}
        aria-hidden
      />
      {/* wine red glow bottom-right */}
      <div
        className="pointer-events-none absolute -bottom-40 -right-20 h-[520px] w-[720px] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.55 0.23 22 / 0.45) 0%, transparent 60%)",
        }}
        aria-hidden
      />
      {/* gold halo center-left */}
      <div
        className="pointer-events-none absolute top-1/2 -left-20 h-[420px] w-[640px] -translate-y-1/2 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.84 0.14 82 / 0.40) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1400px] px-4 py-16 md:px-8 md:py-24 lg:py-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left — copy */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] text-accent uppercase">
              <span className="h-px w-8 bg-accent/60" />
              <span>{t.hero.eyebrow}</span>
            </div>

            <h1
              className={`mt-8 ${
                isZh ? "font-serif" : "font-serif"
              } text-4xl leading-[1.05] text-balance text-foreground md:text-6xl lg:text-7xl`}
            >
              <span className="block">{t.hero.titleA}</span>
              <span className="block italic">
                <span className="text-accent">{t.hero.titleB}</span>
              </span>
              <span className="block">{t.hero.titleC}</span>
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
              {t.hero.sub}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#cta"
                className="group inline-flex items-center gap-2 bg-accent px-5 py-3.5 font-mono text-xs tracking-[0.2em] text-accent-foreground uppercase transition-colors hover:bg-accent/90"
              >
                <span>{t.hero.cta1}</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="#protocol"
                className="inline-flex items-center gap-2 border border-border bg-transparent px-5 py-3.5 font-mono text-xs tracking-[0.2em] text-foreground uppercase transition-colors hover:border-accent/60 hover:text-accent"
              >
                {t.hero.cta2}
              </a>
            </div>

            {/* underline meta */}
            <div className="mt-12 grid grid-cols-3 gap-px border border-border/60 bg-border/60">
              <Stat label={t.hero.stat1Label} value={isZh ? "招募中" : "Open"} />
              <Stat label={t.hero.stat2Label} value={isZh ? "大陆优先" : "CN First"} />
              <Stat label={t.hero.stat3Label} value={isZh ? "招募中" : "Open"} />
            </div>
          </div>

          {/* Right — liquidity card */}
          <div className="lg:col-span-5">
            <div className="relative border border-border bg-card/60 backdrop-blur-sm">
              {/* hairline gold top */}
              <div className="absolute inset-x-0 top-0 h-px gold-hairline" />
              <div className="absolute right-0 top-0 bottom-0 w-px gold-hairline" />

              <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
                    {t.hero.poolLabel}
                  </span>
                </div>
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">v1.0</span>
              </div>

              <div className="px-5 py-6">
                <div className="font-serif text-5xl tracking-tight text-foreground tabular-nums md:text-6xl">
                  <span className="text-accent">{isZh ? "招募" : "Hosts"}</span>
                  <span>{isZh ? "中" : " Recruiting"}</span>
                </div>
                <div className="mt-2 font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
                  {t.hero.poolUnit}
                </div>

                {/* sparkline */}
                <div className="mt-6 border-t border-border/60 pt-6">
                  <svg
                    viewBox={`0 0 ${w} ${h}`}
                    className="h-20 w-full"
                    preserveAspectRatio="none"
                    role="img"
                    aria-label="liquidity sparkline"
                  >
                    <defs>
                      <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.82 0.13 82)" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="oklch(0.82 0.13 82)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline
                      points={`0,${h} ${points} ${w},${h}`}
                      fill="url(#sparkFill)"
                      stroke="none"
                    />
                    <polyline
                      points={points}
                      fill="none"
                      stroke="oklch(0.82 0.13 82)"
                      strokeWidth="1.25"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>

                {/* mini metrics row */}
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border/60 pt-5">
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                      24H Δ
                    </div>
                    <div className="mt-1 font-mono text-sm text-accent tabular-nums">
                      {isZh ? "即将开放" : "Opening"}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                      MoM
                    </div>
                    <div className="mt-1 font-mono text-sm text-foreground tabular-nums">
                      {isZh ? "大陆优先" : "CN First"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* footnote */}
            <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              <span>· hosts recruiting · no inflated counts</span>
              <span>SHA · LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background px-4 py-4 md:px-6 md:py-5">
      <div className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase">{label}</div>
      <div className="mt-1.5 font-serif text-2xl text-foreground tabular-nums md:text-3xl">{value}</div>
    </div>
  )
}
