import type { Metadata } from "next"
import Link from "next/link"
import { CreateDinnerForm } from "@/components/create-dinner-form"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "创建饭局｜饭局 Fanju",
  description: "用饭局 Fanju 创建一场主题清楚、人数明确、规则可确认的小桌饭局，适合主理人发起同城晚餐、商务饭局和周末聚餐。",
  alternates: { canonical: "/create" },
}

export default function CreateDinnerPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">CREATE DINNER</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">创建一场饭局</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">填写主题、时间、地点、人数和报名边界，让一场饭局在发出前就具备清楚预期。适合主理人组织同城小桌、商务晚餐、周末聚餐和兴趣饭局。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/host-tools" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">主理人工具</Link>
            <Link href="/invite" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局口令</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-12 md:grid-cols-3 md:px-8 md:py-16">
          {[
            ["主题先清楚", "用一句话说明这桌饭适合谁、聊什么、不适合什么，避免报名后才发现预期不一致。"],
            ["人数有边界", "小桌饭局建议提前写明席位上限、是否候补、是否允许带朋友，让主理人更容易确认同桌组合。"],
            ["安全可确认", "公开餐厅、费用说明、取消规则和联系方式都应在发出前确认，首次见面不建议模糊地点或私下转账。"],
          ].map(([title, body]) => (
            <article key={title} className="border border-border/60 bg-card/35 p-5">
              <h2 className="font-serif text-2xl text-foreground">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[760px] px-4 py-12 md:px-8 md:py-16">
          <CreateDinnerForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
