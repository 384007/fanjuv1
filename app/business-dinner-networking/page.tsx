import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "商务饭局：专业人士如何通过小桌晚餐建立真实信任 | 饭局 Fanju",
  description: "商务饭局不是推销会、不是资源交换场，而是6-10位专业人士围绕一顿饭建立初步信任和长期弱关系的方式。饭局 Fanju 通过主题筛选、边界设定和安全机制，让商务饭局真正有效。本文给出完整定义与判断标准。",
  alternates: { canonical: "/business-dinner-networking" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "商务饭局：专业人士如何通过小桌晚餐建立真实信任 | 饭局 Fanju",
    description: "为什么商务饭局比大型会议更有效？如何判断一桌商务饭局值得去？完整实用指南。",
    url: `${SITE_URL}/business-dinner-networking`,
    type: "article",
    locale: "zh_CN",
    siteName: "饭局 Fanju",
  },
}

const faqs = [
  ["商务饭局和普通饭局有什么区别？", "商务饭局的核心是建立专业信任，而不是单纯社交。参与者通常带着行业背景或资源需求，但不会把饭桌变成推销会或融资路演。"],
  ["商务饭局适合用来推销或融资吗？", "不适合。把饭局当成推销场的人往往会破坏氛围，也很难建立长期信任。真正的商业机会通常在第二次、第三次自然跟进中产生。"],
  ["一桌好的商务饭局该是什么规模和节奏？", "6-8人最理想。人数太少像一对一，太多容易变成讲座。时间控制在2-2.5小时，允许自然结束，而不是被赶场。"],
  ["如何判断一桌商务饭局值得去？", "看三点：1. 主题是否具体（而不是泛泛的“商务交流”）；2. 参与者背景是否有一定同质性；3. 主理人是否提前把边界说清楚（不硬推、不索要资源）。"],
  ["商务饭局和创始人饭局有什么区别？", "创始人饭局更偏向创业者之间的互助、复盘和弱连接。商务饭局覆盖更广的职场专业人士，包括高管、咨询、传统行业转型等，话题更偏实际商业落地。"],
  ["第一次参加商务饭局要注意什么？", "不要带明显推销目的。把第一次当作“判断这个人/这群人是否值得继续交往”。自然、真实、尊重边界，比表现自己更重要。"],
]

export default function BusinessDinnerNetworkingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "商务饭局 — 专业人士真实信任建立方式 | 饭局 Fanju",
        url: `${SITE_URL}/business-dinner-networking`,
        inLanguage: "zh-CN",
        description: "商务饭局不是推销会，而是通过小桌晚餐建立初步信任的结构化方式。",
      },
      {
        "@type": "DefinedTerm",
        name: "商务饭局",
        description: "6-10位专业人士围绕有主题的小桌晚餐，建立真实信任和可持续弱关系的社交形式。强调边界感、平等对话、不以直接商业交易为目的。",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">商务饭局 · 专业信任建立</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            商务饭局：<br />专业人士如何通过一顿饭建立真实信任
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              <strong>商务饭局</strong>不是推销会、不是资源交换场、不是大型 networking。它是6-10位专业人士围绕一顿有主题的晚餐，建立<strong>初步信任和可持续弱关系</strong>的结构化方式。
            </p>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              在中国商业文化里，“饭局”从来不是单纯吃饭，而是关系建立的重要场景。饭局 Fanju 把这个传统用现代方式结构化：主题筛选、边界设定、小桌规模、安全机制，让商务饭局真正有效，而不是浪费时间。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/category/business-dinner" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">浏览商务饭局</Link>
            <Link href="/startup-founder-dinners" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">创始人饭局</Link>
            <Link href="/what-is-fanju" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局 Fanju 是什么</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">为什么商务饭局比大型会议更有效？</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["信任建立需要场景", "大型会议适合广播信息，饭局适合深度对话。两小时小桌晚餐产生的信任，远胜交换50张名片。"],
              ["中国商业文化的天然土壤", "饭局在中国从来不是单纯社交，而是建立信任、观察人品、交换信息的传统方式。饭局 Fanju 把这个传统用清晰边界保护起来。"],
              ["小桌 = 低噪音 + 高信号", "6-8人规模让每个人都有说话空间，也让伪装很难持续。真实性格和价值观更容易暴露。"],
              ["不以交易为目的，反而更容易产生交易", "把饭局当成推销场的人往往适得其反。真正有价值的合作，通常在第二次、第三次自然跟进中产生。"],
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">一桌好的商务饭局该是什么样子</h2>
          <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground md:text-base">
            <ul className="ml-4 list-disc space-y-2">
              <li><strong>主题具体</strong>：不是“商务交流”，而是“长三角供应链数字化落地难点”“传统企业数字化转型的真实成本”等。</li>
              <li><strong>人数克制</strong>：6-8人最佳。太多容易变成讲座，太少像一对一。</li>
              <li><strong>边界清晰</strong>：主理人提前说明“不聊具体估值”“不索要资源”“可以提前离开”“不录音不拍照”等。</li>
              <li><strong>参与者有一定同质性</strong>：背景差异太大容易鸡同鸭讲，差异太小又缺乏新信息。</li>
              <li><strong>节奏自然</strong>：允许沉默、允许话题自然漂移，而不是被主持人强行推进。</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">如何判断一桌商务饭局值得去</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              ["看主题是否具体", "泛泛的“大家来聊聊商务”大概率是低效局。具体到某个行业痛点或转型场景，才值得去。"],
              ["看参与者背景匹配度", "主理人是否提前透露大致背景？完全随机拼桌和有一定同质性的小桌，体验差很远。"],
              ["看边界是否提前说清楚", "靠谱的主理人会在报名阶段就把“可以提前走”“不推资源”等规则写明。这是对参与者时间的尊重。"],
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">第一次参加商务饭局的正确心态</h2>
          <div className="mt-6 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>第一次去的主要任务不是“谈成什么”，而是<strong>判断这个人/这群人是否值得第二次见面</strong>。</p>
            <p className="mt-4">不要带明显推销或索取资源的目的。把第一次当作“试吃”。真正有价值的商务关系，通常在第二次、第三次自然跟进中慢慢建立。</p>
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">真实商务饭局本地案例</h2>
          <p className="mt-3 text-base text-muted-foreground">商务饭局最难的从来不是“认识人”，而是“判断这桌是否值得花时间”。下面这些经过本地化深度改写的案例，展示了不同城市专业人士的真实顾虑和判断标准。</p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link href="/city/shanghai/ai-founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">上海 · AI/技术</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">上海 AI 创业者饭局：怎么在卷王之城找到靠谱的技术饭搭子</div>
              <p className="mt-2 text-sm text-muted-foreground">大模型 vs 应用 vs 硬件团队的真实赛道差异；为什么“上来就聊估值”在上海 AI 圈是硬伤。结构化筛选在这里尤其关键。</p>
            </Link>
            <Link href="/city/tianjin/founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">天津 · 创始人</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">天津创始人饭局：冬季渡口、冰面与校友网络的真实约束</div>
              <p className="mt-2 text-sm text-muted-foreground">小白楼 vs 解放碑的商务圈子完全不同；冬季 18:30 硬性结束 + 渡口/冰面限制。随机商务局在这里极易变成无效社交。</p>
            </Link>
            <Link href="/city/guangzhou/city-guide-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">广州 · 供应链</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">广州城市指南：供应链从业者冬季的饭局节奏</div>
              <p className="mt-2 text-sm text-muted-foreground">珠江新城 vs 荔湾、越秀的实际通勤；年底 review 季的避坑优先级。只有提前把“今晚不谈具体客户”写清楚的局才值得去。</p>
            </Link>
            <Link href="/city/hangzhou/high-quality-social-dining" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">杭州 · 高质量商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">杭州高质量社交晚餐：西湖区与滨江的真实区别</div>
              <p className="mt-2 text-sm text-muted-foreground">阿里系 vs 传统互联网 vs 新消费的商务边界；滨江的局为什么节奏和西湖完全不同。本地人判断“值不值得”的三条硬标准。</p>
            </Link>
            <Link href="/city/nanjing/founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">南京 · 创始人/商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">南京创始人饭局：六朝古都与江北新城，怎么找到能把真话聊透的饭搭子</div>
              <p className="mt-2 text-sm text-muted-foreground">玄武 vs 江北的资源与政策落差；本地传统商帮和互联网项目结合的真实摩擦；南京“面子文化”下的安全边界判断。</p>
            </Link>
            <Link href="/city/fuzhou/high-quality-social-dining" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">福州 · 高质量商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">福州高质量社交晚餐：三坊七巷与闽江边，如何找到能把真话聊透的饭搭子</div>
              <p className="mt-2 text-sm text-muted-foreground">传统商贸 vs 新金融的碰撞；“先看人再看热闹”的本地筛选逻辑；榕城专业人士对安全边界的极致在意。</p>
            </Link>
            <Link href="/city/xiangtan/business-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">湘潭 · 商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">湘潭商务饭局：本地人怎么通过小桌判断这顿饭值不值得</div>
              <p className="mt-2 text-sm text-muted-foreground">雨湖到九华经开区的真实通勤成本；岳塘安静茶楼 vs 建设北路喧闹；街区视角决定心理安全感的第一判断。</p>
            </Link>
            <Link href="/city/xiangyang/ai-founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">襄阳 · AI/技术商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">襄阳AI创始人饭局：樊城沿江路的小桌，怎么让第一次来的人坐得下来</div>
              <p className="mt-2 text-sm text-muted-foreground">边缘计算在本地政务/农业的真实落地卡点；方言识别、模型误判率、算力贵场景小——结构化筛选在这里尤其关键。</p>
            </Link>
            <Link href="/city/guilin/founder-operator-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">桂林 · 文旅/运营商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">桂林创始人&运营者饭局：漓江边的慢节奏里，怎么找到能把真话聊透的同桌</div>
              <p className="mt-2 text-sm text-muted-foreground">季节性游客波动、文创转型、方言沟通成本的真实压力；“慢下来”文化与运营卷的碰撞。</p>
            </Link>
            <Link href="/city/xiangyang/quality-friends-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">襄阳 · 高质量朋友商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">襄阳高质量朋友饭局：汉江边老巷子的小桌，怎么让第一次来的人也愿意把真话说出来</div>
              <p className="mt-2 text-sm text-muted-foreground">城市记忆分享、老照片、老街巷夜市变迁；允许沉默、允许慢下来的边界感。</p>
            </Link>
            <Link href="/city/guilin/comedy-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">桂林 · 喜剧/生活方式商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">桂林喜剧饭局：七星区巷子深处的螺蛳粉桌，怎么让大家愿意说‘今天真累’</div>
              <p className="mt-2 text-sm text-muted-foreground">允许不笑的空间、真实缺口分享；‘慢下来’的桂林文化与低压力社交的碰撞。</p>
            </Link>
            <Link href="/city/xiangyang/salsa-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">襄阳 · 兴趣/舞蹈商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">襄阳萨尔萨舞饭局：古城墙边的小桌，怎么让舞后的人也愿意把即兴故事说出来</div>
              <p className="mt-2 text-sm text-muted-foreground">即兴交流、非语言对话、舞伴故事；边界清晰的兴趣社交在商务语境下的延伸。</p>
            </Link>
            <Link href="/city/guilin/marathon-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">桂林 · 运动/生活方式商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">桂林马拉松饭局：两江四湖边的小桌，怎么让跑完的人也愿意把真实感受说出来</div>
              <p className="mt-2 text-sm text-muted-foreground">跑者安全感、成绩 vs 生活变化、第一次跑马情绪；低压力、边界清晰的运动社交。</p>
            </Link>
            <Link href="/city/xiangyang/twelve-person-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">襄阳 · 多人 vs 小桌商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">襄阳十二人饭局：多人 vs 小桌的真实边界与信任判断</div>
              <p className="mt-2 text-sm text-muted-foreground">信任稀释、氛围稀释、安全感下降；小桌（4-8人）才是真正有价值的本地实践。</p>
            </Link>
            <Link href="/city/guilin/founder-operator-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">桂林 · 创始人&运营者商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">桂林创始人&运营者饭局：漓江边的慢节奏里，怎么把创业压力和真实困境说出来</div>
              <p className="mt-2 text-sm text-muted-foreground">季节性波动、文创转型、方言沟通；“慢文化”与“卷”的碰撞下的真实支持。</p>
            </Link>
            <Link href="/city/hezhou/business-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">贺州 · 糖矿边贸商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">贺州商务饭局：糖业矿业边贸链条里的真实卡点与判断标准</div>
              <p className="mt-2 text-sm text-muted-foreground">政务消息窗口、配额落地、AA边界；只有本地商务人才懂的节奏，外地思维主理人极易踩雷。</p>
            </Link>
            <Link href="/city/guilin/offline-social-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">桂林 · 日常本地商务</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">桂林本地人日常找饭局：避开游客区、季风约束、熟人社会信任建立</div>
              <p className="mt-2 text-sm text-muted-foreground">七星区、象山区、秀峰政务云周边；雨季结束时间必须锁死；米粉摊 vs 网红店的本地选择。</p>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">所有案例均严格遵循去模板化 Checklist，只有当地专业人士读完才会觉得“把话说清楚了”。</p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">继续探索</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["什么是饭搭子", "/what-is-fandazi"],
              ["饭局 Fanju 是什么", "/what-is-fanju"],
              ["创业者饭局", "/startup-founder-dinners"],
              ["全部商务饭局", "/category/business-dinner"],
              ["如何组织商务饭局", "/how-to-host-a-dinner-gathering"],
              ["安全边界", "/safety"],
              ["全部城市", "/cities"],
              ["创始人饭局对比", "/startup-founder-dinners"],
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
