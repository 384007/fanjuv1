import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Dinner Buddy App | 找饭搭子 饭局 Fanju",
  description: "Find a dinner buddy with Fanju — the dinner buddy app for people who want to meet new friends over real meals. 找饭搭子、约饭、饭搭子 app，用饭局 Fanju 找到同城饭搭子。",
  alternates: { canonical: "/dinner-buddy-app" },
  openGraph: {
    title: "Dinner Buddy App | Find Your Dinner Buddy — Fanju",
    description: "Fanju helps you find dinner buddies in your city through themed, hosted dinner gatherings. No awkward one-on-ones — just good food and real people.",
    url: `${SITE_URL}/dinner-buddy-app`,
    type: "website",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "Dinner Buddy App | Fanju", description: "Find dinner buddies in your city with Fanju." },
}

const faqs = [
  ["What is a dinner buddy?", "A dinner buddy (饭搭子) is someone you share meals with regularly — not necessarily a romantic partner or close friend, but a person you enjoy eating with. Finding a good dinner buddy is harder than it sounds, especially in a new city."],
  ["How does Fanju help me find a dinner buddy?", "Fanju organizes themed dinner gatherings where you meet multiple people at once. If you connect with someone at a Fanju dinner, you have a natural foundation for becoming dinner buddies — you already know you enjoy the same kind of social dining experience."],
  ["Is Fanju a dating app for finding dinner buddies?", "No. Fanju is a social dining platform, not a dating app. Some dinners are singles-focused, but most are about meeting interesting people in general. A dinner buddy relationship can be platonic, professional, or romantic — Fanju does not define the outcome."],
  ["How is finding a dinner buddy on Fanju different from a WeChat group?", "WeChat groups for dining are unstructured and often low-quality. Fanju uses host review, real profiles, and themed dinners to ensure the people you meet are genuinely compatible with your interests and goals."],
  ["What cities can I find dinner buddies in?", "Fanju covers mainland China (Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, Chengdu) and global Chinese-community cities (Singapore, Tokyo, Hong Kong, Taipei, New York, London, Vancouver, and more)."],
  ["How do I register to find a dinner buddy on Fanju?", "Browse dinners by city at fanju.app/cities, choose a dinner type, and submit a registration with your real profile. The host reviews applications and confirms a small table. You meet your potential dinner buddies at the dinner."],
  ["Can I become a regular dinner buddy with someone I meet at Fanju?", "Absolutely. Many Fanju guests become regular dinner companions after meeting at a themed dinner. Fanju creates the first meeting — what happens after is up to you."],
]

export default function DinnerBuddyAppPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Dinner Buddy App — Fanju",
        url: `${SITE_URL}/dinner-buddy-app`,
        inLanguage: "en",
        description: "Find dinner buddies in your city through Fanju's themed, hosted dinner gatherings.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Dinner Buddy App", item: `${SITE_URL}/dinner-buddy-app` },
          ],
        },
      },
      {
        "@type": "SoftwareApplication",
        name: "Fanju",
        applicationCategory: "SocialNetworkingApplication",
        operatingSystem: "iOS, Android, Web",
        url: SITE_URL,
        description: "Dinner buddy app — find people to share meals with in your city.",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Dinner Buddy App · 找饭搭子</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Find Your Dinner Buddy — 找饭搭子
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju is a dinner buddy app that helps you find people to share meals with in your city. Instead of swiping through profiles or posting in random group chats, Fanju organizes themed dinner gatherings where you meet multiple compatible people at once — in a real restaurant, over a real meal. The best way to find a dinner buddy is to have dinner together first.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Find Dinners Near You</Link>
            <Link href="/faq" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">FAQ</Link>
            <Link href="/social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Why Finding a Dinner Buddy Is Hard</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>In Chinese culture, the concept of a 饭搭子 (dinner buddy) is well understood — someone you eat with regularly, who shares your taste in food and conversation, and who makes meals more enjoyable. But finding a good dinner buddy in a new city, or after your social circle has changed, is genuinely difficult.</p>
            <p>Dating apps are not designed for this. They optimize for romantic matching, not dining compatibility. WeChat groups are noisy and unstructured. Posting "anyone want to grab dinner?" on social media feels awkward and rarely works.</p>
            <p>Fanju solves this by creating structured dinner gatherings where finding a dinner buddy is the natural outcome. You meet people who already chose to be at the same kind of dinner as you. The shared experience of a good meal does the rest.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Types of Dinner Buddies You Can Find on Fanju</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["Casual Dining Companion", "Someone to grab dinner with on weeknights or weekends. No agenda, just good food and conversation. Weekend dinners and stranger dinners on Fanju are perfect for this."],
              ["Professional Dinner Buddy", "A colleague, peer, or industry contact you meet regularly for dinner to exchange ideas and build a professional relationship. Business dinners and founder dinners on Fanju attract this crowd."],
              ["Romantic Dinner Buddy", "Someone you meet at a singles dinner who becomes a regular dining companion. Fanju singles dinners are low-pressure and themed, making them a natural starting point."],
              ["Expat Dinner Buddy", "For Chinese communities overseas, finding a dinner buddy who shares your cultural background and language makes a huge difference. Chinese community dinners on Fanju are designed for this."],
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">FAQ</h2>
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Related Pages</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["FAQ", "/faq"],
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["Weekend Dinner", "/category/weekend-dinner"],
              ["Singles Dinner", "/category/singles-dinner"],
              ["Weekend Dinner", "/category/weekend-dinner"],
              ["Chinese Social Dining", "/china-social-dining"],
              ["All Cities", "/cities"],
              ["Press", "/press"],
              ["FAQ", "/faq"],
              ["What is Fanju", "/what-is-fanju"],
              ["中文", "/what-is-fanju"],
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
