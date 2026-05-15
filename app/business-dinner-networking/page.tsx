import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Business Dinner Networking | 商务饭局 — Fanju",
  description: "Fanju organizes business dinner networking events for professionals in China and globally. Build professional relationships over dinner — more effective than conferences. 商务饭局、商务聚餐、商务社交饭局。",
  alternates: { canonical: "/business-dinner-networking" },
  openGraph: {
    title: "Business Dinner Networking | 商务饭局 — Fanju",
    description: "Build professional relationships through business dinner networking on Fanju — more effective than conferences.",
    url: `${SITE_URL}/business-dinner-networking`,
    type: "website",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Business Dinner Networking | Fanju", description: "Business dinner networking for professionals in China and globally." },
}

const faqs = [
  ["What is business dinner networking?", "Business dinner networking is the practice of building professional relationships over a shared meal. Unlike formal networking events, a dinner creates a relaxed, intimate environment where genuine trust can develop. Fanju organizes business dinner networking events for professionals in China and globally."],
  ["Why is dinner better than a conference for networking?", "Conferences are large, noisy, and optimized for broadcasting rather than connecting. A dinner is small, intimate, and optimized for conversation. You will remember a two-hour dinner conversation with 8 people far longer than a conference where you exchanged business cards with 50 strangers."],
  ["What types of professionals attend Fanju business dinners?", "Fanju business dinners attract founders, investors, executives, product managers, engineers, consultants, and other professionals who want to build genuine relationships rather than collect contacts. The specific mix depends on the dinner theme."],
  ["How is a Fanju business dinner different from a formal business dinner?", "A formal business dinner is typically one-on-one or with a specific client. A Fanju business dinner is a small group of 6–10 professionals with shared interests, organized by a host who curates the guest list. It is more like a curated dinner party than a formal business meeting."],
  ["Can I use Fanju business dinners for sales or fundraising?", "Fanju business dinners are for building relationships, not for pitching or selling. Guests who attend with an explicit sales or fundraising agenda often have a poor experience and create a poor experience for others. The value of a business dinner is the relationship — the business follows naturally."],
  ["What cities have business dinner networking on Fanju?", "Fanju business dinners are available in mainland China (Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, Chengdu) and global Chinese-community cities (Singapore, Tokyo, Hong Kong, Taipei, New York, London, and more)."],
  ["How do I register for a business dinner on Fanju?", "Browse fanju.app/category/business-dinner to find business dinner events. Register with your real professional profile and wait for host confirmation."],
]

export default function BusinessDinnerNetworkingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Business Dinner Networking — 商务饭局 — Fanju",
        url: `${SITE_URL}/business-dinner-networking`,
        inLanguage: "en",
        description: "Fanju organizes business dinner networking events for professionals in China and globally.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Business Dinner Networking", item: `${SITE_URL}/business-dinner-networking` },
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
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Business Dinner Networking · 商务饭局</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Business Dinner Networking — 商务饭局
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju organizes business dinner networking events for professionals in China and globally. A Fanju business dinner brings together 6–10 professionals with shared interests for a curated dinner in a real restaurant. The dinner format creates genuine trust and connection — more valuable than a conference badge swap or a LinkedIn connection request.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/category/business-dinner" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Business Dinners</Link>
            <Link href="/startup-founder-dinners" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Founder Dinners</Link>
            <Link href="/private-dinner-club" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Private Dinner Club</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Why Dinner Networking Works</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>The most important business relationships are built on trust, and trust is built through shared experiences. A dinner is one of the most effective shared experiences available — it is intimate, relaxed, and creates natural conversation that reveals character and values in ways that a formal meeting never can.</p>
            <p>In Chinese business culture, the dinner table has always been central to relationship building. The concept of 饭局 (dinner gathering) is deeply embedded in how Chinese professionals build trust and do business. Fanju formalizes this tradition with structure, curation, and safety boundaries.</p>
            <p>A Fanju business dinner is not a pitch event. It is not a sales meeting. It is a curated dinner where professionals with shared interests meet, share a meal, and build the kind of genuine relationships that lead to business opportunities naturally — not through pressure or performance.</p>
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
              ["Business Dinner", "/category/business-dinner"],
              ["Startup Founder Dinners", "/startup-founder-dinners"],
              ["Private Dinner Club", "/private-dinner-club"],
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["How to Host", "/how-to-host-a-dinner-gathering"],
              ["Shenzhen Dinners", "/city/shenzhen"],
              ["Shanghai Dinners", "/city/shanghai"],
              ["Singapore Dinners", "/city/singapore"],
              ["All Cities", "/cities"],
              ["Safety", "/safety"],
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
