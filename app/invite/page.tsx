import type { Metadata } from "next"
import Link from "next/link"
import { ChinaSocialShare } from "@/components/china-social-share"
import { SeatForm } from "@/components/seat-form"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "饭局口令｜饭局 Fanju",
  description: "饭局 Fanju 饭局口令页，包含中国社交分享和席位提交表单。",
  alternates: { canonical: "/invite" },
}

const parts = ["标题", "城市", "时间", "餐桌说明", "席位状态", "同桌名单"]

export default function InvitePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">FANJU INVITE</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局口令</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">一条饭局口令连接中国社交分享、席位提交、主理确认和同桌名单。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/create" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">开始组局</Link>
            <Link href="/share" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">分享</Link>
            <Link href="/ops" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">接口状态</Link>
          </div>
        </div>
      </section>
      <ChinaSocialShare />
      <section className="border-b border-border/60"><div className="mx-auto max-w-[760px] px-4 py-12 md:px-8 md:py-16"><SeatForm table="demo-table" /></div></section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-3">
          {parts.map((item) => <article key={item} className="bg-card/40 p-6"><h2 className="font-serif text-2xl text-foreground">{item}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">饭局口令页包含这一项。</p></article>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
