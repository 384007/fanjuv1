import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  // Demo mode: when ADMIN_TOKEN is not set, accept "demo" so the dashboard
  // can be previewed without any backend / env var setup.
  const adminToken = process.env.ADMIN_TOKEN ?? "demo"

  if (!token || token !== adminToken) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 px-6 py-3 flex flex-wrap items-center gap-6 text-sm font-mono">
        <span className="text-amber-400 font-bold">FANJU LAB</span>
        <Link href="/admin/lab/seo" className="text-zinc-400 hover:text-white">
          SEO
        </Link>
        <Link href="/admin/lab/content-lab" className="text-zinc-400 hover:text-white">
          Content
        </Link>
        <Link href="/admin/lab/publish-jobs" className="text-zinc-400 hover:text-white">
          Jobs
        </Link>
        <Link href="/admin/lab/platform-accounts" className="text-zinc-400 hover:text-white">
          Platforms
        </Link>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
