import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Fanju vs 微信群饭局 | 饭局 Fanju vs WeChat Groups",
  description: "饭局 Fanju vs 微信群饭局：有什么区别？饭局 Fanju 提供主办方审核、公开餐厅和安全边界，比随机微信群饭局更可靠、更安全。",
  alternates: { canonical: "/fanju-vs-wechat-groups" },
  openGraph: {
    title: "Fanju vs 微信群饭局 | 结构化饭局 vs 随机群聊",
    description: "饭局 Fanju 和微信群饭局的区别：主办方审核、安全边界、真实资料。",
    url: `${SITE_URL}/fanju-vs-wechat-groups`,
    type: "article",
    locale: "zh_CN",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Fanju vs 微信群饭局 | Fanju", description: "饭局 Fanju 和微信群饭局的区别。" },
}

const faqs = [
  ["饭局 Fanju 和微信群饭局有什么区别？", "微信群饭局通常是随机拉群、自发组织，缺乏筛选机制和安全边界。饭局 Fanju 提供主题明确的饭局、主办方审核、公开餐厅要求和真实资料验证，是更结构化、更安全的饭局社交方式。"],
  ["微信群饭局有什么问题？", "微信群饭局的主要问题是质量不稳定：参与者背景不明、目的不清、组织混乱。有些群饭局变成了推销场合，有些缺乏基本安全意识。饭局 Fanju 通过主办方审核和主题设定解决了这些问题。"],
  ["饭局 Fanju 是否比微信群饭局更安全？", "是的。饭局 Fanju 要求所有饭局在公开餐厅举行，主办方审核每位参与者，不允许提前转账，不展示虚假报名人数。这些机制比随机微信群饭局提供了更多安全保障。"],
  ["我可以在饭局 Fanju 上建立自己的饭局群吗？", "饭局 Fanju 不是群聊工具。它是饭局组织平台。如果你想成为主办方，可以在 fanju.app/hosts 申请，按照饭局 Fanju 的标准组织饭局。"],
  ["饭局 Fanju 和微信群饭局可以互补吗？", "可以。很多用户在饭局 Fanju 认识人之后，会建立微信群保持联系。饭局 Fanju 负责第一次见面的组织和安全，微信群负责后续的日常联系。"],
  ["为什么不直接在微信上找饭搭子？", "在微信上找饭搭子需要你自己发朋友圈、自己筛选、自己组织，效率低且缺乏安全机制。饭局 Fanju 提供现成的饭局框架，让找饭搭子变得更简单、更安全。"],
  ["How does Fanju compare to WeChat group dinners in English?", "WeChat group dinners are informal, self-organized dinner events arranged through WeChat group chats. Fanju is a structured social dining platform with host review, themed dinners, and safety boundaries. Fanju provides the organization and safety infrastructure that WeChat group dinners lack."],
]

export default function FanjuVsWechatGroupsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "饭局 Fanju vs 微信群饭局 — 结构化饭局 vs 随机群聊",
    description: "比较饭局 Fanju 和微信群饭局在安全性、质量和组织效率方面的区别。",
    url: `${SITE_URL}/fanju-vs-wechat-groups`,
    inLanguage: "zh-CN",
    author: { "@type": "Organization", name: "饭局 Fanju", url: SITE_URL },
    publisher: { "@type": "Organization", name: "饭局 Fanju", url: SITE_URL },
    dateModified: "2026-05-13",
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">对比 · 微信群饭局替代方案</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            饭局 Fanju vs 微信群饭局
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              微信群饭局是中国最常见的线下聚餐组织方式，但它缺乏结构化的筛选机制和安全边界。饭局 Fanju 提供主题明确的饭局、主办方审核、公开餐厅要求和真实资料验证，是比随机微信群饭局更可靠、更安全的饭局社交方式。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/social-dining" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">饭局社交</Link>
            <Link href="/fanju-vs-xiaohongshu" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Fanju vs 小红书</Link>
            <Link href="/safety" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">安全须知</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">核心区别对比</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="py-3 pr-6 text-left font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">维度</th>
                  <th className="py-3 pr-6 text-left font-mono text-[10px] tracking-[0.2em] text-accent uppercase">饭局 Fanju</th>
                  <th className="py-3 text-left font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">微信群饭局</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {[
                  ["参与者筛选", "主办方审核每位参与者", "无筛选，随机拉群"],
                  ["饭局主题", "明确主题，目的清晰", "主题模糊，目的混杂"],
                  ["安全边界", "公开餐厅，不允许提前转账", "无统一安全要求"],
                  ["组织成本", "低 — 平台帮你组织", "高 — 需要自己组织"],
                  ["参与者质量", "高 — 经过审核", "不稳定 — 随机"],
                  ["虚假信息", "不展示虚假报名人数", "可能存在虚假信息"],
                  ["后续联系", "参与者自行决定", "通过微信群保持联系"],
                ].map(([feature, fanju, wechat]) => (
                  <tr key={feature}>
                    <td className="py-3 pr-6 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">{feature}</td>
                    <td className="py-3 pr-6 text-foreground">{fanju}</td>
                    <td className="py-3 text-muted-foreground">{wechat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">常见问题 / FAQ</h2>
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">相关页面</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["Fanju vs 小红书", "/fanju-vs-xiaohongshu"],
              ["Fanju vs Meetup", "/fanju-vs-meetup"],
              ["Fanju vs Tinder", "/fanju-vs-tinder"],
              ["安全须知", "/safety"],
              ["饭局社交", "/social-dining"],
              ["找饭搭子", "/dinner-buddy-app"],
              ["中国饭局社交", "/china-social-dining"],
              ["全部城市", "/cities"],
              ["常见问题", "/faq"],
              ["饭局 Fanju 是什么", "/what-is-fanju"],
              ["主办方招募", "/hosts"],
              ["English", "/social-dining"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">{label}</Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
