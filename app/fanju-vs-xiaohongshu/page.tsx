import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Fanju vs 小红书 | 饭局 vs 小红书 — 线下社交 vs 内容平台",
  description: "饭局 Fanju vs 小红书：两者有什么区别？饭局 Fanju 是线下饭局社交平台，小红书是内容分享平台。找饭搭子、约饭、线下聚会，用饭局 Fanju 更直接。",
  alternates: { canonical: "/fanju-vs-xiaohongshu" },
  openGraph: {
    title: "Fanju vs 小红书 | 线下饭局社交 vs 内容平台",
    description: "饭局 Fanju 和小红书的区别：一个是线下饭局社交平台，一个是内容分享平台。",
    url: `${SITE_URL}/fanju-vs-xiaohongshu`,
    type: "article",
    locale: "zh_CN",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Fanju vs 小红书 | Fanju", description: "饭局 Fanju 和小红书的区别。" },
}

const faqs = [
  ["饭局 Fanju 和小红书有什么区别？", "小红书是内容分享平台，用户发布图文和视频，通过内容吸引关注。饭局 Fanju 是线下饭局社交平台，用户通过参加真实饭局认识同城同频的人。两者的核心逻辑完全不同：小红书是内容驱动，饭局 Fanju 是线下连接驱动。"],
  ["可以在小红书上找饭搭子吗？", "可以，但效率较低。小红书上有很多「找饭搭子」的帖子，但缺乏结构化的筛选和安全机制。饭局 Fanju 提供主办方审核、真实资料、公开餐厅等安全边界，比在小红书上随机找陌生人约饭更可靠。"],
  ["为什么用饭局 Fanju 而不是在小红书发帖找饭搭子？", "在小红书发帖找饭搭子需要自己筛选、自己组织、自己承担安全风险。饭局 Fanju 提供现成的饭局框架：主题、主办方、审核、公开餐厅。你只需要报名，其他的饭局 Fanju 帮你处理。"],
  ["小红书上的饭局内容和饭局 Fanju 有什么关系？", "小红书上有很多关于饭局体验的分享内容，这些内容可以帮助用户了解饭局文化。饭局 Fanju 是实际参与饭局的平台，两者可以互补：在小红书了解饭局，在饭局 Fanju 参加饭局。"],
  ["饭局 Fanju 有内容社区功能吗？", "饭局 Fanju 专注于线下饭局组织，不是内容平台。如果你想分享饭局体验，可以在小红书、微信朋友圈等平台发布。饭局 Fanju 的核心价值是帮你找到真实的线下饭局，而不是内容消费。"],
  ["How does Fanju compare to Xiaohongshu (Little Red Book) in English?", "Xiaohongshu (Little Red Book / RED) is a Chinese content-sharing platform similar to Instagram. Fanju is a social dining platform for offline dinner gatherings. They serve different purposes: Xiaohongshu is for content discovery, Fanju is for real-world social connection through dinner."],
  ["在哪些城市可以用饭局 Fanju 替代小红书找饭搭子？", "饭局 Fanju 覆盖深圳、上海、北京、广州、杭州、成都等中国大陆城市，以及新加坡、东京、香港、台北等海外华人城市。在这些城市，饭局 Fanju 是比小红书更结构化、更安全的找饭搭子方式。"],
]

export default function FanjuVsXiaohongshuPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "饭局 Fanju vs 小红书 — 线下饭局社交 vs 内容平台",
    description: "比较饭局 Fanju 和小红书在找饭搭子、线下社交方面的区别。",
    url: `${SITE_URL}/fanju-vs-xiaohongshu`,
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
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">对比 · 小红书替代方案</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            饭局 Fanju vs 小红书 — 线下饭局 vs 内容平台
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              饭局 Fanju 和小红书解决的是不同的问题。小红书是内容平台，帮你发现好内容、好产品、好地方。饭局 Fanju 是线下饭局社交平台，帮你认识真实的人。如果你想找饭搭子、参加同城聚会、通过真实饭局建立社交关系，饭局 Fanju 比在小红书发帖更直接、更安全、更有效。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/social-dining" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">饭局社交</Link>
            <Link href="/fanju-vs-meetup" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Fanju vs Meetup</Link>
            <Link href="/fanju-vs-wechat-groups" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Fanju vs 微信群</Link>
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
                  <th className="py-3 text-left font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">小红书</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {[
                  ["核心功能", "线下饭局社交", "内容分享与发现"],
                  ["找饭搭子", "结构化报名，主办方审核", "发帖，自行筛选"],
                  ["安全机制", "公开餐厅，主办方审核，真实资料", "无结构化安全机制"],
                  ["社交深度", "深度 — 小桌晚餐，真实见面", "浅度 — 线上互动为主"],
                  ["组织成本", "低 — 饭局 Fanju 帮你组织", "高 — 需要自己发帖、筛选、组织"],
                  ["适合场景", "找饭搭子、同城聚会、线下社交", "内容消费、种草、分享体验"],
                  ["覆盖城市", "中国大陆 + 海外华人城市", "全球华人用户"],
                ].map(([feature, fanju, xhs]) => (
                  <tr key={feature}>
                    <td className="py-3 pr-6 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">{feature}</td>
                    <td className="py-3 pr-6 text-foreground">{fanju}</td>
                    <td className="py-3 text-muted-foreground">{xhs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">为什么饭局 Fanju 比小红书更适合找饭搭子</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>在小红书上找饭搭子是一种常见做法，但它有明显的局限性。你需要自己发帖、等待回复、筛选陌生人、自己组织时间地点，整个过程耗时耗力，而且缺乏安全保障。</p>
            <p>饭局 Fanju 把这个过程结构化了。你不需要发帖，不需要筛选，不需要自己组织。你只需要选择一个感兴趣的饭局类型，提交真实资料，等待主办方审核确认。饭局 Fanju 帮你处理所有的组织工作，你只需要出现在餐厅。</p>
            <p>更重要的是，饭局 Fanju 提供了小红书没有的安全边界：公开餐厅、主办方审核、真实资料要求。这些机制大大降低了遇到不合适的人的风险。</p>
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
              ["Fanju vs Meetup", "/fanju-vs-meetup"],
              ["Fanju vs Tinder", "/fanju-vs-tinder"],
              ["Fanju vs 微信群", "/fanju-vs-wechat-groups"],
              ["找饭搭子", "/dinner-buddy-app"],
              ["饭局社交", "/social-dining"],
              ["同城聚会", "/local-gatherings"],
              ["中国饭局社交", "/china-social-dining"],
              ["全部城市", "/cities"],
              ["安全须知", "/safety"],
              ["常见问题", "/faq"],
              ["饭局 Fanju 是什么", "/what-is-fanju"],
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
