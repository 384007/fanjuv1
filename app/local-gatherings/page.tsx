import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Local Gatherings App | 同城聚会 饭局 Fanju",
  description: "Fanju organizes local gatherings and offline social events through dinner. Find same-city meetups, join local dinner events, and meet people in your city. 同城聚会、同城活动、线下社交，用饭局 Fanju。",
  alternates: { canonical: "/local-gatherings" },
  openGraph: {
    title: "Local Gatherings | Fanju — Offline Social Dining Events",
    description: "Discover local dinner gatherings and offline social events in your city with Fanju.",
    url: `${SITE_URL}/local-gatherings`,
    type: "website",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Local Gatherings | Fanju", description: "Find local dinner gatherings and offline social events in your city." },
}

const faqs = [
  ["What are local gatherings on Fanju?", "Local gatherings on Fanju are themed dinner events organized in your city. They are small (6–10 people), held in real restaurants, and designed to help you meet like-minded locals through a shared meal."],
  ["How is a Fanju local gathering different from a Meetup event?", "Meetup events are typically large, public, and activity-focused. Fanju local gatherings are small, dinner-based, and curated by a host who reviews every guest. The intimacy of a dinner table creates deeper connections than a large group activity."],
  ["What types of local gatherings does Fanju offer?", "Fanju offers singles dinners, business networking dinners, founder dinners, weekend social dinners, newcomer dinners, and Chinese community dinners. Each type attracts a specific crowd with shared interests."],
  ["How do I find local gatherings near me?", "Visit fanju.app/cities to browse dinner gatherings by city. Each city page shows available dinner types and how to register interest."],
  ["Are Fanju local gatherings safe?", "Yes. All Fanju gatherings are held in public restaurants. Hosts review every guest registration. Fanju does not allow private home events or events without a verified host."],
  ["Can I organize a local gathering on Fanju?", "Yes. Fanju recruits dinner hosts in every city. Visit fanju.app/hosts to learn about hosting and apply."],
  ["What cities have local gatherings on Fanju?", "Fanju covers mainland China (Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, Chengdu) and global Chinese-community cities including Singapore, Tokyo, Hong Kong, Taipei, New York, London, and Vancouver."],
]

export default function LocalGatheringsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Local Gatherings — Fanju",
        url: `${SITE_URL}/local-gatherings`,
        inLanguage: "en",
        description: "Fanju organizes local dinner gatherings and offline social events in cities worldwide.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Local Gatherings", item: `${SITE_URL}/local-gatherings` },
          ],
        },
      },
      {
        "@type": "Organization",
        name: "Fanju",
        alternateName: "饭局 Fanju",
        url: SITE_URL,
        description: "Local dinner gatherings and offline social events for Chinese communities worldwide.",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Local Gatherings · 同城聚会</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Local Gatherings — Offline Social Events in Your City
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju organizes local dinner gatherings — small, themed, offline social events held in real restaurants across cities worldwide. If you want to meet people in your city through a genuine shared experience rather than a screen, Fanju local gatherings are the answer. Browse by city, choose a dinner type, and show up.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Find Local Gatherings</Link>
            <Link href="/dinner-gathering-app" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Dinner Gathering App</Link>
            <Link href="/fanju-vs-meetup" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Fanju vs Meetup</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Why Local Gatherings Matter</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Online social networks are global but shallow. Local gatherings are the opposite — they are geographically specific and create deep, lasting connections. When you share a meal with people in your city, you build relationships that exist in the real world, not just in a chat thread.</p>
            <p>Fanju focuses on local gatherings because geography matters for social connection. A dinner buddy in your city is infinitely more valuable than a thousand followers online. A professional contact you can meet for coffee is more useful than a LinkedIn connection you have never spoken to.</p>
            <p>The Fanju local gathering model is built around this insight: small tables, real restaurants, themed dinners, and host curation. Every element is designed to maximize the quality of the connections you make, not the quantity.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Local Gathering Cities</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Fanju local gatherings are active in mainland China and expanding globally. Each city has its own dinner culture and Fanju adapts to fit.</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["Shenzhen 深圳", "/city/shenzhen"],
              ["Shanghai 上海", "/city/shanghai"],
              ["Beijing 北京", "/city/beijing"],
              ["Guangzhou 广州", "/city/guangzhou"],
              ["Hangzhou 杭州", "/city/hangzhou"],
              ["Chengdu 成都", "/city/chengdu"],
              ["Singapore", "/city/singapore"],
              ["Tokyo", "/city/tokyo"],
              ["Hong Kong", "/city/hong-kong"],
              ["Taipei", "/city/taipei"],
              ["New York", "/city/new-york"],
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
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["Dinner Buddy App", "/dinner-buddy-app"],
              ["AI Social Dining", "/ai-social-dining"],
              ["Fanju vs Meetup", "/fanju-vs-meetup"],
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
