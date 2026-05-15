import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Host Console | Fanju",
  description: "Fanju host console for dinner setup, guest status, date polls, notes and post-dinner follow-up.",
  alternates: { canonical: "/host-console" },
}

const cards = [
  ["Dinner setup", "Create title, city, time and table size.", "/create"],
  ["RSVP status", "Review confirmed, pending and waitlist states.", "/rsvp"],
  ["Guest list", "See public guest notes and table fit.", "/guests"],
  ["Date poll", "Choose the best time before publishing.", "/polls"],
  ["Photos", "Keep dinner memories and follow-up links.", "/photos"],
]

export default function HostConsolePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">HOST CONSOLE</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">Fanju host console</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">A host workspace for creating dinners, reviewing guests, choosing a date, sending notes and keeping post-dinner memories.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/create" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Create dinner</Link>
            <Link href="/features" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Features</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(([title, body, href]) => <Link key={href} href={href} className="bg-card/40 p-6 hover:bg-card/70"><h2 className="font-serif text-2xl text-foreground">{title}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p></Link>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
