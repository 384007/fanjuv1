import type { Metadata } from "next"
import Link from "next/link"
import { ChinaSocialShare } from "@/components/china-social-share"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "China Social Share | Fanju",
  description: "Fanju China social share page for major Chinese social platforms.",
  alternates: { canonical: "/social" },
}

export default function SocialPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">CHINA SOCIAL</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">China social share</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">Show recognizable share entries for major Chinese social platforms on Fanju invite pages.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/share" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Share page</Link>
            <Link href="/social-more" className="border border-accent/70 bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:text-accent">More channels</Link>
            <Link href="/invite" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Invite page</Link>
            <Link href="/qr" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">QR</Link>
          </div>
        </div>
      </section>
      <ChinaSocialShare url="https://fanju.app/invite" title="饭局 Fanju 邀请链接" />
      <SiteFooter />
    </main>
  )
}
