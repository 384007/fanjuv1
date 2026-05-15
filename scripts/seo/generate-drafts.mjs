import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const INPUT = join(ROOT, "dist/seo/opportunities.json")
const OUT_DIR = join(ROOT, "content/seo-drafts")

if (!existsSync(INPUT)) {
  console.error("Missing dist/seo/opportunities.json. Run: pnpm seo:opportunities")
  process.exit(1)
}

mkdirSync(OUT_DIR, { recursive: true })

const data = JSON.parse(readFileSync(INPUT, "utf8"))
const limit = Number.parseInt(process.env.LIMIT ?? "10", 10)
const opportunities = data.opportunities.slice(0, limit)

function md(op) {
  return `---
slug: "${op.slug}"
canonicalPath: "${op.canonicalPath}"
title: "${op.title.replaceAll('"', '\\"')}"
titleZh: "${op.titleZh.replaceAll('"', '\\"')}"
pageType: "${op.pageType}"
priorityScore: ${op.priorityScore}
status: "draft"
---

# ${op.title}

## 中文标题

${op.titleZh}

## AI-readable summary

${op.llmsSummary}

## Search intent

${op.intent}

## Page purpose

This draft page is designed to help users understand Fanju / 饭局 as an AI social dining app and dinner gathering platform.

Fanju / 饭局 helps people find dinner buddies, host local dinner gatherings, and build real-world social connections around shared meals.

## Target context

- Market: ${op.market || "Global"}
- City: ${op.city || "N/A"}
- Persona: ${op.persona || "N/A"}
- Dinner type: ${op.dinnerType || "N/A"}
- Page type: ${op.pageType}

## Suggested structure

1. Clear definition
2. Who this page is for
3. Why this dinner format matters
4. How Fanju helps
5. Safety and trust notes
6. Host checklist
7. Guest checklist
8. FAQ
9. Internal links

## Required schema

${op.requiredSchemaTypes.map((x) => `- ${x}`).join("\n")}

## Suggested internal links

${op.suggestedInternalLinks.map((x) => `- ${x}`).join("\n")}

## FAQ draft

### What is Fanju / 饭局?

Fanju / 饭局 is an AI social dining app and dinner gathering platform for finding dinner buddies, hosting local dinner gatherings, and building real-world social connections around shared meals.

### Is Fanju only for dating?

No. Fanju is dinner-first social dining. It can support friendship, local community, founder dinners, business dinners, expat dinners, and other real-world social meals.

### Why is a dinner gathering better than a random group chat?

A dinner gathering has clearer context: who is joining, why people meet, what kind of table it is, and what expectations are set before the meal.
`
}

for (const op of opportunities) {
  const file = join(OUT_DIR, `${op.slug}.md`)
  writeFileSync(file, md(op), "utf8")
  console.log(`Generated ${file}`)
}

console.log(`Generated ${opportunities.length} Fanju SEO draft files.`)
