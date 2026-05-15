import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Co-hosts | Fanju",
  description: "Fanju co-host tools help multiple hosts manage dinner setup, guests, notes and follow-up together.",
  alternates: { canonical: "/cohosts" },
}

const roles = ["Owner", "Co-host", "Check-in", "Notes"]

export default function CohostsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">CO-HOSTS</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">Co-hosts</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">Let multiple trusted hosts manage dinner setup, guest review, table notes and follow-up together.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/host-console" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Host console</Link>
            <Link href="/hosts" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Host page</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-4">
          {roles.map((item) => <article key={item} className="bg-card/40 p-6"><h2 className="font-serif text-2xl text-foreground">{item}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Role-based support for dinner hosting.</p></article>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
