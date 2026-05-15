import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Seoul Social Dining | 首尔饭局社交 — Fanju",
  description: "Fanju brings social dining to Seoul — find dinner gatherings and dinner buddies for Chinese communities in Seoul. 首尔饭局、首尔华人聚餐、首尔社交饭局，用饭局 Fanju 认识首尔同频的人。",
  alternates: { canonical: "/seoul-social-dining" },
  openGraph: {
    title: "Seoul Social Dining | 首尔饭局 — Fanju",
    description: "Find dinner gatherings and dinner buddies in Seoul with Fanju — social dining for Chinese communities.",
    url: `${SITE_URL}/seoul-social-dining`,
    type: "website",
    locale: "ko_KR",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Seoul Social Dining | Fanju", description: "Social dining and dinner gatherings in Seoul." },
}

const faqs = [
  ["What is social dining in Seoul?", "Social dining in Seoul means joining themed, hosted dinner gatherings to meet like-minded people in the city. Fanju organizes small-table dinners for Chinese communities in Seoul — a city with a significant and growing Chinese student and expat population."],
  ["首尔饭局 Fanju 适合哪些人？", "适合在首尔的华人、来韩留学的大陆人、在韩工作的华人和希望在首尔拓展华人人脉的人。首尔有大量中国大陆的留学生，是东北亚重要的华人聚集城市。"],
  ["What dinner types are available in Seoul?", "Fanju Seoul covers student dinners, newcomer dinners, singles dinners, business networking dinners, and Chinese community dinners."],
  ["How do I join a dinner gathering in Seoul?", "Visit fanju.app/cities to find Seoul dinner options. Register with your real profile and wait for host confirmation."],
  ["What language are Seoul Fanju dinners conducted in?", "Seoul Fanju dinners are primarily conducted in Mandarin Chinese, catering to the mainland Chinese community in Seoul."],
  ["Why is Seoul a good city for Chinese social dining?", "Seoul has a large Chinese student population and a growing number of Chinese professionals working in Korean companies. The city's vibrant food scene and cultural proximity to China make it a natural fit for Fanju social dining."],
  ["首尔饭局和东京饭局有什么区别？", "首尔的华人社区以留学生为主，东京的华人社区则更多元，包括工程师、创业者和长期居住者。首尔饭局 Fanju 会根据当地社区特点调整饭局主题，更多关注留学生社交和新城市适应。"],
]

export default function SeoulSocialDiningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Seoul Social Dining — 首尔饭局 — Fanju",
        url: `${SITE_URL}/seoul-social-dining`,
        inLanguage: "en",
        description: "Fanju social dining in Seoul — themed dinner gatherings for Chinese communities.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Seoul Social Dining", item: `${SITE_URL}/seoul-social-dining` },
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
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Seoul · 首尔饭局社交</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Seoul Social Dining — 首尔饭局
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju brings social dining to Seoul — organizing small, themed dinner gatherings for Chinese communities in the city. Seoul has a significant Chinese student and expat population, and Fanju's Mandarin-language social dining network provides a familiar, culturally comfortable way to meet people in a foreign city.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Browse All Cities</Link>
            <Link href="/tokyo-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Tokyo Social Dining</Link>
            <Link href="/singapore-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Singapore Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Social Dining in Seoul</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Seoul is one of East Asia's most dynamic cities, and it has a significant Chinese community — primarily students at Korean universities, professionals working at Korean companies, and entrepreneurs building businesses in the Korea-China corridor.</p>
            <p>For Chinese people in Seoul, finding a social circle can be challenging. Korean social culture is different from Chinese culture, and language barriers can make it hard to build genuine connections outside of work or school. Fanju social dining in Seoul provides a Mandarin-language, culturally familiar environment where Chinese people in Seoul can meet each other over a shared meal.</p>
            <p>Seoul's food scene is exceptional — Korean cuisine, Chinese restaurants, and international dining options all provide excellent settings for Fanju social dining. The city's energy and cultural vibrancy make it an exciting place to build a social network.</p>
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
              ["东京饭局社交", "/tokyo-social-dining"],
              ["新加坡饭局社交", "/singapore-social-dining"],
              ["香港饭局社交", "/hong-kong-social-dining"],
              ["曼谷饭局社交", "/bangkok-social-dining"],
              ["中国饭局社交", "/china-social-dining"],
              ["吉隆坡饭局社交", "/kuala-lumpur-social-dining"],
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
