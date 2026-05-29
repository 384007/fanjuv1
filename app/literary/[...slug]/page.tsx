import { notFound } from "next/navigation"
import { readFileSync, existsSync, readdirSync } from "fs"
import { join } from "path"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { LiteraryChapterRenderer } from "@/components/literary-chapter-renderer"

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

function parseIntoChapters(body: string) {
  const lines = body.split('\n')
  const chapters: { title: string; content: string }[] = []
  let currentTitle = "正文"
  let currentLines: string[] = []

  for (const line of lines) {
    if (line.trim().startsWith('## ')) {
      if (currentLines.length > 0) {
        chapters.push({ title: currentTitle, content: currentLines.join('\n') })
      }
      currentTitle = line.trim().replace(/^##\s+/, '')
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }

  if (currentLines.length > 0) {
    chapters.push({ title: currentTitle, content: currentLines.join('\n') })
  }

  if (chapters.length === 0) {
    return [{ title: "正文", content: body }]
  }

  return chapters
}

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
          const preferred = frontmatter.urlSlug || frontmatter.slug || entry.name.replace(/\.md$/, '')
          if (preferred === requestedSlug) {
            return fullPath
          }
        } catch (e) {}
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

  const title = frontmatter.title || requestedSlug
  const subtitle = frontmatter.subtitle || frontmatter.description

  const chapters = parseIntoChapters(body)

  return (
    <div className="min-h-screen bg-[#f8f5ef] text-[#1a1814] dark:bg-background dark:text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-[760px] px-5 pt-10 pb-24 md:px-6">
        <article className="literary-article">
          <header className="mb-12 border-b border-[#d4c9b3] pb-8 dark:border-border/60">
            <div className="mb-3 font-mono text-[10px] tracking-[4px] text-[#6b6459]/80 dark:text-muted-foreground/70">
              饭局文学系列
            </div>
            <h1 className="font-serif text-[38px] leading-[1.08] tracking-[-0.025em] md:text-[44px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-4 max-w-[640px] text-[17px] leading-tight text-[#4a453e] dark:text-muted-foreground">
                {subtitle}
              </p>
            )}
          </header>

          <LiteraryChapterRenderer chapters={chapters} />
        </article>
      </main>

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
          const preferred = frontmatter.urlSlug || frontmatter.slug || entry.name.replace(/\.md$/, '')
          result.push({ slug: [preferred] })
        } catch (e) {}
      }
    }
    return result
  }

  if (!existsSync(literaryDir)) return []
  return scan(literaryDir)
}
