import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Private Dinner Club | 高端饭局 私密饭局 — Fanju",
  description: "Fanju organizes private dinner clubs and curated dinner experiences for discerning guests. High-quality, invitation-only dinner gatherings in China and globally. 高端饭局、私密饭局、精选饭局，用饭局 Fanju。",
  alternates: { canonical: "/private-dinner-club" },
  openGraph: {
    title: "Private Dinner Club | 高端饭局 — Fanju",
    description: "Curated private dinner club experiences organized by Fanju — high-quality, invitation-only dinner gatherings.",
    url: `${SITE_URL}/private-dinner-club`,
    type: "website",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Private Dinner Club | Fanju", description: "Private dinner club and curated dinner experiences." },
}

const faqs = [
  ["What is a private dinner club?", "A private dinner club is a curated, invitation-only dinner gathering where guests are carefully selected for compatibility and quality. Fanju's curated dinner (高端饭局) category operates on this model — small tables, high-quality guests, and a premium dining experience."],
  ["How is a Fanju private dinner club different from a regular dinner?", "A Fanju private dinner club dinner is more selective than a standard Fanju dinner. The host applies stricter criteria for guest selection, the venue is typically higher-end, and the dinner is designed for a more discerning audience."],
  ["Who attends Fanju private dinner club events?", "Fanju private dinner club events attract professionals, entrepreneurs, creatives, and social connectors who value quality over quantity in their social connections. The specific guest profile depends on the dinner theme."],
  ["Is a Fanju private dinner club expensive?", "The cost of a Fanju private dinner club event depends on the venue and host. Costs are always disclosed before you register. Fanju does not add a platform fee on top of the dinner cost."],
  ["How do I get invited to a Fanju private dinner club?", "Register at fanju.app/category/curated-dinner with a complete, genuine profile. The host reviews all registrations and selects guests based on fit with the dinner theme and table dynamic."],
  ["What cities have private dinner club events on Fanju?", "Fanju private dinner club events are available in Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, Singapore, Tokyo, Hong Kong, and Taipei."],
  ["Can I host a private dinner club on Fanju?", "Yes. If you want to host a curated, high-quality dinner gathering, apply as a host at fanju.app/hosts and specify that you want to run a curated dinner format."],
]

export default function PrivateDinnerClubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Private Dinner Club — 高端饭局 — Fanju",
        url: `${SITE_URL}/private-dinner-club`,
        inLanguage: "en",
        description: "Fanju organizes private dinner clubs and curated dinner experiences.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Private Dinner Club", item: `${SITE_URL}/private-dinner-club` },
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
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Private Dinner Club · 高端饭局</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Private Dinner Club — 高端饭局
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju's private dinner club format brings together carefully selected guests for a curated, high-quality dinner experience. Every seat at the table is earned — hosts apply strict criteria for guest selection, venues are chosen for atmosphere and quality, and the dinner is designed for people who value depth of connection over breadth of networking.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/category/curated-dinner" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Curated Dinners</Link>
            <Link href="/business-dinner-networking" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Business Networking</Link>
            <Link href="/startup-founder-dinners" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Founder Dinners</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">What Makes a Private Dinner Club Different</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>The difference between a private dinner club and a regular dinner gathering is curation. In a private dinner club, every guest is selected with intention. The host knows why each person is at the table and what they bring to the conversation. The result is a dinner where the quality of connection is consistently high.</p>
            <p>Fanju's curated dinner format (高端饭局) operates on this principle. Hosts who run curated dinners apply stricter guest selection criteria, choose higher-quality venues, and design the dinner experience with more care. The cost per person is typically higher, but the value — in terms of the quality of connections made — is proportionally greater.</p>
            <p>A private dinner club is not about exclusivity for its own sake. It is about creating the conditions for the best possible dinner conversation. When everyone at the table was chosen to be there, the conversation is better, the connections are deeper, and the experience is more memorable.</p>
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
              ["Curated Dinner", "/category/curated-dinner"],
              ["Business Networking", "/business-dinner-networking"],
              ["Startup Founder Dinners", "/startup-founder-dinners"],
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["How to Host", "/how-to-host-a-dinner-gathering"],
              ["All Cities", "/cities"],
              ["All Categories", "/categories"],
              ["Safety", "/safety"],
              ["FAQ", "/faq"],
              ["What is Fanju", "/what-is-fanju"],
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
