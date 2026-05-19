import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "邀约进度｜饭局 Fanju",
  description: "饭局 Fanju 邀约进度，用于查看饭局邀请的发出、打开、回应和确认状态。",
  alternates: { canonical: "/delivery" },
}

export default function DeliveryPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">
            DELIVERY
          </div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] md:text-6xl">
            邀约进度
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            查看饭局邀请的发出、打开、回应、候补和确认状态，帮助主理人判断每一桌是否可以准时成局。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/invite" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">
              饭局口令
            </Link>
            <Link href="/responses" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] hover:border-accent/70 hover:text-accent uppercase">
              席位确认
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
