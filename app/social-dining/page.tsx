import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Social Dining App | 饭局社交聚餐平台 Fanju",
  description: "Fanju is a social dining app that connects people through real-world dinner gatherings. Find dinner buddies, join local meals, and build genuine offline friendships over food. 饭局 Fanju 是最好的聚餐社交 app。",
  alternates: {
    canonical: "/social-dining",
    languages: { "zh-CN": "/social-dining", en: "/social-dining" },
  },
  openGraph: {
    title: "Social Dining App | 饭局社交聚餐平台 Fanju",
    description: "Fanju connects people through curated dinner gatherings — find dinner buddies, join local meals, and build real friendships offline.",
    url: `${SITE_URL}/social-dining`,
    type: "website",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: {
    card: "summary_large_image",
    title: "Social Dining App | Fanju",
    description: "Find dinner buddies and join local gatherings with Fanju — the social dining app for real offline connections.",
  },
}

const faqs = [
  ["What is social dining?", "Social dining is the practice of sharing meals with people you want to meet — strangers, acquaintances, or new friends — in a structured, themed setting. Fanju organizes social dining events across cities so anyone can join a dinner and meet like-minded people."],
  ["How is Fanju different from a regular restaurant booking?", "Fanju is not a restaurant booking tool. It's a social dining platform where the goal is to meet people, not just eat. Every dinner is themed, hosted, and curated so guests have something in common before they sit down."],
  ["What types of social dining does Fanju offer?", "Fanju covers singles dinners, business networking dinners, founder dinners, weekend social dinners, newcomer dinners, and Chinese community dinners across mainland China and global Chinese-community cities."],
  ["Is social dining safe?", "Fanju emphasizes public restaurant venues, transparent pricing, host review, and real profiles. We do not guarantee social outcomes but we do set clear safety boundaries for every event."],
  ["How do I find a social dining event near me?", "Browse the city directory at fanju.app/cities to find dinner gatherings in your city. Each city page lists available dinner types and how to register interest."],
  ["Can I host a social dining event on Fanju?", "Yes. Fanju recruits dinner hosts in every city. Visit fanju.app/hosts to learn about hosting requirements, responsibilities, and how to apply."],
  ["What cities does Fanju cover for social dining?", "Fanju prioritizes Shenzhen, Guangzhou, Shanghai, Beijing, Hangzhou, and Chengdu in mainland China, plus Singapore, Tokyo, Hong Kong, Taipei, New York, London, Vancouver, and more globally."],
]

