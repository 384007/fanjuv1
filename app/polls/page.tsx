import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "饭局时间投票｜饭局 Fanju",
  description: "饭局 Fanju 时间投票用于在确认饭局前收集候选时间，减少反复沟通，让主理人更快确定适合多数人的小桌晚餐。",
  alternates: { canonical: "/polls" },
}

const options = [
  ["周五 19:30", "6 人可参加"],
  ["周六 18:30", "8 人可参加"],
  ["周日 12:30", "5 人可参加"],
]

export default function PollsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">DATE POLL</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局时间投票</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">先收集大家可参加的时间，再确定最终饭局时间。适合周末小桌、商务晚餐和朋友局。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/features/date-poll" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">时间投票功能</Link>
            <Link href="/create" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">创建饭局</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-12 md:grid-cols-3 md:px-8 md:py-16">
          {[
            ["先投票再确认", "饭局还没定死时间时，先给出 2 到 4 个候选档，让参与者选择真实可参加时间，减少群聊来回确认。"],
            ["保留主理判断", "投票结果不是机械排期，主理人仍可以结合餐厅空位、同桌组合和主题适配度，选择最稳妥的一档。"],
            ["适合小桌场景", "周末饭局、商务晚餐、朋友局和新人饭局都适合先投票，尤其是参与者来自不同城区或工作时间不一致时。"],
          ].map(([title, body]) => (
            <article key={title} className="border border-border/60 bg-card/35 p-5">
              <h2 className="font-serif text-2xl text-foreground">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[900px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid gap-px border border-border/60 bg-border/60">
            {options.map(([time, count]) => (
              <article key={time} className="flex items-center justify-between gap-4 bg-card/40 p-5">
                <h2 className="font-serif text-2xl text-foreground">{time}</h2>
                <span className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">{count}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
