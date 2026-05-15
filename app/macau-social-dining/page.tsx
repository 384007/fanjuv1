import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Macau Social Dining | 澳门饭局社交 — Fanju",
  description: "Fanju brings social dining to Macau — find dinner gatherings and dinner buddies in Macau. 澳门饭局、澳门聚餐、澳门社交饭局，用饭局 Fanju 认识澳门同频的人。",
  alternates: { canonical: "/macau-social-dining" },
  openGraph: {
    title: "Macau Social Dining | 澳门饭局 — Fanju",
    description: "Find dinner gatherings and dinner buddies in Macau with Fanju.",
    url: `${SITE_URL}/macau-social-dining`,
    type: "website",
    locale: "zh_MO",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Macau Social Dining | Fanju", description: "Social dining and dinner gatherings in Macau." },
}

const faqs = [
  ["What is social dining in Macau?", "Social dining in Macau means joining themed, hosted dinner gatherings to meet like-minded people in the city. Fanju organizes small-table dinners for Chinese communities in Macau."],
  ["澳门饭局 Fanju 适合哪些人？", "适合在澳门的华人、来澳工作者、留学生、创业者和希望在澳门拓展人脉的人。澳门的华人社区规模较小但联系紧密，饭局社交效果很好。"],
  ["What dinner types are available in Macau?", "Fanju Macau covers business networking dinners, newcomer dinners, singles dinners, and Chinese community dinners."],
  ["How do I join a dinner gathering in Macau?", "Visit fanju.app/cities to find Macau dinner options. Register with your real profile and wait for host confirmation."],
  ["澳门饭局和香港饭局有什么联系？", "澳门和香港地理相近，很多参与者会同时关注两地的饭局。饭局 Fanju 在大湾区（深圳、广州、香港、澳门）的饭局形成一个互联的社交网络。"],
  ["Is Fanju available in Macau?", "Yes. Fanju covers Macau as part of its Greater Bay Area social dining network, alongside Shenzhen, Guangzhou, and Hong Kong."],
  ["What makes Macau unique for social dining?", "Macau's blend of Chinese and Portuguese culture, its gaming and hospitality industry, and its position as a gateway between mainland China and the world make it a unique social dining environment."],
]

export default function MacauSocialDiningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Macau Social Dining — 澳门饭局 — Fanju",
        url: `${SITE_URL}/macau-social-dining`,
        inLanguage: "zh-MO",
        description: "Fanju social dining in Macau — themed dinner gatherings for Chinese communities.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Macau Social Dining", item: `${SITE_URL}/macau-social-dining` },
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
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Macau · 澳门饭局社交</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Macau Social Dining — 澳门饭局
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju brings social dining to Macau — organizing small, themed dinner gatherings for Chinese communities in the city. Macau's unique position in the Greater Bay Area makes it a natural hub for cross-border social dining connecting Macau, Hong Kong, Shenzhen, and Guangzhou.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Browse All Cities</Link>
            <Link href="/hong-kong-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Hong Kong Social Dining</Link>
            <Link href="/china-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">China Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Social Dining in Macau</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Macau is a small but internationally connected city with a unique blend of Chinese and Portuguese heritage. Its food scene is world-class, and its position as a Special Administrative Region of China makes it part of the Greater Bay Area social and economic ecosystem.</p>
            <p>Fanju social dining in Macau focuses on the city's Chinese community — including locals, mainland Chinese working in the gaming and hospitality industries, and international visitors with Chinese backgrounds. Dinners are small, themed, and held in real restaurants.</p>
            <p>Macau's proximity to Hong Kong and Shenzhen means that Fanju's Greater Bay Area network creates opportunities for cross-city connections. A business contact made at a Macau dinner might be based in Shenzhen; a dinner buddy from Hong Kong might visit Macau regularly.</p>
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
              ["香港饭局社交", "/hong-kong-social-dining"],
              ["台湾饭局社交", "/taiwan-social-dining"],
              ["新加坡饭局社交", "/singapore-social-dining"],
              ["中国饭局社交", "/china-social-dining"],
              ["深圳饭局", "/city/shenzhen"],
              ["广州饭局", "/city/guangzhou"],
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
