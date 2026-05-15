"use client"

import { useLanguage } from "@/components/language-provider"

const dinners = [
  { city_zh: "深圳", city_en: "SHENZHEN", cat_zh: "单身饭局", cat_en: "SINGLES", seats: "8/12", price: "¥888", delta: "+0.18" },
  { city_zh: "上海", city_en: "SHANGHAI", cat_zh: "兴趣饭局", cat_en: "INTEREST", seats: "6/8", price: "¥588", delta: "−0.07" },
  { city_zh: "北京", city_en: "BEIJING", cat_zh: "高端饭局", cat_en: "CURATED", seats: "4/10", price: "¥1,888", delta: "+0.62" },
  { city_zh: "杭州", city_en: "HANGZHOU", cat_zh: "创业饭局", cat_en: "FOUNDER", seats: "5/8", price: "¥1,288", delta: "+0.21" },
  { city_zh: "纽约", city_en: "NEW YORK", cat_zh: "海外华人", cat_en: "DIASPORA", seats: "9/12", price: "$88", delta: "+0.44" },
  { city_zh: "伦敦", city_en: "LONDON", cat_zh: "海外华人", cat_en: "DIASPORA", seats: "7/10", price: "£68", delta: "+0.12" },
  { city_zh: "东京", city_en: "TOKYO", cat_zh: "兴趣饭局", cat_en: "INTEREST", seats: "5/8", price: "¥9,800", delta: "+0.31" },
  { city_zh: "悉尼", city_en: "SYDNEY", cat_zh: "海外华人", cat_en: "DIASPORA", seats: "6/10", price: "A$98", delta: "−0.18" },
  { city_zh: "新加坡", city_en: "SINGAPORE", cat_zh: "商务饭局", cat_en: "BUSINESS", seats: "3/6", price: "S$388", delta: "+0.03" },
  { city_zh: "香港", city_en: "HONG KONG", cat_zh: "兴趣饭局", cat_en: "INTEREST", seats: "7/12", price: "HK$888", delta: "−0.41" },
  { city_zh: "多伦多", city_en: "TORONTO", cat_zh: "海外华人", cat_en: "DIASPORA", seats: "8/12", price: "C$78", delta: "+0.27" },
  { city_zh: "温哥华", city_en: "VANCOUVER", cat_zh: "单身饭局", cat_en: "SINGLES", seats: "6/10", price: "C$78", delta: "+0.55" },
  { city_zh: "广州", city_en: "GUANGZHOU", cat_zh: "兴趣饭局", cat_en: "INTEREST", seats: "9/14", price: "¥288", delta: "+1.10" },
  { city_zh: "成都", city_en: "CHENGDU", cat_zh: "单身饭局", cat_en: "SINGLES", seats: "6/12", price: "¥388", delta: "+0.02" },
  { city_zh: "墨尔本", city_en: "MELBOURNE", cat_zh: "海外华人", cat_en: "DIASPORA", seats: "5/10", price: "A$88", delta: "+0.09" },
  { city_zh: "洛杉矶", city_en: "LOS ANGELES", cat_zh: "海外华人", cat_en: "DIASPORA", seats: "7/12", price: "$78", delta: "+0.16" },
  { city_zh: "南京", city_en: "NANJING", cat_zh: "兴趣饭局", cat_en: "INTEREST", seats: "10/14", price: "¥288", delta: "+0.18" },
  { city_zh: "苏州", city_en: "SUZHOU", cat_zh: "高端饭局", cat_en: "CURATED", seats: "6/10", price: "¥1,288", delta: "−0.07" },
  { city_zh: "首尔", city_en: "SEOUL", cat_zh: "海外华人", cat_en: "DIASPORA", seats: "4/8", price: "₩98K", delta: "+0.22" },
  { city_zh: "巴黎", city_en: "PARIS", cat_zh: "高端饭局", cat_en: "CURATED", seats: "3/8", price: "€88", delta: "+0.07" },
]

export function LiveTicker() {
  const { lang, t } = useLanguage()
  const isZh = lang === "zh"

  // Duplicate the list to make seamless infinite marquee
  const items = [...dinners, ...dinners]

  return (
    <div className="border-b border-border/60 bg-background/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1400px] items-stretch px-4 md:px-8">
        <div className="flex shrink-0 items-center gap-2 border-r border-border/60 pr-5 py-3">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono text-[10px] tracking-[0.25em] text-accent uppercase">{t.tickerLabel}</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {/* fade edges */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent" />

          <div className="flex w-max animate-marquee items-center py-3">
            {items.map((d, i) => {
              const positive = d.delta.startsWith("+")
              return (
                <div
                  key={i}
                  className="flex shrink-0 items-center gap-2.5 border-r border-border/40 px-5 font-mono text-[11px] tracking-[0.12em] uppercase"
                >
                  <span className="text-foreground">{isZh ? d.city_zh : d.city_en}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{isZh ? d.cat_zh : d.cat_en}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-foreground tabular-nums">{d.seats}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-foreground tabular-nums">{d.price}</span>
                  <span className={`tabular-nums ${positive ? "text-accent" : "text-primary-foreground/70"}`}>
                    {d.delta}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
