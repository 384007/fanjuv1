import Link from "next/link"
import type { SeoReadyArticle } from "@/lib/seo-ready-articles"
import { getAlternatePath } from "@/lib/seo-ready-articles"
import { getCategory, getCity } from "@/lib/seo-data"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

const SITE_URL = "https://fanju.app"

// ─── Safe markdown renderer ───────────────────────────────────────────────────

type Block =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; rows: string[][] }
  | { type: "hr" }

type RelatedLink = { label: string; href: string }

function parseMarkdown(md: string): Block[] {
  const lines = md.split("\n")
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4).trim() }); i++
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() }); i++
    } else if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: line.slice(2).trim() }); i++
    } else if (line.startsWith("---") && line.trim() === "---") {
      blocks.push({ type: "hr" }); i++
    } else if (line.startsWith("| ")) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith("|")) {
        const row = lines[i].split("|").slice(1, -1).map((c) => c.trim())
        if (!row.every((c) => /^[-:]+$/.test(c))) rows.push(row)
        i++
      }
      if (rows.length > 0) blocks.push({ type: "table", rows })
    } else if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*] /, "").trim()); i++
      }
      blocks.push({ type: "ul", items })
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, "").trim()); i++
      }
      blocks.push({ type: "ol", items })
    } else if (line.trim() === "") {
      i++
    } else {
      const parts: string[] = []
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].startsWith("#") &&
        !lines[i].startsWith("|") &&
        !/^[-*] /.test(lines[i]) &&
        !/^\d+\. /.test(lines[i])
      ) {
        parts.push(lines[i]); i++
      }
      if (parts.length > 0) blocks.push({ type: "p", text: parts.join(" ") })
    }
  }
  return blocks
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const re = /(\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\))/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[0].startsWith("**")) {
      parts.push(<strong key={key++}>{m[2]}</strong>)
    } else {
      // SEO articles are generated content. Do not trust model-authored links.
      // Keep the anchor text visible, but add real internal links only from
      // safeRelatedLinks(), where every href is code-derived and route-known.
      parts.push(<span key={key++}>{m[3]}</span>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "h1": return <h1 className="font-serif text-4xl text-foreground md:text-5xl mt-8 mb-4">{renderInline(block.text)}</h1>
    case "h2": return <h2 className="font-serif text-3xl text-foreground md:text-4xl mt-8 mb-3">{renderInline(block.text)}</h2>
    case "h3": return <h3 className="font-serif text-xl text-foreground mt-6 mb-2">{renderInline(block.text)}</h3>
    case "p": return <p className="text-sm leading-relaxed text-muted-foreground md:text-base mb-4">{renderInline(block.text)}</p>
    case "ul":
      return (
        <ul className="list-disc list-inside space-y-1 mb-4 text-sm text-muted-foreground md:text-base">
          {block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
        </ul>
      )
    case "ol":
      return (
        <ol className="list-decimal list-inside space-y-1 mb-4 text-sm text-muted-foreground md:text-base">
          {block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
        </ol>
      )
    case "table":
      return (
        <div className="overflow-x-auto mb-4">
          <table className="w-full border border-border/60 text-sm text-muted-foreground">
            <thead>
              <tr className="bg-card/60">
                {block.rows[0]?.map((cell, i) => (
                  <th key={i} className="border border-border/40 px-3 py-2 text-left font-mono text-[11px] tracking-[0.12em] uppercase text-foreground">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.slice(1).map((row, ri) => (
                <tr key={ri} className="even:bg-card/20">
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-border/40 px-3 py-2">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case "hr": return <hr className="border-border/60 my-6" />
    default: return null
  }
}

// ─── Related links ────────────────────────────────────────────────────────────

const STATIC_RELATED_LINKS = {
  en: [
    { label: "What is Fanju?", href: "/what-is-fanju" },
    { label: "Social Dining", href: "/social-dining" },
    { label: "All Cities", href: "/cities" },
    { label: "All Categories", href: "/categories" },
    { label: "FAQ", href: "/faq" },
  ],
  zh: [
    { label: "Fanju / 饭局是什么", href: "/what-is-fanju" },
    { label: "饭局社交", href: "/social-dining" },
    { label: "全部城市", href: "/cities" },
    { label: "全部饭局类型", href: "/categories" },
    { label: "常见问题", href: "/faq" },
  ],
} satisfies Record<"en" | "zh", RelatedLink[]>

function addUniqueLink(list: RelatedLink[], item: RelatedLink, currentPath: string) {
  if (!item.href || item.href === currentPath) return
  if (list.some((x) => x.href === item.href)) return
  list.push(item)
}

function cityCategoryFromPath(pathname: string) {
  const normalized = pathname.replace(/^\/en(?=\/)/, "")
  const match = normalized.match(/^\/city\/([^/]+)(?:\/([^/]+))?$/)
  if (!match) return { citySlug: "", categorySlug: "" }
  return { citySlug: match[1] || "", categorySlug: match[2] || "" }
}

function safeRelatedLinks(currentPath: string, isEn: boolean): RelatedLink[] {
  const locale = isEn ? "en" : "zh"
  const links: RelatedLink[] = []
  const { citySlug, categorySlug } = cityCategoryFromPath(currentPath)
  const city = citySlug ? getCity(citySlug) : undefined
  const category = categorySlug ? getCategory(categorySlug) : undefined
  const cityPrefix = isEn ? "/en/city" : "/city"
  const categoryPrefix = isEn ? "/en/category" : "/category"

  if (city) {
    addUniqueLink(
      links,
      {
        label: isEn ? `${city.nameEn} dinner guide` : `${city.name}饭局`,
        href: `${cityPrefix}/${city.slug}`,
      },
      currentPath,
    )
  }

  if (category) {
    addUniqueLink(
      links,
      {
        label: isEn ? category.nameEn : category.name,
        href: `${categoryPrefix}/${category.slug}`,
      },
      currentPath,
    )
  }

  if (city && category) {
    addUniqueLink(
      links,
      {
        label: isEn ? `${city.nameEn} ${category.nameEn}` : `${city.name}${category.name}`,
        href: `${cityPrefix}/${city.slug}/${category.slug}`,
      },
      currentPath,
    )
  }

  for (const item of STATIC_RELATED_LINKS[locale]) {
    addUniqueLink(links, item, currentPath)
  }

  return links.slice(0, 8)
}

function RelatedLinksGrid({ links }: { links: RelatedLink[] }) {
  return (
    <div className="grid grid-cols-1 gap-px border border-border/60 bg-border/60">
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="bg-card/45 px-3 py-3 text-sm text-foreground transition-colors hover:text-accent"
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SeoReadyArticlePageProps {
  article: SeoReadyArticle
  /** The actual URL path being rendered (may differ from article.canonicalPath on fallback). */
  currentPath: string
}

export function SeoReadyArticlePage({ article, currentPath }: SeoReadyArticlePageProps) {
  const blocks = parseMarkdown(article.body)

  // Language is determined by the current URL path, not the article's lang field.
  // This ensures fallback pages show the correct UI language.
  const isEn = currentPath.startsWith("/en/")
  const alternatePath = getAlternatePath(currentPath)
  const canonicalUrl = `${SITE_URL}${currentPath}`
  const relatedLinks = safeRelatedLinks(currentPath, isEn)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    url: canonicalUrl,
    inLanguage: isEn ? "en" : "zh-CN",
    publisher: { "@type": "Organization", name: isEn ? "Fanju" : "饭局 Fanju", url: SITE_URL },
  }

  const breadcrumbs = [
    { label: isEn ? "Fanju" : "饭局 Fanju", href: "/" },
    { label: article.title, href: currentPath },
  ]

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.label,
      item: `${SITE_URL}${b.href}`,
    })),
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang={isEn ? "en" : "zh-CN"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />

      {/* Breadcrumb + language toggle */}
      <nav aria-label="breadcrumb" className="border-b border-border/40 bg-card/20">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-2 md:px-8">
          <ol className="flex flex-wrap items-center gap-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden>/</span>}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="transition-colors hover:text-accent">{crumb.label}</Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
          {/* Language toggle — always shown, target is always the derived alternatePath */}
          <Link
            href={alternatePath}
            className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-accent"
          >
            {isEn ? "中文" : "English"}
          </Link>
        </div>
      </nav>

      {/* Article body */}
      <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16 lg:grid lg:grid-cols-[1fr_280px] lg:gap-12">
        <article className="prose-fanju">
          {blocks.map((block, i) => <RenderBlock key={i} block={block} />)}

          <section aria-labelledby="safe-related-links" className="mt-10 border-t border-border/60 pt-8">
            <h2 id="safe-related-links" className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground uppercase mb-4">
              {isEn ? "Explore related Fanju pages" : "继续浏览相关饭局页面"}
            </h2>
            <RelatedLinksGrid links={relatedLinks} />
          </section>
        </article>

        {/* Sidebar */}
        <aside className="mt-12 space-y-6 lg:mt-0">
          <div>
            <h2 className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground uppercase mb-4">
              {isEn ? "Related Pages" : "相关页面"}
            </h2>
            <RelatedLinksGrid links={relatedLinks} />
          </div>
          <Link
            href="/"
            className="flex border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.18em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent"
          >
            {isEn ? "Back to Home" : "回到首页"}
          </Link>
        </aside>
      </div>

      <SiteFooter />
    </main>
  )
}

// ─── Metadata helper ──────────────────────────────────────────────────────────

/**
 * @param article  The article being rendered (may be a fallback).
 * @param currentPath  The actual URL path (determines canonical + hreflang).
 */
export function seoReadyArticleMetadata(article: SeoReadyArticle, currentPath: string) {
  const isEn = currentPath.startsWith("/en/")
  const alternatePath = getAlternatePath(currentPath)

  const zhPath = isEn ? alternatePath : currentPath
  const enPath = isEn ? currentPath : alternatePath

  return {
    title: article.title,
    description: article.description || article.title,
    alternates: {
      canonical: currentPath,
      languages: {
        "zh-CN": zhPath,
        "en": enPath,
      },
    },
    openGraph: {
      title: article.title,
      description: article.description || article.title,
      url: `${SITE_URL}${currentPath}`,
      type: "article" as const,
    },
  }
}
