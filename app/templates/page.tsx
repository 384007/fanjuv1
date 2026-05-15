import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "Dinner Templates | Fanju",
  description: "Fanju dinner templates help hosts start from proven formats for weekend dinners, business dinners, founder dinners and Chinese social dining.",
  alternates: { canonical: "/templates" },
}

const templates = [
  ["Weekend table", "A relaxed small-table dinner for local friends.", "/city/shenzhen/weekend-dinner"],
  ["Business table", "A structured dinner for professional exchange.", "/category/business-dinner"],
  ["Founder table", "A dinner format for builders and operators.", "/category/founder-dinner"],
  ["Chinese social dining", "A Mandarin-context table for Chinese communities.", "/category/chinese-social-dining"],
]

export default function TemplatesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">TEMPLATES</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">Dinner templates</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">Start from a proven dinner format instead of a blank page. Templates help hosts create clear themes, table notes and RSVP questions faster.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/create" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Create dinner</Link>
            <Link href="/features" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Features</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-2">
          {templates.map(([title, body, href]) => <Link key={title} href={href} className="bg-card/40 p-6 hover:bg-card/70"><h2 className="font-serif text-2xl text-foreground">{title}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p></Link>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
