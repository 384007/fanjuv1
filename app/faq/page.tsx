import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "FAQ | 常见问题 — 饭局 Fanju",
  description: "Frequently asked questions about Fanju — the social dining and dinner gathering app. 饭局 Fanju 常见问题解答：饭局是什么、如何报名、安全须知、城市覆盖、饭局类型等。",
  alternates: {
    canonical: "/faq",
    languages: { "zh-CN": "/faq", en: "/faq" },
  },
  openGraph: {
    title: "FAQ | 常见问题 — 饭局 Fanju",
    description: "Frequently asked questions about Fanju social dining and dinner gatherings.",
    url: `${SITE_URL}/faq`,
    type: "website",
    locale: "zh_CN",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "FAQ | 饭局 Fanju", description: "Frequently asked questions about Fanju." },
}

const faqSections = [
  {
    title: "关于饭局 Fanju / About Fanju",
    faqs: [
      ["饭局 Fanju 是什么？ / What is Fanju?", "饭局 Fanju 是一个 AI 饭局社交和线下聚会平台，帮助用户创建饭局、加入聚餐、寻找饭搭子、组织同城活动，并建立真实社交关系。Fanju is an AI social dining and dinner gathering app for people to create, join, and discover real-world meals, parties, dinner buddies, local gatherings, and offline social events."],
      ["饭局 Fanju 适合谁？ / Who is Fanju for?", "适合希望通过真实线下饭局认识同城同频朋友的人，包括单身用户、创业者、商务人士、新到城市的人、海外华人和留学生。Fanju is for anyone who wants to meet people through real-world dinner gatherings — singles, founders, professionals, newcomers to a city, and Chinese communities overseas."],
      ["饭局 Fanju 覆盖哪些城市？ / What cities does Fanju cover?", "中国大陆优先覆盖深圳、广州、上海、北京、杭州、成都；海外华人城市覆盖新加坡、东京、香港、台北、纽约、伦敦、温哥华、多伦多、悉尼、墨尔本等。Fanju prioritizes mainland China cities and global Chinese-community cities worldwide."],
      ["饭局 Fanju 有哪些饭局类型？ / What dinner types does Fanju offer?", "单身饭局、高端饭局、商务饭局、创业者饭局、周末饭局、陌生人饭局、华人饭局、留学生饭局和新城市饭局。Singles dinners, curated dinners, business dinners, founder dinners, weekend dinners, stranger dinners, Chinese community dinners, student dinners, and newcomer dinners."],
    ],
  },
  {
    title: "报名与参加 / Registration & Attendance",
    faqs: [
      ["如何报名饭局？ / How do I register for a dinner?", "选择所在城市和感兴趣的饭局类型，提交真实资料，等待主办方审核确认。具体场次以产品内开放信息为准。Browse by city at fanju.app/cities, choose a dinner type, submit a real profile, and wait for host confirmation."],
      ["报名需要提供哪些信息？ / What information do I need to register?", "通常需要提供职业、兴趣爱好、参加饭局的目的，以及希望认识的人群类型。真实资料有助于主办方为你匹配合适的饭局。Your occupation, interests, dinner goals, and what kind of people you want to meet."],
      ["报名后多久会收到确认？ / How long until I get confirmation?", "主办方会在饭局前审核所有报名，确认时间因主办方和场次而异。通常在饭局前 3–7 天收到确认。Host review timelines vary. Most guests receive confirmation 3–7 days before the dinner."],
      ["可以取消报名吗？ / Can I cancel my registration?", "可以，但请尽早通知主办方。具体取消规则由主办方设定，报名前请确认取消政策。Yes, but please notify the host as early as possible. Cancellation policies are set by individual hosts."],
    ],
  },
  {
    title: "安全与边界 / Safety & Boundaries",
    faqs: [
      ["饭局 Fanju 如何保障安全？ / How does Fanju ensure safety?", "饭局 Fanju 要求所有饭局在公开餐厅举行，主办方审核每位参与者，不允许提前向陌生人转账，不展示虚假报名人数。All Fanju dinners are held in public restaurants. Hosts review every guest. No advance payments to strangers. No fake RSVP counts."],
      ["参加饭局需要注意什么？ / What safety precautions should I take?", "选择公开餐厅场次，确认费用和取消规则，保留行程信息，不提前向陌生人转账，不透露敏感个人信息。Choose public restaurant events, confirm costs and cancellation policies, keep your itinerary with someone you trust, and never pay strangers in advance."],
      ["饭局 Fanju 承诺什么结果吗？ / Does Fanju guarantee outcomes?", "不承诺。饭局 Fanju 提供可信报名和线下晚餐社交入口，不承诺脱单、融资、成交或固定社交结果。No. Fanju provides a trusted registration and offline dining social entry point. We do not guarantee romantic, business, or social outcomes."],
    ],
  },
  {
    title: "主办方 / Hosts",
    faqs: [
      ["如何成为饭局主办方？ / How do I become a Fanju host?", "访问 fanju.app/hosts 了解主办方要求并提交申请。主办方需要有明确的饭局主题、愿意审核参与者并负责任地运营饭局。Visit fanju.app/hosts to learn about host requirements and apply."],
      ["主办方有哪些责任？ / What are host responsibilities?", "主办方负责选择主题、审核报名、确认场地和时间、与参与者沟通，以及确保饭局在公开餐厅举行、不收取预付款。Hosts are responsible for theme, guest review, venue, communication, and maintaining safety boundaries."],
    ],
  },
]

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "FAQ — 常见问题 — 饭局 Fanju",
        url: `${SITE_URL}/faq`,
        inLanguage: "zh-CN",
        description: "饭局 Fanju 常见问题解答。",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "饭局 Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "常见问题", item: `${SITE_URL}/faq` },
          ],
        },
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">FAQ · 常见问题</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            常见问题 — Frequently Asked Questions
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案 / Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              饭局 Fanju 是一个 AI 饭局社交和线下聚会平台。以下是关于饭局 Fanju 最常见的问题和答案，涵盖平台定位、报名流程、安全须知和主办方信息。Fanju is an AI social dining and dinner gathering app. Below are the most common questions about Fanju.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/what-is-fanju" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">饭局 Fanju 是什么</Link>
            <Link href="/safety" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">安全须知</Link>
            <Link href="/hosts" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">主办方招募</Link>
          </div>
        </div>
      </section>

      {faqSections.map((section) => (
        <section key={section.title} className="border-b border-border/60">
          <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
            <h2 className="font-serif text-3xl text-foreground md:text-4xl">{section.title}</h2>
            <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60">
              {section.faqs.map(([q, a]) => (
                <article key={q} className="bg-card/40 p-5 md:p-6">
                  <h3 className="font-serif text-xl text-foreground">{q}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">相关页面 / Related Pages</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["饭局 Fanju 是什么", "/what-is-fanju"],
              ["安全须知", "/safety"],
              ["主办方招募", "/hosts"],
              ["饭局社交", "/social-dining"],
              ["找饭搭子", "/dinner-buddy-app"],
              ["同城聚会", "/local-gatherings"],
              ["中国饭局社交", "/china-social-dining"],
              ["全部城市", "/cities"],
              ["全部类型", "/categories"],
              ["Press", "/press"],
              ["English FAQ", "/faq"],
              ["What is Fanju", "/en/what-is-fanju"],
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
