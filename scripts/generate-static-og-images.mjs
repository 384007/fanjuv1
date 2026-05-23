import { existsSync } from "node:fs"
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, relative } from "node:path"
import { ImageResponse } from "next/og.js"

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, "out")
const WIDTH = 1200
const HEIGHT = 630

function h(type, props, ...children) {
  return { type, props: { ...(props || {}), children: children.length === 1 ? children[0] : children } }
}

function titleCase(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function matchText(html, pattern) {
  const match = html.match(pattern)
  return match ? decodeHtml(match[1].replace(/<[^>]*>/g, "").trim()) : ""
}

function getOgData(html, citySlug, categorySlug, lang) {
  const h1 = matchText(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const served = matchText(html, /"areaServed":\{"@type":"Place","name":"([^"]+)"/)
  const fallbackCity = titleCase(citySlug)
  const fallbackCategory = titleCase(categorySlug)
  const city = served || fallbackCity
  const category = h1.startsWith(city) ? h1.slice(city.length).trim() : fallbackCategory

  return {
    city,
    category: category || fallbackCategory,
    tagline: lang === "en" ? "Real Connections · Small Tables · Social Dining" : "真实社交 · 小桌晚餐 · 同城连接",
  }
}

function textSize(text, base, min) {
  if (text.length <= 18) return base
  if (text.length <= 28) return Math.max(min, base - 8)
  return min
}

function imageElement({ city, category, tagline }) {
  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: "60px",
      },
    },
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "24px",
        },
      },
      h("div", { style: { fontSize: 42, fontWeight: 700, color: "#f97316" } }, "fanju.app"),
      h(
        "div",
        {
          style: {
            fontSize: textSize(city, 64, 44),
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.2,
            maxWidth: "900px",
          },
        },
        city,
      ),
      h(
        "div",
        {
          style: {
            fontSize: textSize(category, 48, 34),
            fontWeight: 500,
            color: "#e2e8f0",
            lineHeight: 1.3,
            maxWidth: "900px",
          },
        },
        category,
      ),
      h("div", { style: { marginTop: 20, fontSize: 24, color: "#94a3b8" } }, tagline),
    ),
  )
}

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath, files)
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }
  return files
}

function cityCategoryFromOutHtml(file) {
  const rel = relative(OUT_DIR, file).split("/")
  if (rel.length === 3 && rel[0] === "city" && rel[2].endsWith(".html")) {
    return { lang: "zh", city: rel[1], category: rel[2].replace(/\.html$/, "") }
  }
  if (rel.length === 4 && rel[0] === "en" && rel[1] === "city" && rel[3].endsWith(".html")) {
    return { lang: "en", city: rel[2], category: rel[3].replace(/\.html$/, "") }
  }
  return null
}

async function renderOgImage(file, route) {
  const html = await readFile(file, "utf8")
  const data = getOgData(html, route.city, route.category, route.lang)
  const response = new ImageResponse(imageElement(data), { width: WIDTH, height: HEIGHT })
  const image = Buffer.from(await response.arrayBuffer())
  const outPath = route.lang === "en"
    ? join(OUT_DIR, "en", "city", route.city, route.category, "opengraph-image")
    : join(OUT_DIR, "city", route.city, route.category, "opengraph-image")

  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, image)
}

if (!existsSync(OUT_DIR)) {
  console.log("[static-og] out/ does not exist; skipped")
  process.exit(0)
}

const routes = (await walk(OUT_DIR))
  .map((file) => ({ file, route: cityCategoryFromOutHtml(file) }))
  .filter((item) => item.route)

let index = 0
const workers = Array.from({ length: 8 }, async () => {
  while (index < routes.length) {
    const current = routes[index++]
    await renderOgImage(current.file, current.route)
  }
})

await Promise.all(workers)
console.log(`[static-og] generated ${routes.length} city/category OG images`)
