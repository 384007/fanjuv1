"use client"

import { useEffect, useState } from "react"

export function ApiPanel() {
  const [health, setHealth] = useState("loading")
  const [dinners, setDinners] = useState("loading")
  const [channels, setChannels] = useState("loading")
  const [tools, setTools] = useState("loading")

  useEffect(() => {
    fetch("/api/health").then((r) => r.text()).then(setHealth).catch((e) => setHealth(String(e)))
    fetch("/api/dinners").then((r) => r.text()).then(setDinners).catch((e) => setDinners(String(e)))
    fetch("/api/channels").then((r) => r.text()).then(setChannels).catch((e) => setChannels(String(e)))
    fetch("/api/tools").then((r) => r.text()).then(setTools).catch((e) => setTools(String(e)))
  }, [])

  return (
    <section className="border-b border-border/60">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px border-x border-border/60 bg-border/60 px-4 py-12 md:grid-cols-2 md:px-8 md:py-16">
        <Box title="/api/health" body={health} />
        <Box title="/api/dinners" body={dinners} />
        <Box title="/api/channels" body={channels} />
        <Box title="/api/tools" body={tools} />
      </div>
    </section>
  )
}

function Box({ title, body }: { title: string; body: string }) {
  return <article className="bg-card/40 p-5"><h2 className="font-serif text-xl text-foreground">{title}</h2><pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{body}</pre></article>
}
