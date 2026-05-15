import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Startup Founder Dinners | 创业者饭局 — Fanju",
  description: "Fanju organizes startup founder dinners for entrepreneurs, investors, and operators in China and globally. Build founder relationships over dinner. 创业者饭局、创始人饭局、创业者聚餐，用饭局 Fanju。",
  alternates: { canonical: "/startup-founder-dinners" },
  openGraph: {
    title: "Startup Founder Dinners | 创业者饭局 — Fanju",
    description: "Startup founder dinners for entrepreneurs, investors, and operators — organized by Fanju in China and globally.",
    url: `${SITE_URL}/startup-founder-dinners`,
    type: "website",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Startup Founder Dinners | Fanju", description: "Startup founder dinners for entrepreneurs and investors." },
}

const faqs = [
  ["What are startup founder dinners?", "Startup founder dinners are small, curated dinner gatherings for entrepreneurs, investors, and startup operators. Fanju organizes founder dinners in China's major startup cities (Shenzhen, Shanghai, Beijing, Hangzhou) and globally (Singapore, Tokyo, New York, London)."],
  ["Who attends Fanju founder dinners?", "Fanju founder dinners attract startup founders at various stages, angel investors, venture capitalists, product managers, engineers who have worked at startups, and operators with relevant experience. The specific mix depends on the dinner theme."],
  ["Is a Fanju founder dinner a pitch event?", "No. Fanju founder dinners are not pitch events. They are relationship-building dinners. Founders who attend with an explicit fundraising agenda often have a poor experience. The value is in building genuine relationships — the investment conversations happen naturally later."],
  ["How is a Fanju founder dinner different from a startup networking event?", "Startup networking events are typically large, noisy, and optimized for quantity of contacts. A Fanju founder dinner is small (6–10 people), curated, and optimized for depth of connection. You will have a real conversation with every person at the table."],
  ["What cities have startup founder dinners on Fanju?", "Fanju founder dinners are active in Shenzhen, Shanghai, Beijing, Hangzhou, Chengdu, Singapore, Tokyo, Hong Kong, Taipei, New York, San Francisco, and London."],
  ["How do I register for a founder dinner on Fanju?", "Browse fanju.app/category/founder-dinner to find founder dinner events. Register with your real professional profile — include your startup stage, role, and what you are hoping to get from the dinner."],
  ["Can investors attend Fanju founder dinners?", "Yes. Fanju founder dinners welcome investors alongside founders. The best founder dinners have a mix of founders, investors, and operators — creating a dynamic where everyone has something to contribute and something to learn."],
]

export default function StartupFounderDinnersPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Startup Founder Dinners — 创业者饭局 — Fanju",
        url: `${SITE_URL}/startup-founder-dinners`,
        inLanguage: "en",
        description: "Fanju organizes startup founder dinners for entrepreneurs, investors, and operators in China and globally.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Startup Founder Dinners", item: `${SITE_URL}/startup-founder-dinners` },
          ],
        },
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Startup Founder Dinners · 创业者饭局</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Startup Founder Dinners — 创业者饭局
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju organizes startup founder dinners — small, curated dinner gatherings for entrepreneurs, investors, and operators in China's major startup cities and globally. A Fanju founder dinner is not a pitch event. It is a relationship-building dinner where founders and investors share a meal, exchange experiences, and build the kind of genuine trust that leads to meaningful collaboration.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/category/founder-dinner" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Founder Dinners</Link>
            <Link href="/business-dinner-networking" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Business Networking</Link>
            <Link href="/private-dinner-club" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Private Dinner Club</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Why Founder Dinners Work</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>The best startup relationships — co-founder partnerships, investor-founder relationships, key hires — are built on genuine trust. And genuine trust is built through shared experiences, not pitch decks. A dinner is one of the most effective ways to build that trust quickly.</p>
            <p>Fanju founder dinners are designed around this insight. A small table of 6–10 founders and investors, a good restaurant, a clear theme, and two hours of genuine conversation. No presentations, no pitches, no business cards. Just people who share a common world talking about what they are building and what they have learned.</p>
            <p>China's startup ecosystem is particularly well-suited to this format. In Chinese business culture, the dinner table is where trust is built and deals are made. Fanju formalizes this tradition with structure and curation, making it accessible to founders who are new to a city or new to the ecosystem.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Founder Dinner Cities</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["Shenzhen 深圳", "/city/shenzhen"],
              ["Shanghai 上海", "/city/shanghai"],
              ["Beijing 北京", "/city/beijing"],
              ["Hangzhou 杭州", "/city/hangzhou"],
              ["Chengdu 成都", "/city/chengdu"],
              ["Singapore", "/city/singapore"],
              ["Tokyo", "/city/tokyo"],
              ["Hong Kong", "/city/hong-kong"],
              ["Taipei", "/city/taipei"],
              ["New York", "/city/new-york"],
              ["San Francisco", "/city/san-francisco"],
              ["London", "/city/london"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">{label}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">FAQ</h2>
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Related Pages</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["Founder Dinner", "/category/founder-dinner"],
              ["Business Networking", "/business-dinner-networking"],
              ["Private Dinner Club", "/private-dinner-club"],
              ["Social Dining", "/social-dining"],
              ["AI Social Dining", "/ai-social-dining"],
              ["How to Host", "/how-to-host-a-dinner-gathering"],
              ["Shenzhen Dinners", "/city/shenzhen"],
              ["Singapore Dinners", "/city/singapore"],
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
