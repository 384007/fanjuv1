import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { categories, cities } from "@/lib/seo-data"

const SITE_URL = "https://fanju.app"

export const metadata: Metadata = {
  title: "饭局类型目录｜单身饭局、高端饭局、商务饭局、创业者饭局｜饭局 Fanju",
  description: "饭局 Fanju 类型目录，包含单身饭局、高端饭局、商务饭局、创业者饭局、周末饭局、华人饭局、留学生饭局和新移民饭局。每种类型说明适合谁、解决什么问题、覆盖哪些城市。",
  alternates: { canonical: "/categories", languages: { "zh-CN": "/categories", en: "/en/categories" } },
  robots: { index: true, follow: true },
  openGraph: {
    title: "饭局类型目录｜饭局 Fanju",
    description: "查看饭局 Fanju 的全部饭局类型与城市报名入口。",
    url: `${SITE_URL}/categories`,
    type: "website",
    locale: "zh_CN",
    alternateLocale: ["en_US"],
  },
}

// Priority categories with richer descriptions for the index page
const categoryDetails: Record<string, { who: string; problem: string; cities: string[] }> = {
  "singles-dinner": {
    who: "单身用户、海归、新城市年轻人",
    problem: "希望在低压力、有主题的小桌晚餐中自然认识异性，不追求一次饭局立刻有结果",
    cities: ["深圳", "上海", "北京", "广州", "东京", "纽约"],
  },
  "chinese-social-dining": {
    who: "中文用户、海外华人、留学生、新移民",
    problem: "在中文语境里认识同频华人，适合大陆城市和全球华人聚集城市",
    cities: ["新加坡", "东京", "纽约", "伦敦", "香港", "台北"],
  },
  "business-dinner": {
    who: "创业者、投资人、管理者、专业服务人士",
    problem: "在晚餐场景中建立初步信任，交流行业观点和资源，不是融资承诺",
    cities: ["深圳", "上海", "北京", "新加坡", "香港"],
  },
  "founder-dinner": {
    who: "创始人、早期团队、投资与产业从业者",
    problem: "聊行业判断、产品增长、组织管理和城市资源，拓展同城同行关系",
    cities: ["深圳", "上海", "北京", "杭州", "旧金山"],
  },
  "curated-dinner": {
    who: "重视餐厅体验和同桌质量的用户",
    problem: "提供更稳妥的晚餐社交入口，关注餐厅环境、主办方经验和参与者质量",
    cities: ["上海", "北京", "深圳", "香港", "新加坡"],
  },
  "weekend-dinner": {
    who: "工作日较忙、希望周末安排轻松社交的城市年轻人",
    problem: "在周五到周日安排有主题的小桌晚餐，认识同城新朋友",
    cities: ["深圳", "上海", "北京", "广州", "成都"],
  },
  "student-dinner": {
    who: "留学生、海归、交换生和年轻校友",
    problem: "在求学、回国或跨城阶段寻找同频朋友、校友和城市信息",
    cities: ["东京", "纽约", "伦敦", "新加坡", "悉尼"],
  },
  "newcomer-dinner": {
    who: "新到一座城市工作、学习或生活的人",
    problem: "快速了解本地生活、认识同城朋友并建立基础社交圈",
    cities: ["深圳", "上海", "北京", "新加坡", "东京"],
  },
  "stranger-dinner": {
    who: "希望扩展弱关系和城市社交圈的人",
    problem: "在安全、有主题引导的环境中与陌生人建立自然交流",
    cities: ["深圳", "上海", "北京", "广州", "成都"],
  },
}

