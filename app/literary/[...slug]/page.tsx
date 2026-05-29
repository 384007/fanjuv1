import { notFound } from "next/navigation"
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

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

function renderLiteraryBody(md: string) {
  const lines = md.trim().split("\n")
  const elements: React.ReactNode[] = []
  let currentParagraph: string[] = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(" ").trim()
      if (text) {
        // Very basic inline formatting
        const formatted = text
          .replace(/\*\*(.+?)\*\*/g, '<strong class="font-medium text-foreground">$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')

        elements.push(
          <p 
            key={elements.length} 
            className="mb-6 text-[15.5px] leading-[1.82] text-foreground/90 tracking-[-0.005em]"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        )
      }
      currentParagraph = []
    }
  }

  lines.forEach((line) => {
    const trimmed = line.trim()

    // Headings
    if (trimmed.startsWith("# ")) {
      flushParagraph()
      elements.push(
        <h1 key={elements.length} className="mt-14 mb-7 font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-foreground">
          {trimmed.slice(2)}
        </h1>
      )
      return
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph()
      elements.push(
        <h2 key={elements.length} className="mt-12 mb-6 font-serif text-[28px] leading-[1.15] tracking-[-0.015em] text-foreground">
          {trimmed.slice(3)}
        </h2>
      )
      return
    }
    if (trimmed.startsWith("### ")) {
      flushParagraph()
      elements.push(
        <h3 key={elements.length} className="mt-9 mb-4 font-serif text-[20px] leading-tight text-foreground/95">
          {trimmed.slice(4)}
        </h3>
      )
      return
    }

    // Horizontal rule
    if (trimmed === "---" || trimmed === "***") {
      flushParagraph()
      elements.push(<hr key={elements.length} className="my-10 border-border/60" />)
      return
    }

    // Empty line = paragraph break
    if (trimmed === "") {
      flushParagraph()
      return
    }

    currentParagraph.push(trimmed)
  })

  flushParagraph()
  return elements
}

export default async function LiteraryArticle({ params }: Props) {
  const { slug } = await params
  const filePath = join(process.cwd(), "content", "literary", ...slug) + ".md"

  if (!existsSync(filePath)) {
    notFound()
  }

  const raw = readFileSync(filePath, "utf8")
  const { frontmatter, body } = parseFrontmatter(raw)

  const title = frontmatter.title || slug[slug.length - 1]
  const subtitle = frontmatter.subtitle || frontmatter.description

  return (
    <div className="min-h-screen bg-[#f9f7f2] text-[#1f1f1f] dark:bg-background dark:text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-[720px] px-5 pt-10 pb-20 md:px-6 md:pt-14">
        <article>
          <header className="mb-10 border-b border-[#e5e0d5] pb-8 dark:border-border/50">
            <div className="mb-2 font-mono text-[10px] tracking-[4px] text-[#6b6459]/70 dark:text-muted-foreground/70">
              饭局文学系列
            </div>
            <h1 className="font-serif text-[36px] leading-[1.08] tracking-[-0.025em] text-balance md:text-[42px]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-4 max-w-[620px] text-[17px] leading-tight text-[#4a453e] dark:text-muted-foreground">
                {subtitle}
              </p>
            )}
          </header>

          <div className="max-w-[680px] literary-body">
            {renderLiteraryBody(body)}
          </div>
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const filePath = join(process.cwd(), "content", "literary", ...slug) + ".md"

  if (!existsSync(filePath)) {
    return { title: "未找到" }
  }

  const raw = readFileSync(filePath, "utf8")
  const { frontmatter } = parseFrontmatter(raw)

  return {
    title: frontmatter.title || "饭局文学",
    description: frontmatter.description || frontmatter.subtitle,
  }
}

export async function generateStaticParams() {
  return []
}
