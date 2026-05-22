interface Props {
  eyebrow: string
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="size-1 rounded-full bg-[var(--gold)]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--gold)]/80">
              {eyebrow}
            </span>
          </div>
          <h1 className="font-serif italic text-4xl md:text-5xl text-foreground leading-none text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 font-mono text-xs text-muted-foreground max-w-xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="gold-hairline h-px mt-8" />
    </div>
  )
}
