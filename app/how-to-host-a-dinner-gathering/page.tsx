import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "How to Host a Dinner Gathering | 如何举办饭局 — Fanju",
  description: "Learn how to host a dinner gathering on Fanju. Step-by-step guide for dinner hosts — from choosing a theme to reviewing guests and running a successful social dining event. 如何举办饭局，饭局主办方指南。",
  alternates: { canonical: "/how-to-host-a-dinner-gathering" },
  openGraph: {
    title: "How to Host a Dinner Gathering | Fanju Host Guide",
    description: "Step-by-step guide for hosting a dinner gathering on Fanju — theme, guest review, venue, and running a successful social dining event.",
    url: `${SITE_URL}/how-to-host-a-dinner-gathering`,
    type: "article",
    locale: "en_US",
    siteName: "Fanju",
  },
  twitter: { card: "summary_large_image", title: "How to Host a Dinner Gathering | Fanju", description: "Step-by-step guide for hosting a dinner gathering on Fanju." },
}

const faqs = [
  ["Who can host a dinner gathering on Fanju?", "Anyone who meets Fanju's host requirements can apply to host. Hosts need to be based in a Fanju-covered city, have a clear dinner theme in mind, and be willing to review guest registrations and run the event responsibly. Visit fanju.app/hosts to apply."],
  ["What makes a good dinner gathering theme?", "A good theme is specific enough to attract compatible guests but broad enough to fill a table. Examples: 'Shenzhen startup founders under 35', 'Shanghai finance professionals who love hiking', 'Singapore newcomers from mainland China'. Vague themes like 'interesting people' attract everyone and no one."],
  ["How many guests should a dinner gathering have?", "Fanju recommends 6–10 guests for a dinner gathering. Fewer than 6 feels like a small group date. More than 10 makes it hard for everyone to have a real conversation. The sweet spot is 8 people — enough diversity, small enough for genuine connection."],
  ["How do I review guest registrations?", "When guests register for your dinner, you receive their profiles including occupation, interests, and dinner goals. Review each registration and confirm guests who fit your theme and will contribute to a good table dynamic. You can decline registrations that do not fit."],
  ["What restaurant should I choose for a dinner gathering?", "Choose a restaurant that is public, accessible, and has a private or semi-private dining area if possible. The noise level should allow conversation. Avoid restaurants that are too loud, too formal, or too casual. The restaurant sets the tone for the dinner."],
  ["How do I handle no-shows at a dinner gathering?", "Confirm attendance with all guests 24–48 hours before the dinner. Have a waitlist of 1–2 backup guests if possible. If someone cancels last minute, decide whether to proceed with the remaining guests or reschedule."],
  ["What are the host responsibilities on Fanju?", "Hosts are responsible for: choosing a clear theme, reviewing guest registrations, confirming the venue and time, communicating with guests before the dinner, running the dinner smoothly, and ensuring the safety boundaries (public restaurant, no advance payments) are maintained."],
]

export default function HowToHostDinnerGatheringPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Host a Dinner Gathering on Fanju",
    description: "Step-by-step guide for hosting a social dining event on Fanju.",
    url: `${SITE_URL}/how-to-host-a-dinner-gathering`,
    inLanguage: "en",
    step: [
      { "@type": "HowToStep", position: 1, name: "Choose a dinner theme", text: "Define a specific, compelling theme that will attract compatible guests." },
      { "@type": "HowToStep", position: 2, name: "Apply as a host", text: "Submit your host application at fanju.app/hosts with your theme and city." },
      { "@type": "HowToStep", position: 3, name: "Review guest registrations", text: "Review each guest profile and confirm those who fit your theme." },
      { "@type": "HowToStep", position: 4, name: "Choose a venue", text: "Select a public restaurant with the right atmosphere for your dinner theme." },
      { "@type": "HowToStep", position: 5, name: "Run the dinner", text: "Host the dinner, facilitate introductions, and ensure a safe, enjoyable experience." },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">Host Guide · 主办方指南</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            How to Host a Dinner Gathering on Fanju
          </h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct Answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
              Hosting a dinner gathering on Fanju involves five steps: choose a specific theme, apply as a host, review guest registrations, choose a public restaurant venue, and run the dinner. Fanju provides the platform infrastructure — you provide the theme, the curation, and the hosting. The result is a small, intimate dinner where everyone belongs at the table.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/hosts" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Apply as a Host</Link>
            <Link href="/how-to-find-dinner-buddies" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Find Dinner Buddies</Link>
            <Link href="/safety" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Safety Guidelines</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Step-by-Step: Hosting a Dinner Gathering</h2>
          <div className="mt-8 space-y-8">
            {[
              ["Step 1: Choose a Specific Theme", "The theme is the most important decision you make as a host. A specific theme attracts compatible guests and sets the tone for the entire dinner. Bad theme: 'interesting people in Shanghai'. Good theme: 'Shanghai product managers who have worked at both Chinese and international companies'. The more specific your theme, the better your table will be."],
              ["Step 2: Apply as a Fanju Host", "Submit your host application at fanju.app/hosts. Include your proposed theme, your city, your background, and why you want to host. Fanju reviews host applications to ensure quality and safety standards are maintained."],
              ["Step 3: Review Guest Registrations", "When guests register for your dinner, you receive their profiles. Review each registration carefully. Confirm guests who fit your theme and will contribute to a good table dynamic. Decline registrations that do not fit — this is your most important job as a host."],
              ["Step 4: Choose the Right Venue", "Select a public restaurant that fits your theme. A founder dinner might work well in a modern restaurant in a business district. A singles dinner might work better in a relaxed, atmospheric restaurant. The venue should allow conversation — avoid places that are too loud or too formal."],
              ["Step 5: Run the Dinner", "Arrive early, greet guests as they arrive, facilitate introductions, and keep the conversation flowing. Your job is not to entertain — it is to create the conditions for genuine connection. A good host asks good questions and makes sure everyone has a chance to speak."],
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
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Host Safety Responsibilities</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>As a Fanju host, you are responsible for maintaining the safety boundaries that make Fanju dinners trustworthy. These are non-negotiable:</p>
            <ul className="ml-4 list-disc space-y-2">
              <li><strong className="text-foreground">Public restaurant only.</strong> All Fanju dinners must be held in public restaurants. No private homes, no private clubs, no unlisted venues.</li>
              <li><strong className="text-foreground">No advance payments from guests.</strong> Never ask guests to pay you directly before the dinner. All payment should happen at the restaurant.</li>
              <li><strong className="text-foreground">Transparent pricing.</strong> Communicate the expected cost per person clearly before guests confirm attendance.</li>
              <li><strong className="text-foreground">Real profiles only.</strong> Do not accept registrations from guests who provide obviously fake or incomplete profiles.</li>
              <li><strong className="text-foreground">No guaranteed outcomes.</strong> Do not promise guests that they will find a partner, make a business deal, or achieve any specific social outcome from attending your dinner.</li>
            </ul>
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
              ["Apply as Host", "/hosts"],
              ["Find Dinner Buddies", "/how-to-find-dinner-buddies"],
              ["Social Dining", "/social-dining"],
              ["Dinner Gathering App", "/dinner-gathering-app"],
              ["Private Dinner Club", "/private-dinner-club"],
              ["Startup Founder Dinners", "/startup-founder-dinners"],
              ["Business Networking", "/business-dinner-networking"],
              ["Safety Guidelines", "/safety"],
              ["All Cities", "/cities"],
              ["All Categories", "/categories"],
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
