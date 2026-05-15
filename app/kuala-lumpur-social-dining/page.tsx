import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Kuala Lumpur Social Dining | 吉隆坡饭局社交 — Fanju",
  description: "Fanju brings social dining to Kuala Lumpur — find dinner gatherings and dinner buddies for Chinese communities in KL. 吉隆坡饭局、马来西亚华人聚餐、KL 社交饭局，用饭局 Fanju。",
  alternates: { canonical: "/kuala-lumpur-social-dining" },
  openGraph: {
    title: "Kuala Lumpur Social Dining | 吉隆坡饭局 — Fanju",
    description: "Find dinner gatherings and dinner buddies in Kuala Lumpur with Fanju — social dining for Chinese communities.",
    url: `${SITE_URL}/kuala-lumpur-social-dining`,
    type: "website",
    locale: "zh_MY",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Kuala Lumpur Social Dining | Fanju", description: "Social dining and dinner gatherings in Kuala Lumpur." },
}

const faqs = [
  ["What is social dining in Kuala Lumpur?", "Social dining in Kuala Lumpur means joining themed, hosted dinner gatherings to meet like-minded people in the city. Fanju organizes small-table dinners for Chinese communities in KL — Malaysia has one of the largest Chinese communities in Southeast Asia."],
  ["吉隆坡饭局 Fanju 适合哪些人？", "适合在吉隆坡的华人、马来西亚华人、来马工作的大陆人、留学生和希望在 KL 拓展华人人脉的人。马来西亚华人社区历史悠久，普通话和粤语都很普遍。"],
  ["What dinner types are available in Kuala Lumpur?", "Fanju KL covers business networking dinners, newcomer dinners, singles dinners, founder dinners, and Chinese community dinners."],
  ["How do I join a dinner gathering in Kuala Lumpur?", "Visit fanju.app/cities to find KL dinner options. Register with your real profile and wait for host confirmation."],
  ["What language are KL Fanju dinners conducted in?", "KL Fanju dinners are primarily conducted in Mandarin Chinese, with some dinners in Cantonese or English depending on the host and theme."],
  ["Why is Kuala Lumpur a good city for Chinese social dining?", "Malaysia has one of the largest Chinese communities in Southeast Asia, with a rich Chinese cultural heritage. KL's Chinese community spans multiple generations and backgrounds, creating a diverse and vibrant social dining environment."],
  ["How does Fanju KL connect to Singapore?", "KL and Singapore are closely connected — many Chinese professionals work across both cities. Fanju's presence in both cities means your social dining network can span the Malaysia-Singapore corridor."],
]

export default function KualaLumpurSocialDiningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Kuala Lumpur Social Dining — 吉隆坡饭局 — Fanju",
        url: `${SITE_URL}/kuala-lumpur-social-dining`,
        inLanguage: "en",
        description: "Fanju social dining in Kuala Lumpur — themed dinner gatherings for Chinese communities.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Kuala Lumpur Social Dining", item: `${SITE_URL}/kuala-lumpur-social-dining` },
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
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Kuala Lumpur · 吉隆坡饭局社交</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Kuala Lumpur Social Dining — 吉隆坡饭局
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju brings social dining to Kuala Lumpur — organizing small, themed dinner gatherings for Chinese communities in KL. Malaysia has one of the largest Chinese communities in Southeast Asia, and KL is the hub of that community. Fanju dinners in KL connect mainland Chinese expats, Malaysian Chinese, and overseas Chinese visitors through shared meals and genuine conversation.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Browse All Cities</Link>
            <Link href="/singapore-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Singapore Social Dining</Link>
            <Link href="/bangkok-social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Bangkok Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Social Dining in Kuala Lumpur</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Kuala Lumpur is home to one of Southeast Asia's most vibrant Chinese communities. Malaysian Chinese have maintained strong cultural ties to Chinese language, food, and traditions across generations, making KL a natural environment for Chinese social dining.</p>
            <p>The Chinese community in KL is diverse — Malaysian Chinese families with roots going back generations, mainland Chinese expats working in finance and tech, students at Malaysian universities, and entrepreneurs building businesses in the Malaysia-Singapore corridor. Fanju dinners in KL bring these communities together.</p>
            <p>KL's food scene is exceptional — Chinese restaurants, hawker centers, and fine dining establishments all provide excellent settings for Fanju social dining. The city's relatively low cost of living compared to Singapore also makes it an attractive base for Chinese entrepreneurs and digital nomads.</p>
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
              ["曼谷饭局社交", "/bangkok-social-dining"],
              ["香港饭局社交", "/hong-kong-social-dining"],
              ["东南亚饭局社交", "/southeast-asia-social-dining"],
              ["中国饭局社交", "/china-social-dining"],
              ["台湾饭局社交", "/taiwan-social-dining"],
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
