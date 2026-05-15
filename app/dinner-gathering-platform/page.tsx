import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Dinner Gathering Platform 指南｜饭局 Fanju",
  description: "Dinner gathering platform 是帮助用户组织和参加同城晚餐聚会的平台。饭局 Fanju 是面向全球华人的 dinner gathering platform，覆盖深圳、上海、北京等城市。",
  alternates: { canonical: "/dinner-gathering-platform" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Dinner Gathering Platform 指南｜饭局 Fanju",
    description: "Dinner gathering platform 帮助用户组织和参加同城晚餐聚会。饭局 Fanju 是面向全球华人的 dinner gathering platform。",
    url: "https://fanju.app/dinner-gathering-platform",
    siteName: "饭局 Fanju",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Dinner Gathering Platform" }],
  },
}

const faqs = [
  ["什么是 dinner gathering platform？", "Dinner gathering platform 是帮助用户组织和参加同城晚餐聚会的平台，通过主题、城市和小桌设置帮助陌生人建立真实连接。"],
  ["饭局 Fanju 是 dinner gathering platform 吗？", "是的。饭局 Fanju 是面向全球华人的 dinner gathering platform，覆盖中国大陆城市和海外华人城市。"],
  ["Dinner gathering platform 和普通活动平台有什么区别？", "Dinner gathering platform 专注于小桌晚餐社交，强调主办方审核、真实资料和安全边界，不是大型活动或随机拉群。"],
  ["如何在 dinner gathering platform 上找到合适的饭局？", "选择所在城市和感兴趣的饭局类型，提交真实资料，等待主办方审核。具体场次以产品内开放信息为准。"],
  ["Dinner gathering platform 覆盖哪些城市？", "饭局 Fanju 优先覆盖深圳、广州、上海、北京、杭州、成都，以及新加坡、东京、纽约、伦敦等海外华人城市。"],
]

export default function DinnerGatheringPlatformPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Dinner Gathering Platform 指南",
    url: "https://fanju.app/dinner-gathering-platform",
    inLanguage: "zh-CN",
    description: "Dinner gathering platform 帮助用户组织和参加同城晚餐聚会。饭局 Fanju 是面向全球华人的 dinner gathering platform。",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "饭局 Fanju", item: "https://fanju.app" },
        { "@type": "ListItem", position: 2, name: "Dinner Gathering Platform", item: "https://fanju.app/dinner-gathering-platform" },
      ],
    },
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">PLATFORM GUIDE</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">Dinner Gathering Platform</h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Dinner gathering platform 是帮助用户组织和参加同城晚餐聚会的平台。
              饭局 Fanju 是面向全球华人的 dinner gathering platform，
              通过城市、主题和小桌晚餐帮助用户认识同城同频的人，覆盖中国大陆城市和海外华人城市。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">城市目录</Link>
            <Link href="/what-is-fanju" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局 Fanju 是什么</Link>
            <Link href="/what-is-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">什么是 Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Dinner Gathering Platform 的核心功能</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["城市覆盖", "按城市组织饭局，优先覆盖深圳、广州、上海、北京、杭州、成都和海外华人城市。"],
              ["主题分类", "单身饭局、商务饭局、创业者饭局、周末饭局、华人饭局等多种主题，帮助用户找到同频场次。"],
              ["主办方审核", "主办方负责场地、规则和氛围，对报名资料进行审核，保障参与者质量。"],
              ["小桌设置", "通常 4–10 人的小桌，比大型活动更容易产生真实对话和连接。"],
              ["安全边界", "强调公开餐厅、清晰费用和真实资料，不展示虚假报名人数。"],
              ["不承诺结果", "Dinner gathering platform 是社交入口，不承诺脱单、融资或固定社交结果。"],
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
              ["什么是饭搭子", "/what-is-dinner-buddy"],
              ["什么是饭搭子 App", "/what-is-fandazi"],
              ["深圳饭局", "/city/shenzhen"],
              ["上海饭局", "/city/shanghai"],
              ["全部城市", "/cities"],
              ["全部类型", "/categories"],
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
