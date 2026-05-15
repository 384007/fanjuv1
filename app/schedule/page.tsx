import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Dinner Schedule | Fanju",
  description: "Fanju dinner schedule helps hosts update date, time, location notes and guest status.",
  alternates: { canonical: "/schedule" },
}

const items = ["Date", "Time", "Location note", "Guest status"]

export default function SchedulePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">SCHEDULE</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">Dinner schedule</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">Update date, time, location notes and guest status for a dinner.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/reminders" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Reminders</Link>
            <Link href="/calendar" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Calendar</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-4">
          {items.map((item) => <article key={item} className="bg-card/40 p-6"><h2 className="font-serif text-2xl text-foreground">{item}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">A dinner schedule field.</p></article>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
