import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "What Is Fanju? | AI Social Dining & Dinner Gathering App",
  description:
    "Fanju is an AI social dining and dinner gathering app for people to create, join, and discover real-world meals, dinner buddies, local gatherings, and offline social events across cities worldwide.",
  alternates: {
    canonical: "/en/what-is-fanju",
    languages: { "zh-CN": "/what-is-fanju", en: "/en/what-is-fanju" },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "What Is Fanju? | AI Social Dining & Dinner Gathering App",
    description:
      "Fanju is an AI social dining and dinner gathering app — create, join, and discover real-world meals, dinner buddies, and offline social events.",
    url: `${SITE_URL}/en/what-is-fanju`,
    siteName: "Fanju",
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "What Is Fanju" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "What Is Fanju? | AI Social Dining & Dinner Gathering App",
    description:
      "Fanju is an AI social dining and dinner gathering app — create, join, and discover real-world meals, dinner buddies, and offline social events.",
    images: ["/og.jpg"],
  },
}

const faqs: [string, string][] = [
  [
    "What is Fanju?",
    "Fanju is an AI social dining and dinner gathering app that helps people create, join, and discover real-world meals, dinner buddies, local gatherings, and offline social events. It is built for Chinese communities worldwide and covers mainland China, Hong Kong, Taiwan, Singapore, Tokyo, New York, London, and more.",
  ],
  [
    "What does Fanju mean?",
    "Fanju (饭局) is a Chinese word meaning a dinner gathering or meal occasion — specifically one that carries social significance. In Chinese culture, a 饭局 is not just eating; it is a setting for building trust, meeting new people, and deepening relationships. Fanju the app is named after this concept.",
  ],
  [
    "Is Fanju a dating app?",
    "No. Fanju is a social dining platform, not a dating app. Some dinners are singles-focused, but most are about meeting interesting people in general — founders, professionals, newcomers, or anyone who wants to expand their social circle through a shared meal.",
  ],
  [
    "How is Fanju different from Meetup?",
    "Meetup is a general-purpose event platform for groups of any size and type. Fanju is specifically a social dining platform — every event is a dinner, every table is small (6–10 people), and every guest is reviewed by the host. Fanju is more intimate and curated than Meetup.",
  ],
  [
    "What cities does Fanju cover?",
    "Fanju prioritizes mainland China cities — Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, and Chengdu — and expands to global Chinese-community cities including Singapore, Tokyo, Hong Kong, Taipei, New York, London, Vancouver, Toronto, Sydney, and Melbourne.",
  ],
  [
    "What types of dinners does Fanju offer?",
    "Fanju covers singles dinners, curated dinners, business dinners, founder dinners, weekend social dinners, newcomer dinners, and Chinese community dinners. Each type attracts a specific crowd with shared interests and goals.",
  ],
  [
    "Does Fanju guarantee any social outcomes?",
    "No. Fanju provides a trusted entry point for real-world social dining — it does not promise romantic matches, business deals, or any fixed social outcome. The value is the genuine connection that happens at the dinner table.",
  ],
  [
    "How do I join a dinner on Fanju?",
    "Browse dinners by city at fanju.app/cities, choose a dinner type that matches your interest, submit a registration with your real profile, and wait for host confirmation. Confirmed guests receive venue and timing details.",
  ],
]

