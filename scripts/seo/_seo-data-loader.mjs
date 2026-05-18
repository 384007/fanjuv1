// Internal helper: parse cities & categories from lib/seo-data.ts as plain text.
// Used by route-manifest builder so we never duplicate the source of truth.
// This file is intentionally low-level. It does not perform any AI work and is
// not consumed by the front-end. Only build / generation scripts read it.

import { readFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const SEO_DATA_FILE = join(ROOT, "lib/seo-data.ts")

function sliceBalancedBrackets(text, openIdx) {
  let depth = 0
  let i = openIdx
  while (i < text.length) {
    const ch = text[i]
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch
      i++
      while (i < text.length && text[i] !== quote) {
        if (text[i] === "\\") i++
        i++
      }
    } else if (ch === "[") {
      depth++
    } else if (ch === "]") {
      depth--
      if (depth === 0) return text.slice(openIdx + 1, i)
    }
    i++
  }
  throw new Error("Unbalanced brackets in source file")
}

function splitTopLevelObjects(arrayBody) {
  const objects = []
  let i = 0
  while (i < arrayBody.length) {
    while (i < arrayBody.length && arrayBody[i] !== "{") i++
    if (i >= arrayBody.length) break
    const start = i
    let depth = 1
    i++
    while (i < arrayBody.length && depth > 0) {
      const ch = arrayBody[i]
      if (ch === '"' || ch === "'" || ch === "`") {
        const quote = ch
        i++
        while (i < arrayBody.length && arrayBody[i] !== quote) {
          if (arrayBody[i] === "\\") i++
          i++
        }
      } else if (ch === "{") {
        depth++
      } else if (ch === "}") {
        depth--
      }
      i++
    }
    objects.push(arrayBody.slice(start, i))
  }
  return objects
}

function readDoubleQuotedString(s, idx) {
  if (s[idx] !== '"') return null
  let i = idx + 1
  let out = ""
  while (i < s.length && s[i] !== '"') {
    if (s[i] === "\\") {
      const next = s[i + 1]
      if (next === "n") out += "\n"
      else if (next === "t") out += "\t"
      else if (next === "r") out += "\r"
      else out += next
      i += 2
    } else {
      out += s[i]
      i++
    }
  }
  return { value: out, end: i + 1 }
}

function getStringField(objSrc, fieldName) {
  // Look for `fieldName: "..."` at any depth-0 position inside this top-level
  // object. We do a simple scan that ignores nested objects/arrays.
  let depth = 0
  let i = 0
  while (i < objSrc.length) {
    const ch = objSrc[i]
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch
      i++
      while (i < objSrc.length && objSrc[i] !== quote) {
        if (objSrc[i] === "\\") i++
        i++
      }
      i++
      continue
    }
    if (ch === "{" || ch === "[") {
      depth++
      i++
      continue
    }
    if (ch === "}" || ch === "]") {
      depth--
      i++
      continue
    }
    // Only match at depth 1 (inside the outer object body, not nested)
    if (depth === 1) {
      const head = objSrc.slice(i, i + fieldName.length + 1)
      const prev = i === 0 ? "" : objSrc[i - 1]
      const isBoundary = i === 0 || /[\s,{]/.test(prev)
      if (isBoundary && head === `${fieldName}:`) {
        let j = i + fieldName.length + 1
        while (j < objSrc.length && (objSrc[j] === " " || objSrc[j] === "\t")) j++
        const parsed = readDoubleQuotedString(objSrc, j)
        if (parsed) return parsed.value
      }
    }
    i++
  }
  return undefined
}

function parseEntries(label, exportSignature) {
  const text = readFileSync(SEO_DATA_FILE, "utf8")
  const idx = text.indexOf(exportSignature)
  if (idx === -1) throw new Error(`Cannot find ${exportSignature} in lib/seo-data.ts`)
  // Skip past the `=` (the literal `City[]` type contains `[`/`]`).
  const eq = text.indexOf("=", idx)
  if (eq === -1) throw new Error(`Cannot find '=' for ${label}`)
  const arrayOpen = text.indexOf("[", eq)
  if (arrayOpen === -1) throw new Error(`Cannot find array start for ${label}`)
  const body = sliceBalancedBrackets(text, arrayOpen)
  const objects = splitTopLevelObjects(body)
  const out = []
  for (const objSrc of objects) {
    const slug = getStringField(objSrc, "slug")
    const name = getStringField(objSrc, "name")
    const nameEn = getStringField(objSrc, "nameEn")
    if (!slug || !name || !nameEn) continue
    out.push({
      slug,
      name,
      nameEn,
      province: getStringField(objSrc, "province"),
      provinceEn: getStringField(objSrc, "provinceEn"),
      country: getStringField(objSrc, "country"),
      countryEn: getStringField(objSrc, "countryEn"),
      countryCode: getStringField(objSrc, "countryCode"),
    })
  }
  if (out.length === 0) throw new Error(`No ${label} parsed from lib/seo-data.ts`)
  return out
}

export function loadCities() {
  return parseEntries("cities", "export const cities: City[]")
}

export function loadCategories() {
  return parseEntries("categories", "export const categories: Category[]")
}
