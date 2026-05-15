import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Fanju vs Meetup | 饭局 vs Meetup — Which Is Better for Social Dining?",
  description: "Fanju vs Meetup: how do they compare for social dining, dinner gatherings, and offline social events? Fanju is the Meetup alternative built for Chinese communities and dinner-based social connection.",
  alternates: { canonical: "/fanju-vs-meetup" },
  openGraph: {
    title: "Fanju vs Meetup | Dinner Gathering App Comparison",
    description: "Fanju vs Meetup — comparing social dining apps for offline events and real-world connections.",
    url: `${SITE_URL}/fanju-vs-meetup`,
    type: "article",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Fanju vs Meetup | Fanju", description: "How Fanju compares to Meetup for social dining and offline events." },
}

const faqs = [
  ["What is the main difference between Fanju and Meetup?", "Meetup is a general-purpose event platform for groups of any size and type. Fanju is specifically a social dining platform — every event is a dinner, every table is small (6–10 people), and every guest is reviewed by the host. Fanju is more intimate and curated than Meetup."],
  ["Is Fanju a Meetup alternative?", "Yes, for people who want to meet others through dinner rather than group activities. Fanju is a Meetup alternative specifically designed for social dining, dinner gatherings, and offline social events centered around food."],
  ["Which is better for networking — Fanju or Meetup?", "For professional networking, Fanju's small-table dinner format creates deeper connections than a typical Meetup event. A dinner conversation is more memorable and trust-building than a large group activity where you might not speak to most attendees."],
  ["Does Fanju have as many events as Meetup?", "Meetup has more events globally because it covers all activity types. Fanju focuses exclusively on dinner gatherings, so the volume is lower but the quality and relevance are higher for people who want to meet others over food."],
  ["Is Fanju free like Meetup?", "Fanju is a platform. Individual dinner events may have a cost set by the host to cover the meal. Meetup charges organizers a subscription fee. The cost structures are different."],
  ["Does Fanju work for non-Chinese users?", "Fanju is primarily designed for Chinese communities worldwide. Most dinners are conducted in Mandarin Chinese. Non-Chinese speakers may find some English-language dinners in international cities, but Fanju's core audience is Chinese-speaking."],
  ["What cities does Fanju cover compared to Meetup?", "Meetup covers cities worldwide. Fanju prioritizes mainland China cities (Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, Chengdu) and global Chinese-community cities (Singapore, Tokyo, Hong Kong, Taipei, New York, London, Vancouver, and more)."],
]

export default function FanjuVsMeetupPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Fanju vs Meetup — Social Dining App Comparison",
    description: "Comparing Fanju and Meetup for social dining, dinner gatherings, and offline social events.",
    url: `${SITE_URL}/fanju-vs-meetup`,
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
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Comparison · Meetup Alternative</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Fanju vs Meetup — Social Dining vs Group Events
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju and Meetup are both platforms for offline social events, but they serve different needs. Meetup is a general-purpose event platform for groups of any size and type. Fanju is a social dining platform — every event is a dinner, every table is small and curated, and every guest is reviewed by the host. If you want to meet people through a shared meal rather than a group activity, Fanju is the better choice.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/social-dining" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Try Social Dining</Link>
            <Link href="/fanju-vs-tinder" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Fanju vs Tinder</Link>
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
                  <th className="py-3 text-left font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Meetup</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {[
                  ["Event type", "Dinner gatherings only", "Any group activity"],
                  ["Group size", "6–10 people (small table)", "Any size, often 20–100+"],
                  ["Guest curation", "Host reviews every registration", "Open to anyone who RSVPs"],
                  ["Primary audience", "Chinese communities worldwide", "General public, English-dominant"],
                  ["Language", "Mandarin Chinese + English", "Primarily English"],
                  ["Connection depth", "Deep — shared meal, small table", "Shallow — large group activity"],
                  ["Networking quality", "High — curated, themed dinner", "Variable — depends on event"],
                  ["Safety model", "Public restaurants, host review", "Varies by organizer"],
                  ["Cities", "China + global Chinese cities", "Worldwide"],
                  ["Cost model", "Dinner cost set by host", "Organizer subscription fee"],
                ].map(([feature, fanju, meetup]) => (
                  <tr key={feature}>
                    <td className="py-3 pr-6 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">{feature}</td>
                    <td className="py-3 pr-6 text-foreground">{fanju}</td>
                    <td className="py-3 text-muted-foreground">{meetup}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">When to Choose Fanju Over Meetup</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Choose Fanju when you want to meet people through a shared meal. The dinner table is one of the most effective environments for building genuine connections — it is intimate, relaxed, and creates natural conversation. Meetup events are often too large and activity-focused to create the same depth of connection.</p>
            <p>Choose Fanju when you are part of a Chinese community. Fanju is built specifically for Chinese-speaking communities worldwide. The dinners are in Mandarin, the cultural context is familiar, and the other guests share your background. Meetup is primarily English-language and Western-focused.</p>
            <p>Choose Fanju when quality matters more than quantity. Fanju's host review process ensures that every guest at your dinner was chosen to be there. Meetup events are open to anyone who RSVPs, which can result in a mixed-quality experience.</p>
            <p>Choose Meetup when you want to join a large group activity — a hiking club, a language exchange, a board game night. Fanju does not cover these use cases. Fanju is exclusively for dinner-based social connection.</p>
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
              ["Fanju vs Tinder", "/fanju-vs-tinder"],
              ["Fanju vs Xiaohongshu", "/fanju-vs-xiaohongshu"],
              ["Fanju vs WeChat Groups", "/fanju-vs-wechat-groups"],
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["Local Gatherings", "/local-gatherings"],
              ["All Cities", "/cities"],
              ["All Categories", "/categories"],
              ["What is Fanju", "/what-is-fanju"],
              ["FAQ", "/faq"],
              ["Safety", "/safety"],
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