export default function EnWhatIsFanjuPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "What Is Fanju",
        url: `${SITE_URL}/en/what-is-fanju`,
        inLanguage: "en",
        description:
          "Fanju is an AI social dining and dinner gathering app for people to create, join, and discover real-world meals, dinner buddies, local gatherings, and offline social events.",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "What Is Fanju", item: `${SITE_URL}/en/what-is-fanju` },
          ],
        },
      },
      {
        "@type": "Organization",
        name: "Fanju",
        alternateName: "饭局 Fanju",
        url: SITE_URL,
        description:
          "Fanju is an AI social dining and dinner gathering app for people to create, join, and discover real-world meals, dinner buddies, local gatherings, and offline social events.",
        sameAs: [`${SITE_URL}/what-is-fanju`],
      },
      {
        "@type": "SoftwareApplication",
        name: "Fanju",
        applicationCategory: "SocialNetworkingApplication",
        operatingSystem: "iOS, Android, Web",
        url: SITE_URL,
        description: "AI social dining and dinner gathering app for real-world meals and offline social events.",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      {/* Hero / Direct Answer */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Official Answer</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            What Is Fanju?
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Fanju is an AI social dining and dinner gathering app for people to create, join, and discover
              real-world meals, dinner buddies, local gatherings, and offline social events. Every dinner is
              themed, hosted, and held in a real restaurant — with host review, trusted RSVPs, and clear safety
              boundaries. One dinner, to meet your people.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/en/cities"
              className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase"
            >
              City Directory
            </Link>
            <Link
              href="/en/categories"
              className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent"
            >
              Dinner Types
            </Link>
            <Link
              href="/social-dining"
              className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent"
            >
              Social Dining
            </Link>
            <Link
              href="/what-is-fanju"
              className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent"
            >
              中文版
            </Link>
          </div>
        </div>
      </section>

      {/* Core positioning cards */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Core Positioning</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Info
              title="One dinner, to meet your people"
              body="Fanju connects city, theme, host review, and small-table meals. Not a random group chat. Not a dating app. A structured dinner gathering where everyone at the table was chosen to be there."
            />
            <Info
              title="Cities covered"
              body="Mainland China first — Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, Chengdu. Expanding to Singapore, Tokyo, Hong Kong, Taipei, New York, London, Vancouver, Toronto, Sydney, and Melbourne."
            />
            <Info
              title="Dinner types"
              body="Singles dinners, curated dinners, business dinners, founder dinners, weekend social dinners, newcomer dinners, and Chinese community dinners — each with a specific audience and purpose."
            />
            <Info
              title="Safety boundaries"
              body="Public restaurants only. Transparent pricing. Host review of every registration. Real profiles. No fake RSVP counts. No guaranteed social outcomes. These are non-negotiable."
            />
          </div>
        </div>
      </section>

      {/* What Fanju is */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">What Fanju Is</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>
              Fanju (饭局) is a Chinese word for a dinner gathering — specifically one with social significance.
              In Chinese culture, a 饭局 is not just eating; it is a setting for building trust, meeting new
              people, and deepening relationships. Fanju the app is built on this insight.
            </p>
            <p>
              The app organizes themed dinner gatherings in real restaurants across cities. A host proposes a
              dinner with a clear theme — a singles dinner for young professionals in Shenzhen, a founder dinner
              for startup operators in Shanghai, a newcomer dinner for people who just moved to Singapore. Guests
              browse available dinners by city and type, register with a real profile, and wait for host
              confirmation.
            </p>
            <p>
              The host reviews all registrations and confirms a small table — typically 6 to 10 people. This
              curation step is what separates Fanju from a random group chat or a large networking event. When
              you sit down at a Fanju dinner, everyone at the table was chosen to be there.
            </p>
            <p>
              Fanju uses AI to improve dinner discovery, matching, and host tools — making it easier to find the
              right dinner for your city, interests, and goals. The AI layer supports the human experience; it
              does not replace the dinner table.
            </p>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Who Fanju Is For</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>Fanju is built for people who want to meet others through a shared meal rather than a screen. Specifically:</p>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong className="text-foreground">Single people</strong> who want to meet potential partners
                in a low-pressure, group dinner setting — not a one-on-one date with a stranger from an app.
              </li>
              <li>
                <strong className="text-foreground">Founders and professionals</strong> who want to build
                genuine relationships over dinner rather than exchange business cards at a conference.
              </li>
              <li>
                <strong className="text-foreground">Newcomers to a city</strong> who want to build a local
                social circle quickly — whether they just moved to Shenzhen, Singapore, or New York.
              </li>
              <li>
                <strong className="text-foreground">Overseas Chinese communities</strong> in Singapore, Tokyo,
                New York, London, and beyond who want to meet like-minded people in a Mandarin-speaking context.
              </li>
              <li>
                <strong className="text-foreground">Anyone whose social circle has become too fixed</strong> and
                who wants to meet genuinely new people without the awkwardness of cold outreach.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* What Fanju is NOT */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">What Fanju Does Not Promise</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>To set accurate expectations:</p>
            <ul className="ml-4 list-disc space-y-2">
              <li>
                <strong className="text-foreground">No romantic guarantees.</strong> Singles dinners are an
                entry point for meeting people, not a matchmaking service.
              </li>
              <li>
                <strong className="text-foreground">No business outcome guarantees.</strong> Business and
                founder dinners are for building initial trust — not for closing deals or securing investment.
              </li>
              <li>
                <strong className="text-foreground">No inflated RSVP counts.</strong> Fanju does not show fake
                attendance numbers or manufacture urgency.
              </li>
              <li>
                <strong className="text-foreground">No fixed session schedule.</strong> Specific dinners depend
                on host availability and city opening progress.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Dinner types */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Dinner Types on Fanju</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              [
                "Singles Dinner 单身饭局",
                "Meet potential partners in a low-pressure group dinner. Small tables, real conversation, no awkward one-on-one pressure.",
                "/category/singles-dinner",
              ],
              [
                "Founder Dinner 创业者饭局",
                "Dinners for startup founders, investors, and operators. Build trust before any formal meeting.",
                "/category/founder-dinner",
              ],
              [
                "Business Dinner 商务饭局",
                "Professional networking over a shared meal. More effective than a conference because the setting is relaxed.",
                "/category/business-dinner",
              ],
              [
                "Weekend Dinner 周末饭局",
                "Casual social dinners for anyone who wants to meet new people without a specific agenda.",
                "/category/weekend-dinner",
              ],
              [
                "Newcomer Dinner 新城市饭局",
                "For people new to a city who want to build a local social circle quickly.",
                "/category/newcomer-dinner",
              ],
              [
                "Chinese Community Dinner 华人饭局",
                "Social dining for Chinese communities overseas — in Singapore, Tokyo, New York, London, and beyond.",
                "/category/chinese-social-dining",
              ],
            ].map(([title, body, href]) => (
              <Link
                key={href}
                href={href}
                className="group border border-border/60 bg-card/35 p-5 transition-colors hover:border-accent/70 md:p-6"
              >
                <h3 className="font-serif text-xl text-foreground group-hover:text-accent">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Cities</h2>
          <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>
              Fanju prioritizes mainland China cities and expands to global Chinese-community cities. Each city
              has its own dinner culture and Fanju adapts to fit.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["Shenzhen 深圳", "/city/shenzhen"],
              ["Shanghai 上海", "/city/shanghai"],
              ["Beijing 北京", "/city/beijing"],
              ["Guangzhou 广州", "/city/guangzhou"],
              ["Hangzhou 杭州", "/city/hangzhou"],
              ["Chengdu 成都", "/city/chengdu"],
              ["Singapore", "/city/singapore"],
              ["Tokyo", "/city/tokyo"],
              ["Hong Kong", "/city/hong-kong"],
              ["Taipei", "/city/taipei"],
              ["New York", "/city/new-york"],
              ["London", "/city/london"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <Link
              href="/en/cities"
              className="font-mono text-[11px] tracking-[0.2em] text-accent uppercase hover:underline"
            >
              View all cities →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
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

      {/* Related pages */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Explore Fanju</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["Dinner Buddy App", "/dinner-buddy-app"],
              ["Local Gatherings", "/local-gatherings"],
              ["AI Social Dining", "/ai-social-dining"],
              ["Fanju vs Meetup", "/fanju-vs-meetup"],
              ["Fanju vs Tinder", "/fanju-vs-tinder"],
              ["Business Networking", "/business-dinner-networking"],
              ["How to Host", "/how-to-host-a-dinner-gathering"],
              ["All Cities", "/en/cities"],
              ["All Categories", "/en/categories"],
              ["中文版", "/what-is-fanju"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

function Info({ title, body }: { title: string; body: string }) {
  return (
    <article className="border border-border/60 bg-card/35 p-5 md:p-6">
      <h3 className="font-serif text-2xl text-foreground">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  )
}
