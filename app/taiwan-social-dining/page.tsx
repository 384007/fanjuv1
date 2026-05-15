import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Taiwan Social Dining | 台湾饭局社交 — Fanju",
  description: "Fanju brings social dining to Taiwan — find dinner gatherings and dinner buddies in Taipei and across Taiwan. 台湾饭局、台北聚餐、台湾社交饭局，用饭局 Fanju 认识台湾同频的人。",
  alternates: { canonical: "/taiwan-social-dining" },
  openGraph: {
    title: "Taiwan Social Dining | 台湾饭局 — Fanju",
    description: "Find dinner gatherings and dinner buddies in Taiwan with Fanju — social dining for Chinese communities.",
    url: `${SITE_URL}/taiwan-social-dining`,
    type: "website",
    locale: "zh_TW",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Taiwan Social Dining | Fanju", description: "Social dining and dinner gatherings in Taiwan." },
}

const faqs = [
  ["What is social dining in Taiwan?", "Social dining in Taiwan means joining themed, hosted dinner gatherings to meet like-minded people in Taipei and other Taiwanese cities. Fanju organizes small-table dinners for Chinese communities in Taiwan."],
  ["台湾饭局 Fanju 适合哪些人？", "适合在台湾的华人年轻人、来台工作或留学的大陆人、海外华人、创业者和希望在台湾拓展人脉的人。"],
  ["What dinner types are available in Taiwan?", "Fanju Taiwan covers singles dinners, business networking dinners, founder dinners, newcomer dinners, and Chinese community dinners in Taipei and other cities."],
  ["How do I join a dinner gathering in Taiwan?", "Visit fanju.app/city/taipei to see available dinner types in Taipei. Register with your real profile and wait for host confirmation."],
  ["台湾饭局和香港饭局有什么区别？", "台湾饭局以台北为核心，参与者多为台湾本地华人、来台工作者和留学生。台湾的饮食文化和社交风格与香港有所不同，饭局 Fanju 会根据当地文化调整饭局主题和风格。"],
  ["Is Fanju available in Traditional Chinese?", "Fanju supports both Simplified and Traditional Chinese. Taiwan dinners are typically conducted in Mandarin."],
  ["What cities in Taiwan does Fanju cover?", "Fanju primarily covers Taipei, with plans to expand to Taichung, Tainan, and Kaohsiung as the community grows."],
]

export default function TaiwanSocialDiningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Taiwan Social Dining — 台湾饭局 — Fanju",
        url: `${SITE_URL}/taiwan-social-dining`,
        inLanguage: "zh-TW",
        description: "Fanju social dining in Taiwan — themed dinner gatherings for Chinese communities in Taipei.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Taiwan Social Dining", item: `${SITE_URL}/taiwan-social-dining` },
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
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Taiwan · 台湾饭局社交</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Taiwan Social Dining — 台湾饭局
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju brings social dining to Taiwan — organizing small, themed dinner gatherings for Chinese communities in Taipei and beyond. Whether you are a local Taiwanese, a mainlander working in Taiwan, or an overseas Chinese visiting, Fanju dinners connect you with like-minded people over a real meal.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/city/taipei" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">台北饭局</Link>
            <Link href="/hong-kong-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Hong Kong Social Dining</Link>
            <Link href="/china-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">China Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Social Dining in Taiwan</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Taiwan has a rich food culture and a vibrant Chinese-speaking community. Taipei in particular is a city where food is central to social life — night markets, restaurant culture, and the tradition of sharing meals with friends and colleagues are deeply embedded in Taiwanese daily life.</p>
            <p>Fanju taps into this culture by organizing structured dinner gatherings that go beyond casual dining. A Fanju dinner in Taipei is themed, hosted, and curated — bringing together people with shared interests or goals for a meal that is designed to create genuine connections.</p>
            <p>Taiwan's startup ecosystem, creative industries, and international connections make it a natural fit for Fanju's founder dinners and business networking dinners. The large community of mainland Chinese working and studying in Taiwan also creates demand for Chinese community dinners that bridge different backgrounds.</p>
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Related Cities & Pages</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["台北饭局", "/city/taipei"],
              ["香港饭局社交", "/hong-kong-social-dining"],
              ["澳门饭局社交", "/macau-social-dining"],
              ["新加坡饭局社交", "/singapore-social-dining"],
              ["中国饭局社交", "/china-social-dining"],
              ["东京饭局社交", "/tokyo-social-dining"],
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["All Cities", "/cities"],
              ["Safety", "/safety"],
              ["FAQ", "/faq"],
              ["What is Fanju", "/what-is-fanju"],
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
