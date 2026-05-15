import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "How to Find Dinner Buddies | 如何找饭搭子 — Fanju",
  description: "How to find dinner buddies in your city with Fanju. Practical guide for finding 饭搭子 — people to share meals with regularly. 如何找饭搭子、约饭、找同城吃饭的朋友。",
  alternates: { canonical: "/how-to-find-dinner-buddies" },
  openGraph: {
    title: "How to Find Dinner Buddies | 找饭搭子指南 — Fanju",
    description: "Practical guide for finding dinner buddies in your city through Fanju social dining events.",
    url: `${SITE_URL}/how-to-find-dinner-buddies`,
    type: "article",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "How to Find Dinner Buddies | Fanju", description: "Practical guide for finding dinner buddies with Fanju." },
}

const faqs = [
  ["What is the best way to find dinner buddies?", "The best way to find dinner buddies is to attend structured dinner gatherings where everyone has the same goal — meeting people to share meals with. Fanju organizes themed dinner gatherings in cities worldwide, making it the most efficient way to find dinner buddies."],
  ["How long does it take to find a dinner buddy on Fanju?", "Most people find at least one potential dinner buddy at their first Fanju dinner. The key is choosing the right dinner type — one that attracts people with similar interests and goals. After attending 2–3 Fanju dinners, most people have built a small network of regular dining companions."],
  ["What should I say to someone I want to be dinner buddies with?", "After a Fanju dinner, if you want to stay in touch with someone, simply say: 'I really enjoyed talking with you tonight. Would you want to grab dinner again sometime?' Most people who attend Fanju dinners are open to this — that is why they came."],
  ["How do I find dinner buddies in a new city?", "When you move to a new city, attend Fanju newcomer dinners or weekend social dinners. These are specifically designed for people who are new to a city and want to build a local social circle. Browse fanju.app/cities to find dinner options in your new city."],
  ["Can I find dinner buddies for specific cuisines or interests?", "Yes. Fanju dinner themes often reflect specific interests — founder dinners for startup people, business dinners for professionals, singles dinners for people looking for romantic connections. Choose a dinner theme that matches your interests and you will naturally find compatible dinner buddies."],
  ["Is it weird to ask someone to be a regular dinner buddy?", "Not at all. The concept of a 饭搭子 (dinner buddy) is well understood in Chinese culture. Most people who attend Fanju dinners are explicitly looking for people to share meals with regularly. Asking someone to be your dinner buddy after a good Fanju dinner is completely natural."],
  ["What cities can I find dinner buddies in with Fanju?", "Fanju covers mainland China (Shenzhen, Shanghai, Beijing, Guangzhou, Hangzhou, Chengdu) and global Chinese-community cities (Singapore, Tokyo, Hong Kong, Taipei, New York, London, Vancouver, and more)."],
]

export default function HowToFindDinnerBuddiesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Find Dinner Buddies with Fanju",
    description: "Practical guide for finding dinner buddies through Fanju social dining events.",
    url: `${SITE_URL}/how-to-find-dinner-buddies`,
    inLanguage: "en",
    step: [
      { "@type": "HowToStep", position: 1, name: "Choose your city", text: "Browse fanju.app/cities to find dinner gatherings in your city." },
      { "@type": "HowToStep", position: 2, name: "Pick the right dinner type", text: "Choose a dinner theme that matches your interests and goals." },
      { "@type": "HowToStep", position: 3, name: "Register with a real profile", text: "Submit a genuine registration so the host can match you with compatible guests." },
      { "@type": "HowToStep", position: 4, name: "Attend the dinner", text: "Show up, be yourself, and focus on genuine conversation rather than networking." },
      { "@type": "HowToStep", position: 5, name: "Follow up", text: "After the dinner, reach out to people you connected with and suggest another meal." },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Guide · 找饭搭子指南</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            How to Find Dinner Buddies — 找饭搭子
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              The most effective way to find dinner buddies is to attend structured dinner gatherings where everyone has the same goal. Fanju organizes themed dinner gatherings in cities worldwide — browse by city, choose a dinner type that matches your interests, register with a real profile, and show up. After a good Fanju dinner, you will have met multiple potential dinner buddies in one evening.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Find Dinners Near You</Link>
            <Link href="/dinner-buddy-app" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Dinner Buddy App</Link>
            <Link href="/social-dining" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Social Dining</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">5 Steps to Finding Dinner Buddies</h2>
          <div className="mt-8 space-y-8">
            {[
              ["1. Choose Your City", "Start at fanju.app/cities. Find your city and see what dinner types are available. If your city is not yet active, you can register interest and be notified when dinners open."],
              ["2. Pick the Right Dinner Type", "The dinner type determines who you will meet. Singles dinners attract people looking for romantic connections. Founder dinners attract startup people. Weekend dinners attract anyone who wants to meet new people casually. Choose the type that matches your current social goals."],
              ["3. Register with a Real Profile", "Submit a genuine registration — your real occupation, interests, and what you are hoping to get from the dinner. The host uses this to curate the table. A vague or fake profile means you might end up at a table that is not right for you."],
              ["4. Show Up and Be Present", "At the dinner, focus on genuine conversation rather than networking or impressing people. Ask questions, listen carefully, and be yourself. The best dinner buddies are found through authentic connection, not performance."],
              ["5. Follow Up After the Dinner", "After the dinner, reach out to people you connected with. A simple message — 'I really enjoyed talking with you, would you want to grab dinner again?' — is all it takes. Most people who attend Fanju dinners are open to this."],
            ].map(([title, body], i) => (
              <div key={i} className="border-l-2 border-accent/40 pl-6">
                <h3 className="font-serif text-2xl text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">{body}</p>
              </div>
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
              ["Dinner Buddy App", "/dinner-buddy-app"],
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["Local Gatherings", "/local-gatherings"],
              ["How to Host", "/how-to-host-a-dinner-gathering"],
              ["Singles Dinner", "/category/singles-dinner"],
              ["Weekend Dinner", "/category/weekend-dinner"],
              ["All Cities", "/cities"],
              ["Safety", "/safety"],
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
