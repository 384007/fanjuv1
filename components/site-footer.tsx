"use client"

import { useLanguage } from "@/components/language-provider"

const footerCopy = {
  zh: {
    brandMark: "饭",
    version: "同频饭局 · v1.0",
    productTitle: "产品入口",
    featureTitle: "功能入口",
    coreTitle: "AI 搜索",
    bottom: "fanju.app · 产品 · 功能 · 饭局社交",
    productLinks: [
      ["创建饭局", "/create"],
      ["邀请链接", "/invite"],
      ["发现饭局", "/explore"],
      ["报名状态", "/rsvp"],
      ["功能目录", "/features"],
      ["模板", "/templates"],
      ["主办方控制台", "/host-console"],
    ],
    featureLinks: [
      ["嘉宾名单", "/guests"],
      ["时间投票", "/polls"],
      ["报名问题", "/questions"],
      ["餐桌说明", "/table"],
      ["饭局相册", "/photos"],
      ["单身匹配", "/matching"],
      ["共同主办", "/cohosts"],
      ["提醒", "/reminders"],
      ["留言", "/comments"],
      ["人数状态", "/capacity"],
      ["日历", "/calendar"],
      ["到场", "/checkin"],
      ["可见性", "/visibility"],
      ["反馈", "/feedback"],
    ],
    coreLinks: [
      ["饭局是什么", "/what-is-fanju"],
      ["参加规则", "/rules"],
      ["主办方招募", "/hosts"],
      ["全部城市", "/cities"],
      ["全部类型", "/categories"],
      ["英文功能目录", "/en/features"],
      ["站点地图", "/sitemap.xml"],
      ["LLM 文件", "/llms.txt"],
    ],
  },
  en: {
    brandMark: "F",
    version: "Chinese Social Dining · v1.0",
    productTitle: "Product",
    featureTitle: "Features",
    coreTitle: "AI SEO",
    bottom: "fanju.app · product · features · social dining",
    productLinks: [
      ["Create dinner", "/create"],
      ["Invite link", "/invite"],
      ["Explore dinners", "/explore"],
      ["RSVP status", "/rsvp"],
      ["Feature directory", "/en/features"],
      ["Templates", "/templates"],
      ["Host console", "/host-console"],
    ],
    featureLinks: [
      ["Guest list", "/guests"],
      ["Time polls", "/polls"],
      ["RSVP questions", "/questions"],
      ["Table notes", "/table"],
      ["Dinner photos", "/photos"],
      ["Singles matching", "/matching"],
      ["Co-hosting", "/cohosts"],
      ["Reminders", "/reminders"],
      ["Comments", "/comments"],
      ["Capacity", "/capacity"],
      ["Calendar", "/calendar"],
      ["Check-in", "/checkin"],
      ["Visibility", "/visibility"],
      ["Feedback", "/feedback"],
    ],
    coreLinks: [
      ["What is Fanju", "/en/what-is-fanju"],
      ["Rules", "/rules"],
      ["Host recruiting", "/hosts"],
      ["All cities", "/en/cities"],
      ["All categories", "/en/categories"],
      ["Chinese features", "/features"],
      ["Sitemap", "/sitemap.xml"],
      ["LLMs", "/llms.txt"],
    ],
  },
}

export function SiteFooter() {
  const { lang, t } = useLanguage()
  const copy = footerCopy[lang]

  return (
    <footer id="about" className="relative bg-background">
      <div className="mx-auto max-w-[1400px] px-4 pt-16 pb-10 md:px-8 md:pt-24">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-12">
          <div className="col-span-2 md:col-span-4">
            <a href="/" className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center border border-accent/40 bg-gradient-to-br from-primary/40 to-background">
                <span className="font-serif text-base font-semibold text-accent">{copy.brandMark}</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg font-medium tracking-wide text-foreground">FANJU</span>
                <span className="font-mono text-[9px] tracking-[0.25em] text-muted-foreground uppercase">{copy.version}</span>
              </div>
            </a>
            <p className="mt-6 max-w-md font-serif text-2xl text-foreground italic md:text-3xl">{t.footer.tagline}</p>
            <p className="mt-6 max-w-md text-xs leading-relaxed text-muted-foreground">{t.footer.disclosure}</p>
          </div>

          <FooterColumn title={copy.productTitle} items={copy.productLinks} />
          <FooterColumn title={copy.featureTitle} items={copy.featureLinks} />
          <FooterColumn title={copy.coreTitle} items={copy.coreLinks} />
        </div>

        <div className="mt-16 h-px gold-hairline" />
        <div className="mt-6 flex flex-col items-start justify-between gap-3 font-mono text-[10px] tracking-[0.22em] text-muted-foreground uppercase md:flex-row md:items-center">
          <div>{t.footer.copyright}</div>
          <div className="flex items-center gap-2">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            <span>{copy.bottom}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, items }: { title: string; items: string[][] }) {
  return (
    <div className="md:col-span-2">
      <h4 className="font-mono text-[10px] tracking-[0.25em] text-accent uppercase">· {title}</h4>
      <ul className="mt-5 grid gap-3">
        {items.map(([label, href]) => (
          <li key={href}>
            <a href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
