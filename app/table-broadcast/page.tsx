import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "桌前广播｜饭局 Fanju",
  description: "饭局 Fanju 桌前广播，用于主理人一次同步饭局时间、集合说明、餐桌提醒和饭后回顾。",
  alternates: { canonical: "/table-broadcast" },
}

const items = ["开局前", "集合说明", "临近提醒", "饭后回顾"]

export default function TableBroadcastPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">TABLE BROADCAST</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">桌前广播</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">主理人一次同步饭局时间、集合说明、餐桌提醒和饭后回顾，减少重复沟通。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/reminders" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">桌前提醒</Link>
            <Link href="/feed" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">桌边动态</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60"><div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-4">{items.map((item) => <article key={item} className="bg-card/40 p-6"><h2 className="font-serif text-2xl text-foreground">{item}</h2><p className="mt-3 text-sm text-muted-foreground">一个桌前广播节点。</p></article>)}</div></section>
      <SiteFooter />
    </main>
  )
}
