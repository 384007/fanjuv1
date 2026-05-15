"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Dinner = {
  id: string
  slug: string
  title: string
  city: string
  area: string
  type: string
  date: string
  time: string
  seats: number
  state: string
  summary: string
}

export function DinnerListClient() {
  const [items, setItems] = useState<Dinner[]>([])

  useEffect(() => {
    fetch("/data/dinners.json")
      .then((r) => r.json())
      .then((json) => setItems(json.data || []))
      .catch(() => setItems([]))
  }, [])

  return (
    <div className="grid grid-cols-1 gap-px border border-border/60 bg-border/60 md:grid-cols-3">
      {items.map((item) => (
        <article key={item.id} className="bg-card/40 p-6">
          <div className="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">{item.city} · {item.area}</div>
          <h2 className="mt-4 font-serif text-2xl text-foreground">{item.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
          <div className="mt-4 text-xs text-muted-foreground">{item.date} · {item.time} · {item.seats}</div>
          <div className="mt-5 flex gap-2">
            <Link href="/invite" className="border border-border px-3 py-2 text-xs text-foreground hover:text-accent">饭局口令</Link>
            <Link href="/create" className="border border-border px-3 py-2 text-xs text-foreground hover:text-accent">创建同类</Link>
          </div>
        </article>
      ))}
    </div>
  )
}
