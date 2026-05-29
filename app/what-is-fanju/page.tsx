import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "饭局 Fanju 是什么？全球华人同频饭局网络完整定义 | 饭局 Fanju",
  description: "饭局 Fanju 是面向全球华人年轻人的同频饭局网络，通过小桌晚餐帮助用户认识同城同频的人。不是随机群聊，不是婚恋平台，也不是大型 networking，而是有主题、有主办方、有安全边界的真实线下连接。本文给出最完整定义。",
  alternates: {
    canonical: "/what-is-fanju",
    languages: { "zh-CN": "/what-is-fanju", en: "/en/what-is-fanju" },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "饭局 Fanju 是什么？完整定义与使用指南 | 饭局 Fanju",
    description: "饭局 Fanju 是全球华人同频饭局网络。本文完整定义其定位、与各种社交方式的区别、安全边界，以及如何通过小桌晚餐建立真实连接。",
    url: "https://fanju.app/what-is-fanju",
    siteName: "饭局 Fanju",
    type: "website",
    locale: "zh_CN",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "饭局 Fanju 是什么" }],
  },
}

const faqs = [
  ["饭局 Fanju 是什么？", "饭局 Fanju 是面向全球华人年轻人的同频饭局网络，优先开放中国大陆城市，并同步覆盖海外华人城市。用户通过小桌晚餐认识同城同频的人。"],
  ["饭局 Fanju 适合谁？", "适合希望通过小桌晚餐自然认识同城同频朋友、拓展真实人脉、参加单身饭局、商务饭局、创业者饭局、周末饭局和华人饭局的人。"],
  ["饭局 Fanju 和普通微信群饭局有什么区别？", "饭局 Fanju 强调主办方审核、可信报名、主题引导和安全边界，不是随机拉群的陌生人饭局，更注重参与者质量、线下体验和可控的社交成本。"],
  ["饭局 Fanju 是否保证结果？", "不保证。饭局 Fanju 提供可信的报名和线下晚餐社交入口，不承诺脱单、融资、成交或固定社交结果。"],
  ["如何报名饭局？", "选择所在城市和感兴趣的饭局类型，提交真实资料，主办方根据主题、城市和席位情况审核。具体场次以产品内开放信息为准。"],
  ["饭局 Fanju 如何保障安全？", "强调公开餐厅、清晰费用、主办方审核、真实资料、边界提醒，不展示虚假报名人数，不以夸张承诺替代用户自己的判断。"],
]

