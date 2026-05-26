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
    title: `${category.nameEn} | Fanju Social Dining`,
    description: `${category.answerEn} Compare host notes, public venues, table size, cost expectations and safety basics before joining.`,
    alternates: { canonical: `/en/category/${category.slug}`, languages: { "zh-CN": `/category/${category.slug}`, en: `/en/category/${category.slug}` } },
    openGraph: { title: `${category.nameEn} | Fanju Social Dining`, description: category.answerEn, url: `${SITE_URL}/en/category/${category.slug}`, type: "website", locale: "en_US", alternateLocale: ["zh_CN"] },
  }
}

export default async function EnCategoryPage({ params }: PageProps) {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  const breadcrumbs = [{ label: "Fanju", href: "/" }, { label: "Dinner categories", href: "/en/categories" }, { label: category.nameEn, href: `/en/category/${category.slug}` }]
  const faq = [
    { question: `Who are ${category.nameEn} dinners for?`, answer: `${category.nameEn} dinners suit ${category.audienceEn}.` },
    { question: `How should I choose a ${category.nameEn} dinner?`, answer: "Read the host note, public venue, group size, cost sharing rules and table topic before joining." },
    { question: `Which cities open first?`, answer: "Fanju prioritizes mainland China cities and global Chinese communities." },
    { question: `Do dinners guarantee outcomes?`, answer: "No. Fanju provides dinner sign-up and host information, not guaranteed outcomes." },
  ]
  const jsonLd = { "@context": "https://schema.org", "@type": "Service", name: category.nameEn, serviceType: "Social dining", url: `${SITE_URL}/en/category/${category.slug}`, inLanguage: "en", description: category.answerEn, provider: { "@type": "Organization", name: "Fanju", url: SITE_URL } }
  const cityItems = filterSafeLinkItems(cities.slice(0, 12).map((city): [string, string] => [`${city.nameEn} ${category.nameEn}`, `/en/city/${city.slug}/${category.slug}`]))

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FaqJsonLd items={faq} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SeoPage lang="en" eyebrow="Dinner Category" title={category.nameEn} answer={category.answerEn} faq={faq} category={category} breadcrumbs={breadcrumbs} alternatePath={`/category/${category.slug}`}>
        <ContentBlock title={`What is ${category.nameEn}?`} id="intro"><p>{category.introEn}</p></ContentBlock>
        <ContentBlock title="How to choose a table" id="choose">
          <ul className="ml-4 list-disc space-y-2">
            <li>Check whether the table topic is specific enough for real conversation.</li>
            <li>Choose a public restaurant or clear venue for the first dinner.</li>
            <li>Confirm group size, timing, cost sharing and cancellation expectations before joining.</li>
            <li>Prefer host notes that explain who the dinner is for and who it is not for.</li>
          </ul>
        </ContentBlock>
        <ContentBlock title="Safety basics" id="safety"><p>Fanju is dinner-first social dining. Keep early dinners in public places, avoid unclear payment requests, and do not share sensitive personal information at the first table.</p></ContentBlock>
        {cityItems.length > 0 && <ContentBlock title="City examples" id="cities"><LinkGrid items={cityItems} /></ContentBlock>}
      </SeoPage>
    </>
  )
}
