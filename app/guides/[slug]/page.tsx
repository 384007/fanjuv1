import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BreadcrumbJsonLd, ContentBlock, LinkGrid, SeoPage } from "@/components/seo-page"
import { categories, cities, getGuide, guides } from "@/lib/seo-data"

const SITE_URL = "https://fanju.app"

type PageProps = {
  params: Promise<{ slug: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) return {}

  return {
    title: `${guide.title}｜饭局 Fanju`,
    description: guide.answer,
    alternates: {
      canonical: `/guides/${guide.slug}`,
      languages: {
        "zh-CN": `/guides/${guide.slug}`,
        en: `/en/guides/${guide.slug}`,
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${guide.title}｜饭局 Fanju`,
      description: guide.answer,
      url: `${SITE_URL}/guides/${guide.slug}`,
      type: "article",
      locale: "zh_CN",
      alternateLocale: ["en_US"],
    },
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  const breadcrumbs = [
    { label: "饭局 Fanju", href: "/" },
    { label: "指南", href: "/what-is-fanju" },
    { label: guide.title, href: `/guides/${guide.slug}` },
  ]

  // Visible FAQ — no FAQPage JSON-LD emitted
  const faq = [
    { question: `${guide.title}最重要的建议是什么？`, answer: guide.answer },
    {
      question: "报名饭局前需要确认什么？",
      answer: "需要确认城市、餐厅、时间、费用、取消规则、主办方信息和饭局主题，避免只看标题就报名。",
    },
    {
      question: "参加饭局有哪些安全底线？",
      answer: "优先选择公开餐厅，不提前向陌生人转账，不透露敏感隐私，遇到不舒服的情况及时结束交流或联系主办方。",
    },
    {
      question: "饭局 Fanju 是什么？",
      answer: "饭局 Fanju 是面向全球华人年轻人的同频饭局网络，通过小桌晚餐帮助用户认识同城同频的人。",
    },
  ]

  // Article JSON-LD only — HowTo removed to avoid enhanced-feature errors
  // (guide sections are informational, not step-by-step instructions)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.answer,
    url: `${SITE_URL}/guides/${guide.slug}`,
    inLanguage: "zh-CN",
    author: { "@type": "Organization", name: "饭局 Fanju", url: SITE_URL },
    publisher: { "@type": "Organization", name: "饭局 Fanju", url: SITE_URL },
    dateModified: "2026-05-11",
    articleSection: guide.sections.map((s) => s.title).join(", "),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SeoPage
        lang="zh"
        eyebrow="饭局指南"
        title={guide.title}
        answer={guide.answer}
        faq={faq}
        breadcrumbs={breadcrumbs}
        alternatePath={`/en/guides/${guide.slug}`}
      >
        {/* Table of contents */}
        <ContentBlock title="目录" id="toc">
          <ol className="space-y-2 list-decimal list-inside">
            {["直接答案", ...guide.sections.map((s) => s.title), "相关城市", "相关分类"].map((item) => (
              <li key={item}>
                <Link
                  href={`#${anchor(item)}`}
                  className="text-foreground transition-colors hover:text-accent"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ol>
        </ContentBlock>

        {/* Direct answer */}
        <section id={anchor("直接答案")}>
          <ContentBlock title="直接答案">
            <p>{guide.answer}</p>
          </ContentBlock>
        </section>

        {/* Guide sections */}
        {guide.sections.map((section) => (
          <section key={section.title} id={anchor(section.title)}>
            <ContentBlock title={section.title}>
              <p>{section.body}</p>
            </ContentBlock>
          </section>
        ))}

        {/* Related cities */}
        <section id={anchor("相关城市")}>
          <ContentBlock title="相关城市">
            <LinkGrid items={cities.slice(0, 12).map((city) => [city.name, `/city/${city.slug}`])} />
          </ContentBlock>
        </section>

        {/* Related categories */}
        <section id={anchor("相关分类")}>
          <ContentBlock title="相关分类">
            <LinkGrid items={categories.map((cat) => [cat.name, `/category/${cat.slug}`])} />
          </ContentBlock>
        </section>
      </SeoPage>
    </>
  )
}

function anchor(input: string) {
  return encodeURIComponent(input.toLowerCase().replace(/\s+/g, "-"))
}
