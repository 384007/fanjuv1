import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "饭局主办方招募｜城市饭局、商务饭局、单身饭局主理人｜饭局 Fanju",
  description: "饭局 Fanju 招募城市饭局主办方，适合餐饮资源、城市社群、商务圈层、留学生圈层和华人社交主理人。",
  alternates: { canonical: "/hosts" },
  robots: { index: true, follow: true },
}

const faqs = [
  ["谁可以成为饭局主办方？", "熟悉本地餐厅、城市社群、行业资源或华人圈层的人，都可以关注饭局 Fanju 主办方招募。"],
  ["主办方需要负责什么？", "主办方需要说明饭局主题、适合人群、餐厅区域、人数规模、费用规则和现场流程。"],
  ["哪些城市优先招募主办方？", "深圳、广州、上海、北京、杭州、成都优先，同时关注新加坡、纽约、伦敦、东京、香港、台北等华人城市。"],
]

export default function HostsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: "饭局主办方招募", url: `${SITE_URL}/hosts`, inLanguage: "zh-CN", description: "饭局 Fanju 主办方招募说明。" },
      { "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">HOST RECRUITMENT</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局主办方招募</h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">饭局 Fanju 招募熟悉城市餐厅、行业圈层和华人社群的主办方，优先开放深圳、广州、上海、北京、杭州、成都，并同步关注海外华人城市。</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">城市目录</Link>
            <Link href="/categories" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局类型</Link>
            <Link href="/rules" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">参加规则</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 px-4 py-12 md:grid-cols-2 md:px-8 md:py-16">
          <Info title="城市资源" body="熟悉本地餐厅、商圈和活动场景，能够判断适合小桌晚餐的区域与时间。" />
          <Info title="主题设计" body="能设计单身、商务、创业者、周末、华人、留学生或新移民饭局主题。" />
          <Info title="流程说明" body="能清晰说明人数规模、餐厅区域、费用规则、取消规则和现场流程。" />
          <Info title="长期运营" body="适合愿意长期经营城市社群、餐饮资源和线下连接的人。" />
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">主办方常见问题</h2>
          <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60">
            {faqs.map(([q, a]) => <article key={q} className="bg-card/40 p-5 md:p-6"><h3 className="font-serif text-xl text-foreground">{q}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p></article>)}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}

function Info({ title, body }: { title: string; body: string }) {
  return <article className="border border-border/60 bg-card/35 p-5 md:p-6"><h2 className="font-serif text-2xl text-foreground">{title}</h2><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{body}</p></article>
}
