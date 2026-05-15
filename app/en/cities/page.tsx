import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { categories, cities } from "@/lib/seo-data"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Fanju City Directory | Chinese Social Dining Cities",
  description: "Fanju city directory for Mandarin-speaking social dining across mainland China and global Chinese-community cities including Shenzhen, Shanghai, Singapore, New York and London.",
  alternates: { canonical: "/en/cities", languages: { "zh-CN": "/cities", en: "/en/cities" } },
}

export default function EnCitiesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Fanju City Directory",
    url: `${SITE_URL}/en/cities`,
    inLanguage: "en",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: cities.map((city, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${city.nameEn} Dinners`,
        url: `${SITE_URL}/en/city/${city.slug}`,
      })),
    },
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">FANJU CITY INDEX</div>
          <h1 className="mt-7 font-serif text-4xl text-foreground md:text-6xl">Fanju City Directory</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">Explore Fanju social dining pages across mainland China and global Chinese-community cities. Each city page explains local dinner formats, host recruitment and safety boundaries.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/en/categories" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Categories</Link>
            <Link href="/cities" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Chinese</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid grid-cols-1 gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <article key={city.slug} className="bg-card/40 p-5">
                <Link href={`/en/city/${city.slug}`} className="group block">
                  <h2 className="font-serif text-2xl text-foreground group-hover:text-accent">{city.nameEn} Dinners</h2>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{city.countryEn ?? "China"}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{city.answerEn}</p>
                </Link>
                <div className="mt-5 grid gap-2">
                  {categories.slice(0, 4).map((category) => (
                    <Link key={category.slug} href={`/en/city/${city.slug}/${category.slug}`} className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase hover:text-accent">{city.nameEn} {category.nameEn}</Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
