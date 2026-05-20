import type { Metadata } from "next"
import Link from "next/link"
import { DinnerListClient } from "@/components/dinner-list-client"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "饭局广场｜饭局 Fanju",
  description: "饭局 Fanju 饭局广场用于浏览公开城市饭局，查看地点范围、时间安排、席位状态和口令入口。",
  alternates: { canonical: "/market" },
}

const links = [["发现饭局", "/explore"], ["附近饭局", "/nearby"], ["已保存", "/saved"], ["关注主理", "/following"]]

export default function MarketPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">FANJU MARKET</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局广场</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">浏览公开饭局的城市、区域、时间、席位状态和口令入口，先判断主题与同桌边界，再决定是否继续了解或报名。</p>
        </div>
      </section>
      <section className="border-b border-border/60"><div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16"><DinnerListClient /></div></section>
      <section className="border-b border-border/60"><div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-4">{links.map(([label, href]) => <Link key={href} href={href} className="bg-card/40 p-6 hover:bg-card/70"><h2 className="font-serif text-2xl text-foreground">{label}</h2><p className="mt-3 text-sm text-muted-foreground">进入这个饭局发现入口。</p></Link>)}</div></section>
      <SiteFooter />
    </main>
  )
}
