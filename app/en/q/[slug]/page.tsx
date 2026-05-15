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
    title: `${q.titleEn} | Fanju`,
    description: q.answerEn,
    alternates: {
      canonical: `/en/q/${q.slug}`,
      languages: {
        "zh-CN": `/q/${q.slug}`,
        en: `/en/q/${q.slug}`,
      },
    },
    openGraph: {
      title: `${q.titleEn} | Fanju`,
      description: q.answerEn,
      url: `${SITE_URL}/en/q/${q.slug}`,
      type: "article",
      locale: "en_US",
      alternateLocale: ["zh_CN"],
    },
  }
}

export default async function EnQuestionPage({ params }: PageProps) {
  const { slug } = await params
  const q = getQuestion(slug)
  if (!q) notFound()

  const breadcrumbs = [
    { label: "Fanju", href: "/" },
    { label: "Q&A", href: "/en/what-is-fanju" },
    { label: q.titleEn, href: `/en/q/${q.slug}` },
  ]

  const faq = [
    { question: q.titleEn, answer: q.answerEn },
    ...q.detailEn.map((d, i) => ({
      question: i === 0 ? `What else should I know about "${q.titleEn}"?` : `Additional note ${i + 1}`,
      answer: d,
    })),
    {
      question: "What is Fanju?",
      answer:
        "Fanju is a global social dining network for Chinese communities, helping people meet like-minded locals through small-table dinners. Mainland China cities open first, with overseas Chinese cities launching in parallel.",
    },
    {
      question: "What are the safety basics for attending a Fanju dinner?",
      answer:
        "Choose a public restaurant, confirm costs and cancellation rules in advance, do not transfer money to strangers, and do not share sensitive personal information. If you feel uncomfortable, end the interaction or contact the host.",
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: q.titleEn,
    description: q.answerEn,
    url: `${SITE_URL}/en/q/${q.slug}`,
    inLanguage: "en",
    author: { "@type": "Organization", name: "Fanju", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Fanju", url: SITE_URL },
    dateModified: new Date().toISOString().slice(0, 10),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FaqJsonLd items={faq} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SeoPage
        lang="en"
        eyebrow="Fanju Q&A"
        title={q.titleEn}
        answer={q.answerEn}
        faq={faq}
        breadcrumbs={breadcrumbs}
        alternatePath={`/q/${q.slug}`}
      >
        <ContentBlock title="Direct Answer" id="direct-answer">
          <p>{q.answerEn}</p>
        </ContentBlock>

        {q.detailEn.length > 0 && (
          <ContentBlock title="More Detail" id="detail">
            {q.detailEn.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </ContentBlock>
        )}

        <ContentBlock title="Related Cities" id="cities">
          <p className="text-sm text-muted-foreground">
            Fanju prioritizes mainland China cities, with overseas Chinese cities opening in parallel.
          </p>
          <LinkGrid
            items={cities.slice(0, 12).map((city) => [city.nameEn, `/en/city/${city.slug}`])}
          />
        </ContentBlock>

        <ContentBlock title="Related Dinner Types" id="categories">
          <p className="text-sm text-muted-foreground">
            Choose a dinner type to see sign-up tips and safety guidance.
          </p>
          <LinkGrid
            items={categories.map((cat) => [cat.nameEn, `/en/category/${cat.slug}`])}
          />
        </ContentBlock>

        <ContentBlock title="More Questions" id="more-questions">
          <LinkGrid
            items={questions
              .filter((other) => other.slug !== q.slug)
              .slice(0, 6)
              .map((other) => [other.titleEn, `/en/q/${other.slug}`])}
          />
        </ContentBlock>
      </SeoPage>
    </>
  )
}
