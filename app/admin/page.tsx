import Link from "next/link"

const SECTIONS = [
  {
    href: "/admin/lab/seo",
    label: "SEO Atelier",
    sub: "质检 · Quality Control",
    desc: "Article SEO scores, Claude verdicts, review ledger",
  },
  {
    href: "/admin/lab/content-lab",
    label: "Content Lab",
    sub: "内容 · Atelier",
    desc: "Generate articles with Claude, dispatch to platforms",
  },
  {
    href: "/admin/lab/publish-jobs",
    label: "Publish Jobs",
    sub: "任务 · Dispatch",
    desc: "Every article × platform job, status & published URLs",
  },
  {
    href: "/admin/lab/platform-accounts",
    label: "Platforms",
    sub: "平台 · Network",
    desc: "15 channels, cookie health, daily caps",
  },
]

export default function AdminIndex() {
  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <div className="font-mono text-[9px] uppercase tracking-[0.35em] text-amber-400/70 mb-3">
          Fanju AI SEO Lab
        </div>
        <h1 className="font-serif italic text-5xl text-zinc-100 mb-3">Dashboard</h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          AI-driven content generation · 15-platform publish pipeline · Cookie-authenticated
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group border border-zinc-800 hover:border-amber-500/50 bg-zinc-900/60 p-6 rounded-sm transition-colors"
          >
            <div className="font-serif italic text-2xl text-zinc-100 mb-1 group-hover:text-amber-400 transition-colors">
              {s.label}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-500 mb-3">
              {s.sub}
            </div>
            <div className="font-mono text-[11px] text-zinc-400">{s.desc}</div>
          </Link>
        ))}
      </div>

      <div className="border border-zinc-800 bg-zinc-900/40 rounded-sm p-5">
        <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-500 mb-3">
          Quick Links
        </div>
        <div className="flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.25em]">
          <Link href="/admin/login" className="text-amber-400 hover:underline">
            Login / 登录
          </Link>
          <span className="text-zinc-700">·</span>
          <a href="https://github.com/384007/fanjuv1/pull/1" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-200">
            PR #1
          </a>
          <span className="text-zinc-700">·</span>
          <a href="https://modal.com" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-200">
            Modal Dashboard
          </a>
          <span className="text-zinc-700">·</span>
          <Link href="/docs/CUSTOM-SECRET.md" className="text-zinc-400 hover:text-zinc-200">
            Secret Docs
          </Link>
        </div>
      </div>
    </div>
  )
}
