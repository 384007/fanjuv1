import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { categories, cities } from "@/lib/seo-data"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "Fanju Dinner Category Directory | Chinese Social Dining",
  description: "Fanju dinner category directory for singles dinners, curated dinners, business dinners, founder dinners, weekend dinners, Chinese social dining and student dinners.",
  alternates: { canonical: "/en/categories", languages: { "zh-CN": "/categories", en: "/en/categories" } },
}

export default function EnCategoriesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Fanju Dinner Category Directory",
    url: `${SITE_URL}/en/categories`,
    inLanguage: "en",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: categories.map((category, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: category.nameEn,
        url: `${SITE_URL}/en/category/${category.slug}`,
      })),
    },
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang="en">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">FANJU CATEGORY INDEX</div>
          <h1 className="mt-7 font-serif text-4xl text-foreground md:text-6xl">Fanju Dinner Categories</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">Explore Fanju dinner formats for Mandarin-speaking communities, from singles dinners and business dinners to founder, weekend, student and newcomer dinners.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/en/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">Cities</Link>
            <Link href="/categories" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">Chinese</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid grid-cols-1 gap-px border border-border/60 bg-border/60 lg:grid-cols-3">
            {categories.map((category) => (
              <article key={category.slug} className="bg-card/40 p-5">
                <Link href={`/en/category/${category.slug}`} className="group block">
                  <h2 className="font-serif text-2xl text-foreground group-hover:text-accent">{category.nameEn}</h2>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{category.name}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{category.answerEn}</p>
                </Link>
                <div className="mt-5 grid gap-2">
                  {cities.slice(0, 5).map((city) => (
                    <Link key={city.slug} href={`/en/city/${city.slug}/${category.slug}`} className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase hover:text-accent">{city.nameEn} {category.nameEn}</Link>
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
