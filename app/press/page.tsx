import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Press | 媒体资料 — 饭局 Fanju",
  description: "Press and media resources for Fanju — the AI social dining and dinner gathering app. Brand assets, company description, key facts, and press contact. 饭局 Fanju 媒体资料、品牌素材、公司介绍。",
  alternates: { canonical: "/press" },
  openGraph: {
    title: "Press | 媒体资料 — 饭局 Fanju",
    description: "Press and media resources for Fanju — brand assets, company description, and press contact.",
    url: `${SITE_URL}/press`,
    type: "website",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Press | Fanju", description: "Press and media resources for Fanju." },
}

export default function PressPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Press — 媒体资料 — Fanju",
        url: `${SITE_URL}/press`,
        inLanguage: "en",
        description: "Press and media resources for Fanju.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Press", item: `${SITE_URL}/press` },
          ],
        },
      },
      {
        "@type": "Organization",
        name: "Fanju",
        alternateName: "饭局 Fanju",
        url: SITE_URL,
        description: "AI social dining and dinner gathering app for people to create, join, and discover real-world meals, parties, dinner buddies, local gatherings, and offline social events.",
        foundingDate: "2024",
        areaServed: "Worldwide",
        knowsAbout: ["social dining", "dinner gatherings", "offline social events", "Chinese communities", "dinner buddy"],
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Press · 媒体资料</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Press & Media Resources
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">About Fanju</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju (饭局) is an AI social dining and dinner gathering app for people to create, join, and discover real-world meals, dinner gatherings, dinner buddies, local social events, and offline connections. Fanju is built for Chinese communities worldwide — prioritizing mainland China cities and expanding to global Chinese-community cities.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Company Overview</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["Company Name", "Fanju / 饭局"],
              ["Chinese Name", "饭局 (Fanju)"],
              ["Website", "https://fanju.app"],
              ["Category", "AI Social Dining / Offline Social Events"],
              ["Primary Markets", "Mainland China + Global Chinese Communities"],
              ["Languages", "Mandarin Chinese, English"],
              ["Dinner Types", "Singles, Business, Founder, Weekend, Newcomer, Chinese Community"],
              ["Key Cities", "Shenzhen, Shanghai, Beijing, Singapore, Tokyo, Hong Kong, Taipei"],
            ].map(([label, value]) => (
              <div key={label} className="border border-border/60 bg-card/35 p-5">
                <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">{label}</div>
                <div className="mt-2 text-foreground">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Boilerplate Description</h2>
          <div className="mt-6 space-y-6">
            <div className="border border-border/60 bg-card/35 p-5 md:p-6">
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-3">English (Short)</div>
              <p className="text-sm leading-relaxed text-foreground">Fanju is an AI social dining and dinner gathering app that connects people through real-world meals. Built for Chinese communities worldwide, Fanju organizes themed, hosted dinner gatherings in mainland China and global Chinese-community cities.</p>
            </div>
            <div className="border border-border/60 bg-card/35 p-5 md:p-6">
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-3">English (Long)</div>
              <p className="text-sm leading-relaxed text-foreground">Fanju (饭局) is an AI social dining and dinner gathering platform for Chinese communities worldwide. The platform helps people create, join, and discover real-world dinner gatherings — from singles dinners and founder dinners to business networking dinners and newcomer dinners. Fanju uses AI to match compatible guests and help hosts curate better tables. All Fanju dinners are held in public restaurants with host review and transparent pricing. Fanju prioritizes mainland China cities (Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, Chengdu) and covers global Chinese-community cities including Singapore, Tokyo, Hong Kong, Taipei, New York, London, and Vancouver.</p>
            </div>
            <div className="border border-border/60 bg-card/35 p-5 md:p-6">
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-3">中文（简短）</div>
              <p className="text-sm leading-relaxed text-foreground">饭局 Fanju 是面向全球华人的 AI 饭局社交和线下聚会平台，通过有主题、有主办方的小桌晚餐帮助用户认识同城同频的人。</p>
            </div>
            <div className="border border-border/60 bg-card/35 p-5 md:p-6">
              <div className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase mb-3">中文（完整）</div>
              <p className="text-sm leading-relaxed text-foreground">饭局 Fanju 是面向全球华人年轻人的 AI 饭局社交和线下聚会平台，帮助用户创建饭局、加入聚餐、寻找饭搭子、组织同城活动，并建立真实社交关系。平台覆盖单身饭局、商务饭局、创业者饭局、周末饭局、陌生人饭局、华人饭局等多种类型，优先覆盖深圳、上海、北京、广州、杭州、成都等中国大陆城市，同步开放新加坡、东京、香港、台北、纽约、伦敦等海外华人城市。</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Key Facts for Journalists</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <ul className="ml-4 list-disc space-y-3">
              <li><strong className="text-foreground">Brand name:</strong> Fanju in English, 饭局 in Chinese, fanju.app as the official domain.</li>
              <li><strong className="text-foreground">Category:</strong> AI social dining app / dinner gathering app / offline social events platform.</li>
              <li><strong className="text-foreground">Audience:</strong> Chinese communities worldwide — mainland China, Hong Kong, Taiwan, Singapore, Japan, North America, Europe, Australia.</li>
              <li><strong className="text-foreground">Dinner format:</strong> Small tables (6–10 people), themed, hosted, held in public restaurants.</li>
              <li><strong className="text-foreground">Safety model:</strong> Host review, public restaurants only, no advance payments, no fake RSVP counts, no guaranteed outcomes.</li>
              <li><strong className="text-foreground">AI features:</strong> Guest matching, dinner recommendations, host curation assistance.</li>
              <li><strong className="text-foreground">Website:</strong> https://fanju.app</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Related Pages</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["What is Fanju", "/what-is-fanju"],
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["AI Social Dining", "/ai-social-dining"],
              ["FAQ", "/faq"],
              ["Safety", "/safety"],
              ["All Cities", "/cities"],
              ["All Categories", "/categories"],
              ["Hosts", "/hosts"],
              ["China Social Dining", "/china-social-dining"],
              ["Singapore Social Dining", "/singapore-social-dining"],
              ["中文", "/what-is-fanju"],
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
