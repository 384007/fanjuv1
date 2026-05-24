import { spawn } from "child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"

const ROOT = process.cwd()
const SITE = "https://fanju.app"
const PUBLIC_DIR = join(ROOT, "public")
const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:3100").replace(/\/$/, "")
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.CONCURRENCY || "8", 10))
const TIMEOUT_MS = Math.max(5000, Number.parseInt(process.env.TIMEOUT_MS || "30000", 10))
const REQUEST_TIMEOUT_MS = Math.max(5000, Number.parseInt(process.env.REQUEST_TIMEOUT_MS || "10000", 10))
const URL_LIMIT = Math.max(0, Number.parseInt(process.env.URL_LIMIT || "0", 10))
const OUTPUT_FILE = process.env.OUTPUT_FILE || "/private/tmp/fanju-headless-chrome-sitemap.json"
const URLS = (process.env.URLS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
const CHROME = process.env.CHROME_BIN || [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome",
].find((path) => existsSync(path))

function sitemapPaths(file) {
  if (!existsSync(file)) return []
  const xml = readFileSync(file, "utf8")
  const paths = []
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const url = new URL(match[1])
      if (url.origin === SITE) paths.push(url.pathname.replace(/\/$/, "") || "/")
    } catch {
      // Other validators handle malformed sitemap entries.
    }
  }
  return paths
}

function unique(items) {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b))
}

function pathFromUrl(raw) {
  const value = String(raw || "").trim()
  if (!value) return ""
  if (value.startsWith("/")) return value.replace(/\/$/, "") || "/"
  try {
    return new URL(value).pathname.replace(/\/$/, "") || "/"
  } catch {
    return ""
  }
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function launchChrome() {
  if (!CHROME) throw new Error("Chrome binary not found. Set CHROME_BIN.")

  const userDataDir = mkdtempSync(join(tmpdir(), "fanju-chrome-"))
  const child = spawn(CHROME, [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    "--disable-background-networking",
    "--disable-client-side-phishing-detection",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-extensions",
    "--disable-features=AutofillServerCommunication,MediaRouter,OptimizationHints,Translate",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--metrics-recording-only",
    "--mute-audio",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] })

  const ready = new Promise((resolve, reject) => {
    let stderr = ""
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error(`Chrome did not expose DevTools within ${REQUEST_TIMEOUT_MS}ms`))
    }, REQUEST_TIMEOUT_MS)

    child.stderr.setEncoding("utf8")
    child.stderr.on("data", (chunk) => {
      stderr += chunk
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)
      if (!match || settled) return
      settled = true
      clearTimeout(timer)
      resolve(match[1])
    })

    child.on("exit", (code, signal) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(new Error(`Chrome exited before DevTools was ready: code=${code} signal=${signal}`))
    })
  })

  return { child, ready, userDataDir }
}

async function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl)
  const pending = new Map()
  const listeners = new Map()
  let nextId = 1

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`WebSocket open timeout: ${wsUrl}`)), REQUEST_TIMEOUT_MS)
    ws.addEventListener("open", () => {
      clearTimeout(timer)
      resolve()
    }, { once: true })
    ws.addEventListener("error", () => {
      clearTimeout(timer)
      reject(new Error(`WebSocket error: ${wsUrl}`))
    }, { once: true })
  })

  ws.addEventListener("message", (event) => {
    let message
    try {
      message = JSON.parse(String(event.data))
    } catch {
      return
    }

    if (message.id && pending.has(message.id)) {
      const item = pending.get(message.id)
      pending.delete(message.id)
      clearTimeout(item.timer)
      if (message.error) {
        item.reject(new Error(`${item.method}: ${message.error.message || JSON.stringify(message.error)}`))
      } else {
        item.resolve(message.result || {})
      }
      return
    }

    if (!message.method || !listeners.has(message.method)) return
    const handlers = listeners.get(message.method)
    listeners.delete(message.method)
    for (const handler of handlers) handler(message.params || {})
  })

  ws.addEventListener("close", () => {
    for (const [id, item] of pending.entries()) {
      clearTimeout(item.timer)
      item.reject(new Error(`${item.method}: WebSocket closed before response ${id}`))
    }
    pending.clear()
    listeners.clear()
  })

  function send(method, params = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
    const id = nextId++
    ws.send(JSON.stringify({ id, method, params }))
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id)
        reject(new Error(`${method}: timeout after ${timeoutMs}ms`))
      }, timeoutMs)
      pending.set(id, { method, resolve, reject, timer })
    })
  }

  function once(method, timeoutMs = TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const handlers = listeners.get(method) || []
        listeners.set(method, handlers.filter((handler) => handler !== onEvent))
        reject(new Error(`${method}: timeout after ${timeoutMs}ms`))
      }, timeoutMs)
      function onEvent(params) {
        clearTimeout(timer)
        resolve(params)
      }
      const handlers = listeners.get(method) || []
      handlers.push(onEvent)
      listeners.set(method, handlers)
    })
  }

  function close() {
    try {
      ws.close()
    } catch {
      // The browser may already have closed the socket.
    }
  }

  return { close, once, send }
}

