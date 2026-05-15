import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "参与者工具｜饭局 Fanju",
  description: "饭局 Fanju 参与者工具，集中展示饭局广场、附近饭局、保存、席位确认、同桌名单、日历、提醒和饭后回忆。",
  alternates: { canonical: "/guest-tools" },
}

const tools = [
  ["饭局广场", "/market"],
  ["附近饭局", "/nearby"],
  ["保存饭局", "/saved"],
  ["席位确认", "/responses"],
  ["同桌名单", "/guests"],
  ["入局问答", "/questions"],
  ["饭局日历", "/calendar"],
  ["桌前提醒", "/reminders"],
  ["饭后回忆", "/memories"],
]

export default function GuestToolsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">GUEST TOOLS</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">参与者工具</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">把参与者需要的找局、保存、报名、同桌、提醒和饭后回忆集中到一个入口。</p>
        </div>
      </section>
      <section className="border-b border-border/60"><div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-3">{tools.map(([label, href]) => <Link key={href} href={href} className="bg-card/40 p-6 hover:bg-card/70"><h2 className="font-serif text-2xl text-foreground">{label}</h2><p className="mt-3 text-sm text-muted-foreground">进入这个参与者工具。</p></Link>)}</div></section>
      <SiteFooter />
    </main>
  )
}
