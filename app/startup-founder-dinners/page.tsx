import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "创业者饭局：创始人如何通过小桌建立真实互助网络 | 饭局 Fanju",
  description: "创业者饭局不是 pitch 场、不是资源交换会，而是创始人、投资人、运营者围绕一顿饭建立真实信任和长期互助的结构化方式。饭局 Fanju 通过主题筛选和边界设定，让创始人饭局真正有效。",
  alternates: { canonical: "/startup-founder-dinners" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "创业者饭局：创始人真实互助网络 | 饭局 Fanju",
    description: "为什么创始人需要结构化小桌饭局？如何判断一桌创始人饭局值得去？完整指南。",
    url: `${SITE_URL}/startup-founder-dinners`,
    type: "article",
    locale: "zh_CN",
    siteName: "饭局 Fanju",
  },
}

const faqs = [
  ["创业者饭局和普通商务饭局有什么区别？", "创业者饭局更聚焦早期阶段的互助、复盘、资源信息共享和心理支持。参与者多为创始人、早期投资人、关键运营者，话题更偏实际落地和长期主义。"],
  ["创始人饭局适合用来 pitch 或找钱吗？", "强烈不推荐。把饭局当成融资场合的人往往会破坏氛围，也很难建立真正信任。真正的投资对话通常在第二次、第三次自然跟进中产生。"],
  ["一桌好的创始人饭局该是什么规模？", "5-8人最理想。太少像一对一复盘，太多容易变成小型沙龙。关键是每人都能充分发言。"],
  ["如何判断一桌创始人饭局值得去？", "看三点：1. 主题是否具体（而非泛泛“创业交流”）；2. 参与者阶段是否有一定重叠；3. 主理人是否提前把边界说清楚（不硬 pitch、不索要资源）。"],
  ["新创始人参加会不会被看低？", "不会。好的创始人饭局最欢迎早期阶段的人分享真实困境。成熟创始人反而更愿意帮助早期人，因为这也是建立长期连接的方式。"],
  ["投资者可以参加创始人饭局吗？", "可以，但最好以“学习和连接”而非“找项目”的心态参加。好的创始人饭局里，投资人往往是提供视角和经验的角色。"],
]

