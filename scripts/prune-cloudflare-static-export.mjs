import { existsSync, rmSync, statSync } from "node:fs"
import { readdir } from "node:fs/promises"
import { join } from "node:path"

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, "out")

function isNextFlightText(file) {
  return file.endsWith(".txt") && file.split("/").pop()?.startsWith("__next")
}

function hasMatchingHtml(file) {
  if (!file.endsWith(".txt")) return false
  return existsSync(`${file.slice(0, -4)}.html`)
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

if (!existsSync(OUT_DIR) || !statSync(OUT_DIR).isDirectory()) {
  console.log("[cloudflare-prune] out/ does not exist; skipped")
  process.exit(0)
}

const files = await walk(OUT_DIR)
let removed = 0

for (const file of files) {
  if (isNextFlightText(file) || hasMatchingHtml(file)) {
    rmSync(file)
    removed++
  }
}

const remaining = (await walk(OUT_DIR, [])).length
console.log(`[cloudflare-prune] removed ${removed} Next static flight files; ${remaining} files remain in out/`)
