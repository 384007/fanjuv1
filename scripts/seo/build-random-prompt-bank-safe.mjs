// Safe entrypoint for the SEO random prompt bank builder.
//
// The original builder already has a hard heading preflight. This wrapper keeps
// that hard preflight intact and patches only the deterministic heading choice
// step so one article cannot select the same normalized H3/H2 twice for a given
// seed.

import { spawnSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const sourceFile = join(__dirname, "build-random-prompt-bank.mjs")
const generatedDir = join(__dirname, ".generated")
const generatedFile = join(generatedDir, "build-random-prompt-bank-heading-dedup.mjs")

const source = readFileSync(sourceFile, "utf8")

const startMarker = '  const h2Count = 4 + frameIndex(profile, "h2-count", 4)'
const endMarker = '  const frame = { h1: cleanHeading(TEMPLATES[0][frameIndex(profile, "h1", TEMPLATES[0].length)]), h2s, deepHeadings, maxDepth: 3 }'
const startIndex = source.indexOf(startMarker)
const endIndex = source.indexOf(endMarker, startIndex)

if (startIndex < 0 || endIndex < 0) {
  throw new Error("Prompt bank safe wrapper could not find the original heading selection block to patch.")
}

const replaceEndIndex = endIndex + endMarker.length

const safeHeadingSelection = [
  '  const usedHeadingKeys = new Set()',
  '  const routeLabel = profile.locale + ":" + profile.route',
  '',
  '  function rememberHeading(text) {',
  '    const normalized = normalizeForTemplateCheck(text)',
  '    if (normalized) usedHeadingKeys.add(normalized)',
  '    return text',
  '  }',
  '',
  '  function chooseUniqueHeading(variants, startIndex) {',
  '    if (!Array.isArray(variants) || variants.length === 0) return null',
  '    for (let offset = 0; offset < variants.length; offset++) {',
  '      const index = (startIndex + offset) % variants.length',
  '      const text = routeSpecificHeading(variants[index])',
  '      const normalized = normalizeForTemplateCheck(text)',
  '      if (!normalized || usedHeadingKeys.has(normalized)) continue',
  '      usedHeadingKeys.add(normalized)',
  '      return text',
  '    }',
  '    return null',
  '  }',
  '',
  '  const h1 = rememberHeading(cleanHeading(TEMPLATES[0][frameIndex(profile, "h1", TEMPLATES[0].length)]))',
  '',
  '  const h2Count = 4 + frameIndex(profile, "h2-count", 4)',
  '  const h2s = []',
  '  for (let i = 0; i < Math.min(h2Count, h2Slots.length); i++) {',
  '    const variants = h2Slots[i]',
  '    const text = chooseUniqueHeading(variants, frameIndex(profile, "h2-" + (i + 1), variants.length))',
  '    if (text) h2s.push(text)',
  '  }',
  '  if (h2s.length < 4) {',
  '    throw new Error("Heading preflight failed for " + routeLabel + ": could not choose at least 4 unique H2 headings after normalization; got " + h2s.length)',
  '  }',
  '',
  '  const h3Count = frameIndex(profile, "h3-count", 5)',
  '  const deepHeadings = []',
  '  const h3Variants = TEMPLATES[2] || []',
  '  for (let i = 0; i < h3Count; i++) {',
  '    const text = chooseUniqueHeading(h3Variants, frameIndex(profile, "h3-" + (i + 1), h3Variants.length))',
  '    if (text) deepHeadings.push({ level: 3, text })',
  '  }',
  '',
  '  const frame = { h1, h2s, deepHeadings, maxDepth: 3 }',
].join("\n")

// Fix relative import paths so the generated file (inside .generated/) can
// still resolve sibling modules like prompt-bank-history.mjs.
const patchedSource = source
  .slice(0, startIndex) + safeHeadingSelection + source.slice(replaceEndIndex)
const patched = patchedSource.replace(
  /from\s+"\.\/prompt-bank-history\.mjs"/g,
  `from ${JSON.stringify(join(__dirname, "prompt-bank-history.mjs"))}`,
)
mkdirSync(generatedDir, { recursive: true })
writeFileSync(generatedFile, patched, "utf8")

const result = spawnSync(process.execPath, [generatedFile], {
  cwd: join(__dirname, "../.."),
  env: process.env,
  stdio: "inherit",
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
