import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Bangkok Social Dining | 曼谷饭局社交 — Fanju",
  description: "Fanju brings social dining to Bangkok — find dinner gatherings and dinner buddies for Chinese communities in Bangkok. 曼谷饭局、曼谷华人聚餐、曼谷社交饭局，用饭局 Fanju。",
  alternates: { canonical: "/bangkok-social-dining" },
  openGraph: {
    title: "Bangkok Social Dining | 曼谷饭局 — Fanju",
    description: "Find dinner gatherings and dinner buddies in Bangkok with Fanju — social dining for Chinese communities.",
    url: `${SITE_URL}/bangkok-social-dining`,
    type: "website",
    locale: "en_TH",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Bangkok Social Dining | Fanju", description: "Social dining and dinner gatherings in Bangkok." },
}

const faqs = [
  ["What is social dining in Bangkok?", "Social dining in Bangkok means joining themed, hosted dinner gatherings to meet like-minded people in the city. Fanju organizes small-table dinners for Chinese communities in Bangkok — a city with a large and growing Chinese expat population."],
  ["曼谷饭局 Fanju 适合哪些人？", "适合在曼谷的华人、来泰工作的大陆人、留学生、数字游民、创业者和希望在曼谷拓展华人人脉的人。曼谷近年来吸引了大量中国大陆的数字游民和创业者。"],
  ["What dinner types are available in Bangkok?", "Fanju Bangkok covers newcomer dinners, digital nomad dinners, business networking dinners, singles dinners, and Chinese community dinners."],
  ["How do I join a dinner gathering in Bangkok?", "Visit fanju.app/cities to find Bangkok dinner options. Register with your real profile and wait for host confirmation."],
  ["Why is Bangkok a good city for Chinese social dining?", "Bangkok has become a major destination for Chinese digital nomads, entrepreneurs, and expats. The city's low cost of living, vibrant food scene, and growing Chinese community make it ideal for Fanju social dining."],
  ["What language are Bangkok Fanju dinners conducted in?", "Bangkok Fanju dinners are primarily conducted in Mandarin Chinese, catering to the mainland Chinese community in the city."],
  ["How is Fanju different from Bangkok expat networking events?", "Most Bangkok expat events are English-language and Western-focused. Fanju Bangkok is specifically designed for Chinese communities — Mandarin-language, culturally familiar, and focused on genuine connection over a shared meal."],
]

export default function BangkokSocialDiningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Bangkok Social Dining — 曼谷饭局 — Fanju",
        url: `${SITE_URL}/bangkok-social-dining`,
        inLanguage: "en",
        description: "Fanju social dining in Bangkok — themed dinner gatherings for Chinese communities.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Bangkok Social Dining", item: `${SITE_URL}/bangkok-social-dining` },
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
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Bangkok · 曼谷饭局社交</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Bangkok Social Dining — 曼谷饭局
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju brings social dining to Bangkok — organizing small, themed dinner gatherings for Chinese communities in the city. Bangkok has become one of Southeast Asia's most popular destinations for Chinese digital nomads, entrepreneurs, and expats, making it a natural fit for Fanju's social dining model.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Browse All Cities</Link>
            <Link href="/singapore-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Singapore Social Dining</Link>
            <Link href="/kuala-lumpur-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">KL Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Social Dining in Bangkok</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Bangkok has emerged as one of the most popular destinations for Chinese digital nomads and entrepreneurs in Southeast Asia. The city's low cost of living, excellent food scene, and growing Chinese community have created a vibrant social environment that is perfect for Fanju's social dining model.</p>
            <p>The Chinese community in Bangkok is diverse — long-established Thai-Chinese families, mainland Chinese expats, digital nomads, and entrepreneurs who have relocated from Shenzhen, Shanghai, and Beijing. Fanju dinners in Bangkok bring these communities together around shared interests and goals.</p>
            <p>Bangkok's food culture is world-renowned, making it an ideal setting for social dining. A Fanju dinner in Bangkok combines the city's exceptional restaurant scene with the intentional social structure that makes Fanju dinners more than just a meal.</p>
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
              ["新加坡饭局社交", "/singapore-social-dining"],
              ["吉隆坡饭局社交", "/kuala-lumpur-social-dining"],
              ["东南亚饭局社交", "/southeast-asia-social-dining"],
              ["新加坡饭局社交", "/singapore-social-dining"],
              ["香港饭局社交", "/hong-kong-social-dining"],
              ["中国饭局社交", "/china-social-dining"],
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["All Cities", "/cities"],
              ["Dinner Buddy App", "/dinner-buddy-app"],
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
