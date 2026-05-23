import { ImageResponse } from "next/og"
import { getCategory, getCity } from "@/lib/seo-data"

export const runtime = "edge"
export const dynamic = "force-static"

export const alt = "Fanju city dinner"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

type ImageProps = { params: Promise<{ city: string; category: string }> }

function slugLabel(slug: string) {
  return decodeURIComponent(slug)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default async function Image({ params }: ImageProps) {
  const { city: citySlug, category: categorySlug } = await params
  const city = getCity(citySlug)
  const category = getCategory(categorySlug)
  const cityName = city?.nameEn || slugLabel(citySlug)
  const categoryName = category?.nameEn || slugLabel(categorySlug)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8f1e7",
          color: "#1f1712",
          padding: "64px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "58px",
                height: "58px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "16px",
                background: "#1f1712",
                color: "#f8f1e7",
                fontSize: "30px",
                fontWeight: 800,
              }}
            >
              F
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "30px", fontWeight: 800 }}>fanju.app</div>
              <div style={{ color: "#786557", fontSize: "20px" }}>Fanju</div>
            </div>
          </div>
          <div style={{ color: "#8b4f2a", fontSize: "24px", fontWeight: 700 }}>City Dinner Guide</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ color: "#8b4f2a", fontSize: "38px", fontWeight: 800 }}>{categoryName}</div>
          <div style={{ maxWidth: "980px", fontSize: "94px", fontWeight: 900, lineHeight: 1.02 }}>
            {cityName} Dinners
          </div>
          <div style={{ color: "#4e4037", fontSize: "32px", lineHeight: 1.3 }}>
            Small tables · Host review · Real local connection
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", color: "#786557", fontSize: "24px" }}>
          <div>{cityName} / {categoryName}</div>
          <div>fanju.app</div>
        </div>
      </div>
    ),
    size,
  )
}
