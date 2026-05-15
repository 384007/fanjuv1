import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { BreadcrumbJsonLd, ContentBlock, FaqJsonLd, LinkGrid, SeoPage } from "@/components/seo-page"
import { categories, cities, getCategory, getCity } from "@/lib/seo-data"

const SITE_URL = "https://fanju.app"

type PageProps = { params: Promise<{ city: string; category: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return cities.flatMap((city) =>
    categories.map((category) => ({ city: city.slug, category: category.slug }))
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug, category: categorySlug } = await params
  const city = getCity(citySlug)
  const category = getCategory(categorySlug)
  if (city && category) {
    const title = `${city.nameEn} ${category.nameEn} | Fanju`
    const description = `${city.nameEn} ${category.nameEn} sign-up, host review and safety notes. ${category.answerEn}`
    return {
      title,
      description,
      alternates: { canonical: `/en/city/${city.slug}/${category.slug}`, languages: { "zh-CN": `/city/${city.slug}/${category.slug}`, en: `/en/city/${city.slug}/${category.slug}` } },
      openGraph: { title, description, url: `${SITE_URL}/en/city/${city.slug}/${category.slug}`, type: "website", locale: "en_US", alternateLocale: ["zh_CN"] },
    }
  }
  return {}
}

export default async function EnCityCategoryPage({ params }: PageProps) {
  const { city: citySlug, category: categorySlug } = await params
  const city = getCity(citySlug)
  const category = getCategory(categorySlug)

  // Original logic — city and category both in seo-data
  if (city && category) {
    const title = `${city.nameEn} ${category.nameEn}`
    const answer = `${title} suits ${category.audienceEn}. Fanju focuses on real profiles, host review, small-table dinners and public restaurant settings.`
    const breadcrumbs = [
      { label: "Fanju", href: "/" },
      { label: `${city.nameEn} Dinners`, href: `/en/city/${city.slug}` },
      { label: category.nameEn, href: `/en/category/${category.slug}` },
      { label: title, href: `/en/city/${city.slug}/${category.slug}` },
    ]
    const faq = [
      { question: `How do I join ${title}?`, answer: `Follow the ${city.nameEn} city page and ${category.nameEn} category page, then submit a basic profile for host review.` },
      { question: `Is ${title} suitable for first-timers?`, answer: "Yes. Choose a public restaurant, a clear theme and a small table size." },
      { question: `Does ${title} guarantee outcomes?`, answer: "No. Fanju provides a trusted social dining entry point, not guaranteed dating, deals, funding or fixed networking outcomes." },
    ]
    const jsonLd = { "@context": "https://schema.org", "@type": "Service", name: title, serviceType: "Social dining", url: `${SITE_URL}/en/city/${city.slug}/${category.slug}`, inLanguage: "en", description: answer, areaServed: { "@type": "Place", name: city.nameEn }, provider: { "@type": "Organization", name: "Fanju", url: SITE_URL } }

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <FaqJsonLd items={faq} />
        <BreadcrumbJsonLd items={breadcrumbs} />
        <SeoPage lang="en" eyebrow={`${city.provinceEn} · ${category.nameEn}`} title={title} answer={answer} faq={faq} city={city} category={category} breadcrumbs={breadcrumbs} alternatePath={`/city/${city.slug}/${category.slug}`}>
          <ContentBlock title={`About ${city.nameEn}`} id="city"><p>{city.introEn}</p></ContentBlock>
          <ContentBlock title={`About ${category.nameEn}`} id="category"><p>{category.introEn}</p></ContentBlock>
          <ContentBlock title="Browse more" id="more"><LinkGrid items={[[`${city.nameEn} Dinners`, `/en/city/${city.slug}`], [category.nameEn, `/en/category/${category.slug}`], ["All cities", "/en/cities"], ["All categories", "/en/categories"]]} /></ContentBlock>
        </SeoPage>
      </>
    )
  }

  // Fallback — city or category not in seo-data, redirect gracefully
  redirect("/en/cities")
}
