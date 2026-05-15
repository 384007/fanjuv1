import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "发现公开饭局｜饭局 Fanju",
  description: "发现饭局 Fanju 的公开城市饭局，按城市、类型和主题浏览可关注的小桌晚餐。",
  alternates: { canonical: "/explore" },
}

const items = [
  ["深圳周末小桌", "深圳", "/city/shenzhen/weekend-dinner"],
  ["上海商务晚餐", "上海", "/city/shanghai/business-dinner"],
  ["北京城市小桌", "北京", "/city/beijing/founder-dinner"],
  ["新加坡华人晚餐", "新加坡", "/city/singapore/chinese-social-dining"],
]

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">EXPLORE</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">发现公开饭局</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">按城市和主题浏览可关注的小桌晚餐。公开饭局适合城市冷启动、主办方招募和新用户发现。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/create" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">创建饭局</Link>
            <Link href="/features/public-events" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">公开饭局功能</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid grid-cols-1 gap-px border border-border/60 bg-border/60 md:grid-cols-2 lg:grid-cols-4">
            {items.map(([title, city, href]) => (
              <article key={title} className="bg-card/40 p-5 transition-colors hover:bg-card/70">
                <Link href={href} className="group block">
                  <h2 className="font-serif text-2xl text-foreground group-hover:text-accent">{title}</h2>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{city}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">进入城市页面查看说明、规则和相关入口。</p>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
