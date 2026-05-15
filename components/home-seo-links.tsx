import Link from "next/link"
import { categories, cities } from "@/lib/seo-data"

const citySlugs = ["shenzhen", "guangzhou", "shanghai", "beijing", "hangzhou", "chengdu", "singapore", "new-york", "london", "tokyo", "hong-kong", "taipei"]
const categorySlugs = ["singles-dinner", "curated-dinner", "business-dinner", "founder-dinner", "weekend-dinner", "stranger-dinner", "chinese-social-dining", "student-dinner", "newcomer-dinner"]
const combos: [string, string][] = [["shenzhen", "singles-dinner"], ["shanghai", "business-dinner"], ["beijing", "founder-dinner"], ["guangzhou", "weekend-dinner"], ["chengdu", "stranger-dinner"], ["singapore", "chinese-social-dining"]]

export function HomeSeoLinks() {
  const topCities = cities.filter((city) => citySlugs.includes(city.slug)).sort((a, b) => citySlugs.indexOf(a.slug) - citySlugs.indexOf(b.slug))
  const topCategories = categories.filter((category) => categorySlugs.includes(category.slug)).sort((a, b) => categorySlugs.indexOf(a.slug) - categorySlugs.indexOf(b.slug))

  return (
    <section id="seo-links" className="relative border-b border-border/60 bg-background">
      <div className="mx-auto max-w-[1400px] px-4 py-20 md:px-8 md:py-28">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] text-accent uppercase"><span className="h-px w-8 bg-accent/60" /><span>SEO ENTRY</span></div>
            <h2 className="mt-6 font-serif text-3xl leading-[1.1] text-balance text-foreground md:text-5xl">热门城市饭局<br /><span className="italic text-accent">同频晚餐社交入口</span></h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">饭局 Fanju 优先开放中国大陆城市，并同步覆盖海外华人城市。以下链接帮助用户快速进入真实城市页、分类页和报名说明页。</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">全部城市</Link>
              <Link href="/categories" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">全部饭局类型</Link>
              <Link href="/what-is-fanju" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局是什么</Link>
            </div>
          </div>
          <div className="lg:col-span-7"><SeoLinkBlock title="热门城市" items={topCities.map((city) => [`${city.name}饭局`, `/city/${city.slug}`, city.nameEn])} /></div>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SeoLinkBlock title="饭局类型" items={topCategories.map((category) => [category.name, `/category/${category.slug}`, category.nameEn])} />
          <SeoLinkBlock title="城市 × 类型" items={combos.map(([citySlug, categorySlug]) => { const city = cities.find((item) => item.slug === citySlug); const category = categories.find((item) => item.slug === categorySlug); return city && category ? [`${city.name}${category.name}`, `/city/${city.slug}/${category.slug}`, `${city.nameEn} ${category.nameEn}`] : null }).filter((item): item is [string, string, string] => Boolean(item))} />
        </div>
      </div>
    </section>
  )
}

function SeoLinkBlock({ title, items }: { title: string; items: [string, string, string][] }) {
  return (
    <div className="border border-border/60 bg-card/25 p-5 md:p-6">
      <h3 className="font-mono text-[10px] tracking-[0.25em] text-accent uppercase">· {title}</h3>
      <div className="mt-5 grid grid-cols-1 gap-px border border-border/60 bg-border/60 sm:grid-cols-2">
        {items.map(([label, href, sub]) => <Link key={href} href={href} className="group bg-background/80 p-4 transition-colors hover:bg-card"><span className="block font-serif text-lg text-foreground group-hover:text-accent">{label}</span><span className="mt-1 block font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">{sub}</span></Link>)}
      </div>
    </div>
  )
}
