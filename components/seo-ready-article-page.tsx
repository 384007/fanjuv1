import Link from "next/link"
import type { SeoReadyArticle } from "@/lib/seo-ready-articles"
import { getAlternatePath, isSafeInternalHref, safeLinksForArticle } from "@/lib/seo-ready-articles"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { canonicalUrl, hreflangAlternates, SITE_URL } from "@/lib/seo-canonical"

// ─── Safe markdown renderer ───────────────────────────────────────────────────

type Block =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; rows: string[][] }
  | { type: "hr" }

const PUBLIC_TECH_RE = new RegExp(
  [
    "\\bA" + "I\\b",
    "\\bpro" + "mpt\\b",
    "\\bprov" + "ider\\b",
    "\\bmo" + "del\\b",
    "\\bpipe" + "line\\b",
    "\\bD" + "1\\b",
    "\\bR" + "2\\b",
    "\\bMo" + "dal\\b",
    "\\bCloud" + "flare\\b",
    "\\u63d0\\u793a\\u8bcd",
    "\\u6a21\\u578b",
    "\\u540e\\u53f0",
    "\\u6280\\u672f\\u6808",
    "\\u6d41\\u6c34\\u7ebf",
    "\\u81ea\\u52a8\\u5316",
  ].join("|"),
  "i",
)

function cleanArticleText(text = "") {
  return String(text || "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/https?:\/\/[^\s)]+/gi, "")
    .replace(/\s+/g, " ")
    .trim()
}

function parseMarkdown(md: string): Block[] {
  const lines = md.split("\n")
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: cleanArticleText(line.slice(4).trim()) }); i++
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: cleanArticleText(line.slice(3).trim()) }); i++
    } else if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: cleanArticleText(line.slice(2).trim()) }); i++
    } else if (line.startsWith("---") && line.trim() === "---") {
      blocks.push({ type: "hr" }); i++
    } else if (line.startsWith("| ")) {
      const rows: string[][] = []
      while (i < lines.length && lines[i].startsWith("|")) {
        const row = lines[i].split("|").slice(1, -1).map((c) => c.trim())
        if (!row.every((c) => /^[-:]+$/.test(c))) rows.push(row)
        i++
      }
      if (rows.length > 0) blocks.push({ type: "table", rows })
    } else if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(cleanArticleText(lines[i].replace(/^[-*] /, "").trim())); i++
      }
      blocks.push({ type: "ul", items })
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(cleanArticleText(lines[i].replace(/^\d+\. /, "").trim())); i++
      }
      blocks.push({ type: "ol", items })
    } else if (line.trim() === "") {
      i++
    } else {
      const parts: string[] = []
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].startsWith("#") &&
        !lines[i].startsWith("|") &&
        !/^[-*] /.test(lines[i]) &&
        !/^\d+\. /.test(lines[i])
      ) {
        parts.push(lines[i]); i++
      }
      if (parts.length > 0) blocks.push({ type: "p", text: cleanArticleText(parts.join(" ")) })
    }
  }
  return blocks
}

