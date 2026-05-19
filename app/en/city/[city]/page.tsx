import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SeoReadyArticlePage, seoReadyArticleMetadata } from "@/components/seo-ready-article-page"
import { BreadcrumbJsonLd, ContentBlock, FaqJsonLd, LinkGrid, SeoPage } from "@/components/seo-page"
import { categories, cities, getCity } from "@/lib/seo-data"
import { getSeoReadyArticleByPathOrAlternate, getSeoReadyCityParams, getAlternatePath, hasReadyArticleAtPath } from "@/lib/seo-ready-articles"

const SITE_URL = "https://fanju.app"

type PageProps = { params: Promise<{ city: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  const seen = new Set<string>()
  return [...cities.map((city) => ({ city: city.slug })), ...getSeoReadyCityParams("en")].filter((param) => {
    if (seen.has(param.city)) return false
    seen.add(param.city)
    return true
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: slug } = await params
  const pathname = `/en/city/${slug}`
  const ready = getSeoReadyArticleByPathOrAlternate(pathname)
  if (ready) return seoReadyArticleMetadata(ready.article, pathname, hasReadyArticleAtPath(getAlternatePath(pathname)))

  const city = getCity(slug)
  if (!city) return {}
  return {
    title: `${city.nameEn} Dinners | Fanju`,
    description: city.answerEn,
    alternates: { canonical: `/en/city/${city.slug}`, languages: { "zh-CN": `/city/${city.slug}`, en: `/en/city/${city.slug}` } },
    openGraph: { title: `${city.nameEn} Dinners | Fanju`, description: city.answerEn, url: `${SITE_URL}/en/city/${city.slug}`, type: "website", locale: "en_US", alternateLocale: ["zh_CN"] },
  }
}

export default async function EnCityPage({ params }: PageProps) {
  const { city: slug } = await params
  const pathname = `/en/city/${slug}`
  const ready = getSeoReadyArticleByPathOrAlternate(pathname)
  if (ready) return <SeoReadyArticlePage article={ready.article} currentPath={pathname} hasAlternateArticle={hasReadyArticleAtPath(getAlternatePath(pathname))} />

  const city = getCity(slug)
  if (!city) notFound()
  const breadcrumbs = [{ label: "Fanju", href: "/" }, { label: `${city.nameEn} Dinners`, href: `/en/city/${city.slug}` }]
  const faq = [
    { question: `Is ${city.nameEn} open for dinners?`, answer: `The ${city.nameEn} page captures early RSVPs and host recruitment.` },
    { question: `What dinner types are available in ${city.nameEn}?`, answer: `${city.nameEn} prioritizes singles, curated, business, weekend and stranger dinner formats.` },
    { question: `What should I know before attending?`, answer: "Choose a public restaurant, confirm costs and cancellation rules, and do not transfer money in advance to strangers." },
  ]
  const jsonLd = { "@context": "https://schema.org", "@type": "WebPage", name: `${city.nameEn} Dinners`, url: `${SITE_URL}/en/city/${city.slug}`, inLanguage: "en", description: city.answerEn, provider: { "@type": "Organization", name: "Fanju", url: SITE_URL } }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FaqJsonLd items={faq} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SeoPage lang="en" eyebrow={`${city.provinceEn} · City Dinners`} title={`${city.nameEn} Dinners`} answer={city.answerEn} faq={faq} city={city} breadcrumbs={breadcrumbs} alternatePath={`/city/${city.slug}`}>
        <ContentBlock title={`Who are ${city.nameEn} dinners for?`} id="intro"><p>{city.introEn}</p></ContentBlock>
        <ContentBlock title={`Dinner types in ${city.nameEn}`} id="categories"><LinkGrid items={categories.map((cat) => [cat.nameEn, `/en/category/${cat.slug}`])} /></ContentBlock>
      </SeoPage>
    </>
  )
}
