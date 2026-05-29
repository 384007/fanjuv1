import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "饭局 Fanju vs 微信群饭局：为什么结构化小桌更可靠 | 饭局 Fanju",
  description: "微信群饭局 vs 饭局 Fanju：随机拉群 vs 主办方审核、主题明确、安全边界。深入对比两者在安全、质量、效率和真实连接上的根本区别，帮助你选择靠谱的饭局方式。",
  alternates: { canonical: "/fanju-vs-wechat-groups" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "饭局 Fanju vs 微信群饭局 | 结构化 vs 随机",
    description: "为什么越来越多专业人士放弃微信群饭局，转向饭局 Fanju 的结构化小桌？完整对比与真实案例。",
    url: `${SITE_URL}/fanju-vs-wechat-groups`,
    type: "article",
    locale: "zh_CN",
    siteName: "饭局 Fanju",
  },
}

const faqs = [
  ["饭局 Fanju 和微信群饭局最大的区别是什么？", "微信群饭局是自发、随机、缺乏筛选的群聊组织方式。饭局 Fanju 是平台化、主题驱动、有主办方审核和安全机制的结构化饭局。"],
  ["微信群饭局为什么越来越不可靠？", "质量完全依赖群主个人，容易变成推销场、酒局或目的不明的聚会，缺乏边界感和安全保障。"],
  ["饭局 Fanju 是否完全取代微信群？", "不是。很多人在 Fanju 第一次见面后，会自然建立微信群保持联系。Fanju 负责高质量的第一次见面，微信负责后续轻度联系。"],
  ["在微信上找饭搭子效率低吗？", "效率低且风险高。你需要自己发圈、筛选、组织、承担所有安全责任。Fanju 把这些成本转移给平台和主办方。"],
  ["为什么创始人/职场人更倾向 Fanju？", "时间宝贵，不想参加低效、目的混乱的群局。Fanju 的主题筛选和边界设定，让每一次见面都有更高概率产生价值。"],
]

export default function FanjuVsWechatGroupsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "饭局 Fanju vs 微信群饭局 — 结构化小桌 vs 随机群聊",
    description: "深入对比两种饭局方式在安全、质量、效率上的差异。",
    url: `${SITE_URL}/fanju-vs-wechat-groups`,
    inLanguage: "zh-CN",
    author: { "@type": "Organization", name: "饭局 Fanju" },
    dateModified: "2026-05-29",
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
              微信群饭局是中国最常见的线下聚餐组织方式，但它本质上是<strong>随机、自发、缺乏结构</strong>的。饭局 Fanju 通过主题驱动、主办方审核、公开餐厅要求和真实资料验证，提供的是<strong>结构化、可预测、有安全边界</strong>的饭局体验。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/safety" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">安全边界</Link>
            <Link href="/what-is-fandazi" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">什么是饭搭子</Link>
            <Link href="/fanju-vs-xiaohongshu" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">vs 小红书</Link>
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
                  ["参与者筛选", "主办方审核 + 真实资料", "无筛选，随机拉群"],
                  ["主题与目的", "明确主题，目的对齐", "主题模糊，目的混杂"],
                  ["安全机制", "公开餐厅 + 边界规则 + 不展示虚假人数", "完全依赖群主个人"],
                  ["组织成本", "平台承担大部分，极低", "群主/发起人承担全部"],
                  ["质量稳定性", "高 — 结构化保障", "极不稳定 — 看运气"],
                  ["适合人群", "希望高效、靠谱连接的人", "时间成本低、能接受不确定性的人"],
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">为什么越来越多专业人士放弃微信群饭局</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["时间成本太高", "自己拉群、筛选、定餐厅、控场、处理突发，经常一场饭下来比工作还累。"],
              ["质量完全不可控", "经常遇到推销、酒局、目的不明的人，浪费时间还可能踩坑。"],
              ["安全边界缺失", "陌生人微信群里，提前转账、泄露信息、被带偏节奏的情况时有发生。"],
              ["缺乏主题对齐", "一群人坐一起却不知道为什么来，聊天容易变成尬聊或互相营销。"],
            ].map(([title, body]) => (
              <article key={title} className="border border-border/60 bg-card/35 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NEW: 微信群饭局的 5 大系统性风险 */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase mb-2">系统性风险分析</div>
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">微信群饭局的 5 大系统性风险</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            微信群饭局不是偶尔出问题，而是结构性存在以下 5 类几乎不可避免的风险：
          </p>

          <div className="mt-8 space-y-5">
            {[
              { title: "信息不对称风险", desc: "发起人掌握几乎所有信息，参与者完全被动。骗局、营销局、酒局极易藏身其中。" },
              { title: "质量随机性风险", desc: "完全依赖群主个人审美和执行力。没有审核机制，任何人都可以进来。" },
              { title: "边界缺失风险", desc: "几乎从不提前说清楚费用、结束时间、可以聊什么。极易产生尴尬、道德绑架或性骚扰。" },
              { title: "后续追责风险", desc: "出了问题没人负责。群主可以删人、退群，平台不承担任何责任。" },
              { title: "信任幻觉风险", desc: "线上群聊容易产生虚假亲密感，线下见面后崩盘率极高，浪费大量时间和情绪成本。" },
            ].map((item, i) => (
              <div key={i} className="border-l-2 border-border/60 pl-5">
                <h3 className="font-serif text-lg text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">饭局 Fanju 如何解决这些问题</h2>
          <div className="mt-8 text-sm leading-relaxed text-muted-foreground md:text-base space-y-4">
            <p>饭局 Fanju 把“第一次见面”的成本和风险，从个人转移到平台和结构：</p>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong>主题筛选</strong>：你知道这桌人是为什么来的（创始人复盘、行业交流、生活方式分享等）。</li>
              <li><strong>主办方审核</strong>：不是谁都能来，主办方会根据主题过滤参与者。</li>
              <li><strong>安全机制</strong>：公开餐厅 + 清晰费用 + 允许随时退出 + 不展示虚假人数。</li>
              <li><strong>低组织成本</strong>：你只需要报名、准时到场，剩下由平台和主办方负责。</li>
            </ul>
            <p>这让专业人士（创始人、职场人、内容创作者）可以用极低的时间成本，获得更高概率的真实连接。</p>
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">真实本地案例：为什么结构化小桌比微信群更可靠</h2>
          <p className="mt-3 text-base text-muted-foreground">微信群饭局的最大问题，是质量完全不可控。下面这些已重写的本地案例，展示了不同城市专业人士真实遇到的问题，以及结构化小桌如何解决。</p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link href="/city/shanghai/media-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">上海 · 媒体人</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">上海媒体人饭局：行业边界、选题禁忌与真实信任建立</div>
              <p className="mt-2 text-sm text-muted-foreground">为什么媒体人最怕“被录音”“被截图”？本地化改写后的判断标准：主理人是否提前把“今晚不讨论什么”写死。</p>
            </Link>
            <Link href="/city/tianjin/founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">天津 · 创始人</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">天津创始人饭局：冬季渡口、冰面与校友网络的真实约束</div>
              <p className="mt-2 text-sm text-muted-foreground">小白楼 vs 解放碑的圈子差异；南开、天大、北洋的校友脉络。随机群局在这里极易变成“老乡会”或“项目路演”。</p>
            </Link>
            <Link href="/city/guangzhou/city-guide-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">广州 · 供应链</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">广州城市指南：供应链从业者冬季的饭局节奏</div>
              <p className="mt-2 text-sm text-muted-foreground">珠江新城 vs 荔湾的实际通勤；年底 review 季的避坑优先级。只有结构化审核才能过滤掉“来推货”的老油条。</p>
            </Link>
            <Link href="/city/shanghai/ai-founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">上海 · AI 创始人</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">上海 AI 创业者饭局：怎么在卷王之城找到靠谱的技术饭搭子</div>
              <p className="mt-2 text-sm text-muted-foreground">信息爆炸但信任极低。微信群里 80% 是分享会+营销，真正能聊技术细节的 4-6 人小桌才是稀缺品。</p>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">这些案例都经过严格去模板化，只有当地专业人士看了才知道“原来问题可以被这样说清楚”。</p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">继续阅读</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["什么是饭搭子", "/what-is-fandazi"],
              ["饭局 Fanju 是什么", "/what-is-fanju"],
              ["安全边界", "/safety"],
              ["如何找饭搭子", "/how-to-find-dinner-buddies"],
              ["vs 小红书", "/fanju-vs-xiaohongshu"],
              ["商务饭局", "/business-dinner-networking"],
              ["全部城市", "/cities"],
              ["如何组织饭局", "/how-to-host-a-dinner-gathering"],
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
