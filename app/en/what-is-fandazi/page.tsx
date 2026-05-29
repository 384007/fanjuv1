import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "What is a 饭搭子 (Dinner Companion)? | Complete Definition & Guide | Fanju",
  description: "饭搭子 (fandazi) is a modern Chinese term for a dinner companion — a light, sustainable, equal relationship built around shared meals. This is the most complete definition, with original frameworks for evaluating trust and sustainability.",
  alternates: {
    canonical: "/en/what-is-fandazi",
    languages: { "zh-CN": "/what-is-fandazi", en: "/en/what-is-fandazi" },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "What is a 饭搭子 (Dinner Companion)? | Fanju",
    description: "The complete modern definition of 饭搭子 — light, equal, sustainable relationships built around real meals. Includes original evaluation frameworks.",
    url: `${SITE_URL}/en/what-is-fandazi`,
    siteName: "Fanju",
    type: "website",
    locale: "en_US",
  },
}

const faqs: [string, string][] = [
  ["What does 饭搭子 (fandazi) mean?", "饭搭子 refers to a light, equal, and sustainable relationship built primarily around shared meals. It is weaker than close friendship but stronger and more recurring than a one-off dinner or random table-sharing."],
  ["How is a 饭搭子 different from a friend?", "Friends can go long periods without meeting. 饭搭子 relationships usually require periodic real-world meals to stay alive. They are optimized for lightness and regularity rather than deep emotional support."],
  ["Why do 饭搭子 relationships matter in Chinese cities today?", "Many young professionals in China live alone, have fixed work circles, and experience high loneliness. A reliable 饭搭子 provides low-cost, high-reality social connection without the heavy expectations of traditional friendship."],
  ["How do you find good 饭搭子?", "Through structured small-table dinners with clear themes and safety boundaries (such as Fanju). The key is repeated, low-pressure meetings with people who respect boundaries."],
  ["Is it safe to meet 饭搭子 from the internet?", "Safety depends entirely on the structure. Public restaurants, host review, real profiles, and clear exit rights dramatically reduce risk compared to random WeChat groups or private invitations."],
]

export default function WhatIsFandaziEnglish() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "What is a 饭搭子 (Dinner Companion)",
        url: `${SITE_URL}/en/what-is-fandazi`,
        inLanguage: "en",
        description: "饭搭子 is a light, sustainable relationship built around shared meals in contemporary Chinese urban life.",
      },
      {
        "@type": "DefinedTerm",
        name: "饭搭子 (Dinner Companion)",
        description: "A recurring, equal, low-pressure social relationship centered on shared meals, requiring periodic in-person contact but without the intensity of close friendship.",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Modern Chinese Social Concept</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">What is a 饭搭子 (Dinner Companion)?</h1>

          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Definition</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              A <strong>饭搭子 (fandazi)</strong> is a light, equal, and sustainable social relationship built primarily around shared meals. It sits between casual acquaintance and close friendship — recurring enough to matter, light enough to maintain without exhaustion.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/en/what-is-fanju" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">What is Fanju?</Link>
            <Link href="/en/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Find Dinner Companions</Link>
          </div>
        </div>
      </section>

      {/* Core Frameworks */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase mb-2">Original Framework</div>
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">The Dinner Companion Trust Ladder</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            The quality of a 饭搭子 relationship can be measured on four levels. Most random dinners never leave Level 1–2.
          </p>

          <div className="mt-8 space-y-6">
            {[
              { level: "Level 1", title: "Information Exchange", desc: "Surface-level topics, industry gossip, safe opinions. Easy but low value. Most WeChat group dinners stay here." },
              { level: "Level 2", title: "Viewpoints & Boundary Testing", desc: "Sharing real opinions and testing whether the other person respects your limits. This is where genuine potential appears." },
              { level: "Level 3", title: "Vulnerability & Failure Disclosure", desc: "Willingness to discuss real struggles, failed projects, and anxieties. Extremely rare in early meetings, extremely valuable when it happens." },
              { level: "Level 4", title: "Light Mutual Support", desc: "Natural, low-stakes help (introductions, small favors, shared resources) without major obligation. The highest stable form of this relationship." },
            ].map((item, i) => (
              <div key={i} className="border-l-2 border-accent/70 pl-5">
                <div className="font-mono text-xs tracking-[0.2em] text-accent">{item.level}</div>
                <h3 className="font-serif text-xl text-foreground mt-1">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 21-Day Decay Law */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase mb-2">First-Principles Observation</div>
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">The 21-Day Decay Law</h2>
          <div className="mt-6 text-base leading-relaxed text-muted-foreground space-y-4">
            <p>
              饭搭子 relationships follow a harsh but reliable rule:
            </p>
            <p className="border-l-4 border-accent/70 pl-4 text-foreground font-medium">
              Once the interval between real meetings exceeds 21 days, the relationship enters an irreversible trust-decay channel.
            </p>
            <p>
              The cause is not fading affection, but the disappearance of shared reality context. You no longer experience the same restaurants, news, or emotional triggers together. Conversations require more background, costs rise, and value drops.
            </p>
          </div>
        </div>
      </section>

      {/* How to evaluate */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">First-Meeting Evaluation: 7 Practical Questions</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Use these questions after the first dinner to decide whether to continue.
          </p>
          <div className="mt-8 space-y-4">
            {[
              "Were boundaries clearly stated in advance (what to talk about, costs, exit rights)?",
              "Could the organizer’s real identity be verified through public channels?",
              "Was the venue a genuine public restaurant with clear logistics?",
              "Did the other person respect any discomfort you expressed?",
              "Was there at least one moment of genuine, non-performative conversation?",
              "Do you feel the relationship has a natural reason to continue?",
              "Would you feel comfortable introducing this person to one of your existing friends?",
            ].map((q, i) => (
              <div key={i} className="border border-border/60 bg-card/35 p-5 text-sm">{i + 1}. {q}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Common Questions</h2>
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Continue Reading</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["What is Fanju?", "/en/what-is-fanju"],
              ["How to Find Dinner Companions", "/en/how-to-find-dinner-buddies"],
              ["Safety & Boundaries", "/en/safety"],
              ["Cities", "/en/cities"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
