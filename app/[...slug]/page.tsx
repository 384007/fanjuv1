import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { SeoReadyArticlePage, seoReadyArticleMetadata } from "@/components/seo-ready-article-page"
import {
  getSeoReadyArticleByPathOrAlternate,
  getSeoReadyStaticParamsForCatchAll,
  getAlternatePath,
  hasReadyArticleAtPath,
} from "@/lib/seo-ready-articles"

type PageProps = { params: Promise<{ slug: string[] }> }

export const dynamicParams = false

export function generateStaticParams() {
  return getSeoReadyStaticParamsForCatchAll()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const pathname = `/${slug.join("/")}`
  const result = getSeoReadyArticleByPathOrAlternate(pathname)
  if (!result) return {}
  return seoReadyArticleMetadata(result.article, pathname, hasReadyArticleAtPath(getAlternatePath(pathname)))
}

export default async function CatchAllSeoReadyPage({ params }: PageProps) {
  const { slug } = await params
  const pathname = `/${slug.join("/")}`
  const result = getSeoReadyArticleByPathOrAlternate(pathname)
  if (!result) redirect("/")
  return <SeoReadyArticlePage article={result!.article} currentPath={pathname} hasAlternateArticle={hasReadyArticleAtPath(getAlternatePath(pathname))} />
}
