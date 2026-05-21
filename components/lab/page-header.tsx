interface Props {
  eyebrow: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <div className="mb-10">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="size-1 rounded-full bg-[var(--gold)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--gold)]/80">
              {eyebrow}
            </span>
          </div>
          <h1 className="font-serif italic text-5xl md:text-6xl text-foreground leading-none tracking-tight text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 font-mono text-xs text-muted-foreground max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="gold-hairline h-px mt-8" />
    </div>
  )
}

