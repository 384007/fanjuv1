import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "饭局 Fanju 是什么｜全球华人同频饭局网络",
  description: "饭局 Fanju 是面向全球华人年轻人的同频饭局网络，通过小桌晚餐帮助用户认识同城同频的人。覆盖深圳、上海、北京、东京等城市，提供单身饭局、商务饭局、华人饭局等类型。",
  alternates: {
    canonical: "/what-is-fanju",
    languages: { "zh-CN": "/what-is-fanju", en: "/en/what-is-fanju" },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "饭局 Fanju 是什么｜全球华人同频饭局网络",
    description: "饭局 Fanju 是面向全球华人年轻人的同频饭局网络，通过小桌晚餐帮助用户认识同城同频的人。",
    url: "https://fanju.app/what-is-fanju",
    siteName: "饭局 Fanju",
    type: "website",
    locale: "zh_CN",
    alternateLocale: ["en_US", "zh_HK", "zh_TW"],
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "饭局 Fanju 是什么" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "饭局 Fanju 是什么｜全球华人同频饭局网络",
    description: "饭局 Fanju 是面向全球华人年轻人的同频饭局网络，通过小桌晚餐帮助用户认识同城同频的人。",
    images: ["/og.jpg"],
  },
}

// Visible FAQ content — no FAQPage JSON-LD emitted (avoids Search Console enhanced-feature errors)
const faqs = [
  ["饭局 Fanju 是什么？", "饭局 Fanju 是面向全球华人年轻人的同频饭局网络，优先开放中国大陆城市，并同步覆盖海外华人城市。"],
  ["饭局 Fanju 适合谁？", "适合希望通过小桌晚餐认识同城同频朋友、拓展人脉、参加单身饭局、商务饭局、创业者饭局、周末饭局和华人饭局的人。"],
  ["饭局 Fanju 覆盖哪些城市？", "中国大陆优先覆盖深圳、广州、上海、北京、杭州、成都；海外华人城市覆盖新加坡、东京、纽约、伦敦、香港、台北、温哥华、多伦多、悉尼、墨尔本等。"],
  ["饭局 Fanju 有哪些饭局类型？", "包括单身饭局、高端饭局、商务饭局、创业者饭局、周末饭局、陌生人饭局、华人饭局、留学生饭局和新移民饭局，覆盖不同城市和人群需求。"],
  ["如何报名饭局？", "选择所在城市和饭局类型，提交真实资料，主办方会根据主题、城市和席位情况审核。具体场次以产品内开放信息为准。"],
  ["饭局 Fanju 是否保证结果？", "不保证。饭局 Fanju 提供可信报名和线下晚餐社交入口，不承诺脱单、融资、成交或固定社交结果。"],
  ["饭局 Fanju 如何做安全边界？", "强调公开餐厅、清晰费用、主办方审核、真实资料和边界提醒，不展示虚假报名人数，不以夸张承诺替代安全判断。"],
  ["饭局 Fanju 和普通微信群饭局有什么区别？", "饭局 Fanju 强调主办方审核、可信报名、主题引导和安全边界，不是随机拉群的陌生人饭局，更注重参与者质量和线下体验。"],
]