export default function SocialDiningPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Social Dining App — Fanju",
        url: `${SITE_URL}/social-dining`,
        inLanguage: "en",
        description: "Fanju is a social dining app connecting people through real-world dinner gatherings.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Social Dining", item: `${SITE_URL}/social-dining` },
          ],
        },
      },
      {
        "@type": "Organization",
        name: "Fanju",
        alternateName: "饭局 Fanju",
        url: SITE_URL,
        description: "AI social dining and dinner gathering app for real-world meals and offline social events.",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Social Dining App</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            Social Dining — Meet People Over Real Meals
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju is a social dining app that connects people through curated, themed dinner gatherings in real restaurants. Whether you are looking for a dinner buddy, want to expand your local network, or simply want to meet interesting people over food, Fanju organizes the experience so you just show up and connect.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Find Dinners by City</Link>
            <Link href="/dinner-gathering-app" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Dinner Gathering App</Link>
            <Link href="/dinner-buddy-app" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Find Dinner Buddies</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">What Is Social Dining?</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Social dining is one of the oldest and most effective ways humans build relationships. Sharing a meal lowers social barriers, creates natural conversation, and builds trust faster than almost any other activity. Fanju is built on this insight: a well-organized dinner with the right people is more valuable than a hundred swipes on a dating app or a networking event where everyone is handing out business cards.</p>
            <p>The Fanju social dining model works like this: a host proposes a dinner with a clear theme — singles dinner, founder dinner, newcomer dinner, or weekend social dinner. Guests register with real profiles. The host reviews applications and confirms a small table of 6–10 people. Everyone meets at a real restaurant, shares a meal, and leaves with genuine connections.</p>
            <p>This is not speed dating. It is not a networking event. It is social dining — the most natural form of human connection, organized with intention.</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Why Fanju for Social Dining</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["Themed Dinners", "Every Fanju dinner has a clear theme and purpose. Singles dinners, business dinners, founder dinners, and newcomer dinners each attract a specific crowd so you know who you are meeting before you arrive."],
              ["Host Review", "Fanju hosts review every registration. This keeps dinner quality high and ensures guests are genuinely interested in the theme, not just looking for a free meal."],
              ["Small Tables", "Fanju dinners are intentionally small — typically 6 to 10 people. Small tables create real conversation. Large events create noise."],
              ["Real Restaurants", "All Fanju dinners happen in real, public restaurants. No private homes, no hidden venues. This is a core safety boundary that Fanju does not compromise on."],
              ["No Fake RSVPs", "Fanju does not inflate attendance numbers or create artificial urgency. Every seat shown as available is genuinely available."],
              ["Global Chinese Community", "Fanju is built for Chinese communities worldwide — mainland China, Hong Kong, Taiwan, Singapore, Tokyo, New York, London, and beyond. Social dining in a shared cultural context."],
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Social Dining Categories on Fanju</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Fanju organizes social dining into distinct categories so you can find the right dinner for your goals:</p>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong className="text-foreground">Singles Dinner (单身饭局)</strong> — Meet potential partners in a low-pressure, themed dinner setting. No awkward one-on-one dates. Just a good meal with interesting people.</li>
              <li><strong className="text-foreground">Business Dinner (商务饭局)</strong> — Build professional relationships over dinner. Better than a formal networking event because the conversation flows naturally.</li>
              <li><strong className="text-foreground">Founder Dinner (创业者饭局)</strong> — Dinners for startup founders, investors, and operators. Share experiences, exchange resources, and build trust before any formal meeting.</li>
              <li><strong className="text-foreground">Weekend Social Dinner (周末饭局)</strong> — Casual weekend dinners for anyone who wants to meet new people in their city without a specific agenda.</li>
              <li><strong className="text-foreground">Newcomer Dinner (新城市饭局)</strong> — For people who just moved to a new city and want to build a local social circle quickly.</li>
              <li><strong className="text-foreground">Chinese Community Dinner (华人饭局)</strong> — Social dining for Chinese communities overseas — in Singapore, Tokyo, New York, London, and beyond.</li>
            </ul>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Singles Dinner", "/category/singles-dinner"],
              ["Business Dinner", "/category/business-dinner"],
              ["Founder Dinner", "/category/founder-dinner"],
              ["Weekend Dinner", "/category/weekend-dinner"],
              ["Newcomer Dinner", "/category/newcomer-dinner"],
              ["Chinese Social Dining", "/category/chinese-social-dining"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">{label}</Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Social Dining Cities</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Fanju social dining is active across mainland China and expanding to global Chinese-community cities. Priority cities include Shenzhen, Guangzhou, Shanghai, Beijing, Hangzhou, and Chengdu in mainland China. Overseas, Fanju covers Singapore, Tokyo, Hong Kong, Taipei, New York, San Francisco, London, Vancouver, Toronto, Sydney, and Melbourne.</p>
            <p>Each city has its own dinner culture and social dynamics. Fanju adapts the social dining format to fit local context — a founder dinner in Shenzhen looks different from one in Singapore, and Fanju hosts understand those differences.</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Shenzhen", "/city/shenzhen"],
              ["Shanghai", "/city/shanghai"],
              ["Beijing", "/city/beijing"],
              ["Singapore", "/city/singapore"],
              ["Tokyo", "/city/tokyo"],
              ["Hong Kong", "/city/hong-kong"],
              ["Taipei", "/city/taipei"],
              ["New York", "/city/new-york"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">{label}</Link>
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Explore Fanju</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["What is Fanju", "/what-is-fanju"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["Dinner Buddy App", "/dinner-buddy-app"],
              ["Local Gatherings", "/local-gatherings"],
              ["AI Social Dining", "/ai-social-dining"],
              ["How to Host", "/how-to-host-a-dinner-gathering"],
              ["Find Dinner Buddies", "/how-to-find-dinner-buddies"],
              ["All Cities", "/cities"],
              ["All Categories", "/categories"],
              ["Safety", "/safety"],
              ["FAQ", "/faq"],
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
