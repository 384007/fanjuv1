interface Props {
  label: string
  value: string | number
  hint?: string
  accent?: "gold" | "wine" | "default"
}

export function StatCard({ label, value, hint, accent = "default" }: Props) {
  const ring =
    accent === "gold"
      ? "before:bg-[var(--gold)]/40"
      : accent === "wine"
        ? "before:bg-[var(--wine)]/40"
        : "before:bg-border"

  return (
    <div
      className={`group relative bg-card/40 backdrop-blur-sm border border-border/40 hover:border-[var(--gold)]/40 transition-colors rounded-sm p-6 before:content-[''] before:absolute before:left-0 before:top-4 before:bottom-4 before:w-px ${ring}`}
    >
      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
        {label}
      </div>
      <div className="font-serif italic text-5xl text-foreground leading-none">{value}</div>
      {hint && (
        <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          {hint}
        </div>
      )}
    </div>
  )
}