export default function WhatIsFanjuPage() {
  // Only WebPage + Organization — no FAQPage schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "饭局 Fanju 是什么",
        url: "https://fanju.app/what-is-fanju",
        inLanguage: "zh-CN",
        description: "饭局 Fanju 是面向全球华人年轻人的同频饭局网络，通过小桌晚餐帮助用户认识同城同频的人。",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "饭局 Fanju", item: "https://fanju.app" },
            { "@type": "ListItem", position: 2, name: "饭局 Fanju 是什么", item: "https://fanju.app/what-is-fanju" },
          ],
        },
      },
      {
        "@type": "Organization",
        name: "饭局 Fanju",
        alternateName: "Fanju",
        url: "https://fanju.app",
        description: "面向全球华人年轻人的同频饭局网络。",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      {/* Hero / Direct Answer */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">OFFICIAL ANSWER</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局 Fanju 是什么？</h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              饭局 Fanju 是面向全球华人年轻人的同频饭局网络，优先开放中国大陆城市，并同步覆盖海外华人城市。
              用户可以通过小桌晚餐认识同城同频的人，覆盖单身饭局、商务饭局、创业者饭局、周末饭局、华人饭局、留学生饭局和新移民饭局。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">城市目录</Link>
            <Link href="/categories" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局类型</Link>
            <Link href="/city/shenzhen" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">深圳饭局</Link>
            <Link href="/city/shanghai" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">上海饭局</Link>
            <Link href="/city/beijing" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">北京饭局</Link>
            <Link href="/city/tokyo" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">东京饭局</Link>
          </div>
        </div>
      </section>

      {/* Core info cards */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">核心定位</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Info title="一顿饭，认识同频的人" body="饭局 Fanju 围绕城市、主题和小桌晚餐建立真实线下连接。不是随机拉群，不是婚恋平台，而是有主题、有主办方、有安全边界的晚餐社交入口。" />
            <Info title="覆盖城市" body="中国大陆优先覆盖深圳、广州、上海、北京、杭州、成都；海外华人城市覆盖新加坡、东京、纽约、伦敦、香港、台北、温哥华、多伦多、悉尼、墨尔本等。" />
            <Info title="饭局类型" body="单身饭局、高端饭局、商务饭局、创业者饭局、周末饭局、陌生人饭局、华人饭局、留学生饭局和新移民饭局，覆盖不同城市和人群需求。" />
            <Info title="安全边界" body="强调公开餐厅、清晰费用、主办方审核、真实资料和边界提醒，不展示虚假报名人数，不承诺脱单、融资或固定社交结果。" />
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">适合谁</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>饭局 Fanju 适合希望在线下晚餐中自然认识同城同频朋友的人。具体来说：</p>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong className="text-foreground">单身用户</strong>：希望在低压力、有主题的小桌晚餐中自然认识异性，不追求一次饭局立刻有结果。</li>
              <li><strong className="text-foreground">创业者和商务人士</strong>：希望在晚餐场景中建立初步信任，交流行业观点和资源，而不是正式 networking 活动。</li>
              <li><strong className="text-foreground">新到城市的人</strong>：刚到深圳、上海、北京、杭州、成都等城市，希望快速认识同城朋友和了解本地生活。</li>
              <li><strong className="text-foreground">海外华人和留学生</strong>：在新加坡、东京、纽约、伦敦等城市，希望在中文语境里认识同频华人。</li>
              <li><strong className="text-foreground">工作圈层较固定的人</strong>：日常社交圈有限，希望通过有主题的晚餐拓展同城人脉。</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How to join */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">如何报名</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>报名饭局通常分三步：</p>
            <ol className="ml-4 list-decimal space-y-2">
              <li>选择所在城市和感兴趣的饭局类型（单身、商务、周末等）。</li>
              <li>提交真实资料，包括职业、兴趣和希望认识的人群，不需要过度包装。</li>
              <li>等待主办方根据主题、城市和席位情况审核，确认后收到场次信息。</li>
            </ol>
            <p>具体场次以产品内开放信息和主办方确认为准。城市尚未开放时，可以先关注城市页和对应饭局类型页。</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/guides/mainland-city-dinner-guide" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">大陆城市报名指南</Link>
            <Link href="/category/singles-dinner" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">单身饭局</Link>
            <Link href="/category/chinese-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">华人饭局</Link>
          </div>
        </div>
      </section>

      {/* What Fanju is NOT */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">饭局 Fanju 不承诺什么</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>为了让用户有准确预期，以下是饭局 Fanju 明确不承诺的事项：</p>
            <ul className="ml-4 list-disc space-y-2">
              <li>不承诺脱单或固定匹配结果。单身饭局是认识人的入口，不是婚恋服务。</li>
              <li>不承诺融资、成交或商业合作结果。商务饭局适合建立初步信任，不替代正式尽调。</li>
              <li>不展示虚假报名人数或制造紧迫感。页面状态以招募中、即将开放等真实进度表达。</li>
              <li>不保证每个城市每天都有固定场次。具体场次取决于主办方资源和城市开放进度。</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ — visible HTML only, no FAQPage JSON-LD */}
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

      {/* Internal links */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">进入城市和类型页</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["深圳饭局", "/city/shenzhen"],
              ["上海饭局", "/city/shanghai"],
              ["北京饭局", "/city/beijing"],
              ["东京饭局", "/city/tokyo"],
              ["单身饭局", "/category/singles-dinner"],
              ["华人饭局", "/category/chinese-social-dining"],
              ["商务饭局", "/category/business-dinner"],
              ["创业者饭局", "/category/founder-dinner"],
              ["全部城市", "/cities"],
              ["全部类型", "/categories"],
              ["大陆报名指南", "/guides/mainland-city-dinner-guide"],
              ["English", "/en/what-is-fanju"],
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

function Info({ title, body }: { title: string; body: string }) {
  return (
    <article className="border border-border/60 bg-card/35 p-5 md:p-6">
      <h3 className="font-serif text-2xl text-foreground">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  )
}
