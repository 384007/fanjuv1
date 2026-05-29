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



// Find the actual .md file using urlSlug (or fallback)
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

// Parse body into chapters by ## headings
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

  // If no ## found, treat everything as one chapter
  if (chapters.length === 0) {
    return [{ title: "正文", content: body }]
  }

  return chapters
}


  const [currentPage, setCurrentPage] = React.useState(0)
  const [direction, setDirection] = React.useState(0) // -1 left, +1 right for slide animation

  const goToPage = (newPage: number) => {
    if (newPage < 0 || newPage >= chapters.length) return
    setDirection(newPage > currentPage ? 1 : -1)
    setCurrentPage(newPage)
  }

  // Keyboard arrow support
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPage(currentPage - 1)
      if (e.key === 'ArrowRight') goToPage(currentPage + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentPage])

  const currentChapter = chapters[currentPage] || chapters[0]
  const rendered = renderLiteraryMarkdown(currentChapter.content)

  return (
    <>
      {chapters.length > 1 && (
        <div className="mb-6 text-sm text-[#6b6459] dark:text-muted-foreground flex items-center gap-4">
          <span>第 {currentPage + 1} 章 / 共 {chapters.length} 章　·　{currentChapter.title}</span>
          <span className="text-xs opacity-60">(← → 方向键翻页)</span>
        </div>
      )}

      {/* Sliding container */}
      <div className="relative overflow-hidden">
        <div
          key={currentPage}
          className="transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(${direction * -8}px)`,
            opacity: 1,
          }}
        >
          <div className="prose prose-neutral max-w-none text-[15.5px] leading-[1.82] text-[#1a1814] dark:prose-invert dark:text-foreground/90">
            {rendered}
          </div>
        </div>
      </div>

      {/* 1.2.3 + Arrow navigation */}
      {chapters.length > 1 && (
        <div className="mt-12 flex items-center justify-center gap-3 border-t border-[#d4c9b3] pt-8 dark:border-border/60">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="px-3 py-1 text-sm border rounded disabled:opacity-30 hover:bg-[#f0e9d9] dark:hover:bg-white/10"
          >
            ←
          </button>

          {chapters.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx)}
              className={`w-8 h-8 text-sm font-medium rounded-full border transition-all ${
                idx === currentPage
                  ? 'bg-[#1a1814] text-white border-[#1a1814] dark:bg-white dark:text-[#1a1814]'
                  : 'border-[#d4c9b3] hover:bg-[#f0e9d9] dark:border-border/60 dark:hover:bg-white/10'
              }`}
            >
              {idx + 1}
            </button>
          ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === chapters.length - 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-30 hover:bg-[#f0e9d9] dark:hover:bg-white/10"
          >
            →
          </button>
        </div>
      )}
    </>
  )
}

// Proper literary Markdown renderer (supports images + basic formatting)
function renderLiteraryMarkdown(md: string): React.ReactNode {
  const lines = md.trim().split('\n')
  const elements: React.ReactNode[] = []
  let currentParagraph: string[] = []

  const flushParagraph = () => {
    if (currentParagraph.length === 0) return
    const text = currentParagraph.join(' ').trim()
    if (text) {
      elements.push(
        <p key={elements.length} className="mb-6">
          {renderInline(text)}
        </p>
      )
    }
    currentParagraph = []
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim()

    // Image: ![alt](src)
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (imgMatch) {
      flushParagraph()
      elements.push(
        <figure key={elements.length} className="my-8">
          <img 
            src={imgMatch[2]} 
            alt={imgMatch[1]} 
            className="w-full rounded-lg shadow-sm border border-[#d4c9b3]/40 dark:border-white/10" 
            loading="lazy"
          />
          {imgMatch[1] && (
            <figcaption className="mt-2 text-center text-xs text-[#6b6459] dark:text-muted-foreground/70">
              {imgMatch[1]}
            </figcaption>
          )}
        </figure>
      )
      return
    }

    // Headings
    if (line.startsWith('# ')) { flushParagraph(); elements.push(<h1 key={elements.length} className="mt-12 mb-6 font-serif text-3xl tracking-tight">{line.slice(2)}</h1>); return }
    if (line.startsWith('## ')) { flushParagraph(); elements.push(<h2 key={elements.length} className="mt-10 mb-5 font-serif text-2xl tracking-tight">{line.slice(3)}</h2>); return }
    if (line.startsWith('### ')) { flushParagraph(); elements.push(<h3 key={elements.length} className="mt-8 mb-4 font-serif text-xl tracking-tight">{line.slice(4)}</h3>); return }

    if (line === '---' || line === '***') { flushParagraph(); elements.push(<hr key={elements.length} className="my-10 border-[#d4c9b3] dark:border-white/15" />); return }
    if (line === '') { flushParagraph(); return }

    currentParagraph.push(line)
  })

  flushParagraph()
  return elements
}

function renderInline(text: string): React.ReactNode {
  // Very basic inline (bold, italic)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-medium text-foreground">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
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

// Keep generateStaticParams for static export (uses urlSlug from frontmatter)
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
