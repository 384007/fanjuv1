import { existsSync, rmSync, statSync, mkdirSync, copyFileSync } from "node:fs"
import { readdir, rm } from "node:fs/promises"
import { join } from "node:path"

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, "out")

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) await walk(fullPath, files)
    else if (entry.isFile()) files.push(fullPath)
  }
  return files
}

if (!existsSync(OUT_DIR) || !statSync(OUT_DIR).isDirectory()) {
  console.log("[cloudflare-prune] out/ does not exist; skipped")
  process.exit(0)
}

let removed = 0

// 1. Remove city/[city]/[topic]/* and en/city/[city]/[topic]/* — served by Workers, not Pages
// Keep city/[city]/index.html (single-city hub pages, NOT handled by Worker)
for (const base of [join(OUT_DIR, "city"), join(OUT_DIR, "en", "city")]) {
  if (!existsSync(base)) continue
  // Remove subdirectories (topic-level pages like /city/dongguan/singles-dinner)
  for (const entry of await readdir(base, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const cityDir = join(base, entry.name)
    // Remove topic subdirs inside each city dir, keep index.html
    for (const sub of await readdir(cityDir, { withFileTypes: true })) {
      if (sub.isDirectory()) {
        await rm(join(cityDir, sub.name), { recursive: true, force: true })
        removed++
      }
    }
  }
  console.log(`[cloudflare-prune] pruned worker-served topic subdirs from: ${base.replace(ROOT + "/", "")}`)
}

// 2. Remove all __next*.txt RSC payload files (never needed for static serving)
const allFiles = await walk(OUT_DIR)
for (const file of allFiles) {
  const name = file.split("/").pop() ?? ""
  if (name.startsWith("__next") && name.endsWith(".txt")) {
    rmSync(file)
    removed++
  }
}

// 3. Remove any remaining .txt with a matching .html
const remaining1 = await walk(OUT_DIR)
for (const file of remaining1) {
  if (file.endsWith(".txt") && existsSync(`${file.slice(0, -4)}.html`)) {
    rmSync(file)
    removed++
  }
}

const remaining = (await walk(OUT_DIR)).length
console.log(`[cloudflare-prune] removed ${removed} files/dirs; ${remaining} files remain in out/`)

if (remaining > 20000) {
  console.error(`[cloudflare-prune] ERROR: ${remaining} files exceed CF Pages 20k limit!`)
  process.exit(1)
}

// 4. Ensure public/icons/ is copied to out/icons/ (Next.js static export can miss subdirectories)
const PUBLIC_ICONS = join(ROOT, "public", "icons")
const OUT_ICONS = join(OUT_DIR, "icons")
if (existsSync(PUBLIC_ICONS)) {
  mkdirSync(OUT_ICONS, { recursive: true })
  for (const entry of await readdir(PUBLIC_ICONS, { withFileTypes: true })) {
    if (entry.isFile()) copyFileSync(join(PUBLIC_ICONS, entry.name), join(OUT_ICONS, entry.name))
  }
  console.log(`[cloudflare-prune] copied public/icons/ → out/icons/`)
}
