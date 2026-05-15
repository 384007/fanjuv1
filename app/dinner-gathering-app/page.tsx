import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Dinner Gathering App | 聚餐 App 饭局 Fanju",
  description: "Fanju is the dinner gathering app for creating, joining, and discovering real-world dinner events. Find local dinner gatherings, meet new people, and build offline social connections. 饭局 app，聚餐 app，同城聚会。",
  alternates: { canonical: "/dinner-gathering-app" },
  openGraph: {
    title: "Dinner Gathering App | Fanju",
    description: "Create and join dinner gatherings with Fanju — the app for real-world meals and offline social events.",
    url: `${SITE_URL}/dinner-gathering-app`,
    type: "website",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Dinner Gathering App | Fanju", description: "Create and join dinner gatherings with Fanju." },
}

const faqs = [
  ["What is a dinner gathering app?", "A dinner gathering app helps people organize, discover, and join real-world dinner events. Fanju is a dinner gathering app that connects people through themed, hosted dinners in real restaurants across cities worldwide."],
  ["How do I join a dinner gathering on Fanju?", "Browse dinners by city at fanju.app/cities, choose a dinner type that matches your interest, submit a registration with your real profile, and wait for host confirmation. Confirmed guests receive venue and timing details."],
  ["Can I create my own dinner gathering on Fanju?", "Yes. Fanju recruits dinner hosts in every city. Hosts propose a dinner theme, review guest registrations, and run the event. Visit fanju.app/hosts to apply as a host."],
  ["What makes Fanju different from other dinner gathering apps?", "Fanju focuses on Chinese communities worldwide, uses host review to maintain quality, keeps tables small (6–10 people), and operates exclusively in public restaurants. No fake RSVPs, no guaranteed outcomes."],
  ["Is Fanju a free dinner gathering app?", "Fanju is a platform. Individual dinner events may have a cost set by the host to cover the meal. Costs and cancellation policies are always disclosed before you register."],
  ["What cities have dinner gatherings on Fanju?", "Fanju covers mainland China cities (Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, Chengdu) and global Chinese-community cities (Singapore, Tokyo, Hong Kong, Taipei, New York, London, Vancouver, and more)."],
  ["How is a dinner gathering different from a party?", "A dinner gathering on Fanju is intentionally small, themed, and structured around a shared meal. It is designed for genuine conversation and connection, not entertainment or performance."],
]

export default function DinnerGatheringAppPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Dinner Gathering App — Fanju",
        url: `${SITE_URL}/dinner-gathering-app`,
        inLanguage: "en",
        description: "Fanju is the dinner gathering app for creating, joining, and discovering real-world dinner events.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Dinner Gathering App", item: `${SITE_URL}/dinner-gathering-app` },
          ],
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "Fanju",
        applicationCategory: "SocialNetworkingApplication",
        operatingSystem: "iOS, Android, Web",
        url: SITE_URL,
        description: "Dinner gathering app for real-world meals and offline social events.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Dinner Gathering App</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            The Dinner Gathering App for Real Offline Connections
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju is a dinner gathering app that lets you create, join, and discover real-world dinner events in your city. Every gathering is themed, hosted, and held in a real restaurant. Fanju covers mainland China and global Chinese-community cities — making it the go-to dinner gathering app for Chinese communities worldwide.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Browse Dinner Gatherings</Link>
            <Link href="/hosts" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Host a Dinner</Link>
            <Link href="/social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">How the Dinner Gathering App Works</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Most social apps connect people digitally and hope they meet in real life eventually. Fanju reverses this: it starts with a real dinner and lets the relationship develop from there. The dinner gathering app model is simple but powerful.</p>
            <p>A host proposes a dinner with a clear theme — a singles dinner for young professionals in Shenzhen, a founder dinner for startup operators in Shanghai, a newcomer dinner for people who just moved to Singapore. Guests browse available dinners by city and type, then register with a real profile including their occupation, interests, and what they are hoping to get from the dinner.</p>
            <p>The host reviews all registrations and confirms a small table — typically 6 to 10 people. This curation step is what separates Fanju from a random group chat or a large networking event. When you sit down at a Fanju dinner, everyone at the table was chosen to be there.</p>
            <p>After the dinner, connections are real. No algorithm, no swipe, no match — just people who shared a meal and chose to stay in touch.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Dinner Gathering Types</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["Singles Dinner 单身饭局", "Meet potential partners in a low-pressure dinner setting. Small tables, real conversation, no awkward one-on-one pressure."],
              ["Founder Dinner 创业者饭局", "Dinners for startup founders, investors, and operators. Build trust before any formal meeting."],
              ["Business Dinner 商务饭局", "Professional networking over a shared meal. More effective than a conference because the setting is relaxed."],
              ["Weekend Dinner 周末饭局", "Casual social dinners for anyone who wants to meet new people without a specific agenda."],
              ["Newcomer Dinner 新城市饭局", "For people new to a city who want to build a local social circle quickly."],
              ["Chinese Community Dinner 华人饭局", "Social dining for Chinese communities overseas — in Singapore, Tokyo, New York, London, and beyond."],
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
              ["Dinner Buddy App", "/dinner-buddy-app"],
              ["Weekend Dinner", "/category/weekend-dinner"],
              ["Founder Dinner", "/category/founder-dinner"],
              ["Host Guide", "/guides/host-recruitment-guide"],
              ["FAQ", "/faq"],
              ["Press", "/press"],
              ["Business Dinner", "/category/business-dinner"],
              ["All Cities", "/cities"],
              ["All Categories", "/categories"],
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
