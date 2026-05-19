import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BreadcrumbJsonLd, ContentBlock, FaqJsonLd, LinkGrid, SeoPage } from "@/components/seo-page"
import { categories, cities, getCategory } from "@/lib/seo-data"
import { filterSafeLinkItems } from "@/lib/seo-ready-articles"

const SITE_URL = "https://fanju.app"

type PageProps = { params: Promise<{ category: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return categories.slice(0, 12).map((category) => ({ category: category.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) return {}
  return {
    title: `${category.nameEn} | Fanju`,
    description: category.answerEn,
    alternates: { canonical: `/en/category/${category.slug}`, languages: { "zh-CN": `/category/${category.slug}`, en: `/en/category/${category.slug}` } },
    openGraph: { title: `${category.nameEn} | Fanju`, description: category.answerEn, url: `${SITE_URL}/en/category/${category.slug}`, type: "website", locale: "en_US", alternateLocale: ["zh_CN"] },
  }
}

export default async function EnCategoryPage({ params }: PageProps) {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  const breadcrumbs = [{ label: "Fanju", href: "/" }, { label: category.nameEn, href: `/en/category/${category.slug}` }]
  const faq = [
    { question: `Who are ${category.nameEn} dinners for?`, answer: `${category.nameEn} dinners suit ${category.audienceEn}.` },
    { question: `Which cities open first?`, answer: "Fanju prioritizes mainland China cities and global Chinese communities." },
    { question: `Do dinners guarantee outcomes?`, answer: "No. Fanju provides dinner sign-up and host information, not guaranteed outcomes." },
  ]
  const jsonLd = { "@context": "https://schema.org", "@type": "Service", name: category.nameEn, serviceType: "Social dining", url: `${SITE_URL}/en/category/${category.slug}`, inLanguage: "en", description: category.answerEn, provider: { "@type": "Organization", name: "Fanju", url: SITE_URL } }
  const cityItems = filterSafeLinkItems(cities.slice(0, 12).map((city): [string, string] => [`${city.nameEn} ${category.nameEn}`, `/en/city/${city.slug}`]))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FaqJsonLd items={faq} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SeoPage lang="en" eyebrow="Dinner Category" title={category.nameEn} answer={category.answerEn} faq={faq} category={category} breadcrumbs={breadcrumbs} alternatePath={`/category/${category.slug}`}>
        <ContentBlock title={`What is ${category.nameEn}?`} id="intro"><p>{category.introEn}</p></ContentBlock>
        {cityItems.length > 0 && <ContentBlock title="Cities" id="cities"><LinkGrid items={cityItems} /></ContentBlock>}
      </SeoPage>
    </>
  )
}
