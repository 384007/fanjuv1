import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Fanju vs Tinder | 饭局 vs Tinder — Social Dining vs Dating App",
  description: "Fanju vs Tinder: how do they compare? Fanju is not a dating app — it is a social dining platform for meeting people over real meals. The Tinder alternative for people who want genuine offline connections.",
  alternates: { canonical: "/fanju-vs-tinder" },
  openGraph: {
    title: "Fanju vs Tinder | Social Dining vs Dating App",
    description: "Fanju vs Tinder — comparing social dining with dating apps for meeting people offline.",
    url: `${SITE_URL}/fanju-vs-tinder`,
    type: "article",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Fanju vs Tinder | Fanju", description: "How Fanju compares to Tinder for meeting people offline." },
}

const faqs = [
  ["Is Fanju a dating app like Tinder?", "No. Fanju is a social dining platform, not a dating app. While some Fanju dinners are singles-focused, the goal is to meet interesting people over a shared meal — not to swipe and match. Fanju does not have a matching algorithm, a swipe interface, or a direct messaging system for strangers."],
  ["Can I find a romantic partner on Fanju?", "It is possible. Some people who meet at Fanju singles dinners develop romantic relationships. But Fanju does not promise or optimize for this outcome. Fanju creates the conditions for genuine connection — what happens after the dinner is up to the people involved."],
  ["Why would someone choose Fanju over Tinder?", "Choose Fanju if you want to meet people in real life, in a group setting, over a shared meal. Tinder is optimized for one-on-one romantic matching. Fanju is optimized for genuine social connection in a low-pressure group dinner environment."],
  ["Is Fanju safer than Tinder for meeting strangers?", "Fanju has structural safety advantages over Tinder. All Fanju dinners are held in public restaurants. Hosts review every guest registration. You meet multiple people at once, not one stranger alone. These factors reduce the risks associated with meeting strangers online."],
  ["Does Fanju have singles dinners?", "Yes. Singles dinners (单身饭局) are one of Fanju's most popular dinner types. They are themed, hosted, and held in real restaurants — creating a low-pressure environment for single people to meet potential partners naturally."],
  ["How is a Fanju singles dinner different from a Tinder date?", "A Tinder date is a one-on-one meeting with a stranger you matched with online. A Fanju singles dinner is a group dinner with 6–10 people who all chose to attend the same themed event. The group setting reduces pressure, creates natural conversation, and allows you to meet multiple people at once."],
  ["Is Fanju available in China where Tinder is not?", "Yes. Fanju is specifically designed for Chinese communities and operates in mainland China, where Tinder is not available. Fanju is the social dining alternative for Chinese users who want to meet people offline."],
]

export default function FanjuVsTinderPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Fanju vs Tinder — Social Dining vs Dating App",
    description: "Comparing Fanju and Tinder for meeting people offline.",
    url: `${SITE_URL}/fanju-vs-tinder`,
    inLanguage: "en",
    author: { "@type": "Organization", name: "Fanju", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Fanju", url: SITE_URL },
    dateModified: "2026-05-13",
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Comparison · Tinder Alternative</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Fanju vs Tinder — Social Dining vs Dating App
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju is not a dating app. Tinder is. The comparison matters because many people who are tired of dating apps are looking for a better way to meet people in real life — and Fanju is that alternative. Fanju organizes dinner gatherings where you meet multiple interesting people at once, in a real restaurant, without the pressure of a one-on-one date.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/category/singles-dinner" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Singles Dinners</Link>
            <Link href="/fanju-vs-meetup" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Fanju vs Meetup</Link>
            <Link href="/fanju-vs-xiaohongshu" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Fanju vs Xiaohongshu</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Side-by-Side Comparison</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="py-3 pr-6 text-left font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Feature</th>
                  <th className="py-3 pr-6 text-left font-mono text-[10px] tracking-[0.2em] text-accent uppercase">Fanju</th>
                  <th className="py-3 text-left font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Tinder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {[
                  ["Primary purpose", "Social dining & offline connection", "Romantic matching"],
                  ["Meeting format", "Group dinner (6–10 people)", "One-on-one date"],
                  ["Interaction model", "Real-life dinner first", "Online match first"],
                  ["Pressure level", "Low — group setting", "High — one-on-one stranger"],
                  ["Safety model", "Public restaurant, host review", "Individual responsibility"],
                  ["Outcome guarantee", "None — genuine connection only", "None — match only"],
                  ["Available in China", "Yes", "No"],
                  ["Language", "Mandarin Chinese + English", "English-dominant"],
                  ["Audience", "Chinese communities worldwide", "General public globally"],
                  ["Singles focus", "Yes (singles dinner type)", "Yes (primary focus)"],
                ].map(([feature, fanju, tinder]) => (
                  <tr key={feature}>
                    <td className="py-3 pr-6 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">{feature}</td>
                    <td className="py-3 pr-6 text-foreground">{fanju}</td>
                    <td className="py-3 text-muted-foreground">{tinder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Why Dinner Beats Swiping</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Dating apps like Tinder have a fundamental problem: they optimize for engagement, not connection. The swipe interface is designed to keep you swiping, not to help you meet someone meaningful. The result is that most people spend hours on dating apps and meet very few people they genuinely connect with.</p>
            <p>Fanju takes the opposite approach. Instead of optimizing for engagement, Fanju optimizes for the quality of the real-world meeting. A Fanju singles dinner brings together 6–10 people who all chose to attend the same themed event. The group setting creates natural conversation, reduces the pressure of a one-on-one date, and allows you to meet multiple people at once.</p>
            <p>The dinner table is one of the most effective environments for building genuine connection. Sharing a meal creates intimacy, lowers social barriers, and gives people something to talk about beyond their profile photos. A two-hour dinner conversation reveals more about a person than a hundred text messages.</p>
            <p>Fanju does not promise romantic outcomes. But it creates the conditions for genuine connection — and genuine connection is the foundation of any meaningful relationship, romantic or otherwise.</p>
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
              ["Singles Dinner", "/category/singles-dinner"],
              ["Fanju vs Meetup", "/fanju-vs-meetup"],
              ["Fanju vs Xiaohongshu", "/fanju-vs-xiaohongshu"],
              ["Fanju vs WeChat Groups", "/fanju-vs-wechat-groups"],
              ["Social Dining", "/social-dining"],
              ["Dinner Buddy App", "/dinner-buddy-app"],
              ["How to Find Dinner Buddies", "/how-to-find-dinner-buddies"],
              ["All Cities", "/cities"],
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
