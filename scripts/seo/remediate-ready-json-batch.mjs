#!/usr/bin/env node
/**
 * Targeted remediation for the recent ~120 "ready" JSON articles.
 * Goal: Kill the egregious internal repeated boilerplate paragraphs that appear
 * 6-10 times inside each article (the "写清这一步的目的..." and "Keep the plan concrete..." blocks).
 *
 * This is the first step to make already-published "线上" articles less templated and less risky for GSC/Bing.
 *
 * Usage:
 *   node scripts/seo/remediate-ready-json-batch.mjs
 *
 * After running, the articles should be reviewed again with STRICT audit before any re-publish.
 */

import { readdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join, resolve } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, "../..")
const READY_DIR = join(ROOT, "content/articles/ready/index")

// The exact repeated tails we must kill (Chinese + English versions from the broken batch)
const REPEATED_ZH = "写清这一步的目的，是为了让读者在参加之前就能判断是否适合自己：这桌饭为什么存在、谁应该来、谁不适合来、怎样退出、怎样继续联系。具体说明越多，饭局越有真实参考价值，也越能减少第一次线下见面的不确定感。"
const REPEATED_EN = "Keep the plan concrete: name the table purpose, define who should join, leave room for quieter guests, and make follow-up optional rather than expected. A useful page should also explain the first decision a reader has to make, the signals that show whether a table is trustworthy, and the boundaries that keep the meal comfortable. This gives the reader enough detail to act without turning the guide into generic copy or a sales pitch."

// Slightly varied, shorter, more natural replacements (still safe, boundary-respecting, no hard sell)
const VARIANTS_ZH = [
  "这些细节越清楚，第一次见面时的不确定感就越低。",
  "把这些信息写明白，能让想来的人快速判断是否合适。",
  "清晰的边界和预期，是小桌社交最基本的安全感来源。",
  "提前说清楚这些，能减少现场的尴尬和误会。",
  "只有把规则和氛围写透，参与者才知道自己该不该来。"
]

const VARIANTS_EN = [
  "Clear expectations reduce uncertainty for first-time guests.",
  "The more specific the description, the easier it is for the right people to decide if the table fits them.",
  "Explicit boundaries are the foundation of comfortable small-table socialising.",
  "Stating these details upfront prevents most on-the-night awkwardness.",
  "When the host makes the rules and tone obvious, the right guests self-select."
]

function pickVariant(isEn, index) {
  const arr = isEn ? VARIANTS_EN : VARIANTS_ZH
  return arr[index % arr.length]
}

function cleanBody(body, isEn, idx) {
  let cleaned = body
  if (isEn) {
    if (cleaned.includes(REPEATED_EN)) {
      cleaned = cleaned.split(REPEATED_EN).join(pickVariant(true, idx))
    }
    // Also catch slight variations if any
    cleaned = cleaned.replace(/Keep the plan concrete: name the table purpose, define who should join, leave room for quieter guests, and make follow-up optional rather than expected\./g, "")
  } else {
    if (cleaned.includes(REPEATED_ZH)) {
      cleaned = cleaned.split(REPEATED_ZH).join(pickVariant(false, idx))
    }
  }
  // Collapse multiple spaces/newlines left by removal
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim()
  return cleaned
}

function processFile(filePath) {
  const raw = readFileSync(filePath, "utf8")
  let article
  try {
    article = JSON.parse(raw)
  } catch (e) {
    console.error(`JSON parse failed: ${filePath}`)
    return false
  }

  const isEn = article.language === "en"
  let changed = false
  let sectionIdx = 0

  if (Array.isArray(article.sections)) {
    for (const section of article.sections) {
      if (section.body && typeof section.body === "string") {
        const original = section.body
        const cleaned = cleanBody(original, isEn, sectionIdx)
        if (cleaned !== original) {
          section.body = cleaned
          changed = true
        }
      }
      sectionIdx++
    }
  }

  // Also clean directAnswer and excerpt if they accidentally contain the tail
  if (article.directAnswer) {
    const c = cleanBody(article.directAnswer, isEn, 99)
    if (c !== article.directAnswer) {
      article.directAnswer = c
      changed = true
    }
  }
  if (article.excerpt) {
    const c = cleanBody(article.excerpt, isEn, 98)
    if (c !== article.excerpt) {
      article.excerpt = c
      changed = true
    }
  }

  if (changed) {
    writeFileSync(filePath, JSON.stringify(article, null, 2) + "\n", "utf8")
    return true
  }
  return false
}

console.log("=== Remediating repeated boilerplate in ready JSON articles ===")
console.log(`Scanning: ${READY_DIR}`)

const files = readdirSync(READY_DIR).filter(f => f.endsWith(".json"))
let fixed = 0
let total = 0

for (const f of files) {
  const full = join(READY_DIR, f)
  total++
  if (processFile(full)) {
    fixed++
    console.log(`  Fixed: ${f}`)
  }
}

console.log(`\nDone. Scanned ${total} files, fixed ${fixed} articles with repeated boilerplate.`)
console.log("Next: re-run STRICT anti-template and quality audits on the batch.")
console.log("These articles still need deeper unique H2 variation and local depth per the Checklist.")