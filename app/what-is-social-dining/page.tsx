import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "什么是 Social Dining？饭局社交完整指南｜饭局 Fanju",
  description: "Social dining 是以共同用餐为核心的线下社交方式。饭局 Fanju 是面向全球华人的 social dining 平台，通过小桌晚餐帮助用户认识同城同频的人。",
  alternates: { canonical: "/what-is-social-dining" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "什么是 Social Dining？饭局社交完整指南｜饭局 Fanju",
    description: "Social dining 是以共同用餐为核心的线下社交方式。饭局 Fanju 是面向全球华人的 social dining 平台。",
    url: "https://fanju.app/what-is-social-dining",
    siteName: "饭局 Fanju",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "什么是 Social Dining" }],
  },
}

const faqs = [
  ["什么是 social dining？", "Social dining 是以共同用餐为核心的线下社交方式，通过小桌晚餐帮助陌生人或弱关系建立真实连接。"],
  ["Social dining 和普通聚餐有什么区别？", "普通聚餐通常是熟人之间的活动，social dining 更强调认识新朋友、主题引导和主办方组织，适合希望拓展社交圈的人。"],
  ["饭局 Fanju 是 social dining 平台吗？", "是的。饭局 Fanju 是面向全球华人的 social dining 平台，通过城市、主题和小桌晚餐帮助用户认识同城同频的人。"],
  ["Social dining 安全吗？", "可信的 social dining 平台会强调公开餐厅、主办方审核和真实资料。饭局 Fanju 不展示虚假报名人数，不承诺固定社交结果。"],
  ["哪些城市有 social dining？", "饭局 Fanju 优先覆盖深圳、广州、上海、北京、杭州、成都，以及新加坡、东京、纽约、伦敦等海外华人城市。"],
]

export default function WhatIsSocialDiningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "什么是 Social Dining",
    url: "https://fanju.app/what-is-social-dining",
    inLanguage: "zh-CN",
    description: "Social dining 是以共同用餐为核心的线下社交方式。饭局 Fanju 是面向全球华人的 social dining 平台。",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "饭局 Fanju", item: "https://fanju.app" },
        { "@type": "ListItem", position: 2, name: "什么是 Social Dining", item: "https://fanju.app/what-is-social-dining" },
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
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">什么是 Social Dining？</h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Social dining 是以共同用餐为核心的线下社交方式。不同于普通聚餐，social dining 强调认识新朋友、主题引导和主办方组织，
              帮助陌生人或弱关系在晚餐场景中建立真实连接。饭局 Fanju 是面向全球华人的 social dining 平台。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">城市目录</Link>
            <Link href="/what-is-fanju" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局 Fanju 是什么</Link>
            <Link href="/what-is-dinner-buddy" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">什么是饭搭子</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Social Dining 的核心特征</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["小桌晚餐", "通常 4–10 人的小桌设置，比大型活动更容易产生真实对话。"],
              ["主题引导", "围绕城市、职业、兴趣或生活方式设定主题，帮助参与者找到共同话题。"],
              ["主办方组织", "由有经验的主办方负责场地、规则和氛围，降低陌生人见面的不确定性。"],
              ["真实资料", "参与者提交真实个人信息，主办方审核，减少虚假身份和低质量参与。"],
              ["公开餐厅", "在公开营业的餐厅举办，保障基本安全边界。"],
              ["不承诺结果", "Social dining 是社交入口，不承诺脱单、融资或固定社交结果。"],
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">饭局 Fanju 的 Social Dining 类型</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["单身饭局", "/category/singles-dinner"],
              ["高端饭局", "/category/curated-dinner"],
              ["商务饭局", "/category/business-dinner"],
              ["创业者饭局", "/category/founder-dinner"],
              ["周末饭局", "/category/weekend-dinner"],
              ["陌生人饭局", "/category/stranger-dinner"],
              ["华人饭局", "/category/chinese-social-dining"],
              ["留学生饭局", "/category/student-dinner"],
              ["新移民饭局", "/category/newcomer-dinner"],
              ["同城饭局", "/category/local-dinner"],
              ["高质量社交", "/category/high-quality-social-dining"],
              ["全部类型", "/categories"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">
                {label}
              </Link>
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
              ["什么是饭搭子", "/what-is-dinner-buddy"],
              ["什么是饭搭子 App", "/what-is-fandazi"],
              ["Dinner Gathering 平台", "/dinner-gathering-platform"],
              ["深圳饭局", "/city/shenzhen"],
              ["上海饭局", "/city/shanghai"],
              ["北京饭局", "/city/beijing"],
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
