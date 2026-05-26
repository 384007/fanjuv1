import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Dinner Photos and Recaps | Fanju",
  description: "Fanju dinner photos help hosts keep post-event memories, venue notes, recap links and next-dinner follow-up in one clear place.",
  alternates: { canonical: "/photos" },
  openGraph: {
    title: "Dinner Photos and Recaps | Fanju",
    description: "Keep dinner memories, venue notes and follow-up links after each small-table Fanju dinner.",
    url: `${SITE_URL}/photos`,
    type: "website",
  },
}

const items = [
  ["Photos", "Collect selected dinner photos after the event so guests can remember the table without digging through chat history."],
  ["Venue", "Keep the restaurant name, area, table notes and practical details attached to the recap."],
  ["Recap", "Write a short summary of what the table discussed, what worked, and what should be improved next time."],
  ["Next dinner", "Add a follow-up link so interested guests can join the next small-table dinner with clearer expectations."],
]

const faq = [
  ["What is the Fanju photos page for?", "It explains how hosts can use photos and recaps after a dinner to preserve memories and guide follow-up."],
  ["Should every dinner photo be public?", "No. Hosts should only share photos that guests are comfortable sharing, and sensitive personal details should stay private."],
  ["How do photos help a dinner community?", "A small recap makes the table feel more concrete: guests can remember the venue, the topic and the next possible gathering."],
]

export default function PhotosPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Dinner Photos and Recaps | Fanju",
    url: `${SITE_URL}/photos`,
    description: metadata.description,
    inLanguage: "en",
    provider: { "@type": "Organization", name: "Fanju", url: SITE_URL },
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">PHOTOS</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">Dinner photos and recaps</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Fanju dinner photos are for post-event memory, not random image feeds. Hosts can keep selected photos, venue notes, recap links and next-dinner context in one clear place after a small-table dinner.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/features/photo-album" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Photo feature</Link>
            <Link href="/create" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Create dinner</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-4">
          {items.map(([item, body]) => (
            <article key={item} className="bg-card/40 p-6">
              <h2 className="font-serif text-2xl text-foreground">{item}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8">
          <h2 className="font-serif text-3xl text-foreground">Photo sharing boundaries</h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Photos should support trust after a dinner. Do not publish images that guests did not agree to share, do not expose private contact information, and keep the recap focused on the table topic, venue and next steps.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {faq.map(([question, answer]) => (
              <article key={question} className="border border-border/60 bg-card/40 p-5">
                <h3 className="font-serif text-xl text-foreground">{question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}