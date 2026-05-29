import path from "node:path"

/** @type {import('next').NextConfig} */
// Static export is only needed for Cloudflare Pages production build.
// In `next dev` (or when DISABLE_STATIC_EXPORT=1) the admin lab pages
// (`dynamic = "force-dynamic"`, cookies, API routes) need a runtime server,
// so we drop `output: "export"` in those modes.
const isDev = process.env.NODE_ENV !== "production"
const disableExport = process.env.DISABLE_STATIC_EXPORT === "1" || isDev
const rootDir = process.cwd()

const nextConfig = {
  ...(disableExport ? {} : { output: "export" }),
  // Empty turbopack config to satisfy Next 16 when a custom webpack config is present.
  // We still want standard webpack for production builds (more stable with Google fonts in this env).
  turbopack: {},
  webpack(config) {
    config.resolve.alias["next/link"] = path.join(rootDir, "components/static-link.tsx")
    return config
  },
  trailingSlash: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
