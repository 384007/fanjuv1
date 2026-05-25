import { execFileSync, spawnSync } from "child_process"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const tempRoots = []
const outputFiles = []

function tempRoot(name) {
  const root = mkdtempSync(join(tmpdir(), `fanju-${name}-`))
  tempRoots.push(root)
  return root
}

function outputRel(name) {
  const rel = `dist/seo/${name}.jsonl`
  outputFiles.push(join(ROOT, rel))
  return rel
}

function baseEnv(extra = {}) {
  return {
    ...process.env,
    CLOUDFLARE_ACCOUNT_ID: "",
    CLOUDFLARE_API_TOKEN: "",
    CLOUDFLARE_AUTH_TOKEN: "",
    SEO_HISTORY_D1_ENABLED: "0",
    ...extra,
  }
}

function runBuild(env) {
  return execFileSync(process.execPath, ["scripts/seo/build-random-prompt-bank.mjs"], {
    cwd: ROOT,
    env: baseEnv(env),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
}

function runCheck(env) {
  return spawnSync(process.execPath, ["scripts/seo/check-prompt-bank-diversity.mjs"], {
    cwd: ROOT,
    env: baseEnv(env),
    encoding: "utf8",
  })
}

function readJsonl(rel) {
  const file = join(ROOT, rel)
  return readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line))
}

function loadManifestEntries() {
  const manifest = JSON.parse(readFileSync(join(ROOT, "data/seo/route-manifest.json"), "utf8"))
  return manifest.entries || []
}

function firstEligibleEnRoute() {
  const route = loadManifestEntries().find((entry) =>
    entry.locale === "en" &&
    entry.enabled === true &&
    Number(entry.enRank || 0) >= 1 &&
    Number(entry.enRank || 0) <= 100
  )
  assert.ok(route, "expected at least one eligible EN route")
  return route
}

function writeReadyMarkdownHistory(root, route) {
  const readyDir = join(root, "content/seo-ready")
  mkdirSync(readyDir, { recursive: true })
  writeFileSync(join(readyDir, "historical.md"), [
    "---",
    `slug: "historical"`,
    `canonicalPath: "${route.route}"`,
    `lang: "${route.locale}"`,
    `status: "ready"`,
    `aiQualityScore: 100`,
    `routeKey: "${route.locale}:${route.citySlug}:${route.topicSlug}"`,
    "---",
    "",
    "# Historical route",
    "",
  ].join("\n"), "utf8")
}

function writePublishedHashHistory(root, prompt) {
  const distDir = join(root, "dist/seo")
  mkdirSync(distDir, { recursive: true })
  writeFileSync(join(distDir, "unit-published.json"), JSON.stringify({
    drafts: [{
      status: "ready",
      score: 100,
      canonicalPath: "/en/city/not-the-same/history-only",
      locale: "en",
      citySlug: "not-the-same",
      topicSlug: "history-only",
      promptHash: prompt.promptHash,
      profileHash: prompt.profileHash,
    }],
  }, null, 2) + "\n", "utf8")
}

after(() => {
  for (const file of outputFiles) rmSync(file, { force: true })
  for (const root of tempRoots) rmSync(root, { recursive: true, force: true })
})

test("prompt bank is reproducible with the same seed and internally unique", () => {
  const historyRoot = tempRoot("prompt-bank-empty-history")
  const outA = outputRel("test-deterministic-brief-a")
  const outB = outputRel("test-deterministic-brief-b")

  runBuild({
    LIMIT: "1000",
    LANG: "all",
    EN_TOP_CITY_LIMIT: "100",
    RANDOM_SEED: "unit-deterministic-brief",
    OUTPUT_FILE: outA,
    SEO_HISTORY_ROOT: historyRoot,
  })
  runBuild({
    LIMIT: "1000",
    LANG: "all",
    EN_TOP_CITY_LIMIT: "100",
    RANDOM_SEED: "unit-deterministic-brief",
    OUTPUT_FILE: outB,
    SEO_HISTORY_ROOT: historyRoot,
  })

  const a = readJsonl(outA)
  const b = readJsonl(outB)
  assert.equal(a.length, 1000)
  assert.deepEqual(
    a.map((p) => [p.routeKey, p.promptHash, p.profileHash]),
    b.map((p) => [p.routeKey, p.promptHash, p.profileHash]),
  )
  assert.equal(new Set(a.map((p) => p.promptHash)).size, 1000)
  assert.equal(new Set(a.map((p) => p.profileHash)).size, 1000)

  const enBrief = a.find((p) => p.locale === "en")?.articleBrief
  const zhBrief = a.find((p) => p.locale === "zh")?.articleBrief
  assert.ok(enBrief?.routeKey)
  assert.ok(Array.isArray(enBrief.sectionPlan))
  assert.ok(enBrief.languageRules.includes("Natural local English"))
  assert.ok(enBrief.languageRules.includes("Mention Fanju naturally, not aggressively"))
  assert.ok(zhBrief?.languageRules.includes("使用自然中文"))
  assert.ok(zhBrief.languageRules.includes("禁止重复标题"))
})

