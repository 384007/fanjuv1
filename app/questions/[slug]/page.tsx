import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { questionPages } from "@/lib/seo-data"

type PageProps = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return questionPages.map((q) => ({ slug: q.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const q = questionPages.find((x) => x.slug === slug)
  if (!q) return {}
  return {
    title: `${q.title}｜饭局 Fanju`,
    description: q.answer,
    alternates: { canonical: `/questions/${slug}` },
    robots: { index: true, follow: true },
  }
}

export default async function QuestionPage({ params }: PageProps) {
  const { slug } = await params
  const q = questionPages.find((x) => x.slug === slug)
  if (!q) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: q.title,
    url: `https://fanju.app/questions/${slug}`,
    inLanguage: "zh-CN",
    description: q.answer,
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">QUESTION · 问答</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-5xl">{q.title}</h1>
          <div className="mt-8 border-l border-accent/70 bg-card/35 p-5 md:p-6">
            <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">直接答案</div>
            <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">{q.answer}</p>
          </div>
        </div>
      </section>

      {q.tips.length > 0 && (
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
            <h2 className="font-serif text-2xl text-foreground">实用建议</h2>
            <ul className="mt-6 ml-4 list-disc space-y-3 text-sm leading-relaxed text-muted-foreground">
              {q.tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
          </div>
        </section>
      )}

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-2xl text-foreground">相关问题</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {questionPages.filter((x) => x.slug !== slug).map((x) => (
              <Link key={x.slug} href={`/questions/${x.slug}`} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">
                {x.title}
              </Link>
            ))}
            <Link href="/what-is-fanju" className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">饭局 Fanju 是什么</Link>
            <Link href="/faq" className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">常见问题</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
