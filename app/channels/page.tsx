import type { Metadata } from "next"
import Link from "next/link"
import { ChinaSocialShare } from "@/components/china-social-share"
import { ChinaSocialShareMore } from "@/components/china-social-share-more"
import { ChinaSocialShareExtra } from "@/components/china-social-share-extra"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "China Channels | Fanju",
  description: "Fanju invite distribution channels for Chinese social platforms.",
  alternates: { canonical: "/channels" },
}

export default function ChannelsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">CHANNELS</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">China channels</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">All visible channel icons for Fanju dinner invite distribution.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/invite" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Invite</Link>
            <Link href="/share" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Share</Link>
          </div>
        </div>
      </section>
      <ChinaSocialShare url="https://fanju.app/invite" title="饭局 Fanju 邀请链接" />
      <ChinaSocialShareMore url="https://fanju.app/invite" />
      <ChinaSocialShareExtra url="https://fanju.app/invite" />
      <SiteFooter />
    </main>
  )
}
