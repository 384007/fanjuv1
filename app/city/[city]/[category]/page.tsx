import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { SeoReadyArticlePage, seoReadyArticleMetadata } from "@/components/seo-ready-article-page"
import { BreadcrumbJsonLd, ContentBlock, FaqJsonLd, LinkGrid, SeoPage } from "@/components/seo-page"
import { categories, cities, getCategory, getCity } from "@/lib/seo-data"
import { getSeoReadyArticleByPathOrAlternate, getSeoReadyCityCategoryParams } from "@/lib/seo-ready-articles"

const SITE_URL = "https://fanju.app"

type PageProps = { params: Promise<{ city: string; category: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  const seen = new Set<string>()
  return [
    ...cities.flatMap((city) => categories.map((category) => ({ city: city.slug, category: category.slug }))),
    ...getSeoReadyCityCategoryParams("zh"),
  ].filter((param) => {
    const key = `${param.city}/${param.category}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: citySlug, category: categorySlug } = await params
  const pathname = `/city/${citySlug}/${categorySlug}`
  const ready = getSeoReadyArticleByPathOrAlternate(pathname)
  if (ready) return seoReadyArticleMetadata(ready.article, pathname)

  const city = getCity(citySlug)
  const category = getCategory(categorySlug)
  if (city && category) {
    const title = `${city.name}${category.name}｜饭局 Fanju`
    const description = `${city.name}${category.name}报名、招募、主理确认和安全建议。${category.answer}`
    return {
      title,
      description,
      alternates: { canonical: `/city/${city.slug}/${category.slug}`, languages: { "zh-CN": `/city/${city.slug}/${category.slug}`, en: `/en/city/${city.slug}/${category.slug}` } },
      openGraph: { title, description, url: `${SITE_URL}/city/${city.slug}/${category.slug}`, type: "website", locale: "zh_CN", alternateLocale: ["en_US"] },
    }
  }
  return {}
}

export default async function CityCategoryPage({ params }: PageProps) {
  const { city: citySlug, category: categorySlug } = await params
  const pathname = `/city/${citySlug}/${categorySlug}`
  const ready = getSeoReadyArticleByPathOrAlternate(pathname)
  if (ready) return <SeoReadyArticlePage article={ready.article} currentPath={pathname} />

  const city = getCity(citySlug)
  const category = getCategory(categorySlug)

  // Original logic — city and category both in seo-data
  if (city && category) {
    const title = `${city.name}${category.name}`
    const answer = `${title}适合${category.audience}。饭局 Fanju 以真实资料、主理确认、小桌晚餐和公开餐厅为基础，帮助同城用户建立可信线下连接。`
    const breadcrumbs = [
      { label: "饭局 Fanju", href: "/" },
      { label: `${city.name}饭局`, href: `/city/${city.slug}` },
      { label: category.name, href: `/category/${category.slug}` },
      { label: title, href: `/city/${city.slug}/${category.slug}` },
    ]
    const faq = [
      { question: `${title}如何报名？`, answer: `可以先关注${city.name}城市页和${category.name}分类页，填写基础资料后等待主理人确认。` },
      { question: `${title}适合第一次参加吗？`, answer: "适合。建议选择公开餐厅、主题明确、人数适中的小桌饭局。" },
      { question: `${title}是否保证结果？`, answer: "不保证。饭局 Fanju 提供可信报名和线下晚餐社交入口，不承诺脱单、成交、融资或固定人脉结果。" },
    ]
    const jsonLd = { "@context": "https://schema.org", "@type": "Service", name: title, serviceType: "Social dining", url: `${SITE_URL}/city/${city.slug}/${category.slug}`, inLanguage: "zh-CN", description: answer, areaServed: { "@type": "Place", name: city.name }, provider: { "@type": "Organization", name: "饭局 Fanju", url: SITE_URL } }

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <FaqJsonLd items={faq} />
        <BreadcrumbJsonLd items={breadcrumbs} />
        <SeoPage lang="zh" eyebrow={`${city.province} · ${category.name}`} title={title} answer={answer} faq={faq} city={city} category={category} breadcrumbs={breadcrumbs} alternatePath={`/en/city/${city.slug}/${category.slug}`}>
          <ContentBlock title={`${city.name}本地说明`} id="city"><p>{city.intro}</p></ContentBlock>
          <ContentBlock title={`${category.name}说明`} id="category"><p>{category.intro}</p></ContentBlock>
          <ContentBlock title="继续浏览" id="more"><LinkGrid items={[[`${city.name}饭局`, `/city/${city.slug}`], [category.name, `/category/${category.slug}`], ["全部城市", "/cities"], ["全部类型", "/categories"]]} /></ContentBlock>
        </SeoPage>
      </>
    )
  }

  // Fallback — city or category not in seo-data, redirect gracefully
  redirect("/cities")
}
