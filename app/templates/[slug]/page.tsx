import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { templates } from "@/lib/seo-data"

type PageProps = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return templates.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const t = templates.find((x) => x.slug === slug)
  if (!t) return {}
  return {
    title: `${t.title}｜饭局 Fanju`,
    description: t.description,
    alternates: { canonical: `/templates/${slug}` },
    robots: { index: true, follow: true },
  }
}

export default async function TemplatePage({ params }: PageProps) {
  const { slug } = await params
  const t = templates.find((x) => x.slug === slug)
  if (!t) notFound()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">TEMPLATE · 模板</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-5xl">{t.title}</h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">{t.description}</p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-2xl text-foreground">模板内容</h2>
          <pre className="mt-6 whitespace-pre-wrap rounded border border-border/60 bg-card/40 p-6 font-mono text-sm leading-relaxed text-foreground">
            {t.body}
          </pre>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-2xl text-foreground">其他模板</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {templates.filter((x) => x.slug !== slug).map((x) => (
              <Link key={x.slug} href={`/templates/${x.slug}`} className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">
                {x.title}
              </Link>
            ))}
            <Link href="/templates" className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">全部模板</Link>
            <Link href="/what-is-fanju" className="border border-border/60 bg-card/35 p-3 text-center font-mono text-[10px] tracking-[0.16em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent">饭局 Fanju 是什么</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
