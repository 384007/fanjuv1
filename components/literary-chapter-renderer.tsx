"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

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
  const [isChapterListOpen, setIsChapterListOpen] = useState(false)

  const goToPage = (newPage: number) => {
    if (newPage < 0 || newPage >= chapters.length) return
    setDirection(newPage > currentPage ? 1 : -1)
    setCurrentPage(newPage)
    // Close modal if open
    if (isChapterListOpen) setIsChapterListOpen(false)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPage(currentPage - 1)
      if (e.key === 'ArrowRight') goToPage(currentPage + 1)
      if (e.key.toLowerCase() === 'd' || e.key === '目录') {
        // 'd' or perhaps not, keep simple
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentPage, isChapterListOpen])

  const currentChapter = chapters[currentPage] || chapters[0]
  const rendered = renderLiteraryMarkdown(currentChapter.content)
  const progress = chapters.length > 1 ? Math.round(((currentPage + 1) / chapters.length) * 100) : 100

  const prevChapter = currentPage > 0 ? chapters[currentPage - 1] : null
  const nextChapter = currentPage < chapters.length - 1 ? chapters[currentPage + 1] : null

  return (
    <>
      {chapters.length > 1 && (
        <div className="mb-6 flex items-center justify-between text-sm text-[#6b6459] dark:text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="font-medium tracking-wide">第 {currentPage + 1} 章 / 共 {chapters.length} 章</span>
            <span className="text-[#1a1814] dark:text-foreground/90 font-serif text-[15px] tracking-[-0.01em]">
              {currentChapter.title}
            </span>
          </div>
          <span className="text-xs opacity-50 hidden md:inline">(方向键 ← → 翻页 · 点击目录浏览)</span>
        </div>
      )}

      {/* Subtle progress bar */}
      {chapters.length > 1 && (
        <div className="h-px w-full bg-[#d4c9b3]/40 dark:bg-white/10 mb-8 overflow-hidden">
          <div
            className="h-px bg-[#1a1814] dark:bg-white transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="relative overflow-hidden min-h-[420px]">
        <div
          key={currentPage}
          className="transition-all duration-300 ease-out"
          style={{
            transform: `translateX(${direction * 18}px)`,
            opacity: 0.96,
          }}
        >
          <div className="prose prose-neutral max-w-none text-[15.5px] leading-[1.82] text-[#1a1814] dark:prose-invert dark:text-foreground/90">
            {rendered}
          </div>
        </div>
      </div>

      {/* Premium bottom navigation - no ugly number grid */}
      {chapters.length > 1 && (
        <div className="mt-14 border-t border-[#d4c9b3] pt-7 dark:border-border/60">
          <div className="flex items-center justify-between gap-4">
            {/* Previous */}
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="group flex flex-col items-start gap-0.5 px-4 py-2 text-left disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f0e9d9]/60 dark:hover:bg-white/5 rounded-lg transition-all active:scale-[0.985]"
            >
              <span className="text-[10px] tracking-[1.5px] uppercase text-[#6b6459]/70 dark:text-muted-foreground/70">上一章</span>
              <span className="font-serif text-[14px] leading-tight text-[#1a1814] dark:text-foreground/90 group-hover:text-[#3a3429] dark:group-hover:text-white/90 max-w-[210px] truncate">
                {prevChapter ? prevChapter.title : '—'}
              </span>
            </button>

            {/* Center: Catalog trigger - mainstream premium pattern */}
            <button
              onClick={() => setIsChapterListOpen(true)}
              className="flex flex-col items-center justify-center px-8 py-2.5 rounded-xl border border-[#d4c9b3] hover:bg-[#f0e9d9] dark:border-border/70 dark:hover:bg-white/5 transition-all active:scale-[0.985] min-w-[148px]"
              aria-label="打开章节目录"
            >
              <span className="text-[10px] tracking-[2px] text-[#6b6459]/70 dark:text-muted-foreground/70">目录</span>
              <span className="font-medium text-sm text-[#1a1814] dark:text-foreground/90 mt-px">
                {currentPage + 1} / {chapters.length}
              </span>
            </button>

            {/* Next */}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === chapters.length - 1}
              className="group flex flex-col items-end gap-0.5 px-4 py-2 text-right disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#f0e9d9]/60 dark:hover:bg-white/5 rounded-lg transition-all active:scale-[0.985]"
            >
              <span className="text-[10px] tracking-[1.5px] uppercase text-[#6b6459]/70 dark:text-muted-foreground/70">下一章</span>
              <span className="font-serif text-[14px] leading-tight text-[#1a1814] dark:text-foreground/90 group-hover:text-[#3a3429] dark:group-hover:text-white/90 max-w-[210px] truncate">
                {nextChapter ? nextChapter.title : '—'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Elegant Chapter List Modal - top-tier mainstream (like WeChat Read / high-end literary apps) */}
      <Dialog open={isChapterListOpen} onOpenChange={setIsChapterListOpen}>
        <DialogContent className="max-w-lg bg-[#f8f5ef] dark:bg-[#111] border-[#d4c9b3] dark:border-white/15 p-0 rounded-2xl shadow-2xl">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-[#d4c9b3]/60 dark:border-white/10">
            <DialogTitle className="font-serif text-xl tracking-tight text-[#1a1814] dark:text-foreground">
              目录 · 共 {chapters.length} 章
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[62vh] overflow-y-auto py-2 px-2 custom-scroll">
            {chapters.map((ch, idx) => {
              const isActive = idx === currentPage
              return (
                <button
                  key={idx}
                  onClick={() => goToPage(idx)}
                  className={`w-full text-left px-5 py-3.5 rounded-xl mb-1 flex items-start gap-4 transition-all active:bg-[#e8e0d0] dark:active:bg-white/5 ${
                    isActive
                      ? 'bg-[#1a1814] text-white dark:bg-white dark:text-[#1a1814]'
                      : 'hover:bg-[#f0e9d9] dark:hover:bg-white/5 text-[#1a1814] dark:text-foreground/90'
                  }`}
                >
                  <span className={`font-mono text-xs mt-1 w-9 shrink-0 tracking-widest ${isActive ? 'opacity-80' : 'opacity-50'}`}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className={`font-serif text-[15px] leading-snug tracking-[-0.01em] text-left ${isActive ? '' : 'pr-3'}`}>
                    {ch.title}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-[10px] self-center tracking-[1px] opacity-60">当前</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="px-6 py-4 border-t border-[#d4c9b3]/60 dark:border-white/10 flex justify-end">
            <DialogClose asChild>
              <button className="text-sm px-5 py-1.5 rounded-lg hover:bg-[#f0e9d9] dark:hover:bg-white/10 transition-colors text-[#6b6459] dark:text-muted-foreground">
                关闭
              </button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
