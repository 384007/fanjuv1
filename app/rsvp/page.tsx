import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "饭局报名状态｜饭局 Fanju",
  description: "饭局 Fanju 报名状态页面，用于展示报名、待确认、候补和已确认状态。",
  alternates: { canonical: "/rsvp" },
}

const states = [
  ["01", "填写资料", "选择城市、饭局类型和基础说明。"],
  ["02", "等待确认", "主办方根据主题和人数上限查看报名。"],
  ["03", "确认席位", "席位确认后同步时间、区域和规则。"],
  ["04", "饭后回顾", "饭后可以沉淀相册、反馈和下一场关注。"],
]

export default function RsvpPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">RSVP FLOW</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局报名状态</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">饭局 Fanju 用结构化状态管理报名、待确认、候补和已确认，让主办方和参与者都能看清进度。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/features/rsvp-tracking" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">报名追踪功能</Link>
            <Link href="/create" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">创建饭局</Link>
            <Link href="/rules" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">参加规则</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-4">
          {states.map(([num, title, body]) => (
            <article key={title} className="bg-card/40 p-6">
              <div className="font-mono text-[10px] tracking-[0.25em] text-accent">{num}</div>
              <h2 className="mt-4 font-serif text-2xl text-foreground">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
