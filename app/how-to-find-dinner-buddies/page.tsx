import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "如何找饭搭子？找同城吃饭伙伴的实用指南 | 饭局 Fanju",
  description: "想找靠谱的饭搭子、同城吃饭的朋友？本文给出最实操的找饭搭子方法：通过小桌主题饭局、真实资料审核、边界感筛选，在深圳、上海、北京、成都等城市找到能长期一起吃饭的人。",
  alternates: { canonical: "/how-to-find-dinner-buddies" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "如何找饭搭子？完整实用指南 | 饭局 Fanju",
    description: "找饭搭子最有效的方式：参加结构化小桌饭局。真实案例、判断标准、跟进方法，一步步教你找到能长期一起吃饭的同频伙伴。",
    url: `${SITE_URL}/how-to-find-dinner-buddies`,
    type: "article",
    locale: "zh_CN",
    siteName: "饭局 Fanju",
  },
}

const faqs = [
  ["找饭搭子最有效的方法是什么？", "最有效的方法是参加有主题、有边界的小桌饭局。每个人都带着“想找吃饭伙伴”的明确目的来，匹配效率远高于随机群聊或大型活动。"],
  ["第一次参加饭局就能找到饭搭子吗？", "很多人第一次就能遇到 1-2 个感觉对的人。真正稳定的饭搭子关系，通常需要参加 2-4 次同一类主题的饭局后自然形成。"],
  ["如何判断对方适合做长期饭搭子？", "看三点：1. 聊天是否自然轻松（不用表演）；2. 是否尊重边界（你说不舒服他立刻调整）；3. 第二次约饭是否自然（而不是勉强）。"],
  ["新城市怎么快速找到饭搭子？", "优先参加“新人欢迎局”“周末社交局”“同城生活分享局”。这些主题的人大多和新来的人一样在找连接，成功率更高。"],
  ["一个人参加会不会尴尬？", "不会。真正好的小桌饭局主理人会做开场串联。第一次去的核心任务不是“交朋友”，而是“感受氛围和人”。"],
  ["饭搭子关系需要多频繁见面？", "没有固定标准。有人一周一次，有人半个月一次。重点是双方都觉得舒服、可持续，而不是勉强维持。"],
]

export default function HowToFindDinnerBuddiesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "如何找饭搭子",
    description: "通过结构化小桌饭局找到靠谱的同城吃饭伙伴的完整方法。",
    url: `${SITE_URL}/how-to-find-dinner-buddies`,
    inLanguage: "zh-CN",
    step: [
      { "@type": "HowToStep", position: 1, name: "明确自己想要什么类型的饭搭子", text: "是轻松聊天、行业交流、还是生活方式分享？先想清楚再选主题。" },
      { "@type": "HowToStep", position: 2, name: "选择对的城市和主题", text: "在 fanju.app/cities 选城市，再挑匹配自己当前状态的饭局类型。" },
      { "@type": "HowToStep", position: 3, name: "用真实资料报名", text: "真实职业、兴趣、期望，能让主办方帮你匹配到更合适的人。" },
      { "@type": "HowToStep", position: 4, name: "第一次去重点感受", text: "不要急着加微信，重点判断氛围、边界感和自己是否舒服。" },
      { "@type": "HowToStep", position: 5, name: "自然跟进", text: "第二次约饭是检验是否能成为饭搭子的关键，自然比勉强更重要。" },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">找饭搭子 · 实用指南</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            如何找饭搭子？<br className="hidden md:block" />靠谱的同城吃饭伙伴
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              找饭搭子最有效的方式，是参加<strong>有主题、有边界的小桌饭局</strong>。每个人都带着“想找人一起吃饭”的明确目的来，匹配效率和真实度远高于微信群、陌生人拼桌或大型活动。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">找你所在城市的饭局</Link>
            <Link href="/what-is-fandazi" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">什么是饭搭子</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">找饭搭子的 5 个关键步骤</h2>
          <div className="mt-8 space-y-8">
            {[
              ["1. 先想清楚你现在最缺什么", "是单纯不想一个人吃饭？想认识同行业的人？还是希望有固定周末饭局？目标越清晰，选的主题就越准。"],
              ["2. 选对主题和城市", "创始人局、媒体人局、城市生活分享局、单身低压局……不同主题的人群完全不同。优先选你当前状态最匹配的。"],
              ["3. 用真实资料报名", "真实职业、兴趣、期望，能让主办方帮你过滤掉明显不合适的人。这是目前最有效的匹配机制。"],
              ["4. 第一次去，重点是判断", "不要急着加微信。重点观察：聊天是否自然、是否尊重边界、自己是否真正舒服。舒服比热闹重要。"],
              ["5. 自然跟进第二次", "第二次约饭是检验是否能成为饭搭子的关键。自然提出比勉强更可持续。"],
            ].map(([title, body], i) => (
              <div key={i} className="border-l-2 border-accent/40 pl-6">
                <h3 className="font-serif text-2xl text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase mb-2">可执行判断工具</div>
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">长期饭搭子判断 6 问 Checklist</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            第一次见面后，用这 6 个问题快速判断对方是否值得发展成长期饭搭子。至少通过 4 条再考虑继续。
          </p>

          <div className="mt-8 space-y-4">
            {[
              "聊天时是否自然轻松，不需要刻意表演或迎合？",
              "当你表达任何不舒服（早走、只聊工作、不想加微信），对方是否立刻尊重而不是施压？",
              "第二次约饭的提议是否自然发生，而不是你勉强提出？",
              "对方是否在第一次就主动分享了一些真实困境或失败（而非只展示成功）？",
              "你们是否有至少 1-2 个共同的、可持续的兴趣或生活方式话题？",
              "你离开时是否觉得“下次还想见这个人”，而不是“终于结束了”？",
            ].map((q, i) => (
              <div key={i} className="border border-border/60 bg-card/35 p-5 flex gap-4">
                <span className="font-mono text-xs tracking-[0.2em] text-accent mt-1 shrink-0">0{i + 1}</span>
                <p className="text-sm leading-relaxed text-foreground">{q}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-sm text-muted-foreground">
            通过率高的人，通常 2-4 次同一主题饭局后就能形成稳定的饭搭子关系。通过率低的，基本可以礼貌结束。
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">新城市找饭搭子的特别建议</h2>
          <div className="mt-6 text-sm leading-relaxed text-muted-foreground md:text-base space-y-4">
            <p>新到一座城市时，优先参加以下三类局：</p>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong>新人欢迎 / 城市适应局</strong>：大家都是新来的或刚到不久，共同语言最多。</li>
              <li><strong>周末 / 生活方式局</strong>：不聊工作，只聊怎么在本地过得舒服。</li>
              <li><strong>同类兴趣局</strong>（跑步、读书、咖啡、创业等）：共同话题天然存在。</li>
            </ul>
            <p>第一次去的主要任务不是交朋友，而是<strong>确认这种形式适合自己</strong>。舒服了，再继续。</p>
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">高质量本地案例参考</h2>
          <p className="mt-3 text-base text-muted-foreground">以下是已通过严格本地化改写的真实场景，包含只有当地人才懂的约束和判断标准。这些案例能帮你更快判断什么样的小桌值得参加。</p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link href="/city/shanghai/ai-founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">上海 · AI 创始人</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">上海 AI 创业者饭局：怎么在卷王之城找到靠谱的技术饭搭子</div>
              <p className="mt-2 text-sm text-muted-foreground">张江、临港、徐汇滨江的真实节奏；为什么信息多反而信任密度低；创始人最怕的四类局。</p>
            </Link>
            <Link href="/city/tianjin/founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">天津 · 创始人</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">天津创始人饭局：冬季渡口、冰面与校友网络的真实约束</div>
              <p className="mt-2 text-sm text-muted-foreground">小白楼 vs 解放碑的圈子差异；南开、天大、北洋的校友脉络；冬季 18:30 必须结束的硬性限制。</p>
            </Link>
            <Link href="/city/guangzhou/city-guide-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">广州 · 供应链/职场</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">广州城市指南：供应链从业者冬季的饭局节奏</div>
              <p className="mt-2 text-sm text-muted-foreground">珠江新城 vs 荔湾、越秀的实际通勤；年底 review 季的避坑优先级；只有本地人才懂的“先吃饱再聊”文化。</p>
            </Link>
            <Link href="/city/chengdu/supper-club" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">成都 · 晚餐俱乐部</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">成都晚餐俱乐部：下班后想找人一起吃饭，但又不想社交表演</div>
              <p className="mt-2 text-sm text-muted-foreground">玉林、建设路、镋钯街的安静小馆；成都人最敏感的“被安排”痛点；5-7 人 + 明确允许提前走的边界。</p>
            </Link>
            <Link href="/city/hangzhou/high-quality-social-dining" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">杭州 · 高质量社交</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">杭州高质量社交晚餐：西湖区与滨江的真实区别</div>
              <p className="mt-2 text-sm text-muted-foreground">阿里系 vs 传统互联网 vs 新消费的圈层；为什么滨江的局节奏和西湖完全不同；本地人判断“值不值得”的三条硬标准。</p>
            </Link>
            <Link href="/city/beijing/city-guide-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">北京 · 城市指南</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">北京城市指南：不同圈层饭局的真实边界与节奏</div>
              <p className="mt-2 text-sm text-muted-foreground">中关村、海淀、朝阳的实际通勤与结束时间；为什么“二环内创业者”与“五环外职场人”的局完全不同。</p>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">这些文章都经过严格去模板化 + 本地细节验证，只有当地人读完才会觉得“终于把话说清楚了”。</p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">继续探索</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["什么是饭搭子", "/what-is-fandazi"],
              ["饭局 Fanju 是什么", "/what-is-fanju"],
              ["全部城市", "/cities"],
              ["单身饭局", "/category/singles-dinner"],
              ["创业者饭局", "/category/founder-dinner"],
              ["周末饭局", "/category/weekend-dinner"],
              ["如何组织饭局", "/how-to-host-a-dinner-gathering"],
              ["安全边界", "/safety"],
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
