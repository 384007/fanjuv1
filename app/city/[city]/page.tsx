import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BreadcrumbJsonLd, ContentBlock, LinkGrid, SeoPage } from "@/components/seo-page"
import { categories, cities, getCity } from "@/lib/seo-data"

const SITE_URL = "https://fanju.app"

type PageProps = { params: Promise<{ city: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return cities.map((city) => ({ city: city.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: slug } = await params
  const city = getCity(slug)
  if (!city) return {}
  return {
    title: `${city.name}饭局｜饭局 Fanju`,
    description: city.answer,
    alternates: {
      canonical: `/city/${city.slug}`,
      languages: { "zh-CN": `/city/${city.slug}`, en: `/en/city/${city.slug}` },
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${city.name}饭局｜饭局 Fanju`,
      description: city.answer,
      url: `${SITE_URL}/city/${city.slug}`,
      type: "website",
      locale: "zh_CN",
      alternateLocale: ["en_US"],
    },
  }
}

export default async function CityPage({ params }: PageProps) {
  const { city: slug } = await params
  const city = getCity(slug)
  if (!city) notFound()

  const breadcrumbs = [
    { label: "饭局 Fanju", href: "/" },
    { label: "城市目录", href: "/cities" },
    { label: `${city.name}饭局`, href: `/city/${city.slug}` },
  ]

  // Visible FAQ — FaqJsonLd is disabled (returns null), so no FAQPage schema emitted
  const faq = [
    {
      question: `${city.name}饭局现在开放了吗？`,
      answer: `${city.name}饭局页面用于承接报名和主办方招募需求，具体场次以产品内开放信息为准。`,
    },
    {
      question: `${city.name}有哪些饭局类型？`,
      answer: `${city.name}优先覆盖单身饭局、高端饭局、商务饭局、创业者饭局、周末饭局和陌生人饭局等类型。`,
    },
    {
      question: `参加${city.name}饭局要注意什么？`,
      answer: "建议选择公开餐厅、确认费用和取消规则、保留行程信息，不提前向陌生人转账或透露敏感隐私。",
    },
    {
      question: `${city.name}饭局适合哪些人？`,
      answer: city.intro,
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${city.name}饭局`,
    url: `${SITE_URL}/city/${city.slug}`,
    inLanguage: "zh-CN",
    description: city.answer,
    provider: { "@type": "Organization", name: "饭局 Fanju", url: SITE_URL },
  }

  // Related cities: same country/region, excluding current
  const relatedCities = cities
    .filter((c) => c.slug !== city.slug && (c.countryCode ?? "CN") === (city.countryCode ?? "CN"))
    .slice(0, 6)
  // Fallback: if fewer than 3, add from all cities
  const fallbackCities = relatedCities.length >= 3
    ? relatedCities
    : cities.filter((c) => c.slug !== city.slug).slice(0, 6)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SeoPage
        lang="zh"
        eyebrow={`${city.province} · 城市饭局`}
        title={`${city.name}饭局`}
        answer={city.answer}
        faq={faq}
        city={city}
        breadcrumbs={breadcrumbs}
        alternatePath={`/en/city/${city.slug}`}
      >
        {/* City-specific intro */}
        <ContentBlock title={`${city.name}饭局适合谁`} id="intro">
          <p>{city.intro}</p>
          {city.highlights && city.highlights.length > 0 && (
            <ul className="mt-4 ml-4 list-disc space-y-2">
              {city.highlights.map((h) => <li key={h}>{h}</li>)}
            </ul>
          )}
        </ContentBlock>

        {/* What to confirm before joining */}
        <ContentBlock title="报名前确认事项" id="checklist">
          <ul className="ml-4 list-disc space-y-2">
            <li>确认餐厅地址、开始和结束时间，选择交通方便的场次。</li>
            <li>确认费用包含项、退款规则和主办方联系方式。</li>
            <li>了解饭局主题和同桌人数，选择与自己目的匹配的场次。</li>
            <li>首次参加建议选择公开餐厅，保留行程信息。</li>
          </ul>
        </ContentBlock>

        {/* Safety */}
        <ContentBlock title="安全提醒" id="safety">
          <p>
            参加{city.name}饭局时，建议优先选择公开餐厅，不提前向陌生人转账，不透露敏感证件、住址或财务信息。
            遇到不舒服的交流可以直接结束话题或联系主办方。
          </p>
        </ContentBlock>

        {/* Dinner types */}
        <ContentBlock title={`${city.name}可关注的饭局类型`} id="categories">
          <LinkGrid items={categories.map((cat) => [cat.name, `/category/${cat.slug}`])} />
        </ContentBlock>

        {/* Related cities in same region */}
        {fallbackCities.length > 0 && (
          <ContentBlock title="相关城市饭局" id="related-cities">
            <LinkGrid items={fallbackCities.map((c) => [`${c.name}饭局`, `/city/${c.slug}`])} />
          </ContentBlock>
        )}
      </SeoPage>
    </>
  )
}