export default function StartupFounderDinnersPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "创业者饭局 — 创始人真实互助网络 | 饭局 Fanju",
        url: `${SITE_URL}/startup-founder-dinners`,
        inLanguage: "zh-CN",
        description: "创业者饭局是创始人建立真实信任和互助的结构化方式。",
      },
      {
        "@type": "DefinedTerm",
        name: "创业者饭局",
        description: "5-8位创始人、投资人、关键运营者围绕有主题的小桌晚餐，建立真实信任、互助和可持续弱关系的社交形式。强调不以直接交易为目的的长期连接。",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">创业者饭局 · 创始人互助网络</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            创业者饭局：<br />创始人如何通过一顿饭建立真实互助
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              <strong>创业者饭局</strong>不是 pitch 场、不是资源交换会、不是大型沙龙。它是5-8位创始人、早期投资人、关键运营者围绕一顿有主题的晚餐，建立<strong>真实信任和长期互助</strong>的结构化方式。
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              在中国创业生态里，创始人最缺的往往不是信息，而是能把真实困境、失败教训、团队真实状态说出来的同频人。饭局 Fanju 把这个需求用小桌 + 主题 + 边界保护起来。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/category/founder-dinner" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">浏览创始人饭局</Link>
            <Link href="/business-dinner-networking" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">商务饭局</Link>
            <Link href="/what-is-fanju" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局 Fanju 是什么</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">为什么创始人需要结构化小桌饭局</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["信息过载 vs 真实洞察", "公开场合听到的都是包装后的版本。只有在信任度够高的小桌里，创始人才会讲真实失败、团队真实冲突和决策的灰色地带。"],
              ["心理支持比资源更稀缺", "很多创始人最缺的不是钱，而是有人能听懂自己的焦虑、孤独和长期主义压力。"],
              ["跨阶段连接的价值", "早期创始人能从成熟创始人那里获得避坑经验；成熟创始人也能从早期人那里获得新鲜视角和团队活力。"],
              ["弱连接的长期价值", "第一次饭局不一定立刻产生合作，但很多真正重要的资源和信息，往往在第二次、第三次自然跟进中出现。"],
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">一桌好的创始人饭局该是什么样子</h2>
          <div className="mt-8 text-sm leading-relaxed text-muted-foreground md:text-base space-y-4">
            <ul className="ml-4 list-disc space-y-2">
              <li><strong>主题具体</strong>：例如“从 0 到 1 的团队配置真实成本”“融资窗口期如何判断和准备”“长三角 vs 北上广深对早期创业的真实影响”。</li>
              <li><strong>人数 5-8 人</strong>：保证每个人都有充分发言空间。</li>
              <li><strong>阶段有重叠但不完全相同</strong>：最好有早期、中期、相对成熟的创始人混在一起。</li>
              <li><strong>边界明确</strong>：主理人提前说明不硬 pitch、不索要资源、不传播焦虑等。</li>
              <li><strong>允许真实情绪</strong>：允许讲失败、讲焦虑、讲想放弃的时刻，而不是只讲成功方法论。</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">如何判断一桌创始人饭局值得去</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              ["主题是否真正具体", "泛泛的“大家来聊创业”大概率是低效局。越具体越好。"],
              ["参与者阶段匹配度", "完全不同阶段的人硬凑在一起容易鸡同鸭讲。"],
              ["主理人是否把边界说清楚", "靠谱的主理人会在报名阶段就写明规则。这是对大家时间的尊重。"],
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">第一次参加创始人饭局的正确心态</h2>
          <div className="mt-6 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>第一次去的核心任务是<strong>判断这群人是否值得继续交往</strong>，而不是立刻拿到资源或投资。</p>
            <p className="mt-4">把第一次当作“试吃”。真正有价值的创始人关系，通常在第二次、第三次自然复盘或互助中慢慢建立。</p>
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">创始人真实本地案例</h2>
          <p className="mt-3 text-base text-muted-foreground">这些经过本地化深度改写的文章，展示了上海、天津、哈尔滨、广州等地创始人真实的圈子约束和判断标准。</p>
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Link href="/city/shanghai/ai-founder-dinner" className="border border-border/60 bg-card/35 p-4 hover:border-accent/70">上海 AI 创始人：卷王之城的技术饭搭子</Link>
            <Link href="/city/tianjin/founder-dinner" className="border border-border/60 bg-card/35 p-4 hover:border-accent/70">天津创始人：冬季渡口、冰面与校友网络约束</Link>
            <Link href="/city/haerbin/founder-dinner" className="border border-border/60 bg-card/35 p-4 hover:border-accent/70">哈尔滨创始人：零下三十度冰城的产业饭搭子</Link>
            <Link href="/city/guangzhou/city-guide-dinner" className="border border-border/60 bg-card/35 p-4 hover:border-accent/70">广州供应链创始人：冬季 review 季的避坑节奏</Link>
            <Link href="/city/jinhua/founder-dinner" className="border border-border/60 bg-card/35 p-4 hover:border-accent/70">金华创始人：江北老街边界感筛选同频人</Link>
            <Link href="/city/xiangtan/business-dinner" className="border border-border/60 bg-card/35 p-4 hover:border-accent/70">湘潭商务创始人：街区视角判断一桌饭值不值得</Link>
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
              ["商务饭局", "/business-dinner-networking"],
              ["全部创始人饭局", "/category/founder-dinner"],
              ["如何组织创始人饭局", "/how-to-host-a-dinner-gathering"],
              ["安全边界", "/safety"],
              ["全部城市", "/cities"],
              ["找饭搭子指南", "/how-to-find-dinner-buddies"],
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
