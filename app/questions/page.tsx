import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Guest Questions | Fanju",
  description: "Fanju guest questions help hosts collect table-fit notes before confirming dinner seats.",
  alternates: { canonical: "/questions" },
}

const questions = [
  "Which city are you in?",
  "What kind of dinner table are you looking for?",
  "What topics would you enjoy discussing?",
  "Any food preferences the host should know?",
]

export default function QuestionsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">GUEST QUESTIONS</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">Guest questions</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">Collect short answers before confirming a seat, so hosts can understand the dinner fit without long back-and-forth messages.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/features/guest-questions" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Question feature</Link>
            <Link href="/create" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Create dinner</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[900px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid gap-px border border-border/60 bg-border/60">
            {questions.map((q) => <article key={q} className="bg-card/40 p-5"><h2 className="font-serif text-2xl text-foreground">{q}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Used during RSVP review.</p></article>)}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
