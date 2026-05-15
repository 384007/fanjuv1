import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "AI Social Dining | AI 饭局推荐 饭局 Fanju",
  description: "Fanju uses AI to match dinner guests, recommend gatherings, and curate social dining experiences. AI 饭局推荐、AI 聚会推荐、AI 社交饭局 — 用 AI 找到最适合你的饭局。",
  alternates: { canonical: "/ai-social-dining" },
  openGraph: {
    title: "AI Social Dining | Fanju — AI-Powered Dinner Matching",
    description: "Fanju uses AI to recommend dinner gatherings, match compatible guests, and curate social dining experiences across cities.",
    url: `${SITE_URL}/ai-social-dining`,
    type: "website",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "AI Social Dining | Fanju", description: "AI-powered dinner matching and social dining recommendations." },
}

const faqs = [
  ["What is AI social dining?", "AI social dining uses artificial intelligence to improve the quality of dinner gatherings — by matching compatible guests, recommending relevant events, and helping hosts curate better tables. Fanju applies AI to make social dining more intentional and effective."],
  ["How does Fanju use AI for social dining?", "Fanju uses AI to analyze guest profiles, interests, and goals to recommend the most relevant dinner gatherings. AI also helps hosts review registrations and identify compatible guest combinations for small-table dinners."],
  ["Is AI social dining better than traditional matchmaking?", "AI social dining is not a replacement for human judgment — it is a tool that helps surface better options faster. Fanju hosts still make the final curation decisions. AI handles the pattern recognition; humans handle the nuance."],
  ["What data does Fanju AI use to recommend dinners?", "Fanju AI uses the information you provide in your registration — occupation, interests, dinner goals, and city. It does not use social media data or third-party tracking."],
  ["Can AI guarantee I will meet the right people at a Fanju dinner?", "No. Fanju does not guarantee social outcomes. AI improves the probability of compatible matches, but human chemistry and genuine connection cannot be predicted by any algorithm."],
  ["What cities have AI social dining on Fanju?", "AI-powered recommendations are available across all Fanju cities — mainland China (Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, Chengdu) and global Chinese-community cities."],
  ["How is Fanju AI social dining different from a dating app algorithm?", "Dating app algorithms optimize for engagement and retention. Fanju AI optimizes for real-world dinner compatibility — finding people who will have a good conversation over a meal, not people who will keep swiping."],
]

export default function AiSocialDiningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "AI Social Dining — Fanju",
        url: `${SITE_URL}/ai-social-dining`,
        inLanguage: "en",
        description: "Fanju uses AI to match dinner guests and recommend social dining gatherings.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "AI Social Dining", item: `${SITE_URL}/ai-social-dining` },
          ],
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "Fanju",
        applicationCategory: "SocialNetworkingApplication",
        operatingSystem: "iOS, Android, Web",
        url: SITE_URL,
        description: "AI social dining app — AI-powered dinner matching and gathering recommendations.",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">AI Social Dining · AI 饭局推荐</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            AI Social Dining — Smarter Dinner Matching
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju is an AI social dining platform that uses artificial intelligence to recommend dinner gatherings, match compatible guests, and help hosts curate better tables. AI handles the pattern recognition — finding people with compatible interests, goals, and backgrounds. Hosts handle the final curation. The result is a dinner where everyone belongs at the table.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Find AI-Matched Dinners</Link>
            <Link href="/social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Social Dining</Link>
            <Link href="/dinner-gathering-app" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Dinner Gathering App</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">How AI Improves Social Dining</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>The hardest part of organizing a good dinner is not finding a restaurant or setting a date — it is finding the right people. A dinner with the wrong mix of guests is awkward and forgettable. A dinner with the right mix is memorable and often life-changing.</p>
            <p>Fanju uses AI to solve the guest curation problem at scale. When you register for a Fanju dinner, you provide information about your occupation, interests, what you are hoping to get from the dinner, and what kind of people you want to meet. Fanju AI analyzes this information across all registrations for a given dinner and surfaces the most compatible combinations for the host to consider.</p>
            <p>This is not a dating algorithm. It does not optimize for engagement or retention. It optimizes for one thing: the quality of the conversation at the dinner table. A good dinner conversation requires people with enough in common to connect, and enough difference to be interesting.</p>
            <p>AI social dining on Fanju also means smarter recommendations. If you have attended a founder dinner in Shenzhen and enjoyed it, Fanju can recommend similar dinners in other cities you visit, or suggest related dinner types you might not have considered.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">AI Social Dining vs Traditional Matchmaking</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["Speed", "AI can analyze hundreds of guest profiles in seconds. A human host reviewing the same profiles manually would take hours. AI social dining makes curation fast without sacrificing quality."],
              ["Pattern Recognition", "AI identifies compatibility patterns that humans might miss — shared industry backgrounds, complementary skill sets, similar life stages. These patterns predict good dinner chemistry."],
              ["Human Override", "Fanju AI is a tool, not a decision-maker. Hosts always have the final say on who sits at their table. AI surfaces options; humans make choices."],
              ["No Guaranteed Outcomes", "AI improves the probability of a good dinner, but cannot guarantee it. Fanju does not promise social outcomes — only a well-organized, well-curated dinner experience."],
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
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["Dinner Buddy App", "/dinner-buddy-app"],
              ["Local Gatherings", "/local-gatherings"],
              ["China Social Dining", "/china-social-dining"],
              ["Startup Founder Dinners", "/startup-founder-dinners"],
              ["Business Networking", "/business-dinner-networking"],
              ["Private Dinner Club", "/private-dinner-club"],
              ["All Cities", "/cities"],
              ["All Categories", "/categories"],
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
