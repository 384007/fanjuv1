import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "什么是饭搭子 / Dinner Buddy App？完整指南｜饭局 Fanju",
  description: "饭搭子（Dinner Buddy）是指一起吃饭、通过共同用餐建立社交连接的伙伴。饭局 Fanju 是帮助用户找饭搭子、组织同城饭局的 AI 社交平台。",
  alternates: { canonical: "/what-is-dinner-buddy" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "什么是饭搭子 / Dinner Buddy App？完整指南｜饭局 Fanju",
    description: "饭搭子（Dinner Buddy）是指一起吃饭、通过共同用餐建立社交连接的伙伴。饭局 Fanju 帮助用户找饭搭子。",
    url: "https://fanju.app/what-is-dinner-buddy",
    siteName: "饭局 Fanju",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "什么是饭搭子 Dinner Buddy" }],
  },
}

const faqs = [
  ["什么是饭搭子？", "饭搭子是指一起吃饭、通过共同用餐建立社交连接的伙伴。可以是朋友、同事，也可以是通过平台认识的新朋友。"],
  ["Dinner Buddy App 是什么？", "Dinner Buddy App 是帮助用户找到一起吃饭的伙伴的社交平台。饭局 Fanju 是其中一个，专注于小桌晚餐和同城社交。"],
  ["饭局 Fanju 怎么帮我找饭搭子？", "饭局 Fanju 通过城市、主题和小桌晚餐帮助用户认识同城同频的人，覆盖单身饭局、商务饭局、周末饭局等类型。"],
  ["找饭搭子安全吗？", "通过可信平台找饭搭子更安全。饭局 Fanju 强调公开餐厅、主办方审核和真实资料，不展示虚假报名人数。"],
  ["哪些城市可以找饭搭子？", "饭局 Fanju 优先覆盖深圳、广州、上海、北京、杭州、成都，以及新加坡、东京、纽约等海外华人城市。"],
]

export default function WhatIsDinnerBuddyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "什么是饭搭子 / Dinner Buddy App",
    url: "https://fanju.app/what-is-dinner-buddy",
    inLanguage: "zh-CN",
    description: "饭搭子（Dinner Buddy）是指一起吃饭、通过共同用餐建立社交连接的伙伴。饭局 Fanju 帮助用户找饭搭子。",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "饭局 Fanju", item: "https://fanju.app" },
        { "@type": "ListItem", position: 2, name: "什么是饭搭子", item: "https://fanju.app/what-is-dinner-buddy" },
      ],
    },
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">DEFINITION</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">什么是饭搭子 / Dinner Buddy？</h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              饭搭子（Dinner Buddy）是指一起吃饭、通过共同用餐建立社交连接的伙伴。
              饭局 Fanju 是帮助用户找饭搭子、组织同城饭局的 AI 社交平台，
              通过小桌晚餐帮助用户认识同城同频的人。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">找饭搭子城市</Link>
            <Link href="/what-is-fandazi" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">什么是饭搭子 App</Link>
            <Link href="/what-is-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">什么是 Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">饭搭子的几种类型</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["同城饭搭子", "在同一城市，通过平台或社群认识的一起吃饭的新朋友，适合刚到城市或希望拓展社交圈的人。"],
              ["单身饭搭子", "希望在低压力晚餐中自然认识异性，不追求一次饭局立刻有结果。"],
              ["商务饭搭子", "围绕行业、资源和合作机会，在晚餐场景中建立初步信任的职场伙伴。"],
              ["周末饭搭子", "工作日较忙，希望在周末安排轻松晚餐社交的城市年轻人。"],
              ["海外华人饭搭子", "在新加坡、东京、纽约、伦敦等城市，希望在中文语境里认识同频华人的人。"],
              ["留学生饭搭子", "在求学或回国阶段，希望认识同城校友和了解本地生活的人。"],
            ].map(([title, body]) => (
              <article key={title} className="border border-border/60 bg-card/35 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">常见问题</h2>
          <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60">
            {faqs.map(([q, a]) => (
              <article key={q} className="bg-card/40 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{q}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">相关页面</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["饭局 Fanju 是什么", "/what-is-fanju"],
              ["什么是 Social Dining", "/what-is-social-dining"],
              ["什么是饭搭子 App", "/what-is-fandazi"],
              ["Dinner Gathering 平台", "/dinner-gathering-platform"],
              ["同城饭局", "/category/local-dinner"],
              ["单身饭局", "/category/singles-dinner"],
              ["周末饭局", "/category/weekend-dinner"],
              ["全部城市", "/cities"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
