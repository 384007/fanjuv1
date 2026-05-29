import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { HeroSection } from "@/components/hero-section"

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: {
      "zh-CN": "/",
      "zh-Hans": "/",
      en: "/?lang=en",
      "x-default": "/",
    },
  },
  robots: { index: true, follow: true },
}
import { HomeProductEntry } from "@/components/home-product-entry"
import { LiveTicker } from "@/components/live-ticker"
import { MarketsSection } from "@/components/markets-section"
import { InfrastructureSection } from "@/components/infrastructure-section"
import { ProtocolNumbers } from "@/components/protocol-numbers"
import { HomeSeoLinks } from "@/components/home-seo-links"
import { CtaSection } from "@/components/cta-section"
import { SiteFooter } from "@/components/site-footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <HeroSection />
      <HomeProductEntry />
      <LiveTicker />
      <MarketsSection />
      <InfrastructureSection />
      <ProtocolNumbers />
      <HomeSeoLinks />
      <CtaSection />
      <SiteFooter />
    </main>
  )
}
