// scripts/seo/check-i18n-coverage.mjs
//
// Walks lib/i18n.ts (the single source of truth for both locales) and
// confirms every leaf string key exists in both ZH and EN, with non-empty
// values that look like the right script. Required keys for the new SEO
// pages are also verified.
//
// Note: the project uses a single combined dictionary file. Earlier specs
// referenced src/i18n/en.ts / src/i18n/zh.ts — those don't exist here and
// we deliberately do not introduce them in order to avoid restructuring.

import { existsSync, readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const DICT_FILE = join(ROOT, "lib/i18n.ts")

if (!existsSync(DICT_FILE)) {
  console.error("Missing lib/i18n.ts")
  process.exit(1)
}

// We can't easily import a TS file from Node without a loader. Instead we
// parse the file as text — the dictionary uses a stable shape:
//   export const dict = { zh: { ... }, en: { ... } } as const
// The parser below extracts the two top-level objects "zh" and "en".

const src = readFileSync(DICT_FILE, "utf8")
const dictIdx = src.indexOf("export const dict")
if (dictIdx === -1) {
  console.error("Cannot locate `export const dict` in lib/i18n.ts")
  process.exit(1)
}
const eq = src.indexOf("=", dictIdx)
const open = src.indexOf("{", eq)

function findMatching(text, openIdx, openCh, closeCh) {
  let depth = 0
  let i = openIdx
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"' || ch === "'" || ch === "`") {
      const q = ch
      i++
      while (i < text.length && text[i] !== q) {
        if (text[i] === "\\") i++
        i++
      }
    } else if (ch === openCh) {
      depth++
    } else if (ch === closeCh) {
      depth--
      if (depth === 0) return i
    }
    i++
  }
  return -1
}

function findLocaleObject(body, label) {
  // body starts after the outer `{`; find `<label>:` at depth 1
  let depth = 0
  let i = 0
  while (i < body.length) {
    const ch = body[i]
    if (ch === '"' || ch === "'" || ch === "`") {
      const q = ch
      i++
      while (i < body.length && body[i] !== q) {
        if (body[i] === "\\") i++
        i++
      }
      i++
      continue
    }
    if (ch === "{" || ch === "[") depth++
    else if (ch === "}" || ch === "]") depth--

    if (depth === 0) {
      if (body.slice(i, i + label.length + 1) === `${label}:`) {
        const open = body.indexOf("{", i + label.length + 1)
        const close = findMatching(body, open, "{", "}")
        if (close === -1) throw new Error(`Could not match braces for locale ${label}`)
        return body.slice(open, close + 1)
      }
    }
    i++
  }
  throw new Error(`Locale ${label} not found in dict`)
}

const close = findMatching(src, open, "{", "}")
if (close === -1) {
  console.error("Cannot locate end of `dict` literal in lib/i18n.ts")
  process.exit(1)
}
const dictBody = src.slice(open + 1, close)
// Sanity-check that both locale blocks exist; the actual parsing happens
// further below using the raw `src` and the locate-by-`zh:` / `en:` indices.
findLocaleObject(dictBody, "zh")
findLocaleObject(dictBody, "en")

// Walk an object literal and produce the set of leaf paths and whether each
// leaf is a string. We don't need the exact value, just the shape.

function readStringLiteral(text, idx) {
  if (text[idx] !== '"') return null
  let i = idx + 1
  let out = ""
  while (i < text.length && text[i] !== '"') {
    if (text[i] === "\\") {
      const next = text[i + 1]
      if (next === "n") out += "\n"
      else if (next === "t") out += "\t"
      else if (next === "r") out += "\r"
      else out += next
      i += 2
    } else {
      out += text[i]
      i++
    }
  }
  return { value: out, end: i + 1 }
}

function parseObjectInner(text, openIdx) {
  // text[openIdx] === '{'. Walk through `key: value,` pairs at depth 1.
  const close = findMatching(text, openIdx, "{", "}")
  if (close === -1) throw new Error("Unbalanced object")
  const body = text.slice(openIdx + 1, close)

  const entries = {}
  let i = 0
  while (i < body.length) {
    // skip whitespace and commas
    while (i < body.length && /[\s,]/.test(body[i])) i++
    if (i >= body.length) break

    // key: identifier or quoted string
    let key
    if (body[i] === '"') {
      const parsed = readStringLiteral(body, i)
      key = parsed.value
      i = parsed.end
    } else {
      let s = i
      while (i < body.length && /[A-Za-z0-9_]/.test(body[i])) i++
      key = body.slice(s, i)
    }
    while (i < body.length && /\s/.test(body[i])) i++
    if (body[i] !== ":") {
      // Not a key/value pair (could be a comment or end). Advance.
      i++
      continue
    }
    i++
    while (i < body.length && /\s/.test(body[i])) i++

    if (i >= body.length) break

    if (body[i] === '"') {
      const parsed = readStringLiteral(body, i)
      entries[key] = { type: "string", value: parsed.value }
      i = parsed.end
    } else if (body[i] === "{") {
      const innerClose = findMatching(body, i, "{", "}")
      if (innerClose === -1) throw new Error(`Unbalanced object near key ${key}`)
      // Recurse on the substring of body
      entries[key] = { type: "object", value: parseObjectInner(body, i) }
      i = innerClose + 1
    } else if (body[i] === "[") {
      const innerClose = findMatching(body, i, "[", "]")
      if (innerClose === -1) throw new Error(`Unbalanced array near key ${key}`)
      entries[key] = { type: "array", value: body.slice(i, innerClose + 1) }
      i = innerClose + 1
    } else {
      // Number / boolean / identifier — treat as opaque scalar
      let s = i
      while (i < body.length && body[i] !== "," && body[i] !== "\n") i++
      entries[key] = { type: "scalar", value: body.slice(s, i).trim() }
    }
  }
  return entries
}

