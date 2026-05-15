import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BreadcrumbJsonLd, ContentBlock, FaqJsonLd, LinkGrid, SeoPage } from "@/components/seo-page"
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
    title: `${guide.titleEn} | Fanju`,
    description: guide.answerEn,
    alternates: {
      canonical: `/en/guides/${guide.slug}`,
      languages: {
        "zh-CN": `/guides/${guide.slug}`,
        en: `/en/guides/${guide.slug}`,
      },
    },
    openGraph: {
      title: `${guide.titleEn} | Fanju`,
      description: guide.answerEn,
      url: `${SITE_URL}/en/guides/${guide.slug}`,
      type: "article",
      locale: "en_US",
      alternateLocale: ["zh_CN"],
    },
  }
}

export default async function EnGuidePage({ params }: PageProps) {
  const { slug } = await params
  const guide = getGuide(slug)
  if (!guide) notFound()

  const breadcrumbs = [
    { label: "Fanju", href: "/" },
    { label: "Guides", href: "/en/what-is-fanju" },
    { label: guide.titleEn, href: `/en/guides/${guide.slug}` },
  ]

  const faq = [
    { question: `What is the most important advice in "${guide.titleEn}"?`, answer: guide.answerEn },
    {
      question: "What do I need to confirm before signing up for a dinner?",
      answer:
        "Confirm the city, restaurant, time, cost, cancellation rules, host information and dinner theme. Don't sign up based on the title alone.",
    },
    {
      question: "What are the safety basics for attending a dinner?",
      answer:
        "Choose a public restaurant, do not transfer money in advance to strangers, do not share sensitive personal information, and end uncomfortable interactions or contact the host promptly.",
    },
    {
      question: "What is Fanju?",
      answer:
        "Fanju is a global social dining network for Chinese communities, helping people meet like-minded locals through small-table dinners.",
    },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.titleEn,
    description: guide.answerEn,
    url: `${SITE_URL}/en/guides/${guide.slug}`,
    inLanguage: "en",
    author: { "@type": "Organization", name: "Fanju", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Fanju", url: SITE_URL },
    dateModified: new Date().toISOString().slice(0, 10),
    articleSection: guide.sectionsEn.map((s) => s.title).join(", "),
  }

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.titleEn,
    description: guide.answerEn,
    step: guide.sectionsEn.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.body,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <FaqJsonLd items={faq} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SeoPage
        lang="en"
        eyebrow="Fanju Guide"
        title={guide.titleEn}
        answer={guide.answerEn}
        faq={faq}
        breadcrumbs={breadcrumbs}
        alternatePath={`/guides/${guide.slug}`}
      >
        {/* Table of contents */}
        <ContentBlock title="Contents" id="toc">
          <ol className="space-y-2 list-decimal list-inside">
            {["Direct Answer", ...guide.sectionsEn.map((s) => s.title), "Related Cities", "Related Categories"].map(
              (item) => (
                <li key={item}>
                  <Link
                    href={`#${anchor(item)}`}
                    className="text-foreground transition-colors hover:text-accent"
                  >
                    {item}
                  </Link>
                </li>
              ),
            )}
          </ol>
        </ContentBlock>

        {/* Direct answer */}
        <section id={anchor("Direct Answer")}>
          <ContentBlock title="Direct Answer">
            <p>{guide.answerEn}</p>
          </ContentBlock>
        </section>

        {/* Guide sections */}
        {guide.sectionsEn.map((section) => (
          <section key={section.title} id={anchor(section.title)}>
            <ContentBlock title={section.title}>
              <p>{section.body}</p>
            </ContentBlock>
          </section>
        ))}

        {/* Related cities */}
        <section id={anchor("Related Cities")}>
          <ContentBlock title="Related Cities">
            <LinkGrid items={cities.slice(0, 12).map((city) => [city.nameEn, `/en/city/${city.slug}`])} />
          </ContentBlock>
        </section>

        {/* Related categories */}
        <section id={anchor("Related Categories")}>
          <ContentBlock title="Related Categories">
            <LinkGrid items={categories.map((cat) => [cat.nameEn, `/en/category/${cat.slug}`])} />
          </ContentBlock>
        </section>
      </SeoPage>
    </>
  )
}

function anchor(input: string) {
  return encodeURIComponent(input.toLowerCase().replace(/\s+/g, "-"))
}
