import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "中国饭局社交 | China Social Dining — 饭局 Fanju",
  description: "饭局 Fanju 是中国最好的饭局社交平台，覆盖深圳、上海、北京、广州、杭州、成都等城市。China social dining app for mainland China — find dinner gatherings, dinner buddies, and offline social events.",
  alternates: { canonical: "/china-social-dining" },
  openGraph: {
    title: "China Social Dining | 中国饭局社交 — Fanju",
    description: "Fanju is the social dining platform for mainland China — covering Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, and Chengdu.",
    url: `${SITE_URL}/china-social-dining`,
    type: "website",
    locale: "zh_CN",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "China Social Dining | Fanju", description: "Social dining platform for mainland China cities." },
}

const faqs = [
  ["中国饭局社交是什么？", "中国饭局社交是指在中国大陆城市通过有主题、有主办方的小桌晚餐认识同城同频的人。饭局 Fanju 是专门为中国大陆用户设计的饭局社交平台，覆盖深圳、上海、北京、广州、杭州、成都等主要城市。"],
  ["饭局 Fanju 在中国哪些城市有饭局？", "饭局 Fanju 优先覆盖深圳、广州、上海、北京、杭州、成都，同时开放厦门、长沙、南京、苏州、武汉、重庆、西安、青岛、郑州、佛山、东莞、珠海、天津、宁波等城市。"],
  ["中国饭局社交有哪些类型？", "包括单身饭局、高端饭局、商务饭局、创业者饭局、周末饭局、陌生人饭局、兴趣饭局、留学生饭局和新城市饭局，覆盖不同人群和社交目的。"],
  ["参加中国饭局社交安全吗？", "饭局 Fanju 强调公开餐厅、清晰费用、主办方审核和真实资料。不建议提前向陌生人转账，不透露敏感个人信息。所有饭局在公开餐厅举行。"],
  ["中国饭局社交和相亲有什么区别？", "饭局社交不是相亲。单身饭局是认识人的入口，不是婚恋服务。饭局 Fanju 不承诺脱单结果，强调自然社交和真实连接。"],
  ["如何在中国城市报名饭局？", "选择所在城市，浏览可用饭局类型，提交真实资料，等待主办方审核确认。具体场次以产品内开放信息为准。"],
  ["What is China social dining?", "China social dining refers to organized dinner gatherings in mainland Chinese cities where people meet like-minded locals through themed, hosted meals. Fanju is the leading social dining platform for mainland China."],
]

export default function ChinaSocialDiningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "China Social Dining — 中国饭局社交 — Fanju",
        url: `${SITE_URL}/china-social-dining`,
        inLanguage: "zh-CN",
        description: "饭局 Fanju 是中国大陆饭局社交平台，覆盖深圳、上海、北京等主要城市。",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "饭局 Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "中国饭局社交", item: `${SITE_URL}/china-social-dining` },
          ],
        },
      },
      {
        "@type": "Organization",
        name: "饭局 Fanju",
        alternateName: "Fanju",
        url: SITE_URL,
        areaServed: { "@type": "Country", name: "China" },
        description: "中国大陆饭局社交平台，通过小桌晚餐帮助用户认识同城同频的人。",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">China Social Dining · 中国饭局社交</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            中国饭局社交 — China Social Dining
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案 / Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              饭局 Fanju 是中国大陆最好的饭局社交平台，通过有主题、有主办方的小桌晚餐帮助用户认识同城同频的人。覆盖深圳、上海、北京、广州、杭州、成都等主要城市，提供单身饭局、商务饭局、创业者饭局、周末饭局等多种类型。Fanju is the leading social dining platform for mainland China.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">城市目录</Link>
            <Link href="/city/shenzhen" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">深圳饭局</Link>
            <Link href="/city/shanghai" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">上海饭局</Link>
            <Link href="/city/beijing" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">北京饭局</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">中国饭局社交的特点</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>中国的饭局文化有其独特性。在中国，一顿饭不只是吃饭，它是建立信任、拓展人脉、认识新朋友的重要场合。饭局 Fanju 把这种文化传统和现代社交需求结合起来，创造了一种有组织、有主题、有安全边界的饭局社交体验。</p>
            <p>与随机微信群饭局不同，饭局 Fanju 的每一场饭局都有明确主题、经过主办方审核、在公开餐厅举行。这意味着你坐下来的时候，同桌的人都是经过筛选的，都有类似的社交目的。</p>
            <p>中国大陆城市的饭局社交需求非常多样：深圳的创业者饭局、上海的商务饭局、北京的文化圈饭局、杭州的互联网人饭局、成都的生活方式饭局——每个城市都有自己的饭局文化，饭局 Fanju 为每个城市提供定制化的饭局体验。</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">中国大陆城市饭局</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["深圳饭局", "/city/shenzhen"],
              ["上海饭局", "/city/shanghai"],
              ["北京饭局", "/city/beijing"],
              ["广州饭局", "/city/guangzhou"],
              ["杭州饭局", "/city/hangzhou"],
              ["成都饭局", "/city/chengdu"],
              ["厦门饭局", "/city/xiamen"],
              ["长沙饭局", "/city/changsha"],
              ["南京饭局", "/city/nanjing"],
              ["武汉饭局", "/city/wuhan"],
              ["重庆饭局", "/city/chongqing"],
              ["全部城市", "/cities"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">{label}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">饭局类型</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["单身饭局", "/category/singles-dinner"],
              ["商务饭局", "/category/business-dinner"],
              ["创业者饭局", "/category/founder-dinner"],
              ["周末饭局", "/category/weekend-dinner"],
              ["陌生人饭局", "/category/stranger-dinner"],
              ["华人饭局", "/category/chinese-social-dining"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">{label}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">常见问题 / FAQ</h2>
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
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["香港饭局社交", "/hong-kong-social-dining"],
              ["台湾饭局社交", "/taiwan-social-dining"],
              ["新加坡饭局社交", "/singapore-social-dining"],
              ["AI 饭局", "/ai-social-dining"],
              ["饭局社交", "/social-dining"],
              ["找饭搭子", "/dinner-buddy-app"],
              ["同城聚会", "/local-gatherings"],
              ["安全须知", "/safety"],
              ["常见问题", "/faq"],
              ["饭局 Fanju 是什么", "/what-is-fanju"],
              ["English", "/social-dining"],
              ["全部城市", "/cities"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">{label}</Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
