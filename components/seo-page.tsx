import Link from "next/link"
import type { ReactNode } from "react"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { categories, cities, type Category, type City } from "@/lib/seo-data"
import { filterSafeLinkItems, safeArticleLinksForCity } from "@/lib/seo-ready-articles"

export type SeoLang = "zh" | "en"

export type FaqItem = {
  question: string
  answer: string
}

export type BreadcrumbItem = {
  label: string
  href: string
}

const ui = {
  zh: {
    directAnswer: "直接答案",
    relatedCities: "相关城市",
    relatedCategories: "相关分类",
    sameCityArticles: "同城其他饭局",
    guide: "报名指南",
    home: "回到首页",
    faqTitle: "常见问题",
    langSwitch: "English",
  },
  en: {
    directAnswer: "Direct Answer",
    relatedCities: "Related Cities",
    relatedCategories: "Related Categories",
    sameCityArticles: "More In This City",
    guide: "Dinner Guide",
    home: "Back to Home",
    faqTitle: "FAQ",
    langSwitch: "中文",
  },
} as const

export function SeoPage({
  lang = "zh",
  eyebrow,
  title,
  answer,
  children,
  faq,
  city,
  category,
  breadcrumbs,
  alternatePath,
}: {
  lang?: SeoLang
  eyebrow: string
  title: string
  answer: string
  children?: ReactNode
  faq: FaqItem[]
  city?: City
  category?: Category
  breadcrumbs?: BreadcrumbItem[]
  /** The equivalent page in the other language, for the lang-switch link */
  alternatePath?: string
}) {
  const t = ui[lang]

  // Related cities: exclude current city if present
  const relatedCities = city
    ? cities.filter((c) => c.slug !== city.slug).slice(0, 6)
    : cities.slice(0, 6)

  // Related categories: exclude current category if present
  const relatedCategories = category
    ? categories.filter((c) => c.slug !== category.slug).slice(0, 6)
    : categories.slice(0, 6)

  const cityLabel = (c: City) => (lang === "en" ? c.nameEn : c.name)
  const catLabel = (c: Category) => (lang === "en" ? c.nameEn : c.name)
  const cityPath = (c: City) => (lang === "en" ? `/en/city/${c.slug}` : `/city/${c.slug}`)
  const catPath = (c: Category) => (lang === "en" ? `/en/category/${c.slug}` : `/category/${c.slug}`)
  const currentPath = city && category
    ? `${lang === "en" ? "/en" : ""}/city/${city.slug}/${category.slug}`
    : city
      ? `${lang === "en" ? "/en" : ""}/city/${city.slug}`
      : category
        ? `${lang === "en" ? "/en" : ""}/category/${category.slug}`
        : ""
  const safeRelatedCities = filterSafeLinkItems(relatedCities.map((c): [string, string] => [cityLabel(c), cityPath(c)]))
  const safeRelatedCategories = filterSafeLinkItems(relatedCategories.map((c): [string, string] => [catLabel(c), catPath(c)]))
  const safeSameCityArticles = city && category
    ? safeArticleLinksForCity(city.slug, lang, currentPath, 6).map((link) => [link.label, link.href] as [string, string])
    : []

  const defaultBreadcrumbs: BreadcrumbItem[] =
    lang === "en"
      ? [
          { label: "Fanju", href: "/" },
          ...(city ? [{ label: `${city.nameEn} Dinners`, href: `/en/city/${city.slug}` }] : []),
          ...(category ? [{ label: category.nameEn, href: `/en/category/${category.slug}` }] : []),
        ]
      : [
          { label: "饭局 Fanju", href: "/" },
          ...(city ? [{ label: `${city.name}饭局`, href: `/city/${city.slug}` }] : []),
          ...(category ? [{ label: category.name, href: `/category/${category.slug}` }] : []),
        ]

  const crumbs = breadcrumbs ?? defaultBreadcrumbs

  const guideHref =
    lang === "en" ? "/en/guides/mainland-city-dinner-guide" : "/guides/mainland-city-dinner-guide"

  return (
    <main className="min-h-screen bg-background text-foreground" lang={lang === "en" ? "en" : "zh-CN"}>
      <SiteHeader />

      {/* Breadcrumb — helps AI crawlers understand page hierarchy */}
      <nav aria-label="breadcrumb" className="border-b border-border/40 bg-card/20">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-2 md:px-8">
          <ol className="flex flex-wrap items-center gap-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            {crumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden>/</span>}
                {i < crumbs.length - 1 ? (
                  <Link href={crumb.href} className="transition-colors hover:text-accent">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
          {alternatePath && (
            <Link
              href={alternatePath}
              className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-accent"
            >
              {t.langSwitch}
            </Link>
          )}
        </div>
      </nav>

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-[0.25]" aria-hidden />
        <div className="relative mx-auto max-w-[1100px] px-4 py-14 md:px-8 md:py-20">
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] text-accent uppercase">
            <span className="h-px w-8 bg-accent/60" />
            <span>{eyebrow}</span>
          </div>
          <h1 className="mt-7 max-w-4xl font-serif text-4xl leading-[1.08] text-balance text-foreground md:text-6xl">
            {title}
          </h1>
          {/* Direct Answer — AI engines (Perplexity, Google AI Overview, ChatGPT Search)
              prefer a clearly labelled concise answer near the top of the page */}
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">{t.directAnswer}</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">{answer}</p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 px-4 py-12 md:px-8 md:py-16 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">{children}</div>
          <aside className="space-y-8">
            {city && category ? (
              <InternalLinks title={t.sameCityArticles} items={safeSameCityArticles} />
            ) : (
              <>
                <InternalLinks title={t.relatedCities} items={safeRelatedCities} />
                <InternalLinks title={t.relatedCategories} items={safeRelatedCategories} />
              </>
            )}
            <div className="space-y-2">
              <Link
                href={guideHref}
                className="flex border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.18em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent"
              >
                {t.guide}
              </Link>
              <Link
                href="/"
                className="flex border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.18em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent"
              >
                {t.home}
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* FAQ — FAQPage schema + visible Q&A is the strongest AI SEO signal */}
      <section className="border-b border-border/60" aria-label={t.faqTitle}>
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">{t.faqTitle}</h2>
          <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60">
            {faq.map((item) => (
              <article key={item.question} className="bg-card/40 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{item.question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}

export function ContentBlock({ title, id, children }: { title: string; id?: string; children: ReactNode }) {
  return (
    <section id={id}>
      <h2 className="font-serif text-3xl text-foreground md:text-4xl">{title}</h2>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">{children}</div>
    </section>
  )
}

export function LinkGrid({ items }: { items: [string, string][] }) {
  const safeItems = filterSafeLinkItems(items)
  if (safeItems.length === 0) return null
  return (
    <div className="grid grid-cols-1 gap-px border border-border/60 bg-border/60 sm:grid-cols-2">
      {safeItems.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className="bg-card/40 p-4 font-mono text-[11px] tracking-[0.16em] text-foreground uppercase transition-colors hover:text-accent"
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

// FAQPage JSON-LD is intentionally disabled.
// Visible FAQ content is preserved in the page HTML for users and AI crawlers.
// Emitting FAQPage schema on a social-product site causes Search Console
// "enhanced feature" warnings without meaningful rich-result benefit.
export function FaqJsonLd({ items: _items }: { items: FaqItem[] }) {
  return null
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.label,
            item: `https://fanju.app${item.href}`,
          })),
        }),
      }}
    />
  )
}

function InternalLinks({ title, items }: { title: string; items: [string, string][] }) {
  const safeItems = filterSafeLinkItems(items)
  if (safeItems.length === 0) return null
  return (
    <div>
      <h2 className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground uppercase">{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-px border border-border/60 bg-border/60">
        {safeItems.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="bg-card/45 px-3 py-3 text-sm text-foreground transition-colors hover:text-accent"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
