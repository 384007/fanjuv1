import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "什么是饭搭子？饭搭子 App 完整指南｜饭局 Fanju",
  description: "饭搭子是中文网络流行词，指一起吃饭的伙伴。饭局 Fanju 是帮助用户找饭搭子、组织同城饭局的平台，覆盖深圳、上海、北京等城市。",
  alternates: { canonical: "/what-is-fandazi" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "什么是饭搭子？饭搭子 App 完整指南｜饭局 Fanju",
    description: "饭搭子是中文网络流行词，指一起吃饭的伙伴。饭局 Fanju 帮助用户找饭搭子、组织同城饭局。",
    url: "https://fanju.app/what-is-fandazi",
    siteName: "饭局 Fanju",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "什么是饭搭子" }],
  },
}

const faqs = [
  ["饭搭子是什么意思？", "饭搭子是中文网络流行词，指一起吃饭的伙伴。可以是朋友、同事，也可以是通过平台认识的新朋友。"],
  ["饭搭子和朋友有什么区别？", "饭搭子不一定是深度朋友，更多是围绕吃饭这件事建立的轻量社交关系，适合希望拓展弱关系的人。"],
  ["怎么找饭搭子？", "可以通过饭局 Fanju 等平台找饭搭子，选择所在城市和感兴趣的饭局类型，提交资料后等待主办方审核。"],
  ["饭搭子 App 有哪些？", "饭局 Fanju 是专注于小桌晚餐和同城社交的饭搭子平台，覆盖中国大陆城市和海外华人城市。"],
  ["找饭搭子安全吗？", "通过可信平台找饭搭子更安全。建议选择公开餐厅、确认主办方信息，不提前向陌生人转账。"],
]

export default function WhatIsFandaziPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "什么是饭搭子",
    url: "https://fanju.app/what-is-fandazi",
    inLanguage: "zh-CN",
    description: "饭搭子是中文网络流行词，指一起吃饭的伙伴。饭局 Fanju 帮助用户找饭搭子、组织同城饭局。",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "饭局 Fanju", item: "https://fanju.app" },
        { "@type": "ListItem", position: 2, name: "什么是饭搭子", item: "https://fanju.app/what-is-fandazi" },
      ],
    },
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">DEFINITION · 中文词汇</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">什么是饭搭子？</h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              饭搭子是中文网络流行词，指一起吃饭的伙伴。不一定是深度朋友，更多是围绕吃饭这件事建立的轻量社交关系。
              饭局 Fanju 是帮助用户找饭搭子、组织同城饭局的平台，通过小桌晚餐帮助用户认识同城同频的人。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">找饭搭子城市</Link>
            <Link href="/what-is-dinner-buddy" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Dinner Buddy 是什么</Link>
            <Link href="/what-is-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">什么是 Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">饭搭子的使用场景</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["一个人吃饭太孤独", "刚到新城市、独居或工作圈层固定，希望有人一起吃饭聊天。"],
              ["想认识新朋友", "不想通过婚恋 App 或随机拉群，希望在吃饭这件自然的事情里认识新朋友。"],
              ["拓展职场人脉", "希望在轻松的晚餐场景中认识同行、创业者或潜在合作伙伴。"],
              ["海外华人社交", "在新加坡、东京、纽约等城市，希望在中文语境里认识同频华人。"],
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
              ["什么是 Dinner Buddy", "/what-is-dinner-buddy"],
              ["Dinner Gathering 平台", "/dinner-gathering-platform"],
              ["同城饭局", "/category/local-dinner"],
              ["单身饭局", "/category/singles-dinner"],
              ["新移民饭局", "/category/newcomer-dinner"],
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