function flattenStringPaths(parsed, prefix = "") {
  const result = []
  for (const [k, info] of Object.entries(parsed)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (info.type === "string") result.push({ path, value: info.value })
    else if (info.type === "object") result.push(...flattenStringPaths(info.value, path))
    else if (info.type === "array") result.push({ path, value: info.value, isArray: true })
  }
  return result
}

const zhParsed = parseObjectInner(src, src.indexOf("{", src.indexOf("zh:", dictIdx)))
const enParsed = parseObjectInner(src, src.indexOf("{", src.indexOf("en:", dictIdx)))

const zhPaths = new Map(flattenStringPaths(zhParsed).map((p) => [p.path, p]))
const enPaths = new Map(flattenStringPaths(enParsed).map((p) => [p.path, p]))

const missingInEn = [...zhPaths.keys()].filter((k) => !enPaths.has(k))
const missingInZh = [...enPaths.keys()].filter((k) => !zhPaths.has(k))
const emptyValues = [
  ...[...zhPaths.entries()].filter(([, v]) => v.type !== "array" && (v.value || "").trim() === "").map(([k]) => `zh.${k}`),
  ...[...enPaths.entries()].filter(([, v]) => v.type !== "array" && (v.value || "").trim() === "").map(([k]) => `en.${k}`),
]

// Required keys for the new SEO pages
const REQUIRED_PATHS = [
  "nav.home",
  "nav.cities",
  "nav.howItWorks",
  "nav.safety",
  "nav.faq",
  "nav.join",
  "seoPage.joinButton",
  "seoPage.viewCityDinners",
  "seoPage.relatedCities",
  "seoPage.relatedTopics",
  "seoPage.readMore",
  "seoPage.updatedAt",
  "seoPage.tableFor",
  "seoPage.hostedIn",
  "seoPage.safeSmallGroup",
  "seoPage.noHardSelling",
  "seoPage.startPlanning",
  "states.loading",
  "states.error",
  "states.notFound",
  "states.empty",
  "cta.softJoin",
  "cta.createDinner",
  "cta.findDinner",
  "cta.exploreCity",
]

const missingRequired = REQUIRED_PATHS.filter((p) => !zhPaths.has(p) || !enPaths.has(p))

// Heuristic: ZH dictionary should not have only-English UI strings; EN
// dictionary should not have CJK characters in user-facing copy.
function hasChinese(s) {
  return /[\u4e00-\u9fff]/.test(s || "")
}
function hasOnlyAscii(s) {
  return /^[\s!-~]+$/.test(s || "")
}

const zhEnglishLeak = []
const enChineseLeak = []
const SHARED_TOKENS_OK_IN_ZH = new Set(["FAQ", "MBTI", "AI", "VC", "PE", "GP", "LP"])

for (const [path, v] of zhPaths.entries()) {
  if (v.type !== "string") continue
  const val = v.value
  if (!val) continue
  if (val.length < 4) continue
  if (hasOnlyAscii(val) && !SHARED_TOKENS_OK_IN_ZH.has(val)) {
    zhEnglishLeak.push(`${path}: "${val}"`)
  }
}
for (const [path, v] of enPaths.entries()) {
  if (v.type !== "string") continue
  const val = v.value
  if (!val) continue
  if (hasChinese(val)) {
    enChineseLeak.push(`${path}: "${val}"`)
  }
}

console.log("I18n coverage report:")
console.log(`EN keys: ${enPaths.size}`)
console.log(`ZH keys: ${zhPaths.size}`)
console.log(`Missing in EN: ${missingInEn.length}`)
console.log(`Missing in ZH: ${missingInZh.length}`)
console.log(`Empty values: ${emptyValues.length}`)
console.log(`Required paths missing: ${missingRequired.length}`)
console.log(`ZH entries that look ASCII-only: ${zhEnglishLeak.length}`)
console.log(`EN entries that contain Chinese: ${enChineseLeak.length}`)

if (missingInEn.length) {
  console.log("Missing in EN:")
  for (const k of missingInEn.slice(0, 30)) console.log(`  ${k}`)
}
if (missingInZh.length) {
  console.log("Missing in ZH:")
  for (const k of missingInZh.slice(0, 30)) console.log(`  ${k}`)
}
if (missingRequired.length) {
  console.log("Required paths missing in at least one locale:")
  for (const k of missingRequired) console.log(`  ${k}`)
}
if (enChineseLeak.length) {
  console.log("EN entries containing Chinese:")
  for (const x of enChineseLeak.slice(0, 20)) console.log(`  ${x}`)
}

const errors = []
if (missingInEn.length) errors.push(`missingInEn=${missingInEn.length}`)
if (missingInZh.length) errors.push(`missingInZh=${missingInZh.length}`)
if (emptyValues.length) errors.push(`emptyValues=${emptyValues.length}`)
if (missingRequired.length) errors.push(`requiredMissing=${missingRequired.length}`)
if (enChineseLeak.length) errors.push(`enChineseLeak=${enChineseLeak.length}`)

if (errors.length) {
  console.error("FAIL: " + errors.join(" "))
  process.exit(1)
}
console.log("OK")