async function createTarget(debugOrigin) {
  const response = await fetch(`${debugOrigin}/json/new?${encodeURIComponent("about:blank")}`, { method: "PUT" })
  if (!response.ok) throw new Error(`create-target:${response.status}`)
  return response.json()
}

async function closeTarget(debugOrigin, targetId) {
  if (!targetId) return
  try {
    await fetch(`${debugOrigin}/json/close/${targetId}`)
  } catch {
    // Best effort cleanup only.
  }
}

async function runPool(items, worker) {
  const out = new Array(items.length)
  let cursor = 0
  let completed = 0
  async function runWorker() {
    while (cursor < items.length) {
      const index = cursor++
      out[index] = await worker(items[index], index)
      completed += 1
      if (completed % 50 === 0 || completed === items.length) {
        console.log(`  browser progress ${completed}/${items.length}`)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, runWorker))
  return out
}

async function checkPath(debugOrigin, path) {
  const url = `${BASE_URL}${path === "/" ? "" : path}`
  const issues = []
  let target
  let client

  try {
    target = await createTarget(debugOrigin)
    client = await createCdpClient(target.webSocketDebuggerUrl)
    await client.send("Page.enable")
    await client.send("Runtime.enable")

    const loaded = client.once("Page.loadEventFired", TIMEOUT_MS).catch((err) => {
      issues.push(`load-timeout:${String(err.message || err).slice(0, 100)}`)
    })
    const navigation = await client.send("Page.navigate", { url }, REQUEST_TIMEOUT_MS)
    if (navigation.errorText) issues.push(`navigation-error:${navigation.errorText}`)
    await loaded

    const result = await client.send("Runtime.evaluate", {
      expression: "document.documentElement ? document.documentElement.outerHTML : ''",
      returnByValue: true,
      awaitPromise: true,
    }, REQUEST_TIMEOUT_MS)

    const html = String(result.result?.value || "")
    const text = visibleText(html)
    if (!html.includes("<html") && !html.includes("<!DOCTYPE html")) issues.push("missing-html")
    if (/<title>\s*404/i.test(html) || /\bNot found\b/i.test(text)) issues.push("rendered-not-found")
    if (!/<h1\b/i.test(html)) issues.push("missing-h1")
    if (text.length < 500) issues.push(`thin-rendered-text:${text.length}`)
    if (/提示词|路由清单|技术实现|自动化流水线|Return valid JSON|Body requirements/i.test(text)) {
      issues.push("rendered-internal-tech-text")
    }
  } catch (err) {
    issues.push(`browser-error:${String(err.message || err).slice(0, 180)}`)
  } finally {
    if (client) client.close()
    await closeTarget(debugOrigin, target?.id)
  }

  return { path, ok: issues.length === 0, issues }
}

const chrome = launchChrome()
let chromeWsUrl
try {
  chromeWsUrl = await chrome.ready
  const chromeUrl = new URL(chromeWsUrl)
  const debugOrigin = `http://${chromeUrl.host}`
  const paths = URLS.length
    ? unique(URLS.map(pathFromUrl).filter(Boolean))
    : unique([
        ...sitemapPaths(join(PUBLIC_DIR, "sitemap.xml")),
        ...sitemapPaths(join(PUBLIC_DIR, "product-sitemap.xml")),
      ])
  const limited = URL_LIMIT > 0 ? paths.slice(0, URL_LIMIT) : paths

  console.log(`Headless Chrome sitemap check: base=${BASE_URL} pages=${limited.length} concurrency=${CONCURRENCY}`)
  const results = await runPool(limited, (path) => checkPath(debugOrigin, path))
  const failures = results.filter((result) => !result.ok)
  const report = {
    checkedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    checked: results.length,
    failed: failures.length,
    failures,
  }

  writeFileSync(OUTPUT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8")
  console.log(`Headless Chrome check: checked=${report.checked} failed=${report.failed}`)
  console.log(`Report: ${OUTPUT_FILE}`)
  for (const failure of failures.slice(0, 40)) {
    console.log(`FAIL ${failure.path} ${failure.issues.join("; ")}`)
  }
  if (failures.length > 40) console.log(`...and ${failures.length - 40} more`)
  if (failures.length) process.exitCode = 1
  else console.log("OK")
} finally {
  chrome.child.kill("SIGTERM")
  const killTimer = setTimeout(() => chrome.child.kill("SIGKILL"), 1000)
  killTimer.unref()
  try {
    rmSync(chrome.userDataDir, { recursive: true, force: true })
  } catch {
    // Best effort cleanup only.
  }
}
