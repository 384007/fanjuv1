import { createReadStream, existsSync, statSync } from "fs"
import { createServer } from "http"
import { extname, join, normalize } from "path"

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, "out")
const PORT = Number.parseInt(process.env.PORT || process.argv[2] || "3100", 10)

const TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
}

function safeJoin(root, path) {
  const resolved = normalize(join(root, path.replace(/^\/+/, "")))
  if (!resolved.startsWith(root)) return ""
  return resolved
}

function fileForRequest(pathname) {
  const path = decodeURIComponent(pathname.split("?")[0] || "/")
  const candidates = []
  if (path === "/") {
    candidates.push(join(OUT_DIR, "index.html"))
  } else {
    candidates.push(safeJoin(OUT_DIR, path))
    candidates.push(safeJoin(OUT_DIR, `${path}.html`))
    candidates.push(safeJoin(OUT_DIR, path, "index.html"))
  }
  for (const file of candidates) {
    if (!file || !existsSync(file)) continue
    try {
      if (statSync(file).isFile()) return file
    } catch {
      // try next candidate
    }
  }
  return ""
}

if (!existsSync(OUT_DIR)) {
  console.error("Missing out/. Run pnpm build first.")
  process.exit(1)
}

const server = createServer((req, res) => {
  const file = fileForRequest(req.url || "/")
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" })
    res.end("Not found")
    return
  }
  res.writeHead(200, {
    "content-type": TYPES[extname(file)] || "application/octet-stream",
    "cache-control": "no-store",
  })
  createReadStream(file).pipe(res)
})

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Serving ${OUT_DIR} at http://127.0.0.1:${PORT}`)
})
