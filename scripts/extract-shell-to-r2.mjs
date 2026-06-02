#!/usr/bin/env node
/**
 * scripts/extract-shell-to-r2.mjs
 *
 * After `next build`, pick one city article HTML from out/ and split it into:
 *   - shell_head: <!DOCTYPE> … </div>  (everything before <main class="min-h-screen")
 *   - shell_tail: </main> … </html>    (everything after the article's </main>)
 *
 * Both are uploaded to R2 so the Worker can wrap dynamic article content with the
 * exact same Next.js CSS / fonts / scripts as the static export.
 *
 * Usage:  node scripts/extract-shell-to-r2.mjs [--dry-run]
 */

import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()
const CF_ACCOUNT_ID = "e7406eaaafd4d38aa87b6b4d38428719"
const CF_API_TOKEN  = "cfut_q77hDOLZgoNFLFzjv3h2qtgVOMordmg76HIIOqoia8aac667"
const OUT_DIR = join(ROOT, "out")
const WORKER_CONFIG = "workers/fanju-seo/wrangler.toml"
const R2_BUCKET = "fanju-articles-prod"
const DRY_RUN = process.argv.includes("--dry-run")

// ── Find a city article HTML to use as template source ───────────────────────

function findCityArticleHtml() {
  // prefer a city/[city]/[topic] style article that was built
  const cityDir = join(OUT_DIR, "city")
  try {
    const cities = readdirSync(cityDir)
    for (const city of cities) {
      const cityPath = join(cityDir, city)
      try {
        const topics = readdirSync(cityPath)
        for (const topic of topics) {
          const htmlPath = join(cityPath, topic, "index.html")
          try {
            const stat = readdirSync(join(cityPath, topic))
            if (stat.includes("index.html")) {
              return join(cityPath, topic, "index.html")
            }
          } catch {}
          // also try direct slug HTML at out/
        }
      } catch {}
    }
  } catch {}

  // fallback: any city-slug article at top-level out/
  const files = readdirSync(OUT_DIR).filter((f) => f.endsWith(".html") && f.includes("-guide"))
  if (files.length) return join(OUT_DIR, files[0])

  throw new Error("No city article HTML found in out/ — run `pnpm build` first")
}

// ── Split HTML into shell_head + shell_tail ───────────────────────────────────

function splitShell(html) {
  // The article <main> always has class="min-h-screen bg-background text-foreground"
  const MAIN_OPEN = /<main class="min-h-screen[^"]*"/
  const mainMatch = html.match(MAIN_OPEN)
  if (!mainMatch) throw new Error("Could not find article <main class='min-h-screen'> in HTML")

  const mainStart = mainMatch.index
  const mainTagEnd = html.indexOf(">", mainStart) + 1

  // Find closing </main>
  const mainClose = html.lastIndexOf("</main>")
  if (mainClose === -1) throw new Error("Could not find </main> in HTML")

  const shellHead = html.slice(0, mainStart)
  const shellTail = html.slice(mainClose + 7) // after </main>

  return { shellHead, shellTail }
}

// ── R2 upload ─────────────────────────────────────────────────────────────────

async function r2Put(key, content) {
  if (DRY_RUN) {
    console.log(`[dry-run] R2 put: ${key} (${content.length} bytes)`)
    return
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/${key}`
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: content,
  })
  if (!res.ok) throw new Error(`R2 upload failed: ${res.status} ${await res.text().then(t => t.slice(0,200))}`)
  console.log(`[shell] uploaded ${key} (${content.length} bytes)`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

const htmlPath = findCityArticleHtml()
console.log(`[shell] Using template source: ${htmlPath.replace(ROOT + "/", "")}`)

const html = readFileSync(htmlPath, "utf8")
const { shellHead, shellTail } = splitShell(html)

console.log(`[shell] head: ${shellHead.length} bytes, tail: ${shellTail.length} bytes`)

await r2Put("shell/head.html", shellHead)
await r2Put("shell/tail.html", shellTail)

console.log("[shell] Done. Worker can now assemble pages from shell + article content.")
