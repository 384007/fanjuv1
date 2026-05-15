import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "饭局嘉宾名单｜饭局 Fanju",
  description: "饭局 Fanju 嘉宾名单页面，用于展示饭局参与状态、候补状态、人数上限和同桌氛围说明。",
  alternates: { canonical: "/guests" },
}

const guests = [
  ["主办方", "已确认", "城市主理人"],
  ["嘉宾 A", "已确认", "产品方向"],
  ["嘉宾 B", "已确认", "设计方向"],
  ["嘉宾 C", "待确认", "内容方向"],
  ["嘉宾 D", "候补", "城市生活"],
]

export default function GuestsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">GUEST LIST</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局嘉宾名单</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">嘉宾名单用于展示主办方允许公开的信息，让参与者理解饭局人数、状态和同桌氛围。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/features/guest-list" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">嘉宾名单功能</Link>
            <Link href="/rsvp" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">报名状态</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[900px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid gap-px border border-border/60 bg-border/60">
            {guests.map(([name, status, note]) => (
              <article key={name} className="flex items-center justify-between gap-4 bg-card/40 p-5">
                <div><h2 className="font-serif text-2xl text-foreground">{name}</h2><p className="mt-1 text-sm text-muted-foreground">{note}</p></div>
                <span className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">{status}</span>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
