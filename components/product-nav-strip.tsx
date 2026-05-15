import Link from "next/link"

const links = [
  ["产品地图", "/product-map"],
  ["开始组局", "/create"],
  ["饭局口令", "/invite"],
  ["中国渠道", "/channels"],
  ["饭局设置", "/event-settings"],
  ["席位确认", "/responses"],
  ["凑局时间", "/find-time"],
  ["桌前广播", "/table-broadcast"],
]

export function ProductNavStrip() {
  return (
    <section className="border-b border-border/60 bg-card/20">
      <div className="mx-auto flex max-w-[1400px] gap-2 overflow-x-auto px-4 py-3 md:px-8">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="shrink-0 border border-border/70 bg-background/70 px-3 py-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase hover:border-accent/60 hover:text-accent">
            {label}
          </Link>
        ))}
      </div>
    </section>
  )
}