export default function CategoriesPage() {
  // Visible FAQ — no FAQPage JSON-LD
  const faq = [
    ["饭局 Fanju 有哪些饭局类型？", "饭局 Fanju 覆盖单身饭局、高端饭局、商务饭局、创业者饭局、周末饭局、陌生人饭局、华人饭局、留学生饭局和新移民饭局。"],
    ["如何选择适合自己的饭局类型？", "可以先根据城市、主题、报名目的和安全边界选择。第一次参加建议选择公开餐厅、主题明确、主办方信息清晰的场次。"],
    ["单身饭局会承诺脱单吗？", "不会。单身饭局是认识人的入口，不是婚恋服务，不承诺固定匹配结果。"],
    ["商务饭局会承诺融资或合作吗？", "不会。商务饭局适合建立初步信任，涉及合作、投资时应在饭局之后再做正式尽调和书面确认。"],
    ["饭局类型页有什么用？", "饭局类型页用于解释每类饭局适合谁、如何报名、有哪些城市入口，并帮助搜索引擎理解饭局 Fanju 的服务结构。"],
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "饭局 Fanju 类型目录",
        url: `${SITE_URL}/categories`,
        inLanguage: "zh-CN",
        description: "饭局 Fanju 的饭局类型索引页，帮助用户和搜索引擎发现分类页面。",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "饭局 Fanju", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "饭局类型目录", item: `${SITE_URL}/categories` },
          ],
        },
      },
      {
        "@type": "ItemList",
        name: "饭局类型目录",
        itemListElement: categories.map((category, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: category.name,
          url: `${SITE_URL}/category/${category.slug}`,
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
          <div className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">FANJU CATEGORY INDEX</div>
          <h1 className="mt-7 font-serif text-4xl text-foreground md:text-6xl">饭局类型目录</h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            查看饭局 Fanju 的全部晚餐社交类型，了解每种饭局适合谁、解决什么问题、覆盖哪些城市，并进入对应城市报名说明页。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/cities" className="border border-accent/70 bg-accent px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-accent-foreground uppercase">城市目录</Link>
            <Link href="/what-is-fanju" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">饭局是什么</Link>
            <Link href="/en/categories" className="border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.2em] text-foreground uppercase hover:border-accent/70 hover:text-accent">English</Link>
          </div>
        </div>
      </section>

      {/* Category cards with richer content */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <div className="grid grid-cols-1 gap-px border border-border/60 bg-border/60 lg:grid-cols-3">
            {categories.map((category) => {
              const detail = categoryDetails[category.slug]
              return (
                <article key={category.slug} className="bg-card/40 p-5">
                  <Link href={`/category/${category.slug}`} className="group block">
                    <h2 className="font-serif text-2xl text-foreground group-hover:text-accent">{category.name}</h2>
                    <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{category.nameEn}</p>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{category.answer}</p>
                  </Link>
                  {detail && (
                    <div className="mt-4 space-y-2 border-t border-border/40 pt-4">
                      <p className="text-xs text-muted-foreground"><span className="text-foreground/70">适合：</span>{detail.who}</p>
                      <p className="text-xs text-muted-foreground"><span className="text-foreground/70">解决：</span>{detail.problem}</p>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {detail.cities.map((cityName) => {
                          const cityData = cities.find((c) => c.name === cityName)
                          return cityData ? (
                            <Link key={cityData.slug} href={`/city/${cityData.slug}/${category.slug}`} className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground uppercase hover:text-accent">
                              {cityName}
                            </Link>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}
                  {!detail && (
                    <div className="mt-5 grid gap-2">
                      {cities.slice(0, 5).map((city) => (
                        <Link key={city.slug} href={`/city/${city.slug}/${category.slug}`} className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase hover:text-accent">
                          {city.name}{category.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Safety note */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">安全边界说明</h2>
          <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>无论选择哪种饭局类型，以下安全边界适用于所有场次：</p>
            <ul className="ml-4 list-disc space-y-2">
              <li>优先选择公开餐厅，确认地址、时间和费用后再报名。</li>
              <li>不提前向陌生人转账，不透露敏感证件、住址或财务信息。</li>
              <li>遇到不舒服的交流可以直接结束话题或联系主办方。</li>
              <li>单身饭局不承诺脱单，商务饭局不承诺融资或合作结果。</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ — visible HTML only */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <h2 className="font-serif text-3xl text-foreground md:text-4xl">饭局类型常见问题</h2>
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
