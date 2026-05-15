import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { getFeature, productFeatures } from "@/lib/product-features"

const SITE_URL = "https://fanju.app"

type PageProps = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return productFeatures.map((feature) => ({ slug: feature.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const feature = getFeature(slug)
  if (!feature) return {}

  return {
    title: `${feature.titleEn} | Fanju`,
    description: feature.answerEn,
    alternates: {
      canonical: `/en/features/${feature.slug}`,
      languages: {
        "zh-CN": `/features/${feature.slug}`,
        en: `/en/features/${feature.slug}`,
      },
    },
    openGraph: {
      title: `${feature.titleEn} | Fanju`,
      description: feature.answerEn,
      url: `${SITE_URL}/en/features/${feature.slug}`,
      type: "website",
      locale: "en_US",
      alternateLocale: ["zh_CN"],
    },
  }
}

export default async function EnFeaturePage({ params }: PageProps) {
  const { slug } = await params
  const feature = getFeature(slug)
  if (!feature) notFound()

  const related = productFeatures.filter((item) => item.slug !== feature.slug).slice(0, 6)
  const faq = [
    [`What is ${feature.nameEn}?`, feature.answerEn],
    [`Who is ${feature.nameEn} for?`, `${feature.nameEn} is for dinner hosts, city community organizers and guests who want a clearer way to join offline dinners.`],
    [`What are the key points of ${feature.nameEn}?`, feature.pointsEn.join("; ")],
  ]
  const breadcrumbItems = [
    { name: "Fanju", href: "/" },
    { name: "Features", href: "/en/features" },
    { name: feature.titleEn, href: `/en/features/${feature.slug}` },
  ]
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: feature.titleEn,
        url: `${SITE_URL}/en/features/${feature.slug}`,
        inLanguage: "en",
        description: feature.answerEn,
      },
      {
        "@type": "Service",
        name: `Fanju ${feature.titleEn}`,
        serviceType: feature.nameEn,
        provider: { "@type": "Organization", name: "Fanju", url: SITE_URL },
        url: `${SITE_URL}/en/features/${feature.slug}`,
        description: feature.answerEn,
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${SITE_URL}${item.href === "/" ? "" : item.href}`,
        })),
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <nav aria-label="breadcrumb" className="border-b border-border/40 bg-card/20">
        <div className="mx-auto flex max-w-[1100px] items-center px-4 py-2 md:px-8">
          <ol className="flex flex-wrap items-center gap-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            {breadcrumbItems.map((item, index) => (
              <li key={item.href} className="flex items-center gap-1">
                {index > 0 && <span aria-hidden>/</span>}
                {index < breadcrumbItems.length - 1 ? (
                  <Link href={item.href} className="transition-colors hover:text-accent">
                    {item.name}
                  </Link>
                ) : (
                  <span className="text-foreground">{item.name}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">FANJU FEATURE</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">{feature.titleEn}</h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">Direct answer</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">{feature.answerEn}</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/en/features" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Features</Link>
            <Link href={`/features/${feature.slug}`} className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Chinese</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 px-4 py-12 md:grid-cols-3 md:px-8 md:py-16">
          {feature.pointsEn.map((point) => (
            <article key={point} className="border border-border/60 bg-card/35 p-5 md:p-6">
              <h2 className="font-serif text-2xl text-foreground">{point}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{feature.answerEn}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">Related features</h2>
          <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/en/features/${item.slug}`} className="bg-card/40 p-4 text-sm text-foreground hover:text-accent">
                <span className="block font-serif text-xl">{item.titleEn}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="border-b border-border/60" aria-label="Frequently asked questions">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">FAQ</h2>
          <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60">
            {faq.map(([question, answer]) => (
              <article key={question} className="bg-card/40 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
