import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BreadcrumbJsonLd, ContentBlock, FaqJsonLd, LinkGrid, SeoPage } from "@/components/seo-page"
import { categories, cities, getQuestion, questions } from "@/lib/seo-data"

const SITE_URL = "https://fanju.app"

type PageProps = {
  params: Promise<{ slug: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return questions.map((q) => ({ slug: q.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const q = getQuestion(slug)
  if (!q) return {}

  return {
    title: `${q.title}｜饭局 Fanju`,
    description: q.answer,
    alternates: {
      canonical: `/q/${q.slug}`,
      languages: {
        "zh-CN": `/q/${q.slug}`,
        en: `/en/q/${q.slug}`,
      },
    },
    openGraph: {
      title: `${q.title}｜饭局 Fanju`,
      description: q.answer,
      url: `${SITE_URL}/q/${q.slug}`,
      type: "article",
      locale: "zh_CN",
      alternateLocale: ["en_US"],
    },
  }
}

export default async function QuestionPage({ params }: PageProps) {
  const { slug } = await params
  const q = getQuestion(slug)
  if (!q) notFound()

  const breadcrumbs = [
    { label: "饭局 Fanju", href: "/" },
    { label: "问答", href: "/what-is-fanju" },
    { label: q.title, href: `/q/${q.slug}` },
  ]

  // Build FAQ items: direct answer + detail paragraphs as follow-up Q&A
  const faq = [
    { question: q.title, answer: q.answer },
    ...q.detail.map((d, i) => ({
      question: i === 0 ? `关于"${q.title}"还需要了解什么？` : `补充说明 ${i + 1}`,
      answer: d,
    })),
    {
      question: "饭局 Fanju 是什么平台？",
      answer:
        "饭局 Fanju 是面向全球华人年轻人的同频饭局网络，通过小桌晚餐帮助用户认识同城同频的人。中国大陆城市优先，海外华人城市同步展开。",
    },
    {
      question: "参加饭局有哪些安全建议？",
      answer:
        "建议选择公开餐厅，提前确认费用和取消规则，不向陌生人提前转账，不透露敏感隐私。遇到不舒服的情况可以直接结束交流或联系主办方。",
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: q.title,
    description: q.answer,
    url: `${SITE_URL}/q/${q.slug}`,
    inLanguage: "zh-CN",
    author: { "@type": "Organization", name: "饭局 Fanju", url: SITE_URL },
    publisher: { "@type": "Organization", name: "饭局 Fanju", url: SITE_URL },
    dateModified: new Date().toISOString().slice(0, 10),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FaqJsonLd items={faq} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SeoPage
        lang="zh"
        eyebrow="饭局问答"
        title={q.title}
        answer={q.answer}
        faq={faq}
        breadcrumbs={breadcrumbs}
        alternatePath={`/en/q/${q.slug}`}
      >
        {/* Direct answer block */}
        <ContentBlock title="直接答案" id="direct-answer">
          <p>{q.answer}</p>
        </ContentBlock>

        {/* Detail paragraphs */}
        {q.detail.length > 0 && (
          <ContentBlock title="详细解释" id="detail">
            {q.detail.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </ContentBlock>
        )}

        {/* Related cities */}
        <ContentBlock title="相关城市" id="cities">
          <p className="text-sm text-muted-foreground">
            饭局 Fanju 优先覆盖中国大陆城市，同步开放海外华人城市。
          </p>
          <LinkGrid
            items={cities.slice(0, 12).map((city) => [city.name, `/city/${city.slug}`])}
          />
        </ContentBlock>

        {/* Related categories */}
        <ContentBlock title="相关饭局类型" id="categories">
          <p className="text-sm text-muted-foreground">
            选择适合你的饭局类型，了解报名建议和安全提示。
          </p>
          <LinkGrid
            items={categories.map((cat) => [cat.name, `/category/${cat.slug}`])}
          />
        </ContentBlock>

        {/* Other questions */}
        <ContentBlock title="更多问答" id="more-questions">
          <LinkGrid
            items={questions
              .filter((other) => other.slug !== q.slug)
              .slice(0, 6)
              .map((other) => [other.title, `/q/${other.slug}`])}
          />
        </ContentBlock>
      </SeoPage>
    </>
  )
}
