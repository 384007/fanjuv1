import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "高端饭局 / 私密饭局：精选小桌的真实价值 | 饭局 Fanju",
  description: "高端饭局、私密饭局不是简单的高消费，而是经过严格筛选、主题深入、氛围克制的精选小桌。饭局 Fanju 的 curated dinner 模式，让每一次见面都值得。",
  alternates: { canonical: "/private-dinner-club" },
  openGraph: {
    title: "高端饭局 / 私密饭局：精选小桌的真实价值 | 饭局 Fanju",
    description: "为什么高端饭局值得？如何判断一桌 curated dinner 是否真正有质量？完整指南。",
    url: `${SITE_URL}/private-dinner-club`,
    type: "article",
    locale: "zh_CN",
    siteName: "饭局 Fanju",
  },
}

const faqs = [
  ["高端饭局和普通饭局有什么区别？", "核心是筛选强度和氛围克制。高端饭局对参与者背景、主题深度、餐厅品质有更高要求，目的是让每一次见面都更值得。"],
  ["高端饭局是不是就是贵？", "价格通常更高，但价值不只在于菜品，而在于筛选后的人的质量和对话的深度。真正的价值是“时间没有被浪费”。"],
  ["如何被邀请参加高端饭局？", "在 fanju.app/category/curated-dinner 报名，提交完整真实资料。主办方会根据主题严格筛选，不是所有人都能通过。"],
  ["高端饭局适合推资源或谈生意吗？", "不适合。把高端饭局当成资源交换场的人，反而容易被筛掉。真正的高端饭局，商业机会是在自然连接之后产生的。"],
  ["高端饭局的氛围是什么样的？", "克制、专业、有深度。不会太热闹，也不会太生硬。大家都知道自己是被精选来的，自我介绍和分享都会更真实。"],
  ["可以自己申请举办高端饭局吗？", "可以。在申请主办方时，说明你想做 curated / 高端 / 私密模式，平台会根据你的背景和主题决定是否开放。"],
]

export default function PrivateDinnerClubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "高端饭局 / 私密饭局 — 精选小桌的真实价值 | 饭局 Fanju",
        url: `${SITE_URL}/private-dinner-club`,
        inLanguage: "zh-CN",
        description: "高端饭局是经过严格筛选、主题深入的精选小桌社交形式。",
      },
      {
        "@type": "DefinedTerm",
        name: "高端饭局 / 私密饭局",
        description: "由主办方严格筛选参与者、选择高品质餐厅、设计深度主题的小桌饭局。强调质量而非数量，适合追求高信号连接的人群。",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">高端饭局 · 精选小桌</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            高端饭局 / 私密饭局：<br />精选小桌的真实价值
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              <strong>高端饭局（私密饭局）</strong>不是简单的高消费，而是经过严格筛选、主题深入、氛围克制的精选小桌。它的价值在于“每一次见面都经过思考”，而不是拼数量、拼热闹。
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              饭局 Fanju 的 curated dinner 模式，正是为追求高信号连接的人设计的。参与者知道自己是被精选的，主办方也认真对待每一次 curation。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/category/curated-dinner" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">浏览精选饭局</Link>
            <Link href="/business-dinner-networking" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">商务饭局</Link>
            <Link href="/startup-founder-dinners" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">创始人饭局</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">高端饭局真正的稀缺价值</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["时间被尊重", "每位参与者都是经过筛选的，你不会遇到明显不匹配或只想推销的人。"],
              ["对话有深度", "因为筛选过，话题更容易进入实质，而不是反复破冰或自我介绍。"],
              ["氛围更克制", "大家都知道这是精选局，自我展示和表演会自然减少，更容易出现真实分享。"],
              ["后续连接质量高", "因为第一次见面信号强，第二次、第三次自然跟进的概率更高。"],
            ].map(([title, body]) => (
              <article key={title} className="border border-border/60 bg-card/35 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">如何判断一桌高端饭局是否真正有质量</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              ["看主办方的筛选标准是否透明", "靠谱的高端饭局，主办方会提前说明“这次想邀请什么背景的人”“拒绝什么样的人”。模糊的只写“高端”“精选”往往是卖噱头。"],
              ["看餐厅和氛围是否匹配主题", "真正的高端不是最贵，而是最适合这次对话的场地。环境要能支撑深度聊天，而不是只为了拍照。"],
              ["看参与者是否真的被精选", "如果报名后几乎所有人都能通过，或者主办方完全不审核，那就是挂羊头卖狗肉。"],
            ].map(([title, body]) => (
              <article key={title} className="border border-border/60 bg-card/35 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">第一次参加高端饭局的正确心态</h2>
          <div className="mt-6 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>高端饭局的稀缺性，意味着你应该更认真对待它。</p>
            <p className="mt-4">不要带着“来镀金”或“来展示自己”的心态。最好的高端饭局，参与者都带着“想和这群人认真聊一次”的诚意。真实、克制、有准备，比任何包装都更有价值。</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">常见问题</h2>
          <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60">
            {faqs.map(([q, a]) => (
              <article key={q} className="bg-card/40 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{q}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">继续探索</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["什么是饭搭子", "/what-is-fandazi"],
              ["饭局 Fanju 是什么", "/what-is-fanju"],
              ["如何举办饭局", "/how-to-host-a-dinner-gathering"],
              ["商务饭局", "/business-dinner-networking"],
              ["创业者饭局", "/startup-founder-dinners"],
              ["安全边界", "/safety"],
              ["全部城市", "/cities"],
              ["精选饭局列表", "/category/curated-dinner"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
