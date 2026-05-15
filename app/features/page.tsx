import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { productFeatures } from "@/lib/product-features"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "饭局功能｜邀请、报名、嘉宾、通知、时间投票、相册｜饭局 Fanju",
  description: "饭局 Fanju 功能目录，覆盖一链邀请、报名追踪、嘉宾名单、群发通知、时间投票、报名问题、费用说明、饭局相册、公开饭局和单身匹配。",
  alternates: { canonical: "/features", languages: { "zh-CN": "/features", en: "/en/features" } },
}

export default function FeaturesPage() {
  const faq = [
    ["饭局 Fanju 有哪些核心功能？", "饭局 Fanju 覆盖一链邀请、报名追踪、嘉宾名单、群发通知、时间投票、报名问题、费用说明、饭局相册、公开饭局和单身匹配。"],
    ["饭局 Fanju 适合主办方吗？", "适合。主办方可以用功能页理解如何组织城市饭局、控制人数、说明费用、同步通知和沉淀饭局记录。"],
    ["饭局 Fanju 和普通群聊有什么不同？", "普通群聊容易信息分散，饭局 Fanju 把饭局主题、报名、嘉宾、通知、费用和规则集中到结构化页面。"],
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: "饭局 Fanju 功能目录", url: `${SITE_URL}/features`, inLanguage: "zh-CN" },
      { "@type": "ItemList", name: "饭局功能目录", itemListElement: productFeatures.map((feature, index) => ({ "@type": "ListItem", position: index + 1, name: feature.name, url: `${SITE_URL}/features/${feature.slug}` })) },
      { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">FANJU FEATURES</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局功能目录</h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">饭局 Fanju 的功能围绕线下小桌晚餐组织：创建饭局、分享邀请、追踪报名、管理嘉宾、群发通知、时间投票、报名问题、费用说明、饭局相册、公开饭局和单身匹配。</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/hosts" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">主办方招募</Link>
            <Link href="/rules" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">参加规则</Link>
            <Link href="/en/features" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">English</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid grid-cols-1 gap-px border border-border/60 bg-border/60 md:grid-cols-2 lg:grid-cols-3">
            {productFeatures.map((feature) => (
              <article key={feature.slug} className="bg-card/40 p-5 transition-colors hover:bg-card/70">
                <Link href={`/features/${feature.slug}`} className="group block">
                  <h2 className="font-serif text-2xl text-foreground group-hover:text-accent">{feature.name}</h2>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{feature.nameEn}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{feature.answer}</p>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">功能常见问题</h2>
          <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60">
            {faq.map(([q, a]) => <article key={q} className="bg-card/40 p-5 md:p-6"><h3 className="font-serif text-xl text-foreground">{q}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p></article>)}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
