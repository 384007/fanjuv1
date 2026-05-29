"use client"

import React, { useState, useEffect } from "react"

interface Chapter {
  title: string
  content: string
}

interface Props {
  chapters: Chapter[]
}

function renderInline(text: string): React.ReactNode {
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

export function LiteraryChapterRenderer({ chapters }: Props) {
  const [currentPage, setCurrentPage] = useState(0)
  const [direction, setDirection] = useState(0)

  const goToPage = (newPage: number) => {
    if (newPage < 0 || newPage >= chapters.length) return
    setDirection(newPage > currentPage ? 1 : -1)
    setCurrentPage(newPage)
  }

  useEffect(() => {
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

      <div className="relative overflow-hidden min-h-[400px]">
        <div
          key={currentPage}
          className="transition-all duration-300 ease-out"
          style={{
            transform: `translateX(${direction * 20}px)`,
            opacity: 0.95,
          }}
        >
          <div className="prose prose-neutral max-w-none text-[15.5px] leading-[1.82] text-[#1a1814] dark:prose-invert dark:text-foreground/90">
            {rendered}
          </div>
        </div>
      </div>

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
