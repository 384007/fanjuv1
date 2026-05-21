/** @type {import('next').NextConfig} */
// Static export is only needed for Cloudflare Pages production build.
// In `next dev` (or when DISABLE_STATIC_EXPORT=1) the admin lab pages
// (`dynamic = "force-dynamic"`, cookies, API routes) need a runtime server,
// so we drop `output: "export"` in those modes.
const isDev = process.env.NODE_ENV !== "production"
const disableExport = process.env.DISABLE_STATIC_EXPORT === "1" || isDev

const nextConfig = {
  ...(disableExport ? {} : { output: "export" }),
  trailingSlash: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
