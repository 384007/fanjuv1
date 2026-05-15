import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "饭局参加规则｜报名、费用、主办方、餐厅说明｜饭局 Fanju",
  description: "饭局 Fanju 参加规则说明，包含报名资料、餐厅信息、费用规则、主办方信息、取消规则和边界提醒。",
  alternates: { canonical: "/rules" },
}

const faqs = [
  ["参加饭局前需要确认什么？", "建议确认城市、餐厅、时间、费用包含项、取消规则、主办方信息和饭局主题。"],
  ["饭局 Fanju 是否展示虚假报名人数？", "不展示。饭局 Fanju 会用招募中、即将开放、主办方招募中等状态说明进度。"],
  ["主办方需要说明什么？", "主办方需要说明饭局主题、人数、地点、时间、费用规则和取消规则。"],
]

export default function RulesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", name: "饭局参加规则", url: `${SITE_URL}/rules`, inLanguage: "zh-CN", description: "饭局 Fanju 参加规则说明。" },
      { "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">RULES</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局参加规则</h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">饭局 Fanju 的参加规则强调清晰主题、公开餐厅、明确费用、主办方信息和取消规则。用户报名前应先了解城市、时间、人数和饭局类型。</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">城市目录</Link>
            <Link href="/categories" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局类型</Link>
            <Link href="/hosts" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">主办方招募</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 px-4 py-12 md:grid-cols-2 md:px-8 md:py-16">
          <Info title="报名资料" body="报名资料应真实、简洁、可审核，方便主办方判断是否符合饭局主题。" />
          <Info title="餐厅信息" body="饭局页面应说明餐厅所在城市、区域、时间和人数规模。" />
          <Info title="费用规则" body="费用说明应包含餐费、服务费、包含项和取消规则。" />
          <Info title="主办方信息" body="主办方需要说明饭局主题、适合人群、流程和基本边界。" />
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">参加规则常见问题</h2>
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
