import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Singapore Social Dining | 新加坡饭局社交 — Fanju",
  description: "Fanju brings social dining to Singapore — find dinner gatherings, dinner buddies, and offline social events for Chinese communities in Singapore. 新加坡饭局、新加坡聚餐、新加坡华人社交饭局。",
  alternates: { canonical: "/singapore-social-dining" },
  openGraph: {
    title: "Singapore Social Dining | 新加坡饭局 — Fanju",
    description: "Find dinner gatherings and dinner buddies in Singapore with Fanju — social dining for Chinese communities.",
    url: `${SITE_URL}/singapore-social-dining`,
    type: "website",
    locale: "en_SG",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Singapore Social Dining | Fanju", description: "Social dining and dinner gatherings in Singapore." },
}

const faqs = [
  ["What is social dining in Singapore?", "Social dining in Singapore means joining themed, hosted dinner gatherings to meet like-minded people in the city. Fanju organizes small-table dinners for Chinese communities in Singapore — covering singles dinners, business dinners, founder dinners, and newcomer dinners."],
  ["新加坡饭局 Fanju 适合哪些人？", "适合在新加坡的华人、来新工作的大陆人、留学生、创业者、金融从业者和希望在新加坡拓展华人人脉的人。新加坡是东南亚华人社区最集中的城市之一。"],
  ["What dinner types are available in Singapore?", "Fanju Singapore covers singles dinners, business networking dinners, founder dinners, newcomer dinners, and Chinese community dinners. Singapore's international business environment makes it ideal for cross-border networking dinners."],
  ["How do I join a dinner gathering in Singapore?", "Visit fanju.app/city/singapore to see available dinner types. Register with your real profile and wait for host confirmation."],
  ["What language are Singapore Fanju dinners conducted in?", "Singapore Fanju dinners are primarily conducted in Mandarin Chinese, with some dinners in English depending on the host and theme. Singapore's bilingual Chinese community makes both languages natural."],
  ["How is Fanju different from Singapore networking events?", "Singapore has many networking events, but most are large, formal, and card-exchange focused. Fanju dinners are small (6–10 people), themed, and held over a shared meal — creating deeper connections than a typical networking event."],
  ["新加坡饭局和中国大陆饭局有什么区别？", "新加坡饭局的参与者更国际化，可能来自中国大陆、新加坡本地、马来西亚、印尼等地的华人社区。语言上以普通话为主，也有英语场次。饭局 Fanju 在新加坡的饭局会根据主题调整语言和风格。"],
]

export default function SingaporeSocialDiningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Singapore Social Dining — 新加坡饭局 — Fanju",
        url: `${SITE_URL}/singapore-social-dining`,
        inLanguage: "en",
        description: "Fanju social dining in Singapore — themed dinner gatherings for Chinese communities.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Singapore Social Dining", item: `${SITE_URL}/singapore-social-dining` },
          ],
        },
      },
      {
        "@type": "Organization",
        name: "Fanju",
        url: SITE_URL,
        areaServed: { "@type": "City", name: "Singapore" },
        description: "Social dining platform for Chinese communities in Singapore.",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Singapore · 新加坡饭局社交</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Singapore Social Dining — 新加坡饭局
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju brings social dining to Singapore — organizing small, themed dinner gatherings for Chinese communities in the city. Singapore is one of Fanju's most active overseas markets, with a large Chinese-speaking community that spans locals, mainland Chinese expats, Malaysian Chinese, and international visitors.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/city/singapore" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">新加坡饭局</Link>
            <Link href="/bangkok-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Bangkok Social Dining</Link>
            <Link href="/kuala-lumpur-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">KL Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Social Dining in Singapore</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Singapore is the most important overseas Chinese city in Southeast Asia. With a Chinese population of over 70%, a world-class food scene, and a position as the region's financial and startup hub, Singapore is a natural home for Fanju social dining.</p>
            <p>The Chinese community in Singapore is diverse — Singapore Chinese, mainland Chinese expats, Malaysian Chinese, and overseas Chinese from across the diaspora. Fanju dinners in Singapore bring these communities together around shared interests and goals, creating connections that cross backgrounds and borders.</p>
            <p>Singapore's startup ecosystem, finance industry, and international business environment make it ideal for Fanju's founder dinners and business networking dinners. The large community of mainland Chinese working in Singapore also creates strong demand for Chinese community dinners that provide a familiar social context in an international city.</p>
            <p>All Fanju dinners in Singapore are held in real restaurants, with host review and transparent pricing. The goal is always the same: a small table of interesting people, a good meal, and genuine connections.</p>
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
              ["新加坡饭局", "/city/singapore"],
              ["曼谷饭局社交", "/bangkok-social-dining"],
              ["吉隆坡饭局社交", "/kuala-lumpur-social-dining"],
              ["香港饭局社交", "/hong-kong-social-dining"],
              ["东京饭局社交", "/tokyo-social-dining"],
              ["中国饭局社交", "/china-social-dining"],
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["Startup Founder Dinners", "/startup-founder-dinners"],
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
