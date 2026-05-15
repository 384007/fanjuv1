import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Tokyo Social Dining | 东京饭局社交 — Fanju",
  description: "Fanju brings social dining to Tokyo — find dinner gatherings and dinner buddies for Chinese communities in Tokyo. 东京饭局、东京华人聚餐、东京社交饭局，用饭局 Fanju 认识东京同频的人。",
  alternates: { canonical: "/tokyo-social-dining" },
  openGraph: {
    title: "Tokyo Social Dining | 东京饭局 — Fanju",
    description: "Find dinner gatherings and dinner buddies in Tokyo with Fanju — social dining for Chinese communities.",
    url: `${SITE_URL}/tokyo-social-dining`,
    type: "website",
    locale: "ja_JP",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Tokyo Social Dining | Fanju", description: "Social dining and dinner gatherings in Tokyo." },
}

const faqs = [
  ["What is social dining in Tokyo?", "Social dining in Tokyo means joining themed, hosted dinner gatherings to meet like-minded people in the city. Fanju organizes small-table dinners for Chinese communities in Tokyo — one of the largest Chinese expat communities in Japan."],
  ["东京饭局 Fanju 适合哪些人？", "适合在东京的华人、来日工作的大陆人、留学生、创业者和希望在东京拓展华人人脉的人。东京有大量中国大陆的留学生、工程师和创业者。"],
  ["What dinner types are available in Tokyo?", "Fanju Tokyo covers singles dinners, business networking dinners, founder dinners, newcomer dinners, student dinners, and Chinese community dinners."],
  ["How do I join a dinner gathering in Tokyo?", "Visit fanju.app/city/tokyo to see available dinner types. Register with your real profile and wait for host confirmation."],
  ["What language are Tokyo Fanju dinners conducted in?", "Tokyo Fanju dinners are primarily conducted in Mandarin Chinese, catering to the mainland Chinese community in Tokyo."],
  ["Why is Tokyo a good city for Chinese social dining?", "Tokyo has one of the largest Chinese communities in Japan, with a significant population of mainland Chinese students, engineers, and entrepreneurs. The city's world-class food scene makes it ideal for social dining."],
  ["东京饭局和国内饭局有什么区别？", "东京饭局的参与者多为在日华人，包括留学生、工程师、创业者和长期居住者。语言以普通话为主，偶尔也有日语场次。饭局 Fanju 在东京的饭局会根据参与者背景调整主题和风格。"],
]

export default function TokyoSocialDiningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Tokyo Social Dining — 东京饭局 — Fanju",
        url: `${SITE_URL}/tokyo-social-dining`,
        inLanguage: "en",
        description: "Fanju social dining in Tokyo — themed dinner gatherings for Chinese communities.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Tokyo Social Dining", item: `${SITE_URL}/tokyo-social-dining` },
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
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Tokyo · 东京饭局社交</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Tokyo Social Dining — 东京饭局
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju brings social dining to Tokyo — organizing small, themed dinner gatherings for Chinese communities in the city. Tokyo has one of the largest Chinese communities in Japan, with a significant population of mainland Chinese students, engineers, entrepreneurs, and long-term residents who benefit from Fanju's Mandarin-language social dining network.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/city/tokyo" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">东京饭局</Link>
            <Link href="/singapore-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Singapore Social Dining</Link>
            <Link href="/seoul-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Seoul Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Social Dining in Tokyo</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Tokyo is home to one of the world's most sophisticated food cultures and one of Japan's largest Chinese communities. The combination of world-class restaurants, a large Chinese expat population, and a city culture that values quality experiences makes Tokyo an ideal environment for Fanju social dining.</p>
            <p>The Chinese community in Tokyo is diverse — mainland Chinese students at Japanese universities, engineers and product managers at Japanese tech companies, entrepreneurs who have built businesses in Japan, and long-term residents who have made Tokyo their home. Fanju dinners in Tokyo bring these communities together around shared interests and goals.</p>
            <p>Tokyo's food scene is legendary. A Fanju dinner in Tokyo combines the city's exceptional restaurant culture with the intentional social structure that makes Fanju dinners more than just a meal. Whether it is a founder dinner in Shibuya, a singles dinner in Shinjuku, or a newcomer dinner for people who just arrived in Tokyo, Fanju creates the context for genuine connections.</p>
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Related Cities & Pages</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["东京饭局", "/city/tokyo"],
              ["首尔饭局社交", "/seoul-social-dining"],
              ["新加坡饭局社交", "/singapore-social-dining"],
              ["香港饭局社交", "/hong-kong-social-dining"],
              ["中国饭局社交", "/china-social-dining"],
              ["曼谷饭局社交", "/bangkok-social-dining"],
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["All Cities", "/cities"],
              ["Safety", "/safety"],
              ["FAQ", "/faq"],
              ["What is Fanju", "/what-is-fanju"],
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
