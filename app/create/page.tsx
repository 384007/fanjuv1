import type { Metadata } from "next"
import Link from "next/link"
import { CreateDinnerForm } from "@/components/create-dinner-form"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export const metadata: Metadata = {
  title: "创建饭局｜饭局 Fanju",
  description: "创建饭局页面，连接 Fanju 后端接口，提交后返回饭局草稿数据。",
  alternates: { canonical: "/create" },
}

export default function CreateDinnerPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1100px] px-4 py-16 md:px-8 md:py-24">
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">CREATE DINNER</div>
          <h1 className="mt-7 font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">创建一场饭局</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">填写饭局信息，提交到 /api/dinners，生成饭局草稿数据。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/ops" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">API 状态</Link>
            <Link href="/invite" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局口令</Link>
          </div>
        </div>
      </section>
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[760px] px-4 py-12 md:px-8 md:py-16">
          <CreateDinnerForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
