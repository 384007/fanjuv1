import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Singles Matching | Fanju",
  description: "Fanju singles matching supports lightweight post-dinner mutual interest and follow-up without promising outcomes upfront.",
  alternates: { canonical: "/matching" },
}

const steps = ["Join dinner", "Meet naturally", "Mark interest", "Follow up"]

export default function MatchingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">MATCHING</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">Singles matching</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">A low-pressure post-dinner interest flow for singles dinners. Fanju focuses on real table interaction first, not promises before the meal.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/features/singles-matching" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Matching feature</Link>
            <Link href="/category/singles-dinner" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Singles dinners</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-4">
          {steps.map((item) => <article key={item} className="bg-card/40 p-6"><h2 className="font-serif text-2xl text-foreground">{item}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Built for low-pressure dinner follow-up.</p></article>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
