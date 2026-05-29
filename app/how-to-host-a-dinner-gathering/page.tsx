import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "如何举办饭局？饭局主办方完整指南 | 饭局 Fanju",
  description: "想成为饭局主办方？本文给出最实操的举办饭局方法：选择具体主题、审核参与者、选公开餐厅、把控边界。饭局 Fanju 提供平台支持，你负责 curation 和真实连接。",
  alternates: { canonical: "/how-to-host-a-dinner-gathering" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "如何举办饭局？饭局主办方完整指南 | 饭局 Fanju",
    description: "从主题选择到审核嘉宾、选餐厅、把控安全边界，一步步教你举办高质量小桌饭局。",
    url: `${SITE_URL}/how-to-host-a-dinner-gathering`,
    type: "article",
    locale: "zh_CN",
    siteName: "饭局 Fanju",
  },
}

const faqs = [
  ["谁可以成为饭局 Fanju 的主办方？", "任何符合要求的人都可以申请。只要你所在的城市已开放、有清晰的饭局主题、愿意认真审核参与者并维护安全边界即可。"],
  ["好的饭局主题应该是什么样的？", "主题要足够具体，能吸引同频的人，但不要太窄。例子：“35岁以下深圳互联网产品经理”“上海爱跑步的职场女性”“长三角供应链从业者复盘会”。太模糊的“有趣的人”容易变成大杂烩。"],
  ["一桌饭局最合适的规模是多少？", "6-8人最理想。少于6人像小型聚会，超过10人就很难每个人都深入交流。8人是最甜蜜点——多样性够，又能真正对话。"],
  ["主办方应该怎么审核参与者？", "看职业、兴趣、这次来饭局的具体期望。优先选择真正匹配主题、愿意分享而不是只想听的人。拒绝不匹配的，这是你最重要的责任。"],
  ["怎么选择餐厅？", "必须是公开餐厅，环境适合长时间聊天（噪音不要太大）。根据主题选：创始人局选现代一点的，生活方式局选有氛围的。提前踩点，确认可以长时间用餐。"],
  ["如果有人临时爽约怎么办？", "提前24-48小时确认出席。有1-2人等待名单最好。实在缺人就按实际人数办，质量比凑数重要。"],
  ["主办方最需要承担什么责任？", "选择好主题、认真审核、选公开餐厅、提前沟通、把控安全边界（不提前收费、不私下交易）、当天做好开场和氛围引导。平台提供框架，你负责真实连接。"],
]

export default function HowToHostDinnerGatheringPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "如何举办高质量饭局",
    description: "饭局 Fanju 主办方从主题到落地的完整实操指南。",
    url: `${SITE_URL}/how-to-host-a-dinner-gathering`,
    inLanguage: "zh-CN",
    step: [
      { "@type": "HowToStep", position: 1, name: "定义具体主题", text: "主题越具体，越能吸引真正同频的人。" },
      { "@type": "HowToStep", position: 2, name: "申请成为主办方", text: "在 fanju.app/hosts 提交申请，说明城市和主题。" },
      { "@type": "HowToStep", position: 3, name: "审核参与者", text: "认真看每份报名资料，只确认匹配的人。" },
      { "@type": "HowToStep", position: 4, name: "选择公开餐厅", text: "环境适合聊天，必须是公开场所。" },
      { "@type": "HowToStep", position: 5, name: "当天把控氛围", text: "做好开场，鼓励真实分享，维护边界。" },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">主办方指南 · 如何举办饭局</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            如何举办高质量饭局？<br />饭局主办方完整指南
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              举办一场好的饭局，核心是<strong>把“为什么这桌人坐在一起”这件事提前想清楚并说清楚</strong>。饭局 Fanju 提供平台框架（报名系统、审核工具、安全机制），你负责主题定义、嘉宾筛选、餐厅选择和当天氛围把控。
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/hosts" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">申请成为主办方</Link>
            <Link href="/how-to-find-dinner-buddies" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">找饭搭子指南</Link>
            <Link href="/safety" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">安全边界</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">5 步举办高质量饭局</h2>
          <div className="mt-8 space-y-8">
            {[
              ["1. 定义具体主题（最重要一步）", "主题越具体，越能筛出真正同频的人。坏例子：“上海有趣的人”。好例子：“35岁以下、在上海做消费互联网且有跨境经验的产品经理”。具体主题 = 高匹配度 + 好对话。"],
              ["2. 申请成为饭局 Fanju 主办方", "去 fanju.app/hosts 提交申请。写清楚你的主题、所在城市、为什么想主办、你自己的背景。平台会审核，确保你理解边界和责任。"],
              ["3. 认真审核每一位报名者", "这是你最重要的工作。看职业、兴趣、这次来饭局的具体期望。只确认真正匹配主题、愿意分享的人。拒绝不匹配的，这是对整桌人的负责。"],
              ["4. 选择公开、适合聊天的餐厅", "必须是公开餐厅。环境要能长时间聊天（噪音不要太大）。根据主题选：创始人局可以现代一点，生活方式局选有氛围的。提前踩点，确认可以慢慢吃。"],
              ["5. 当天做好开场和氛围引导", "提前到场，欢迎每一个人。简单介绍主题和规则（允许提前走、不推销等）。你的角色不是表演者，而是“让大家自然说话”的 facilitator。问好问题，让每个人都有机会被听见。"],
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">主办方必须坚守的安全边界</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["公开餐厅是底线", "所有饭局必须在公开餐厅举行。不能在家、不能私人会所、不能没名气的场地。"],
              ["绝不提前收费", "不要让参与者提前给你转钱。所有费用在餐厅现场结账或通过平台透明处理。"],
              ["真实资料审核", "拒绝明显假资料或信息严重不全的人。这是保护整桌人的第一道防线。"],
              ["不承诺任何结果", "永远不要说“这次能帮你谈成生意”“一定能找到饭搭子”。只提供见面机会，不卖结果。"],
            ].map(([title, body]) => (
              <article key={title} className="border border-border/60 bg-card/35 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NEW: 主办方审核参与者的 7 条黄金标准 - 高可引用单元 */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase mb-2">主办方核心能力</div>
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">主办方审核参与者的 7 条黄金标准</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            作为主办方，你最重要的工作不是“拉人”，而是“把不合适的人挡在门外”。以下标准请严格执行。
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "职业/身份与主题匹配度是否 ≥ 70%？",
              "报名理由是否具体（而不是“想认识人”“随便看看”）？",
              "是否有真实可验证的过往经历或兴趣？",
              "是否表达了明确的“想输出/分享”而非只想“来听”？",
              "历史参与记录中是否出现过多次爽约或负面反馈？",
              "是否愿意在报名时提供真实头像 + 简短自我介绍？",
              "第一次见面时是否尊重边界（不提前加私聊、不推销）？",
            ].map((q, i) => (
              <div key={i} className="border border-border/60 bg-card/35 p-4 text-sm">
                <span className="font-mono text-[10px] text-accent">0{i + 1}</span> {q}
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">通过 5 条以上才建议确认。宁缺毋滥，一桌高质量远胜两桌凑数。</p>
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">真实本地主办案例参考</h2>
          <p className="mt-3 text-base text-muted-foreground">以下是已通过严格本地化改写的真实场景。只有当地人才懂的约束和节奏，才是判断一桌饭值不值得花时间的核心。图片均为真实自然拍摄。</p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link href="/city/shanghai/ai-founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">上海 · AI 创始人</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">上海 AI 创业者饭局：怎么在卷王之城找到靠谱的技术饭搭子</div>
              <p className="mt-2 text-sm text-muted-foreground">张江、徐汇滨江的真实节奏；4-6 人极致克制；为什么“上来就聊估值”在上海 AI 圈是硬伤。</p>
            </Link>
            <Link href="/city/tianjin/founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">天津 · 创始人</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">天津创始人饭局：冬季渡口、冰面与校友网络的真实约束</div>
              <p className="mt-2 text-sm text-muted-foreground">小白楼 vs 解放碑的圈子差异；冬季 18:30 必须结束的硬性限制；南开、天大、北洋校友脉络。</p>
            </Link>
            <Link href="/city/jinan/founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">济南 · 创始人（新）</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">济南创始人饭局：泉城新旧动能转换里，如何找到靠谱的同频饭搭子</div>
              <p className="mt-2 text-sm text-muted-foreground">老商埠 vs 高新的真实落差；政策截留、供应链结合、35 岁危机的本地表现；泉水宴小馆子的烟火气。</p>
            </Link>
            <Link href="/city/shenzhen/tech-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">深圳 · 科技移民</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">深圳科技饭搭子：新来这座城的年轻人，怎么通过小桌找到靠谱同频人</div>
              <p className="mt-2 text-sm text-muted-foreground">南山/福田/华强北三类人的平行世界；996 后 22:30 才下班的真实节奏；“时间太宝贵”成为最硬的筛选标准。</p>
            </Link>
            <Link href="/city/beijing/city-guide-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">北京 · 城市指南</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">北京城市指南：漂在北京的人，怎么通过一顿饭真正摸清这座城</div>
              <p className="mt-2 text-sm text-muted-foreground">回龙观 vs 朝阳的平行世界；冬天、沙尘、极端通勤对心理的真实影响；允许说“其实想走了”的安全感。</p>
            </Link>
            <Link href="/city/guangzhou/city-guide-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">广州 · 城市记忆</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">广州城市指南：西关、荔湾、越秀人怎么通过一顿饭记住这座城</div>
              <p className="mt-2 text-sm text-muted-foreground">熟客文化 + 早茶文化的天然排外；正在消失的骑楼、河涌、老火汤记忆；“我来听、来记录、来理解”的正确心态。</p>
            </Link>
            <Link href="/city/xiangtan/business-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">湘潭 · 商务主办</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">湘潭商务饭局：本地人怎么通过小桌判断这顿饭值不值得</div>
              <p className="mt-2 text-sm text-muted-foreground">雨湖到九华经开区的真实通勤成本；岳塘 vs 建设北路的街区差异；主理人必须把时间窗口和费用处理提前锁死。</p>
            </Link>
            <Link href="/city/jinhua/founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">金华 · 创始人主办</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">金华创始人饭局：江北老街的边界感，怎么筛选出真正同频的人</div>
              <p className="mt-2 text-sm text-muted-foreground">第一条信息就开始筛人；街区视角（江北老街、本帮菜、义乌同行）决定同桌质量；主理人先暴露真实卡点才能建立信任。</p>
            </Link>
            <Link href="/city/guilin/comedy-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">桂林 · 喜剧/生活方式</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">桂林喜剧饭局：允许不笑的空间，怎么让大家愿意说“今天真累”</div>
              <p className="mt-2 text-sm text-muted-foreground">七星区巷子深处的小馆；慢文化 vs 运营压力；主理人先暴露真实缺口才能建立信任。</p>
            </Link>
            <Link href="/city/xiangyang/twelve-person-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">襄阳 · 规模控制</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">襄阳十二人饭局 vs 小桌：信任稀释、氛围跑偏的真实风险</div>
              <p className="mt-2 text-sm text-muted-foreground">人情味浓的城市里，大型饭局极易变成寒暄大会；4-8人小桌才是本地人真正愿意深入的模式。</p>
            </Link>
            <Link href="/city/hezhou/business-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">贺州 · 商务主办</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">贺州商务饭局：糖业矿业边贸链条里的真实卡点与判断标准</div>
              <p className="mt-2 text-sm text-muted-foreground">政务消息窗口、配额落地、AA边界；只有本地商务人才懂的节奏，外地思维主理人极易踩雷。</p>
            </Link>
            <Link href="/city/guilin/offline-social-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">桂林 · 日常本地主办</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">桂林本地人日常找饭局：避开游客区、季风约束、熟人社会信任建立</div>
              <p className="mt-2 text-sm text-muted-foreground">七星区穿山路、象山区老米粉店、秀峰政务云周边；雨季积水与结束时间必须锁死；米粉摊 vs 网红店的本地真实选择。</p>
            </Link>
            <Link href="/city/xiangyang/salsa-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">襄阳 · 兴趣/舞蹈主办</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">襄阳萨尔萨舞饭局：古城墙边的小桌，怎么让舞后的人也愿意把即兴故事说出来</div>
              <p className="mt-2 text-sm text-muted-foreground">汉江边步行复盘 + 即兴情绪延续；不接受临时带固定舞伴；允许一个人来的边界感；只有襄阳舞者才懂的“水土不服”音乐节奏讨论。</p>
            </Link>
            <Link href="/city/xiangyang/ai-founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">襄阳 · AI创始人主办</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">襄阳AI创业者饭局：樊城沿江路的小桌，怎么让第一次来的人也愿意把真实卡点说出来</div>
              <p className="mt-2 text-sm text-muted-foreground">边缘计算在本地政务/农业的真实落地卡点；方言识别、模型误判率、算力贵场景小；主理人先暴露“阴天场景误判率飙升”才能建立信任。</p>
            </Link>
            <Link href="/city/fuzhou-jiangxi/hedge-fund-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">抚州 · 专业人士主办</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">抚州对冲基金饭局：专业人士怎么在节奏舒缓的城市里找到能说真话的人</div>
              <p className="mt-2 text-sm text-muted-foreground">习惯用逻辑和模型做决策的人，最怕被当“潜在LP”看待；具体风险话题（本地企业融资隐藏风险）+ 严格筛选机制才是真正的保护。</p>
            </Link>
            <Link href="/city/haerbin/founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">哈尔滨 · 创始人主办</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">哈尔滨创始人饭局：零下三十度的冰城里，如何找到靠谱的技术与产业饭搭子</div>
              <p className="mt-2 text-sm text-muted-foreground">哈飞系供应链在 -25°C 下的实际交付延迟；哈工大系技术与本地制造结合的真实难点；冬天 7 点半必须结束的物理约束；劝酒文化残留的真实风险。</p>
            </Link>
            <Link href="/city/jinan/founder-dinner" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">济南 · 创始人主办</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">济南创始人饭局：泉城新旧动能转换里，如何找到靠谱的同频饭搭子</div>
              <p className="mt-2 text-sm text-muted-foreground">老商埠 vs 高新的真实落差；政策截留、供应链结合、35 岁危机的本地表现；泉水宴小馆子的烟火气；最晚 10 点结束的本地节奏。</p>
            </Link>
            <Link href="/city/chengdu/supper-club" className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70">
              <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">成都 · 晚餐俱乐部主办</div>
              <div className="mt-2 text-lg font-serif text-foreground group-hover:text-accent">成都晚餐俱乐部：下班后想找人一起吃饭，但又不想社交表演</div>
              <p className="mt-2 text-sm text-muted-foreground">二环三环堵车后的真实疲惫；“被安排”的表演性社交最反感；允许不说话、允许提前走的边界；小馆子烟火气 vs 网红店的本地选择。</p>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">这些文章都经过严格去模板化 + 本地细节验证。主办方最该学的从来不是“怎么拉人”，而是“怎么把边界和本地约束一次性说清楚”。</p>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
