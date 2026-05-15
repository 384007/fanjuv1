import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Dinner Notes | Fanju",
  description: "Fanju dinner notes help hosts keep follow-up notes, memories and next-table links after a dinner.",
  alternates: { canonical: "/notes" },
}

const items = ["Host note", "Memory", "Follow-up", "Next table"]

export default function NotesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">NOTES</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">Dinner notes</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">Keep follow-up notes, memories and next-table links after each dinner.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/photos" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Photos</Link>
            <Link href="/feedback" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Feedback</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-4">
          {items.map((item) => <article key={item} className="bg-card/40 p-6"><h2 className="font-serif text-2xl text-foreground">{item}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">A note format for dinner follow-up.</p></article>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