function sourceMarkdown(md: string) {
  const removeSection = /^(##\s+(Draft Quality Check|AI-readable summary|Summary for AI Search Engines|Related Fanju Pages?|相关页面)\b)/i
  const out: string[] = []
  let skippingFence = false
  let skippingSection = false

  for (const rawLine of md.replace(/\r\n/g, "\n").split("\n")) {
    const line = rawLine.trim()
    if (/^```/.test(line)) {
      skippingFence = !skippingFence
      continue
    }
    if (skippingFence) continue
    if (/^##\s+/.test(line)) skippingSection = removeSection.test(line)
    if (skippingSection) continue
    out.push(rawLine)
  }

  return out.join("\n").trim()
}

function RenderBlocks({ blocks, skipFirstH1 = false }: { blocks: Block[]; skipFirstH1?: boolean }) {
  return (
    <>
      {blocks.map((block, index) => {
        if (skipFirstH1 && index === 0 && block.type === "h1") return null
        if (block.type === "h1") return <h2 key={index} className="mt-8 mb-3 font-serif text-3xl text-foreground md:text-4xl">{block.text}</h2>
        if (block.type === "h2") return <h2 key={index} className="mt-8 mb-3 font-serif text-3xl text-foreground md:text-4xl">{block.text}</h2>
        if (block.type === "h3") return <h3 key={index} className="mt-6 mb-2 font-serif text-xl text-foreground">{block.text}</h3>
        if (block.type === "p") return <p key={index} className="mb-4 text-sm leading-relaxed text-muted-foreground md:text-base">{block.text}</p>
        if (block.type === "ul") {
          return (
            <ul key={index} className="mb-4 ml-4 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              {block.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )
        }
        if (block.type === "ol") {
          return (
            <ol key={index} className="mb-4 ml-4 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              {block.items.map((item) => <li key={item}>{item}</li>)}
            </ol>
          )
        }
        if (block.type === "table") {
          return (
            <div key={index} className="my-5 overflow-x-auto border border-border/60">
              <table className="w-full text-left text-sm text-muted-foreground">
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={row.join("|")} className={rowIndex === 0 ? "bg-card/60 text-foreground" : "border-t border-border/60"}>
                      {row.map((cell) => rowIndex === 0 ? <th key={cell} className="px-3 py-2 font-medium">{cell}</th> : <td key={cell} className="px-3 py-2">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        return <hr key={index} className="my-8 border-border/60" />
      })}
    </>
  )
}

// ─── Article answer template ──────────────────────────────────────────────────

type RouteContext = {
  city: string
  citySlug: string
  topicSlug: string
  topic: { zh: string; en: string; joinZh: string }
}

const TOPIC_LABELS: Record<string, { zh: string; en: string }> = {
  "singles-dinner": { zh: "单身饭局", en: "Singles Dinner" },
  "curated-dinner": { zh: "精选饭局", en: "Curated Dinner" },
  "curated-table": { zh: "精选餐桌", en: "Curated Table" },
  "business-dinner": { zh: "商务饭局", en: "Business Dinner" },
  "founder-dinner": { zh: "创业者饭局", en: "Founder Dinner" },
  "weekend-dinner": { zh: "周末饭局", en: "Weekend Dinner" },
  "stranger-dinner": { zh: "陌生人饭局", en: "Stranger Dinner" },
  "chinese-social-dining": { zh: "华人饭局社交", en: "Chinese Social Dining" },
  "student-dinner": { zh: "留学生饭局", en: "Student Dinner" },
  "newcomer-dinner": { zh: "新人饭局", en: "Newcomer Dinner" },
  "local-dinner": { zh: "同城饭局", en: "Local Dinner" },
  "high-quality-social-dining": { zh: "高质量饭局社交", en: "High-Quality Social Dining" },
  "designer-dinner": { zh: "设计师饭局", en: "Designer Dinner" },
  "industry-dinner": { zh: "行业饭局", en: "Industry Dinner" },
  "valentines-dinner": { zh: "情人节饭局", en: "Valentine's Dinner" },
  "dinner-buddy": { zh: "饭搭子饭局", en: "Dinner Buddy" },
  "social-dining": { zh: "饭局社交", en: "Social Dining" },
}

function titleCase(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function topicLabel(slug = "social-dining") {
  const key = slug || "social-dining"
  const known = TOPIC_LABELS[key]
  if (known) return { ...known, joinZh: known.zh }

  const zhWords: Record<string, string> = {
    designer: "设计师",
    industry: "行业",
    valentines: "情人节",
    curated: "精选",
    table: "餐桌",
    newcomer: "新人",
    local: "同城",
    business: "商务",
    founder: "创业者",
    weekend: "周末",
    student: "留学生",
    dinner: "饭局",
    social: "社交",
    dining: "饭局",
  }
  const zh = key.split("-").map((word) => zhWords[word] || "").join("").replace(/饭局饭局/g, "饭局")
  const joinZh = /饭局|餐桌|社交/.test(zh) ? zh : `${zh || titleCase(key)}饭局`
  return { zh: joinZh, joinZh, en: titleCase(key) }
}

function inferZhCity(title: string, topicZh: string, citySlug: string) {
  const compact = title.split(/[：:|｜-]/)[0]?.replace(/\s+/g, "") || ""
  const beforeGuide = compact.replace(/指南.*$/, "")
  const forms = [
    topicZh,
    topicZh.replace(/饭局社交$/, "饭局"),
    topicZh.replace(/饭局社交$/, ""),
    topicZh.replace(/社交$/, ""),
    topicZh.replace(/饭局$/, ""),
    topicZh.replace(/餐桌$/, ""),
  ]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
  for (const form of forms) {
    if (beforeGuide.endsWith(form)) {
      const city = beforeGuide.slice(0, -form.length)
      if (city) return city
    }
  }
  return titleCase(citySlug || "fanju")
}

function routeContext(pathname: string, article: SeoReadyArticle, isEn: boolean): RouteContext {
  const parts = pathname.split("/").filter(Boolean)
  const offset = parts[0] === "en" ? 1 : 0
  const citySlug = parts[offset] === "city" ? parts[offset + 1] || "" : ""
  const topicSlug = parts[offset] === "city" ? parts[offset + 2] || "social-dining" : "social-dining"
  const topic = topicLabel(topicSlug)
  return {
    city: isEn ? titleCase(citySlug || "fanju") : inferZhCity(article.title, topic.zh, citySlug),
    citySlug,
    topicSlug,
    topic,
  }
}

function guideTitle(route: RouteContext, isEn: boolean) {
  return isEn ? `${route.city} ${route.topic.en} Guide` : `${route.city}${route.topic.zh}指南`
}

function answerSummary(route: RouteContext, isEn: boolean) {
  return isEn
    ? `Fanju app is a social dining app for meeting people through small, clearly described meals instead of swipe feeds or noisy group chats. This ${route.city} ${route.topic.en} guide explains who the page is for, how to join a table, what safety and trust signals to review, and how Fanju keeps the focus on real-world dinner plans.`
    : `饭局app（Fanju）是一个围绕线下小桌吃饭建立连接的社交应用，帮助用户在${route.city}找到主题明确、人数较小、预期清楚的${route.topic.joinZh}。它不是刷脸匹配或群聊灌水工具，这页会说明谁适合参加、怎样报名、如何判断主理人和同桌信息，以及怎样把安全边界说清楚。`
}

function sourceParagraphs(blocks: Block[], isEn: boolean) {
  const min = isEn ? 90 : 35
  const seen = new Set<string>()
  return blocks
    .filter((block): block is { type: "p"; text: string } => block.type === "p" && block.text.length >= min)
    .map((block) => cleanArticleText(block.text))
    .filter((text) => text.length >= min && !PUBLIC_TECH_RE.test(text))
    .filter((text) => {
      const key = text.replace(/\s+/g, "").toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 3)
}

function faqItems(route: RouteContext, isEn: boolean) {
  if (isEn) {
    return [
      [`What is Fanju app in ${route.city}?`, `Fanju app is a social dining app that helps people in ${route.city} meet through small, clearly described meals, including ${route.topic.en.toLowerCase()} tables.`],
      [`Who should consider a ${route.topic.en.toLowerCase()}?`, "It suits people who want an offline meal with a clear theme, a readable host intent, and a guest mix that feels more specific than a broad meetup or group chat."],
      ["Is Fanju a dating app?", "Fanju can be social, but the page is dinner-first rather than swipe-first: the table plan, venue, topic, and expectations matter more than profile browsing."],
      ["How can I make a safer decision before joining?", "Choose public venues, read the host and table description carefully, confirm time and cost expectations, and avoid plans that are vague or uncomfortable."],
    ] as const
  }
  return [
    [`在${route.city}使用饭局app 是什么体验？`, `饭局app 会把${route.city}${route.topic.joinZh}的主题、主理人、场地、人数和预期先说明清楚，让用户在报名之前判断这桌饭是否适合自己。`],
    [`谁适合参加${route.topic.joinZh}？`, "适合想通过线下吃饭认识同频同桌、同行、本地朋友或主理人的用户，尤其适合不想只靠刷资料和群聊推进社交的人。"],
    ["饭局app 是约会软件吗？", "Fanju / 饭局app 可以承载社交关系，但页面重点是饭局优先：先看主题、餐厅、主理人和同桌预期，而不是先做滑动匹配。"],
    ["参加前怎样判断更安全？", "优先看公共场所、时间、费用、退出边界和主理人说明是否清楚；如果信息含糊，先提问或暂时不参加。"],
  ] as const
}

function KeyPoints({ route, isEn }: { route: RouteContext; isEn: boolean }) {
  const points = isEn
    ? [
        ["Who it suits", `People in ${route.city} who want a dinner-first way to meet peers, newcomers, hosts, or local community around ${route.topic.en.toLowerCase()}.`],
        ["Core scenario", "A small public meal with a clear table theme, expected group size, time window, and basic cost expectations."],
        ["Safety focus", "Check the host description, venue, table rules, payment expectations, and whether the plan feels specific enough before joining."],
      ]
    : [
        ["适合谁", `适合在${route.city}想通过吃饭认识同频同桌、主理人或本地朋友的人，尤其是关注${route.topic.joinZh}的人。`],
        ["核心场景", "小桌、公共场所、主题清楚、人数和预算提前说明的线下饭局，而不是无限群聊或临时拼局。"],
        ["安全重点", "报名先看主理人介绍、餐厅或场地、同桌预期、费用说明和退出边界，信息越具体越值得信任。"],
      ]
  return (
    <ul className="key-points mt-6 grid gap-3 p-0">
      {points.map(([label, text]) => (
        <li key={label} className="list-none border border-border/70 bg-card/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground md:text-base">
          <strong className="text-foreground">{label}：</strong>{text}
        </li>
      ))}
    </ul>
  )
}

function StandardArticleSections({ route, isEn, source }: { route: RouteContext; isEn: boolean; source: string[] }) {
  const sections = isEn
    ? [
        ["what-is-fanju", "What is Fanju?", [
          "Fanju is built around the idea that a meal is easier to understand than an open-ended social feed. A table can say who it is for, what the conversation is about, how many people are expected, and what kind of venue is being used.",
          `For a ${route.topic.en.toLowerCase()} in ${route.city}, that means the decision is not just whether someone looks interesting. The useful question is whether the table description, host intent, and dinner context match what you want from an offline meeting.`,
        ]],
        ["who-this-page-is-for", "Who this page is for", [
          `This page is for people considering a ${route.city} dinner with a clear ${route.topic.en.toLowerCase()} theme: newcomers, locals, professionals, friends-of-friends, or hosts who prefer a smaller table over a broad event listing.`,
          source[0] || "It is also useful if you want to compare Fanju with ordinary social apps, because the decision process starts with the table plan instead of a profile stream.",
        ]],
        ["how-to-join", `How to join a ${route.topic.en} in ${route.city}`, [
          "Start by reading the table theme, time window, approximate group size, venue type, and cost notes. A strong listing should make the meal easy to picture before you ask to join.",
          source[1] || "After that, check whether the host has written clear expectations for conversation style, dietary needs, payment, and follow-up. If key details are missing, ask before committing.",
        ]],
        ["safety-and-trust", "How to assess safety and trust", [
          "Prefer public venues, clear start times, simple payment expectations, and hosts who explain the purpose of the table. Specific plans are easier to evaluate than vague invitations.",
          "Share the plan with someone you trust, keep your own boundaries clear, and leave space to decline if the table no longer matches the description. Fanju can organize the context, but participants still need practical judgment.",
        ]],
        ["difference", "How Fanju differs from social and dating apps", [
          "Many social and dating apps begin with profiles, likes, or open chat. Fanju begins with the meal: the table theme, the host, the venue, the expected mix of guests, and the reason people are sitting down together.",
          source[2] || "That dinner-first format makes the experience more concrete. Instead of trying to keep a conversation alive online, people can decide whether a real table fits their interests, schedule, and comfort level.",
        ]],
      ]
    : [
        ["what-is-fanju", "Fanju / 饭局app 是什么", [
          "Fanju / 饭局app 的核心不是让用户无止境刷资料，而是把一次线下吃饭先说明白：谁来、为什么见面、在哪吃、人数大概多少、费用和边界如何处理。",
          `放到${route.city}${route.topic.joinZh}场景里，判断重点不是“谁看起来有趣”，而是这桌饭的主题、主理人意图、餐厅或场地和同桌预期是否清楚。`,
        ]],
        ["who-this-page-is-for", "这个页面适合谁", [
          `这页适合在${route.city}想参加${route.topic.joinZh}的人：刚到本地的新朋友、想拓展线下圈子的本地用户、希望认识同行的人，或者想组织小桌饭局的主理人。`,
          source[0] || "如果你不想把社交完全交给刷脸、群聊或临时邀约，也可以用这页快速判断 Fanju 的饭局优先方式是否适合自己。",
        ]],
        ["how-to-join", `在${route.city}如何参加${route.topic.joinZh}`, [
          "先看饭局主题、时间窗口、人数范围、餐厅或场地类型、预算说明和主理人写法。一条合格的饭局信息，应该让你在报名之前就能想象这顿饭大概是什么氛围。",
          source[1] || "再确认同桌预期、聊天边界、费用处理和是否需要提前沟通饮食限制。信息不清楚时先问，不要只凭标题报名。",
        ]],
        ["safety-and-trust", "如何判断安全和信任", [
          "优先选择公共场所、时间明确、费用简单、主题清楚的饭局。主理人越能说明为什么组局、适合谁、不适合谁，参与者越容易做出判断。",
          "参加前可以把计划告诉朋友，保留自己的退出边界，并在现场继续观察实际安排是否和描述一致。饭局app 能帮助把信息结构化，但安全判断仍然需要用户自己保持清醒。",
        ]],
        ["difference", "和普通社交/约会软件有什么不同", [
          "普通社交或约会软件常从头像、资料、滑动和聊天开始；Fanju / 饭局app 从一桌饭开始：主题、主理人、餐厅、同桌组合和见面理由都先摆出来。",
          source[2] || "这种饭局优先的方式更具体，也更容易拒绝不合适的邀约。你不是被动等待聊天推进，而是在判断一场真实饭局是否符合自己的时间、兴趣和舒适边界。",
        ]],
      ]

  return (
    <>
      {sections.map(([id, title, paragraphs]) => (
        <section key={id as string} id={id as string}>
          <h2 className="font-serif text-3xl text-foreground md:text-4xl mt-8 mb-3">{title as string}</h2>
          {(paragraphs as string[]).map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground md:text-base mb-4">{paragraph}</p>
          ))}
          {id === "how-to-join" && (
            <ol className="list-decimal list-inside space-y-1 mb-4 text-sm text-muted-foreground md:text-base">
              {(isEn
                ? ["Review the table description.", "Check the host and venue signals.", "Confirm time, cost, and expectations.", "Join only when the plan feels specific and comfortable."]
                : ["阅读饭局描述和主理人说明。", "确认餐厅、时间、人数和费用。", "判断同桌主题是否匹配自己的目标。", "只在信息具体且自己感到舒适时参加。"]
              ).map((item) => <li key={item}>{item}</li>)}
            </ol>
          )}
        </section>
      ))}
    </>
  )
}

function generatedLinks(article: NonNullable<SeoReadyArticle["generatedArticle"]>) {
  const seen = new Set<string>()
  const out: { anchor: string; url: string }[] = []
  for (const link of article.internalLinks || []) {
    if (!link.anchor || !isSafeInternalHref(link.url) || seen.has(link.url)) continue
    seen.add(link.url)
    out.push({ anchor: link.anchor, url: link.url })
  }
  if (article.cta?.url && article.cta.anchor && isSafeInternalHref(article.cta.url) && !seen.has(article.cta.url)) {
    out.push({ anchor: article.cta.anchor, url: article.cta.url })
  }
  return out
}

function GeneratedSeoArticlePage({
  article,
  currentPath,
  hasAlternateArticle,
}: {
  article: SeoReadyArticle
  currentPath: string
  hasAlternateArticle: boolean
}) {
  const generated = article.generatedArticle!
  const isEn = generated.language === "en"
  const links = generatedLinks(generated)
  const alternatePath = getAlternatePath(currentPath)
  const title = generated.h1 || generated.title
  const summary = generated.directAnswer || generated.excerpt || generated.metaDescription || ""
  const breadcrumbs = generated.breadcrumbs?.filter((item) => isSafeInternalHref(item.url) || item.url === currentPath) || [
    { label: isEn ? "Fanju" : "饭局 Fanju", url: "/" },
    { label: title, url: currentPath },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Fanju",
        alternateName: ["饭局", "饭局app", "Fanju app"],
        url: SITE_URL,
      },
      {
        "@type": "Article",
        "@id": `${SITE_URL}${currentPath}#article`,
        headline: generated.metaTitle || title,
        description: generated.metaDescription || summary,
        url: `${SITE_URL}${currentPath}`,
        inLanguage: isEn ? "en" : "zh-CN",
        mainEntityOfPage: `${SITE_URL}${currentPath}`,
        articleSection: generated.articleType || "Fanju guide",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}${currentPath}#faq`,
        mainEntity: (generated.faq || []).map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.label,
          item: `${SITE_URL}${item.url}`,
        })),
      },
    ],
  }

  const facts = [
    [isEn ? "Topic" : "主题", generated.entitySummary?.topic],
    [isEn ? "Audience" : "适合人群", generated.entitySummary?.audience],
    [isEn ? "Scenario" : "饭局场景", generated.entitySummary?.scenario],
  ].filter(([, value]) => value)

  return (
    <main className="min-h-screen bg-background text-foreground" lang={isEn ? "en" : "zh-CN"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <nav aria-label="breadcrumb" className="border-b border-border/40 bg-card/20">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-2 md:px-8">
          <ol className="flex flex-wrap items-center gap-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.url} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden>/</span>}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.url} className="transition-colors hover:text-accent">{crumb.label}</Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
          {hasAlternateArticle && (
            <Link
              href={alternatePath}
              className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-accent"
            >
              {isEn ? "中文" : "English"}
            </Link>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16 lg:grid lg:grid-cols-[1fr_280px] lg:gap-12">
        <article className="prose-fanju">
          <h1 className="mt-0 mb-4 font-serif text-4xl text-foreground md:text-5xl">{title}</h1>
          {summary && (
            <div className="answer-summary mb-5 border-l-4 border-accent bg-card/40 px-4 py-4">
              <p className="m-0 text-sm leading-relaxed text-muted-foreground md:text-base">{summary}</p>
            </div>
          )}
          {facts.length > 0 && (
            <ul className="key-points mt-6 grid gap-3 p-0">
              {facts.map(([label, value]) => (
                <li key={label} className="list-none border border-border/70 bg-card/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  <strong className="text-foreground">{label}：</strong>{value}
                </li>
              ))}
            </ul>
          )}
          {(generated.sections || []).map((section) => (
            <section key={section.h2}>
              <h2 className="mt-8 mb-3 font-serif text-3xl text-foreground md:text-4xl">{section.h2}</h2>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground md:text-base">{section.body}</p>
              {(section.links || []).filter(isSafeInternalHref).length > 0 && (
                <div className="mb-5 flex flex-wrap gap-2">
                  {(section.links || []).filter(isSafeInternalHref).map((href) => {
                    const match = links.find((item) => item.url === href)
                    return (
                      <Link key={href} href={href} className="border border-border bg-secondary/40 px-3 py-2 text-sm text-foreground transition-colors hover:border-accent/70 hover:text-accent">
                        {match?.anchor || href}
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          ))}
          {(generated.faq || []).length > 0 && (
            <section id="faq">
              <h2 className="mt-8 mb-3 font-serif text-3xl text-foreground md:text-4xl">{isEn ? "FAQ" : "常见问题"}</h2>
              {(generated.faq || []).map((item) => (
                <div key={item.question}>
                  <h3 className="mt-6 mb-2 font-serif text-xl text-foreground">{item.question}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground md:text-base">{item.answer}</p>
                </div>
              ))}
            </section>
          )}
        </article>

        <aside className="mt-12 space-y-6 lg:mt-0">
          {links.length > 0 && (
            <div>
              <p className="mb-4 font-mono text-[10px] tracking-[0.24em] text-muted-foreground uppercase">
                {isEn ? "Related Pages" : "相关页面"}
              </p>
              <div className="grid grid-cols-1 gap-px border border-border/60 bg-border/60">
                {links.map((link) => (
                  <Link key={link.url} href={link.url} className="bg-card/45 px-3 py-3 text-sm text-foreground transition-colors hover:text-accent">
                    {link.anchor}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <Link
            href="/"
            className="flex border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.18em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent"
          >
            {isEn ? "Back to Home" : "回到首页"}
          </Link>
        </aside>
      </div>

      <SiteFooter />
    </main>
  )
}

function SourceMarkdownArticlePage({
  article,
  currentPath,
  hasAlternateArticle,
}: {
  article: SeoReadyArticle
  currentPath: string
  hasAlternateArticle: boolean
}) {
  const isEn = currentPath.startsWith("/en/")
  const alternatePath = getAlternatePath(currentPath)
  const canonical = `${SITE_URL}${currentPath}`
  const blocks = parseMarkdown(sourceMarkdown(article.body))
  const firstH1 = blocks.find((block): block is { type: "h1"; text: string } => block.type === "h1")?.text
  const title = firstH1 || article.title
  const summary = article.description || sourceParagraphs(blocks, isEn)[0] || ""
  const links = safeLinksForArticle(currentPath, article)
  const breadcrumbs = [
    { label: isEn ? "Fanju" : "饭局 Fanju", href: "/" },
    { label: title, href: currentPath },
  ]

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Fanju",
        alternateName: ["饭局", "饭局app", "Fanju app"],
        url: SITE_URL,
      },
      {
        "@type": "Article",
        "@id": `${canonical}#article`,
        headline: title,
        description: summary,
        url: canonical,
        inLanguage: isEn ? "en" : "zh-CN",
        mainEntityOfPage: canonical,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.label,
          item: `${SITE_URL}${item.href}`,
        })),
      },
    ],
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang={isEn ? "en" : "zh-CN"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      <nav aria-label="breadcrumb" className="border-b border-border/40 bg-card/20">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-2 md:px-8">
          <ol className="flex flex-wrap items-center gap-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden>/</span>}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="transition-colors hover:text-accent">{crumb.label}</Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
          {hasAlternateArticle && (
            <Link
              href={alternatePath}
              className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-accent"
            >
              {isEn ? "中文" : "English"}
            </Link>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16 lg:grid lg:grid-cols-[1fr_280px] lg:gap-12">
        <article className="prose-fanju">
          <h1 className="mt-0 mb-4 font-serif text-4xl text-foreground md:text-5xl">{title}</h1>
          {summary && (
            <div className="answer-summary mb-5 border-l-4 border-accent bg-card/40 px-4 py-4">
              <p className="m-0 text-sm leading-relaxed text-muted-foreground md:text-base">{summary}</p>
            </div>
          )}
          <RenderBlocks blocks={blocks} skipFirstH1 />
        </article>

        <aside className="mt-12 space-y-6 lg:mt-0">
          {links.length > 0 && (
            <div>
              <p className="mb-4 font-mono text-[10px] tracking-[0.24em] text-muted-foreground uppercase">
                {isEn ? "Related Pages" : "相关页面"}
              </p>
              <div className="grid grid-cols-1 gap-px border border-border/60 bg-border/60">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} className="bg-card/45 px-3 py-3 text-sm text-foreground transition-colors hover:text-accent">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <Link
            href="/"
            className="flex border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.18em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent"
          >
            {isEn ? "Back to Home" : "回到首页"}
          </Link>
        </aside>
      </div>

      <SiteFooter />
    </main>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SeoReadyArticlePageProps {
  article: SeoReadyArticle
  /** The actual URL path being rendered (may differ from article.canonicalPath on fallback). */
  currentPath: string
  /** Whether a dedicated ready article exists for the alternate language path. */
  hasAlternateArticle?: boolean
}

export function SeoReadyArticlePage({ article, currentPath, hasAlternateArticle = false }: SeoReadyArticlePageProps) {
  if (article.generatedArticle) {
    return <GeneratedSeoArticlePage article={article} currentPath={currentPath} hasAlternateArticle={hasAlternateArticle} />
  }
  if (article.renderMode === "source") {
    return <SourceMarkdownArticlePage article={article} currentPath={currentPath} hasAlternateArticle={hasAlternateArticle} />
  }

  const blocks = parseMarkdown(article.body)

  // Language is determined by the current URL path, not the article's lang field.
  // This ensures fallback pages show the correct UI language.
  const isEn = currentPath.startsWith("/en/")
  const alternatePath = getAlternatePath(currentPath)
  const canonicalUrl = `${SITE_URL}${currentPath}`
  const route = routeContext(currentPath, article, isEn)
  const title = guideTitle(route, isEn)
  const summary = answerSummary(route, isEn)
  const faq = faqItems(route, isEn)
  const links = safeLinksForArticle(currentPath, article)
  const source = sourceParagraphs(blocks, isEn)
  const cityHubPath = route.citySlug ? `${isEn ? "/en" : ""}/city/${route.citySlug}` : (isEn ? "/en/cities" : "/cities")
  const safeCityHubPath = isSafeInternalHref(cityHubPath) ? cityHubPath : (isEn ? "/en/cities" : "/cities")

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Fanju",
        alternateName: ["饭局", "饭局app", "Fanju app"],
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "Fanju",
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: ["zh-CN", "en"],
      },
      {
        "@type": "MobileApplication",
        "@id": `${SITE_URL}/#mobile-application`,
        name: "Fanju app",
        alternateName: "饭局app",
        applicationCategory: "SocialNetworkingApplication",
        operatingSystem: "iOS, Android",
        url: SITE_URL,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Article",
        "@id": `${canonicalUrl}#article`,
        headline: title,
        description: summary,
        url: canonicalUrl,
        inLanguage: isEn ? "en" : "zh-CN",
        mainEntityOfPage: canonicalUrl,
        articleSection: route.topic.en,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        mainEntity: faq.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  }

  const breadcrumbs = [
    { label: isEn ? "Fanju" : "饭局 Fanju", href: "/" },
    { label: route.city, href: safeCityHubPath },
    { label: title, href: currentPath },
  ]

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.label,
      item: `${SITE_URL}${b.href}`,
    })),
  }

  return (
    <main className="min-h-screen bg-background text-foreground" lang={isEn ? "en" : "zh-CN"}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />

      {/* Breadcrumb + language toggle */}
      <nav aria-label="breadcrumb" className="border-b border-border/40 bg-card/20">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-2 md:px-8">
          <ol className="flex flex-wrap items-center gap-1 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden>/</span>}
                {i < breadcrumbs.length - 1 ? (
                  <Link href={crumb.href} className="transition-colors hover:text-accent">{crumb.label}</Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
          {/* Language toggle — only shown when alternate has a dedicated ready article */}
          {hasAlternateArticle && (
            <Link
              href={alternatePath}
              className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-accent"
            >
              {isEn ? "中文" : "English"}
            </Link>
          )}
        </div>
      </nav>

      {/* Article body */}
      <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16 lg:grid lg:grid-cols-[1fr_280px] lg:gap-12">
        <article className="prose-fanju">
          <h1 className="font-serif text-4xl text-foreground md:text-5xl mt-0 mb-4">{title}</h1>
          <div className="answer-summary border-l-4 border-accent bg-card/40 px-4 py-4 mb-5">
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base m-0">{summary}</p>
          </div>
          <KeyPoints route={route} isEn={isEn} />
          <StandardArticleSections route={route} isEn={isEn} source={source} />
          <section id="faq">
            <h2 className="font-serif text-3xl text-foreground md:text-4xl mt-8 mb-3">{isEn ? "FAQ" : "常见问题"}</h2>
            {faq.map(([question, answer]) => (
              <div key={question}>
                <h3 className="font-serif text-xl text-foreground mt-6 mb-2">{question}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base mb-4">{answer}</p>
              </div>
            ))}
          </section>
        </article>

        {/* Sidebar */}
        <aside className="mt-12 space-y-6 lg:mt-0">
          <div>
            <p className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground uppercase mb-4">
              {isEn ? "Related Pages" : "相关页面"}
            </p>
            <div className="grid grid-cols-1 gap-px border border-border/60 bg-border/60">
              {links.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="bg-card/45 px-3 py-3 text-sm text-foreground transition-colors hover:text-accent"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/"
            className="flex border border-border bg-secondary/40 px-4 py-3 font-mono text-[11px] tracking-[0.18em] text-foreground uppercase transition-colors hover:border-accent/70 hover:text-accent"
          >
            {isEn ? "Back to Home" : "回到首页"}
          </Link>
        </aside>
      </div>

      <SiteFooter />
    </main>
  )
}

// ─── Metadata helper ──────────────────────────────────────────────────────────

/**
 * @param article  The article being rendered (may be a fallback).
 * @param currentPath  The actual URL path (determines canonical + hreflang).
 * @param hasAlternate  Whether a dedicated ready article exists for the alternate language.
 */
export function seoReadyArticleMetadata(article: SeoReadyArticle, currentPath: string, hasAlternate = false) {
  if (article.generatedArticle) {
    const generated = article.generatedArticle
    const alternates = hasAlternate ? hreflangAlternates(currentPath) : { canonical: canonicalUrl(currentPath) }
    return {
      title: generated.metaTitle || generated.title,
      description: generated.metaDescription || generated.excerpt || generated.directAnswer,
      alternates,
      robots: { index: generated.robots === "index,follow", follow: true },
      openGraph: {
        title: generated.metaTitle || generated.title,
        description: generated.metaDescription || generated.excerpt || generated.directAnswer,
        url: canonicalUrl(currentPath),
        type: "article" as const,
      },
    }
  }

  if (article.renderMode === "source") {
    const blocks = parseMarkdown(sourceMarkdown(article.body))
    const firstH1 = blocks.find((block): block is { type: "h1"; text: string } => block.type === "h1")?.text
    const title = firstH1 || article.title
    const description = article.description || sourceParagraphs(blocks, currentPath.startsWith("/en/"))[0]
    const alternates = hasAlternate ? hreflangAlternates(currentPath) : { canonical: canonicalUrl(currentPath) }
    return {
      title,
      description,
      alternates,
      openGraph: {
        title,
        description,
        url: canonicalUrl(currentPath),
        type: "article" as const,
      },
    }
  }

  const isEn = currentPath.startsWith("/en/")
  const route = routeContext(currentPath, article, isEn)
  const title = guideTitle(route, isEn)
  const description = answerSummary(route, isEn)

  const alternates = hasAlternate ? hreflangAlternates(currentPath) : { canonical: canonicalUrl(currentPath) }

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: canonicalUrl(currentPath),
      type: "article" as const,
    },
  }
}
