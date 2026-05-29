import { notFound } from "next/navigation"
import { readFileSync, existsSync, readdirSync } from "fs"
import { join } from "path"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SeoReadyArticlePage } from "@/components/seo-ready-article-page"

type Props = {
  params: Promise<{ slug: string[] }>
}

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)
  if (!match) {
    return { frontmatter: {}, body: raw }
  }
  const frontmatter: Record<string, string> = {}
  match[1].split("\n").forEach(line => {
    const [key, ...rest] = line.split(":")
    if (key) {
      frontmatter[key.trim()] = rest.join(":").trim().replace(/^["']|["']$/g, "")
    }
  })
  return { frontmatter, body: match[2] }
}



// Find the actual .md file that corresponds to a requested URL slug
function findLiteraryFileByUrlSlug(requestedSlug: string): string | null {
  const literaryDir = join(process.cwd(), "content", "literary")

  function scan(dir: string): string | null {
    const entries = readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        const found = scan(fullPath)
        if (found) return found
      } else if (entry.name.endsWith(".md")) {
        try {
          const raw = readFileSync(fullPath, "utf8")
          const { frontmatter } = parseFrontmatter(raw)
          const preferred = getPreferredSlug(frontmatter, entry.name)
          if (preferred === requestedSlug) {
            return fullPath
          }
        } catch (e) {
          // ignore bad files
        }
      }
    }
    return null
  }

  return scan(literaryDir)
}

export default async function LiteraryArticle({ params }: Props) {
  const { slug } = await params
  const requestedSlug = slug[0]

  const filePath = findLiteraryFileByUrlSlug(requestedSlug)

  if (!filePath || !existsSync(filePath)) {
    notFound()
  }

  const raw = readFileSync(filePath, "utf8")
  const { frontmatter, body } = parseFrontmatter(raw)

  // Construct a minimal SeoReadyArticle so we can reuse the project's excellent
  // typography, spacing, and markdown renderer (the same one used for all main articles).
  const article = {
    slug: requestedSlug,
    title: frontmatter.title || requestedSlug,
    description: frontmatter.description || frontmatter.subtitle || "",
    canonicalPath: `/literary/${requestedSlug}`,
    body,
    renderMode: "source" as const,
    aiQualityScore: 95,
    status: "ready",
    lang: "zh",
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <div className="mx-auto max-w-[720px] px-5 pt-8 pb-16 md:px-6">
        {/* Small literary label */}
        <div className="mb-6 font-mono text-[10px] tracking-[3px] text-muted-foreground">
          饭局文学系列
        </div>

        <SeoReadyArticlePage
          article={article as any}
          currentPath={`/literary/${requestedSlug}`}
          hasAlternateArticle={false}
        />
      </div>

      <SiteFooter />
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const requestedSlug = slug[0]
  const filePath = findLiteraryFileByUrlSlug(requestedSlug)

  if (!filePath || !existsSync(filePath)) {
    return { title: "未找到" }
  }

  const raw = readFileSync(filePath, "utf8")
  const { frontmatter } = parseFrontmatter(raw)

  return {
    title: frontmatter.title || "饭局文学",
    description: frontmatter.description || frontmatter.subtitle,
  }
}

// Helper to get preferred URL slug from frontmatter
function getPreferredSlug(frontmatter: Record<string, string>, filename: string): string {
  return (
    frontmatter.urlSlug ||
    frontmatter.slug ||
    filename.replace(/\.md$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  )
}

export function generateStaticParams() {
  const literaryDir = join(process.cwd(), "content", "literary")

  function scan(dir: string): { slug: string[] }[] {
    const entries = readdirSync(dir, { withFileTypes: true })
    const result: { slug: string[] }[] = []

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        result.push(...scan(fullPath))
      } else if (entry.name.endsWith(".md")) {
        try {
          const raw = readFileSync(fullPath, "utf8")
          const { frontmatter } = parseFrontmatter(raw)
          const preferred = getPreferredSlug(frontmatter, entry.name)
          // We use flat slugs for literary articles (no subfolders in URL)
          result.push({ slug: [preferred] })
        } catch (e) {
          console.warn("Failed to read literary file for static params:", fullPath)
        }
      }
    }

    return result
  }

  if (!existsSync(literaryDir)) {
    return []
  }

  return scan(literaryDir)
}
