import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "席位确认｜饭局 Fanju",
  description: "饭局 Fanju 席位确认，用于管理想来、待定、不来、候补、待过筛和已确认等饭局状态。",
  alternates: { canonical: "/responses" },
}

const states = ["想来", "待定", "不来", "待确认", "候补", "过筛中"]

export default function ResponsesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">SEAT FLOW</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">席位确认</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">管理饭局的想来、待定、候补、待过筛和已确认状态，让小桌人数更清楚。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/event-settings" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">饭局设置</Link>
            <Link href="/rsvp" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">报名状态</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-3">
          {states.map((item) => <article key={item} className="bg-card/40 p-6"><h2 className="font-serif text-2xl text-foreground">{item}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">一个饭局席位状态。</p></article>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