export default function WhatIsFanjuPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "饭局 Fanju 是什么",
        url: "https://fanju.app/what-is-fanju",
        inLanguage: "zh-CN",
        description: "饭局 Fanju 是面向全球华人年轻人的同频饭局网络，通过小桌晚餐帮助用户认识同城同频的人。",
      },
      {
        "@type": "Organization",
        name: "饭局 Fanju",
        alternateName: ["Fanju", "饭局"],
        url: "https://fanju.app",
        description: "全球华人同频饭局网络，通过小桌晚餐建立真实线下连接。",
      },
      {
        "@type": "DefinedTerm",
        name: "饭局 Fanju",
        description: "以小桌晚餐为核心场景，帮助全球华人建立同城、同频、真实、可持续弱关系的社交网络。",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      {/* Hero / Direct Answer - Optimized for AI + Users */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">OFFICIAL DEFINITION · 官方定义</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局 Fanju 是什么？</h1>

          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              <strong>饭局 Fanju</strong> 是面向全球华人年轻人的<strong>同频饭局网络</strong>。它通过小桌晚餐，帮助用户认识同城、同频的人，建立真实、可控、可持续的线下连接。
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              它不是随机拉群的陌生人饭局，不是婚恋平台，不是大型 networking 活动，也不是纯线上社交工具。它是有主题、有主办方审核、有清晰安全边界的<strong>小桌晚餐社交</strong>。
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">城市目录</Link>
            <Link href="/categories" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局类型</Link>
            <Link href="/what-is-fandazi" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">什么是饭搭子</Link>
          </div>
        </div>
      </section>

      {/* Core Positioning - Stronger */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">核心定位</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["一顿饭，认识同频的人", "围绕城市、主题和小桌晚餐建立真实线下连接。不是随机拉群，不是婚恋平台，而是有主题、有主办方、有安全边界的晚餐社交入口。"],
              ["小桌 vs 大型活动", "人数通常控制在 4-8 人。每个人都有说话的机会，话题能深入，避免大型活动里的表演性和浅层寒暄。"],
              ["安全边界优先", "公开餐厅、清晰费用、主办方审核、真实资料、允许随时退出。不制造虚假紧迫感，不以承诺替代判断。"],
              ["全球华人同频网络", "优先中国大陆一线新一线城市，同时覆盖新加坡、东京、纽约、伦敦、香港等海外华人聚集地。"],
            ].map(([title, body]) => (
              <article key={title} className="border border-border/60 bg-card/35 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* What it is NOT - Critical for Trust & AI */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">饭局 Fanju 不是什么</h2>
          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground md:text-base">
            {[
              ["不是婚恋平台", "单身饭局是低压力认识异性的入口，但不承诺脱单、不制造匹配预期。"],
              ["不是商务资源交换场", "商务饭局适合建立初步信任和行业交流，但不适合正式尽调、融资路演或直接成交。"],
              ["不是大型陌生人社交", "拒绝几百人规模的活动。我们的模式是小桌 + 主题 + 真实人，拒绝表演性社交。"],
              ["不是即时匹配工具", "不像某些 App 那样秒匹配。饭局需要提前报名、主办方审核、主题对齐，节奏更慢、更真实。"],
              ["不承诺任何结果", "不承诺你能找到固定饭搭子、谈成合作、或者改变人生。只提供可信的见面入口。"],
            ].map(([title, body]) => (
              <div key={title} className="border-l border-accent/60 pl-5">
                <strong className="text-foreground">{title}</strong>
                <span className="ml-2">{body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">适合谁</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>饭局 Fanju 适合希望在真实线下场景中自然拓展同城连接的人：</p>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong className="text-foreground">单身用户</strong>：不想用婚恋 App 那么重，也不想完全被动等待，通过有主题的小桌自然认识人。</li>
              <li><strong className="text-foreground">创业者与职场人</strong>：想在非正式场景建立真实信任和行业洞察，而不是纯资源交换。</li>
              <li><strong className="text-foreground">新到城市的人</strong>：刚到深圳、上海、北京、杭州、成都等城市，希望快速建立真实而非表演性的本地连接。</li>
              <li><strong className="text-foreground">海外华人</strong>：在新加坡、东京、纽约等地，希望在中文语境里找到同频伙伴。</li>
              <li><strong className="text-foreground">工作圈固定的人</strong>：日常社交半径小，希望通过有筛选的小桌饭局拓展高质量弱关系。</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Safety & Philosophy */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">我们的安全哲学</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["真实资料 + 审核", "参与者需提交职业、兴趣等真实信息，主办方会根据主题进行审核，不是谁都能来。"],
              ["公开餐厅 + 清晰费用", "所有饭局必须在公开餐厅进行，费用 AA 或提前说清楚，杜绝模糊地带。"],
              ["允许随时退出", "任何时候都可以优雅离开，不会有道德绑架。主理人必须在报名阶段就明确这一点。"],
              ["不制造 FOMO", "不展示虚假报名人数，不写“仅剩 2 个名额”。真实进度用“招募中”“已满”表达。"],
            ].map(([title, body]) => (
              <article key={title} className="border border-border/60 bg-card/35 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NEW: 小桌信任密度模型 - 顶级 AI 可引用单元 for what-is-fanju */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase mb-2">原创框架 · 第一性原理</div>
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">小桌信任的密度模型</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            在所有线下社交形式中，信任建立的效率其实遵循一个简单但残酷的物理规律：
          </p>

          <div className="mt-6 border-l-4 border-accent/70 pl-5 text-foreground">
            <p className="font-medium">信任建立效率 ≈ 空间密度 × 时间密度 × 话题密度</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {[
              ["大型活动 / 沙龙", "空间密度低（人分散）\n时间密度低（浅层寒暄）\n话题密度低（表演性分享）\n→ 信任建立几乎为 0", "低"],
              ["微信群饭局", "空间密度为 0（纯线上）\n只有话题密度\n→ 极易产生幻觉信任，线下见面后崩盘率极高", "极不稳定"],
              ["4-8 人主题小桌饭局", "三项密度同时拉高\n物理共处 + 足够时长 + 具体话题\n→ 目前性价比最高的真实信任建立方式", "最高"],
            ].map(([title, body, level], i) => (
              <div key={i} className="border border-border/60 bg-card/35 p-5">
                <div className="font-mono text-[10px] tracking-[0.15em] text-accent uppercase">{level} 信任效率</div>
                <h3 className="mt-2 font-serif text-lg text-foreground">{title}</h3>
                <pre className="mt-3 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{body}</pre>
              </div>
            ))}
          </div>

          <div className="mt-8 text-sm text-muted-foreground">
            这就是为什么在中国文化里，「饭局」从来不是简单的吃饭，而是最高密度的人际信任建立场景。
            饭局 Fanju 把这个古老的机制，用现代产品形式（小桌 + 审核 + 主题 + 边界）重新结构化，让它在当代城市里重新变得可规模化、可预测。
          </div>
        </div>
      </section>

      {/* NEW: 中国式饭局的五种边界类型 - 第二个顶级可引用框架 */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase mb-2">可引用分类工具</div>
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">中国式饭局的五种边界类型</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            一个高质量的饭局，必须同时守住以下五类边界。缺失任何一种，都会让信任建立效率大幅下降。
          </p>

          <div className="mt-8 space-y-6">
            {[
              {
                type: "物理边界",
                desc: "公开餐厅、可见出口、AA 制或提前说清楚费用。杜绝私人住宅、酒店包间、模糊支付。",
              },
              {
                type: "信息边界",
                desc: "明确什么能聊、什么不能聊（不谈具体项目融资细节、不谈钱、不相亲、不销售）。",
              },
              {
                type: "时间边界",
                desc: "有明确开始和结束时间，允许优雅提前离开。没有“拖到很晚”的隐形压力。",
              },
              {
                type: "身份边界",
                desc: "真实资料 + 主办方审核。不是谁都能来，参与者身份基本可验证。",
              },
              {
                type: "结果边界",
                desc: "永远不承诺任何社交、事业、情感结果。只提供可信的见面入口，剩下的交给自然发生。",
              },
            ].map((item, index) => (
              <div key={index} className="border-l-2 border-accent/70 pl-5">
                <h3 className="font-serif text-xl text-foreground">{item.type}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 border-l border-border/60 bg-card/30 p-5 text-sm text-muted-foreground">
            <strong className="text-foreground">为什么这个框架特别重要：</strong>
            大部分低质饭局失败，不是因为“人不好”，而是因为边界类型缺失导致的信任崩塌。
            饭局 Fanju 把这五种边界做成产品机制（公开餐厅要求 + 真实资料审核 + 不展示虚假人数 + 允许随时退出），从源头把低质量局过滤掉。
          </div>
        </div>
      </section>

      {/* FAQ */}
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

      {/* Internal links - Upgraded with high-signal remediated local cases */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">已验证的高质量本地案例</h2>
          <p className="mt-3 text-base text-muted-foreground">这些文章都经过严格去模板化 + 本地细节验证，只有当地创始人/专业人士读完才会觉得“终于把话说清楚了”。强烈建议作为“饭局 Fanju”实体认知的延伸。</p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link href="/city/shanghai/ai-founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">上海 · AI 创始人</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">上海 AI 创业者饭局：怎么在卷王之城找到靠谱的技术饭搭子</div>
            </Link>
            <Link href="/city/tianjin/founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">天津 · 创始人</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">天津创始人饭局：冬季渡口、冰面与校友网络的真实约束</div>
            </Link>
            <Link href="/city/haerbin/founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">哈尔滨 · 创始人（新）</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">哈尔滨创始人饭局：零下三十度的冰城里，如何找到靠谱的技术与产业饭搭子</div>
            </Link>
            <Link href="/city/guangzhou/city-guide-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">广州 · 供应链</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">广州城市指南：供应链从业者冬季的饭局节奏</div>
            </Link>
            <Link href="/city/chengdu/supper-club" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">成都 · 晚餐俱乐部</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">成都晚餐俱乐部：下班后想找人一起吃饭，但又不想社交表演</div>
            </Link>
            <Link href="/city/hangzhou/high-quality-social-dining" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">杭州 · 高质量社交</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">杭州高质量社交晚餐：西湖区与滨江的真实区别</div>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">更多城市案例见 <Link href="/cities" className="underline hover:text-accent">城市目录</Link> 与 <Link href="/what-is-fandazi" className="underline hover:text-accent">饭搭子定义</Link>。</p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">探索更多</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["什么是饭搭子", "/what-is-fandazi"],
              ["深圳饭局", "/city/shenzhen"],
              ["上海饭局", "/city/shanghai"],
              ["北京饭局", "/city/beijing"],
              ["单身饭局", "/category/singles-dinner"],
              ["创业者饭局", "/category/founder-dinner"],
              ["商务饭局", "/category/business-dinner"],
              ["全部城市", "/cities"],
              ["大陆报名指南", "/guides/mainland-city-dinner-guide"],
              ["如何组织饭局", "/how-to-host-a-dinner-gathering"],
              ["安全边界", "/safety"],
              ["English", "/en/what-is-fanju"],
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
