import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "饭局设置｜饭局 Fanju",
  description: "饭局 Fanju 设置中心，包含席位确认、席位校验、开放入局、桌前提醒、共同主理、饭后回忆和餐桌规则。",
  alternates: { canonical: "/event-settings" },
}

const settings = [
  ["席位确认", "/responses"],
  ["席位校验", "/seat-check"],
  ["开放入局", "/open-invite"],
  ["桌前提醒", "/reminders"],
  ["共同主理", "/cohosts"],
  ["饭后回忆", "/memories"],
]

export default function EventSettingsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">FANJU SETTINGS</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局设置</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">一处管理饭局的席位、校验、可见性、提醒、共同主理和饭后回忆。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/host-console" className="bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">主理后台</Link>
            <Link href="/create" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">开始组局</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 md:grid-cols-3">
          {settings.map(([label, href]) => <Link key={href} href={href} className="bg-card/40 p-6 hover:bg-card/70"><h2 className="font-serif text-2xl text-foreground">{label}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">配置这一项饭局能力。</p></Link>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
