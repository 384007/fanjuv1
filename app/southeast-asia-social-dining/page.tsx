import { buildGeoMetadata, GeoPageView } from "@/lib/geo-page-data"

export const metadata = buildGeoMetadata("southeast-asia-social-dining")

export default function Page() {
  return <GeoPageView slug="southeast-asia-social-dining" />
}
