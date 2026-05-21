import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Demo mode: if ADMIN_TOKEN is unset, accept "demo" so the lab can be
// previewed without configuration. Same default as app/admin/layout.tsx
// and app/api/lab/[...path]/route.ts.
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "demo"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // The login page itself must stay public, otherwise the layout's
  // auth check would redirect /admin/login -> /admin/login forever.
  if (pathname === "/admin/login") {
    return NextResponse.next()
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  const token = req.cookies.get("admin_token")?.value
  if (!token || token !== ADMIN_TOKEN) {
    const url = req.nextUrl.clone()
    url.pathname = "/admin/login"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
