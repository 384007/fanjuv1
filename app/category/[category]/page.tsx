import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BreadcrumbJsonLd, ContentBlock, LinkGrid, SeoPage } from "@/components/seo-page"
import { categories, cities, getCategory } from "@/lib/seo-data"

const SITE_URL = "https://fanju.app"

type PageProps = { params: Promise<{ category: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) return {}
  return {
    title: `${category.name}｜饭局 Fanju`,
    description: category.answer,
    alternates: {
      canonical: `/category/${category.slug}`,
      languages: { "zh-CN": `/category/${category.slug}`, en: `/en/category/${category.slug}` },
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${category.name}｜饭局 Fanju`,
      description: category.answer,
      url: `${SITE_URL}/category/${category.slug}`,
      type: "website",
      locale: "zh_CN",
      alternateLocale: ["en_US"],
    },
  }
}

// City recommendations per category
const categoryCities: Record<string, string[]> = {
  "singles-dinner": ["shenzhen", "shanghai", "beijing", "guangzhou", "tokyo", "new-york"],
  "chinese-social-dining": ["singapore", "tokyo", "new-york", "london", "hong-kong", "taipei"],
  "business-dinner": ["shenzhen", "shanghai", "beijing", "singapore", "hong-kong"],
  "founder-dinner": ["shenzhen", "shanghai", "beijing", "hangzhou", "san-francisco"],
  "curated-dinner": ["shanghai", "beijing", "shenzhen", "hong-kong", "singapore"],
  "weekend-dinner": ["shenzhen", "shanghai", "beijing", "guangzhou", "chengdu"],
  "student-dinner": ["tokyo", "new-york", "london", "singapore", "sydney"],
  "newcomer-dinner": ["shenzhen", "shanghai", "beijing", "singapore", "tokyo"],
  "stranger-dinner": ["shenzhen", "shanghai", "beijing", "guangzhou", "chengdu"],
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params
  const category = getCategory(slug)
  if (!category) notFound()

  const breadcrumbs = [
    { label: "饭局 Fanju", href: "/" },
    { label: "饭局类型", href: "/categories" },
    { label: category.name, href: `/category/${category.slug}` },
  ]

  // Visible FAQ — FaqJsonLd returns null, no FAQPage schema emitted
  const faq = [
    {
      question: `${category.name}适合哪些人？`,
      answer: `${category.name}适合${category.audience}。${category.intro}`,
    },
    {
      question: `${category.name}在哪些城市优先开放？`,
      answer: "饭局 Fanju 优先覆盖中国大陆城市和全球华人城市，具体场次以主办方招募和城市开放进度为准。",
    },
    {
      question: `${category.name}会承诺结果吗？`,
      answer: "不会。饭局页面提供报名和招募说明，不承诺固定社交结果。单身饭局不承诺脱单，商务饭局不承诺融资或合作。",
    },
    {
      question: `参加${category.name}前需要准备什么？`,
      answer: "建议确认餐厅、时间、费用、主办方规则和退款说明，准备简短自我介绍和可聊话题，选择公开餐厅场次。",
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: category.name,
    serviceType: "Social dining",
    url: `${SITE_URL}/category/${category.slug}`,
    inLanguage: "zh-CN",
    description: category.answer,
    provider: { "@type": "Organization", name: "饭局 Fanju", url: SITE_URL },
  }

  // Recommended cities for this category
  const recCitySlugs = categoryCities[category.slug] ?? []
  const recCities = recCitySlugs
    .map((s) => cities.find((c) => c.slug === s))
    .filter(Boolean) as typeof cities

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SeoPage
        lang="zh"
        eyebrow="饭局分类"
        title={category.name}
        answer={category.answer}
        faq={faq}
        category={category}
        breadcrumbs={breadcrumbs}
        alternatePath={`/en/category/${category.slug}`}
      >
        {/* What this category is */}
        <ContentBlock title={`${category.name}是什么`} id="intro">
          <p>{category.intro}</p>
        </ContentBlock>

        {/* Who it's for */}
        <ContentBlock title="适合人群" id="audience">
          <p>适合：{category.audience}</p>
        </ContentBlock>

        {/* Tips */}
        {category.tips && category.tips.length > 0 && (
          <ContentBlock title="报名建议" id="tips">
            <ul className="ml-4 list-disc space-y-2">
              {category.tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </ContentBlock>
        )}

        {/* Safety */}
        <ContentBlock title="安全边界" id="safety">
          <p>
            参加{category.name}时，建议优先选择公开餐厅，确认费用和取消规则，不提前向陌生人转账。
            {category.slug === "singles-dinner" && "单身饭局不承诺脱单，不展示虚假报名人数。"}
            {category.slug === "business-dinner" && "商务饭局不承诺融资或合作结果，涉及合作应在饭局后正式确认。"}
            {category.slug === "founder-dinner" && "创业者饭局不承诺融资结果，商业敏感信息不应在初次饭局中完整披露。"}
          </p>
        </ContentBlock>

        {/* Recommended cities */}
        {recCities.length > 0 && (
          <ContentBlock title="推荐城市入口" id="cities">
            <LinkGrid items={recCities.map((c) => [`${c.name}${category.name}`, `/city/${c.slug}/${category.slug}`])} />
          </ContentBlock>
        )}

        {/* All cities */}
        <ContentBlock title="全部城市" id="all-cities">
          <LinkGrid items={cities.map((city) => [`${city.name}饭局`, `/city/${city.slug}`])} />
        </ContentBlock>
      </SeoPage>
    </>
  )
}
