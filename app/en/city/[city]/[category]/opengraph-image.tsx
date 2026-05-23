import { ImageResponse } from "next/og"
import { getCity, getCategory } from "@/lib/seo-data"

export const runtime = "edge"
export const alt = "Fanju - Social Dining"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OgImage({ params }: { params: { city: string; category: string } }) {
  const city = getCity(params.city)
  const category = getCategory(params.category)

  const cityName = city?.nameEn ?? params.city
  const categoryName = category?.nameEn ?? params.category

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "42px",
              fontWeight: 700,
              color: "#f97316",
              letterSpacing: "-0.5px",
            }}
          >
            fanju.app
          </div>
          <div
            style={{
              fontSize: "64px",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
              maxWidth: "900px",
            }}
          >
            {cityName}
          </div>
          <div
            style={{
              fontSize: "48px",
              fontWeight: 500,
              color: "#e2e8f0",
              lineHeight: 1.3,
              maxWidth: "900px",
            }}
          >
            {categoryName}
          </div>
          <div
            style={{
              marginTop: "20px",
              fontSize: "24px",
              color: "#94a3b8",
            }}
          >
            Real Connections · Small Tables · Social Dining
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
