import type { Metadata } from "next"
import Link from "next/link"
import { ChinaSocialShare } from "@/components/china-social-share"
import { SeatForm } from "@/components/seat-form"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "饭局口令｜饭局 Fanju",
  description: "饭局 Fanju 饭局口令用于分享一场主题清楚的小桌饭局，让参与者查看时间、地点、席位状态和报名边界。",
  alternates: { canonical: "/invite" },
}

const parts = [
  ["标题", "标题要让参与者一眼看懂这桌饭的主题、城市和适合人群，避免只写泛泛的聚餐。"],
  ["城市", "城市和区域范围提前写清楚，参与者才能判断通勤、结束时间和是否适合当晚赴约。"],
  ["时间", "明确日期、开始时间和预计结束时间，方便小桌饭局按节奏确认席位。"],
  ["餐桌说明", "说明聊天主题、费用方式、餐厅类型和主理人边界，让第一次见面的预期更稳定。"],
  ["席位状态", "公开剩余席位、候补规则和确认方式，减少重复询问，也方便主理人控制同桌组合。"],
  ["同桌名单", "必要时展示已确认参与者的公开昵称或角色，让陌生人加入前有基本判断。"],
]

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
            <Link href="/host-tools" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">主理人工具</Link>
          </div>
        </div>
      </section>
      <ChinaSocialShare />
      <section className="border-b border-border/60"><div className="mx-auto max-w-[760px] px-4 py-12 md:px-8 md:py-16"><SeatForm table="demo-table" /></div></section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-3">
          {parts.map(([title, body]) => <article key={title} className="bg-card/40 p-6"><h2 className="font-serif text-2xl text-foreground">{title}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p></article>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
