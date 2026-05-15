import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Safety | 安全须知 — 饭局 Fanju",
  description: "Safety guidelines for Fanju social dining events. How Fanju keeps dinner gatherings safe — public restaurants, host review, no advance payments, real profiles. 饭局 Fanju 安全须知、参加饭局安全指南。",
  alternates: {
    canonical: "/safety",
    languages: { "zh-CN": "/safety", en: "/safety" },
  },
  openGraph: {
    title: "Safety | 安全须知 — 饭局 Fanju",
    description: "Safety guidelines for Fanju social dining events — public restaurants, host review, and clear boundaries.",
    url: `${SITE_URL}/safety`,
    type: "website",
    locale: "zh_CN",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Safety | 饭局 Fanju", description: "Safety guidelines for Fanju social dining events." },
}

const safetyFaqs = [
  ["饭局 Fanju 如何保障参与者安全？ / How does Fanju ensure participant safety?", "饭局 Fanju 要求所有饭局在公开餐厅举行，主办方审核每位参与者，不允许提前向陌生人转账，不展示虚假报名人数，不承诺固定社交结果。All Fanju dinners are held in public restaurants. Hosts review every guest. No advance payments. No fake RSVP counts. No guaranteed outcomes."],
  ["参加饭局前需要确认哪些事项？ / What should I confirm before attending a dinner?", "确认餐厅地址和交通方式、开始和结束时间、费用包含项和退款规则、主办方联系方式。Confirm the restaurant address, start and end time, what the cost covers, cancellation policy, and host contact information."],
  ["如果在饭局中感到不舒服怎么办？ / What if I feel uncomfortable during a dinner?", "你有权利随时离开。不需要解释原因。如果遇到骚扰或不当行为，可以直接离开并联系饭局 Fanju 反馈。You have the right to leave at any time without explanation. If you experience harassment or inappropriate behavior, leave and report it to Fanju."],
  ["饭局 Fanju 是否允许私下转账？ / Does Fanju allow private payments?", "不允许。饭局 Fanju 明确禁止主办方要求参与者提前私下转账。所有费用应在餐厅现场支付。No. Fanju explicitly prohibits hosts from requesting advance private payments. All costs should be paid at the restaurant."],
  ["如何识别不安全的饭局？ / How to identify an unsafe dinner?", "以下情况请谨慎：要求提前转账、场地不是公开餐厅、主办方无法提供真实联系方式、承诺不切实际的社交结果、要求提供敏感个人信息。Be cautious if: advance payment is requested, venue is not a public restaurant, host cannot provide real contact info, unrealistic outcomes are promised, or sensitive personal information is requested."],
  ["饭局 Fanju 对主办方有哪些安全要求？ / What safety requirements does Fanju have for hosts?", "主办方必须：在公开餐厅举办饭局、不收取预付款、提前告知费用和取消规则、审核参与者真实资料、不承诺固定社交结果。Hosts must: use public restaurants, not collect advance payments, disclose costs and cancellation policies, review real guest profiles, and not promise guaranteed outcomes."],
  ["What should I do if I witness unsafe behavior at a Fanju dinner?", "Leave the situation if you feel unsafe. Report the incident to Fanju through the platform or by contacting us directly. Fanju takes safety reports seriously and will review host conduct accordingly."],
]

export default function SafetyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Safety — 安全须知 — 饭局 Fanju",
        url: `${SITE_URL}/safety`,
        inLanguage: "zh-CN",
        description: "饭局 Fanju 安全须知和参加饭局安全指南。",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "饭局 Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "安全须知", item: `${SITE_URL}/safety` },
          ],
        },
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Safety · 安全须知</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            安全须知 — Safety Guidelines
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案 / Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              饭局 Fanju 的安全模型基于四个原则：公开餐厅、主办方审核、透明费用、不承诺结果。所有饭局必须在公开餐厅举行，主办方审核每位参与者，费用提前告知，不允许预付款，不承诺脱单、融资或其他固定社交结果。Fanju's safety model is built on four principles: public restaurants, host review, transparent pricing, and no guaranteed outcomes.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">饭局 Fanju 安全原则 / Fanju Safety Principles</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["公开餐厅 / Public Restaurants", "所有饭局 Fanju 的饭局必须在公开餐厅举行。不允许私人住宅、私人会所或未公开场地。All Fanju dinners must be held in public restaurants. No private homes, private clubs, or unlisted venues."],
              ["主办方审核 / Host Review", "主办方审核每位参与者的真实资料，确保参与者与饭局主题匹配。Hosts review every guest registration to ensure participants match the dinner theme and contribute to a safe table dynamic."],
              ["透明费用 / Transparent Pricing", "费用在报名前告知，包含项目清晰，退款规则明确。不允许主办方要求预付款。Costs are disclosed before registration. No advance payments to hosts are permitted."],
              ["不承诺结果 / No Guaranteed Outcomes", "饭局 Fanju 不承诺脱单、融资、成交或任何固定社交结果。饭局是认识人的入口，不是结果保证。Fanju does not guarantee romantic, business, or social outcomes. Dinners are an entry point for connection, not a guarantee of results."],
              ["真实资料 / Real Profiles", "参与者需要提供真实的职业、兴趣和参加目的。虚假资料会影响主办方的审核判断，也会影响其他参与者的体验。Participants must provide genuine profiles. Fake profiles undermine host curation and harm other guests' experience."],
              ["边界提醒 / Boundary Reminders", "遇到不舒服的交流，你有权利随时结束话题或离开。饭局 Fanju 鼓励参与者设定和尊重个人边界。You have the right to end any conversation or leave at any time. Fanju encourages participants to set and respect personal boundaries."],
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">参加饭局前的安全检查清单 / Pre-Dinner Safety Checklist</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>参加任何饭局前，建议确认以下事项：</p>
            <ul className="ml-4 list-disc space-y-2">
              <li>确认餐厅地址是公开餐厅，可以在地图上找到。</li>
              <li>确认费用包含项和退款规则，不接受预付款要求。</li>
              <li>保留行程信息（餐厅地址、时间、主办方联系方式）给信任的朋友或家人。</li>
              <li>不透露敏感个人信息（身份证号、银行账户、家庭住址）。</li>
              <li>首次参加建议选择人多的公开场次，不单独与陌生人前往偏僻地点。</li>
              <li>如果感到不舒服，随时可以离开，不需要解释原因。</li>
            </ul>
            <p className="mt-4">Before attending any dinner, confirm: the venue is a real public restaurant, costs and cancellation policies are clear, you have shared your itinerary with someone you trust, and you are not sharing sensitive personal information.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">常见问题 / FAQ</h2>
          <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60">
            {safetyFaqs.map(([q, a]) => (
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">相关页面 / Related Pages</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["饭局 Fanju 是什么", "/what-is-fanju"],
              ["常见问题", "/faq"],
              ["主办方招募", "/hosts"],
              ["饭局规则", "/rules"],
              ["饭局社交", "/social-dining"],
              ["找饭搭子", "/dinner-buddy-app"],
              ["如何举办饭局", "/how-to-host-a-dinner-gathering"],
              ["全部城市", "/cities"],
              ["全部类型", "/categories"],
              ["Press", "/press"],
              ["What is Fanju", "/en/what-is-fanju"],
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
