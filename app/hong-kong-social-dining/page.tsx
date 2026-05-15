import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Hong Kong Social Dining | 香港饭局社交 — Fanju",
  description: "Fanju brings social dining to Hong Kong — find dinner gatherings, dinner buddies, and offline social events in HK. 香港饭局、香港聚餐、香港社交饭局，用饭局 Fanju 认识香港同频的人。",
  alternates: { canonical: "/hong-kong-social-dining" },
  openGraph: {
    title: "Hong Kong Social Dining | 香港饭局 — Fanju",
    description: "Find dinner gatherings and dinner buddies in Hong Kong with Fanju — the social dining app for Chinese communities.",
    url: `${SITE_URL}/hong-kong-social-dining`,
    type: "website",
    locale: "zh_HK",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Hong Kong Social Dining | Fanju", description: "Social dining and dinner gatherings in Hong Kong." },
}

const faqs = [
  ["What is social dining in Hong Kong?", "Social dining in Hong Kong means joining themed, hosted dinner gatherings to meet like-minded people in the city. Fanju organizes small-table dinners in Hong Kong for Chinese communities — covering singles dinners, business dinners, founder dinners, and newcomer dinners."],
  ["香港饭局 Fanju 适合哪些人？", "适合在香港的华人年轻人、内地来港工作者、留学生、创业者和希望拓展香港本地人脉的人。香港饭局 Fanju 提供中文语境的社交饭局体验。"],
  ["How do I join a dinner gathering in Hong Kong?", "Visit fanju.app/city/hong-kong to see available dinner types in Hong Kong. Register with your real profile and wait for host confirmation."],
  ["What dinner types are available in Hong Kong?", "Fanju Hong Kong covers singles dinners, business networking dinners, founder dinners, newcomer dinners, and Chinese community dinners. Hong Kong's international character makes it ideal for cross-border networking dinners too."],
  ["Is Fanju available in Cantonese?", "Fanju operates primarily in Mandarin Chinese and English. Hong Kong dinners may be hosted in Cantonese, Mandarin, or English depending on the host and theme."],
  ["How is Fanju different from Hong Kong networking events?", "Most Hong Kong networking events are large, formal, and card-exchange focused. Fanju dinners are small (6–10 people), themed, and held over a shared meal — creating deeper connections than a typical networking event."],
  ["香港饭局和内地饭局有什么区别？", "香港饭局更多元化，参与者可能来自内地、香港本地、海外华人社区。语言上可能混合粤语、普通话和英语。饭局 Fanju 在香港的饭局会根据主题和主办方调整语言和风格。"],
]

export default function HongKongSocialDiningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Hong Kong Social Dining — 香港饭局 — Fanju",
        url: `${SITE_URL}/hong-kong-social-dining`,
        inLanguage: "zh-HK",
        description: "Fanju social dining in Hong Kong — themed dinner gatherings for Chinese communities.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Hong Kong Social Dining", item: `${SITE_URL}/hong-kong-social-dining` },
          ],
        },
      },
      {
        "@type": "Organization",
        name: "Fanju",
        url: SITE_URL,
        areaServed: { "@type": "City", name: "Hong Kong" },
        description: "Social dining platform for Chinese communities in Hong Kong.",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Hong Kong · 香港饭局社交</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Hong Kong Social Dining — 香港饭局
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju brings social dining to Hong Kong — organizing small, themed dinner gatherings for Chinese communities in HK. Whether you are a local, a mainlander working in Hong Kong, an overseas Chinese, or a newcomer to the city, Fanju dinners connect you with like-minded people over a real meal in a real restaurant.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/city/hong-kong" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">香港饭局</Link>
            <Link href="/china-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">China Social Dining</Link>
            <Link href="/singapore-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Singapore Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Social Dining in Hong Kong</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Hong Kong is one of the world's most dynamic cities for Chinese communities. It sits at the intersection of mainland China, global finance, and international culture — making it a unique environment for social dining. A dinner in Hong Kong might bring together a Shenzhen entrepreneur, a Hong Kong finance professional, a Singapore-based investor, and a London-educated designer. That diversity is what makes Hong Kong social dining so valuable.</p>
            <p>Fanju organizes dinner gatherings in Hong Kong that reflect this diversity. Dinners are themed to attract compatible guests — founder dinners for the startup community, business dinners for finance and professional services, newcomer dinners for people who just moved to HK, and singles dinners for young professionals looking to meet people outside their work circle.</p>
            <p>All Fanju dinners in Hong Kong are held in real restaurants, with host review and transparent pricing. The goal is always the same: a small table of interesting people, a good meal, and genuine connections.</p>
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
              ["香港饭局", "/city/hong-kong"],
              ["台湾饭局社交", "/taiwan-social-dining"],
              ["澳门饭局社交", "/macau-social-dining"],
              ["新加坡饭局社交", "/singapore-social-dining"],
              ["中国饭局社交", "/china-social-dining"],
              ["深圳饭局", "/city/shenzhen"],
              ["上海饭局", "/city/shanghai"],
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["All Cities", "/cities"],
              ["Safety", "/safety"],
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
