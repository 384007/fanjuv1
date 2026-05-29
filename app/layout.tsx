import type { Metadata, Viewport } from "next"
import { Inter, Cormorant_Garamond, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LanguageProvider } from "@/components/language-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

const SITE_URL = "https://fanju.app"
const SITE_NAME = "饭局 Fanju"
const BRAND_ICON = "/icon.svg?v=20260529-v1"
const APPLE_ICON = "/apple-icon.png?v=20260530-v3"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "饭局 · 饭搭子 — 同城约饭找饭局 | Fanju",
    template: "%s · 饭局 Fanju",
  },
  description:
    "饭局 Fanju 是同城约饭、找饭搭子、组饭局的社交平台。不想一个人吃饭？来 Fanju 找同城饭友。覆盖各类主题饭局、盲盒饭局，马上找到一起吃饭的人。",
  applicationName: SITE_NAME,
  generator: "Fanju",
  referrer: "origin-when-cross-origin",
  keywords: [
    "饭局",
    "饭局 Fanju",
    "Fanju",
    "全球饭局社交网络",
    "饭局社交",
    "真实线下饭局",
    "同频饭局",
    "城市饭局",
    "兴趣饭局",
    "单身饭局",
    "商务饭局",
    "创业者饭局",
    "周末饭局",
    "高端饭局",
    "线下社交",
    "同城社交",
    "真实社交",
    "饭局活动",
    "城市生活方式",
    "深圳饭局",
    "上海饭局",
    "北京饭局",
    "杭州饭局",
    "广州饭局",
    "成都饭局",
    "香港饭局",
    "澳门饭局",
    "台湾饭局",
    "新加坡饭局",
    "曼谷饭局",
    "东京饭局",
    "AI 撮合",
    "MBTI 交友",
    "global social dining network",
    "social dining",
    "dining experiences",
    "real-life dining experiences",
    "meet people over dinner",
    "dinner events",
    "offline social network",
    "city-based social dining",
    "curated dinner",
    "interest dinner",
    "business dinner",
    "singles dinner",
    "founder dinner",
  ],
  authors: [{ name: "Fanju", url: SITE_URL }],
  creator: "Fanju",
  publisher: "Fanju",
  category: "Lifestyle · Social · Dining",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    alternateLocale: ["en_US", "zh_HK", "zh_TW"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "饭局 Fanju｜全球同频饭局网络",
    description:
      "一顿饭，认识同频的同频的人。中国大陆与全球城市（纽约、旧金山、伦敦、东京、悉尼、新加坡、温哥华、多伦多）同步招募主办方。",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "饭局 Fanju · 全球同频饭局网络",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "饭局 Fanju｜全球同频饭局网络",
    description:
      "一顿饭，认识同频的同频的人。全球城市 · 主办方招募中 · 不展示虚假报名人数。",
    images: ["/og.jpg"],
    creator: "@fanju_app",
    site: "@fanju_app",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: BRAND_ICON, sizes: "any", type: "image/svg+xml" }],
    shortcut: [BRAND_ICON],
    apple: [{ url: APPLE_ICON, sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest?v=20260530-v3",
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  other: {
    "apple-touch-icon": APPLE_ICON,
    "msapplication-TileImage": APPLE_ICON,
    "msapplication-TileColor": "#000000",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#000000" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "饭局 Fanju",
      alternateName: ["Fanju", "FANJU", "饭局"],
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      description:
        "面向全球年轻人的同频饭局网络。中国大陆城市优先，海外城市城市（纽约、旧金山、伦敦、东京、悉尼、新加坡、温哥华、多伦多等）同步展开。",
      sameAs: [
        "https://twitter.com/fanju_app",
      ],
      foundingDate: "2026-01-01",
      areaServed: [
        { "@type": "Country", name: "China" },
        { "@type": "Country", name: "United States" },
        { "@type": "Country", name: "United Kingdom" },
        { "@type": "Country", name: "Australia" },
        { "@type": "Country", name: "Japan" },
        { "@type": "Country", name: "Singapore" },
        { "@type": "Country", name: "Canada" },
        { "@type": "Country", name: "Hong Kong" },
        { "@type": "Country", name: "Taiwan" },
      ],
      knowsLanguage: ["zh-CN", "zh-Hans", "zh-Hant", "en"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: ["zh-CN", "en-US"],
      publisher: { "@id": `${SITE_URL}#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Service",
      name: "饭局 Fanju · 全球同频饭局协议",
      provider: { "@id": `${SITE_URL}#organization` },
      serviceType: "Social dining network",
      areaServed: [
        { "@type": "Country", name: "China" },
        { "@type": "Country", name: "United States" },
        { "@type": "Country", name: "United Kingdom" },
        { "@type": "Country", name: "Australia" },
        { "@type": "Country", name: "Japan" },
        { "@type": "Country", name: "Singapore" },
        { "@type": "Country", name: "Canada" },
      ],
      audience: {
        "@type": "Audience",
        audienceType: "people, ages 25–35, worldwide",
      },
    },
    {
      "@type": "ItemList",
      name: "饭局 Fanju 优先城市 / Fanju priority cities",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "深圳 Shenzhen", url: `${SITE_URL}/city/shenzhen` },
        { "@type": "ListItem", position: 2, name: "广州 Guangzhou", url: `${SITE_URL}/city/guangzhou` },
        { "@type": "ListItem", position: 3, name: "上海 Shanghai", url: `${SITE_URL}/city/shanghai` },
        { "@type": "ListItem", position: 4, name: "北京 Beijing", url: `${SITE_URL}/city/beijing` },
        { "@type": "ListItem", position: 5, name: "杭州 Hangzhou", url: `${SITE_URL}/city/hangzhou` },
        { "@type": "ListItem", position: 6, name: "成都 Chengdu", url: `${SITE_URL}/city/chengdu` },
        { "@type": "ListItem", position: 7, name: "纽约 New York", url: `${SITE_URL}/city/new-york` },
        { "@type": "ListItem", position: 8, name: "旧金山 San Francisco", url: `${SITE_URL}/city/san-francisco` },
        { "@type": "ListItem", position: 9, name: "伦敦 London", url: `${SITE_URL}/city/london` },
        { "@type": "ListItem", position: 10, name: "东京 Tokyo", url: `${SITE_URL}/city/tokyo` },
        { "@type": "ListItem", position: 11, name: "悉尼 Sydney", url: `${SITE_URL}/city/sydney` },
        { "@type": "ListItem", position: 12, name: "新加坡 Singapore", url: `${SITE_URL}/city/singapore` },
      ],
    },
  ],
}
// FAQPage removed from global JSON-LD.
// Reason: injecting FAQPage at layout level causes Search Console
// "enhanced feature" errors because most pages don't display these Q&As.
// FAQ content is preserved as visible HTML on individual pages.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${cormorant.variable} ${geistMono.variable} bg-background`}
    >
      <head>
        <link rel="alternate" hrefLang="zh-CN" href={SITE_URL} />
        <link rel="alternate" hrefLang="zh-Hans" href={SITE_URL} />
        <link rel="alternate" hrefLang="en" href={`${SITE_URL}/?lang=en`} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />
        <link rel="icon" href={BRAND_ICON} type="image/svg+xml" />
        <link rel="shortcut icon" href={BRAND_ICON} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={APPLE_ICON} />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <LanguageProvider>{children}</LanguageProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
