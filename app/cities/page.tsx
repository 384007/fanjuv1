import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { categories, cities } from "@/lib/seo-data"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "饭局城市目录｜深圳、上海、北京、广州、杭州、成都饭局｜饭局 Fanju",
  description: "饭局 Fanju 城市目录，覆盖中国大陆、港澳台与海外华人城市，包含深圳饭局、上海饭局、北京饭局、广州饭局、杭州饭局、成都饭局、新加坡饭局、纽约饭局等。",
  alternates: { canonical: "/cities", languages: { "zh-CN": "/cities", en: "/en/cities" } },
  robots: { index: true, follow: true },
  openGraph: {
    title: "饭局城市目录｜饭局 Fanju",
    description: "查看饭局 Fanju 已开放和即将开放的城市饭局入口。",
    url: `${SITE_URL}/cities`,
    type: "website",
    locale: "zh_CN",
    alternateLocale: ["en_US"],
  },
}

// Mainland China cities (first 20 in the array)
const mainlandCities = cities.filter((c) => !c.countryCode || c.countryCode === "CN")
// Overseas Chinese-community cities
const overseasCities = cities.filter((c) => c.countryCode && c.countryCode !== "CN")

export default function CitiesPage() {
  // Visible FAQ — no FAQPage JSON-LD
  const faq = [
    ["饭局 Fanju 覆盖哪些城市？", "饭局 Fanju 优先覆盖深圳、广州、上海、北京、杭州、成都，并同步布局新加坡、纽约、伦敦、东京、香港、台北等海外华人城市。"],
    ["城市目录有什么用？", "城市目录用于帮助用户和搜索引擎快速进入各城市饭局页面，查看本地饭局类型、报名建议和安全提醒。"],
    ["没有开放的城市可以报名吗？", "可以先关注城市页和对应饭局类型页，后续以主办方招募和开放进度为准。"],
    ["海外华人城市有哪些饭局类型？", "海外华人城市优先开放华人饭局、留学生饭局、新移民饭局和商务饭局，具体场次以主办方招募进度为准。"],
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "饭局 Fanju 城市目录",
        url: `${SITE_URL}/cities`,
        inLanguage: "zh-CN",
        description: "饭局 Fanju 的城市饭局索引页，帮助用户和搜索引擎发现城市饭局页面。",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "饭局 Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "城市目录", item: `${SITE_URL}/cities` },
          ],
        },
      },
      {
        "@type": "ItemList",
        name: "饭局城市目录",
        itemListElement: cities.map((city, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: `${city.name}饭局`,
          url: `${SITE_URL}/city/${city.slug}`,
        })),
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] text-accent uppercase">
            <span className="h-px w-8 bg-accent/60" /><span>FANJU CITY INDEX</span>
          </div>
          <h1 className="mt-7 max-w-4xl font-serif text-4xl leading-[1.08] text-foreground md:text-6xl">饭局城市目录</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            查看饭局 Fanju 在中国大陆、港澳台与海外华人城市的同频晚餐社交入口。
            每个城市页都包含本地饭局类型、报名建议和安全提醒。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/categories" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">查看饭局类型</Link>
            <Link href="/what-is-fanju" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局是什么</Link>
            <Link href="/en/cities" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">English</Link>
          </div>
        </div>
      </section>

      {/* Priority cities highlight */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">重点城市入口</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">以下城市优先开放，主办方招募和场次资源最为集中。</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {[
              { name: "深圳", slug: "shenzhen", desc: "科技·创业·出海" },
              { name: "上海", slug: "shanghai", desc: "金融·海归·商务" },
              { name: "北京", slug: "beijing", desc: "互联网·媒体·投资" },
              { name: "广州", slug: "guangzhou", desc: "大湾区·生活·商贸" },
              { name: "杭州", slug: "hangzhou", desc: "电商·内容·创业" },
              { name: "成都", slug: "chengdu", desc: "生活方式·兴趣" },
              { name: "东京", slug: "tokyo", desc: "海外华人·留学生" },
              { name: "新加坡", slug: "singapore", desc: "金融·科技·新移民" },
              { name: "纽约", slug: "new-york", desc: "华人·金融·留学" },
              { name: "香港", slug: "hong-kong", desc: "商务·港漂·大湾区" },
            ].map(({ name, slug, desc }) => (
              <Link key={slug} href={`/city/${slug}`} className="group border border-border/60 bg-card/35 p-4 transition-colors hover:border-accent/70 hover:bg-card/70">
                <div className="font-serif text-xl text-foreground group-hover:text-accent">{name}饭局</div>
                <div className="mt-1 font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase">{desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mainland China cities */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">中国大陆城市</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">覆盖一线、新一线及重点二线城市，优先招募本地主办方和餐厅资源。</p>
          <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {mainlandCities.map((city) => (
              <article key={city.slug} className="bg-card/40 p-5 transition-colors hover:bg-card/70">
                <Link href={`/city/${city.slug}`} className="group block">
                  <h3 className="font-serif text-2xl text-foreground group-hover:text-accent">{city.name}饭局</h3>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{city.nameEn} · {city.province}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{city.answer}</p>
                </Link>
                <div className="mt-5 grid grid-cols-1 gap-2">
                  {categories.slice(0, 4).map((category) => (
                    <Link key={category.slug} href={`/city/${city.slug}/${category.slug}`} className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase hover:text-accent">
                      {city.name}{category.name}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Overseas Chinese-community cities */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">港澳台 · 海外华人城市</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            覆盖全球华人聚集城市，优先开放华人饭局、留学生饭局、新移民饭局和商务饭局。
          </p>
          <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {overseasCities.map((city) => (
              <article key={city.slug} className="bg-card/40 p-5 transition-colors hover:bg-card/70">
                <Link href={`/city/${city.slug}`} className="group block">
                  <h3 className="font-serif text-2xl text-foreground group-hover:text-accent">{city.name}饭局</h3>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{city.nameEn} · {city.countryEn ?? city.country}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{city.answer}</p>
                </Link>
                <div className="mt-5 grid grid-cols-1 gap-2">
                  {categories.slice(0, 3).map((category) => (
                    <Link key={category.slug} href={`/city/${city.slug}/${category.slug}`} className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase hover:text-accent">
                      {city.name}{category.name}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — visible HTML only */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">城市目录常见问题</h2>
          <div className="mt-8 grid grid-cols-1 gap-px border border-border/60 bg-border/60">
            {faq.map(([q, a]) => (
              <article key={q} className="bg-card/40 p-5 md:p-6">
                <h3 className="font-serif text-xl text-foreground">{q}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
