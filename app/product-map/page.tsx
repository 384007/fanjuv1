import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { fanjuProductNames } from "@/lib/fanju-product-names"

export const metadata: Metadata = {
  title: "饭局产品地图｜饭局 Fanju",
  description: "饭局 Fanju 产品地图，包含饭局口令、席位确认、同桌名单、凑局时间、入局问答、饭后回忆、开放入局、主理人过筛等功能。",
  alternates: { canonical: "/product-map" },
}

export default function ProductMapPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">FANJU PRODUCT MAP</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局产品地图</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">用饭局自己的语言组织产品能力：组局、邀约、席位确认、同桌、提醒、饭后回忆和主理人工具。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/create" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">开始组局</Link>
            <Link href="/channels" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">分享渠道</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-3">
          {fanjuProductNames.map(([name, desc, href]) => (
            <Link key={href} href={href} className="bg-card/40 p-6 hover:bg-card/70">
              <h2 className="font-serif text-2xl text-foreground">{name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
