import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "主理人工具｜饭局 Fanju",
  description: "饭局 Fanju 主理人工具，集中管理组局、饭局设置、席位确认、熟客分组、批量邀约、桌前广播和饭后回忆。",
  alternates: { canonical: "/host-tools" },
}

const tools = [
  ["开始组局", "/create"],
  ["饭局设置", "/event-settings"],
  ["席位确认", "/responses"],
  ["席位校验", "/seat-check"],
  ["熟客分组", "/guest-groups"],
  ["批量邀约", "/bulk-invite"],
  ["桌前广播", "/table-broadcast"],
  ["饭后回忆", "/memories"],
  ["一键复局", "/again"],
  ["饭局系列", "/series"],
  ["同桌清单", "/table-list"],
  ["饭局日程", "/schedule"],
]

export default function HostToolsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">HOST TOOLS</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">主理人工具</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">把主理人需要的组局、席位、邀约、广播、复局和饭后沉淀集中到一个入口。</p>
        </div>
      </section>
      <section className="border-b border-border/60"><div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-3">{tools.map(([label, href]) => <Link key={href} href={href} className="bg-card/40 p-6 hover:bg-card/70"><h2 className="font-serif text-2xl text-foreground">{label}</h2><p className="mt-3 text-sm text-muted-foreground">进入这个主理人工具。</p></Link>)}</div></section>
      <SiteFooter />
    </main>
  )
}
