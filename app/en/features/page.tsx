import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { productFeatures } from "@/lib/product-features"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Fanju Features | Invites, RSVP, Guests, Notifications, Polls, Albums",
  description: "Fanju feature directory for one-link invites, RSVP tracking, guest lists, text updates, date polls, guest questions, cost notes, photo albums, public dinners and singles matching.",
  alternates: { canonical: "/en/features", languages: { "zh-CN": "/features", en: "/en/features" } },
}

export default function EnFeaturesPage() {
  const faq = [
    ["What features does Fanju include?", "Fanju includes one-link invites, RSVP tracking, guest lists, text updates, date polls, guest questions, cost notes, photo albums, public dinners and singles matching."],
    ["Is Fanju built for hosts?", "Yes. Fanju helps hosts organize city dinners, control guest caps, explain cost rules, send updates and keep post-dinner records."],
    ["How is Fanju different from a group chat?", "Group chats scatter information. Fanju structures the dinner theme, RSVP, guest list, updates, costs and rules into clear pages."],
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: "Fanju Feature Directory", url: `${SITE_URL}/en/features`, inLanguage: "en" },
      { "@type": "ItemList", name: "Fanju features", itemListElement: productFeatures.map((feature, index) => ({ "@type": "ListItem", position: index + 1, name: feature.nameEn, url: `${SITE_URL}/en/features/${feature.slug}` })) },
      { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">FANJU FEATURES</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">Fanju Features</h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">Fanju features cover offline dinner organization: create dinners, share invite links, track RSVPs, manage guests, send updates, run date polls, collect questions, explain costs, keep albums, publish dinners and support singles matching.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/features" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Chinese</Link>
            <Link href="/create" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Create dinner</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid grid-cols-1 gap-px border border-border/60 bg-border/60 md:grid-cols-2 lg:grid-cols-3">
            {productFeatures.map((feature) => (
              <article key={feature.slug} className="bg-card/40 p-5 transition-colors hover:bg-card/70">
                <Link href={`/en/features/${feature.slug}`} className="group block">
                  <h2 className="font-serif text-2xl text-foreground group-hover:text-accent">{feature.nameEn}</h2>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{feature.name}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{feature.answerEn}</p>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
