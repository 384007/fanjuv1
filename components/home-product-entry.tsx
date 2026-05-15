import Link from "next/link"
import { fanjuProductNames } from "@/lib/fanju-product-names"

const topLinks = [
  ["开始组局", "/create"],
  ["饭局口令", "/invite"],
  ["产品地图", "/product-map"],
  ["分享渠道", "/channels"],
  ["饭局设置", "/event-settings"],
  ["席位确认", "/responses"],
]

export function HomeProductEntry() {
  return (
    <section className="border-b border-border/60 bg-background">
      <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-8 md:py-20">
        <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">FANJU PRODUCT</div>
        <div className="mt-5 grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <h2 className="font-serif text-3xl leading-tight text-foreground md:text-5xl">饭局不是内容页，是完整组局产品。</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground md:text-base">从创建饭局、生成口令、分发到中国主流社交平台、席位确认、同桌名单、桌前提醒到饭后回忆，首页直接进入完整功能闭环。</p>
          </div>
          <div className="grid grid-cols-2 gap-px border border-border/60 bg-border/60 md:grid-cols-3">
            {topLinks.map(([label, href]) => (
              <Link key={href} href={href} className="bg-card/40 p-4 text-sm text-foreground hover:bg-card/70 hover:text-accent">
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60 md:grid-cols-4">
          {fanjuProductNames.slice(0, 12).map(([name, desc, href]) => (
            <Link key={href} href={href} className="bg-card/35 p-4 hover:bg-card/70">
              <h3 className="font-serif text-xl text-foreground">{name}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