test("historical markdown route is filtered without trying to backfill duplicates", () => {
  const route = firstEligibleEnRoute()
  const historyRoot = tempRoot("prompt-bank-route-history")
  const out = outputRel("test-historical-route-filter")
  writeReadyMarkdownHistory(historyRoot, route)

  const stdout = runBuild({
    LIMIT: "1",
    LANG: "en",
    EN_TOP_CITY_LIMIT: "100",
    RANDOM_SEED: "unit-route-history",
    TARGET_ROUTES: route.route,
    OUTPUT_FILE: out,
    SEO_HISTORY_ROOT: historyRoot,
  })

  assert.equal(readJsonl(out).length, 0)
  assert.match(stdout, /actualGenerated:\s*0/)
})

test("historical promptHash and profileHash are filtered before emission", () => {
  const route = firstEligibleEnRoute()
  const baseHistory = tempRoot("prompt-bank-hash-empty")
  const historyRoot = tempRoot("prompt-bank-hash-history")
  const baseOut = outputRel("test-historical-hash-base")
  const filteredOut = outputRel("test-historical-hash-filtered")

  runBuild({
    LIMIT: "1",
    LANG: "en",
    EN_TOP_CITY_LIMIT: "100",
    RANDOM_SEED: "unit-hash-history",
    TARGET_ROUTES: route.route,
    OUTPUT_FILE: baseOut,
    SEO_HISTORY_ROOT: baseHistory,
  })
  const [prompt] = readJsonl(baseOut)
  assert.ok(prompt)
  writePublishedHashHistory(historyRoot, prompt)

  const stdout = runBuild({
    LIMIT: "1",
    LANG: "en",
    EN_TOP_CITY_LIMIT: "100",
    RANDOM_SEED: "unit-hash-history",
    TARGET_ROUTES: route.route,
    OUTPUT_FILE: filteredOut,
    SEO_HISTORY_ROOT: historyRoot,
  })

  assert.equal(readJsonl(filteredOut).length, 0)
  assert.match(stdout, /actualGenerated:\s*0/)
})

test("prompt-bank checker fails on historical duplicates", () => {
  const route = firstEligibleEnRoute()
  const emptyHistory = tempRoot("prompt-bank-check-empty")
  const historyRoot = tempRoot("prompt-bank-check-history")
  const out = outputRel("test-check-historical-duplicate")

  runBuild({
    LIMIT: "1",
    LANG: "en",
    EN_TOP_CITY_LIMIT: "100",
    RANDOM_SEED: "unit-check-history",
    TARGET_ROUTES: route.route,
    OUTPUT_FILE: out,
    SEO_HISTORY_ROOT: emptyHistory,
  })
  const [prompt] = readJsonl(out)
  writePublishedHashHistory(historyRoot, prompt)

  const manifestFile = join(historyRoot, "route-manifest.json")
  writeFileSync(manifestFile, JSON.stringify({ entries: [{ ...route, enRank: 1 }] }, null, 2) + "\n", "utf8")
  const result = runCheck({
    PROMPT_BANK_FILE: out,
    SEO_HISTORY_ROOT: historyRoot,
    MANIFEST_FILE: manifestFile,
    LANG: "en",
    EN_TOP_CITY_LIMIT: "1",
  })

  assert.notEqual(result.status, 0)
  assert.match(`${result.stdout}\n${result.stderr}`, /Historical promptHash duplicates:\s*1/)
  assert.match(`${result.stdout}\n${result.stderr}`, /Historical profileHash duplicates:\s*1/)
})
