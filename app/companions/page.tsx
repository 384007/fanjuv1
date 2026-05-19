import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "同行名额｜饭局 Fanju",
  description: "饭局 Fanju 同行名额功能，用于设置是否允许参与者携带同行者、控制额外席位和报名说明。",
  alternates: { canonical: "/companions" },
}

export default function CompanionsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">
            COMPANIONS
          </div>

          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">
            同行名额
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            设置饭局是否允许参与者携带一位同行者，并清楚说明同行名额、额外席位、确认方式和主理人审核规则。
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/invite"
              className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase"
            >
              饭局口令
            </Link>
            <Link
              href="/responses"
              className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent"
            >
              席位确认
            </Link>
            <Link
              href="/product-map"
              className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent"
            >
              产品地图
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
