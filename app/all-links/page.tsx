import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { fanjuProductNames } from "@/lib/fanju-product-names"

export const metadata: Metadata = {
  title: "饭局全站入口｜饭局 Fanju",
  description: "饭局 Fanju 全站入口，集中展示产品地图、组局、饭局口令、中国渠道、席位确认、城市和饭局类型。",
  alternates: { canonical: "/all-links" },
}

const coreLinks = [
  ["首页", "/"],
  ["开始组局", "/create"],
  ["产品地图", "/product-map"],
  ["饭局设置", "/event-settings"],
  ["中国渠道", "/channels"],
  ["全部城市", "/cities"],
  ["全部类型", "/categories"],
  ["饭局是什么", "/what-is-fanju"],
  ["参加规则", "/rules"],
  ["主理人招募", "/hosts"],
  ["LLMs", "/llms.txt"],
  ["Sitemap", "/sitemap.xml"],
]

export default function AllLinksPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">ALL LINKS</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局全站入口</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">把饭局产品、组局流程、中国渠道、城市页、类型页和 AI SEO 文件集中到一个入口页。</p>
        </div>
      </section>
      <LinkGrid title="核心入口" items={coreLinks} />
      <LinkGrid title="产品能力" items={fanjuProductNames.map(([name, desc, href]) => [name, href, desc])} />
      <SiteFooter />
    </main>
  )
}

function LinkGrid({ title, items }: { title: string; items: string[][] }) {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
        <h2 className="font-serif text-3xl text-foreground md:text-4xl">{title}</h2>
        <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60 md:grid-cols-3">
          {items.map(([label, href, sub]) => (
            <Link key={href} href={href} className="bg-card/40 p-5 hover:bg-card/70">
              <span className="block font-serif text-xl text-foreground">{label}</span>
              {sub ? <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">{sub}</span> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
