import { readFileSync, writeFileSync } from "fs"
import { readJson, abs } from "./_content-factory-runtime.mjs"
import { generateWithRouter } from "./ai-router.mjs"

const FAILING_FILES = [
  "content/seo-ready/anshun-backpacker-dinner.md",
  "content/seo-ready/en-budapest-mechanical-engineer-dinner.md",
  "content/seo-ready/en-casablanca-local-dinner.md",
  "content/seo-ready/en-kyoto-digital-detox-dinner.md",
  "content/seo-ready/en-lagos-open-table-dinner.md",
  "content/seo-ready/en-manila-vegan-dinner.md",
  "content/seo-ready/shantou-tea-ceremony-dinner.md",
  "content/seo-ready/xiamen-remote-worker-dinner.md",
  "content/seo-ready/xiaogan-aviation-dinner.md"
]

async function repairFile(filePath) {
  const fullPath = abs(filePath)
  const content = readFileSync(fullPath, "utf8")
  const isEn = content.includes('lang: "en"')
  const brandKw = isEn ? "Fanju" : "饭局app"

  console.log(`Repairing ${filePath}...`)

  const system = `You are a top-tier SEO expert. Your task is to surgically repair the provided article to meet strict SEO standards. 
  1. Title/H1 must include: '${brandKw}'.
  2. Remove any template-like generic sections.
  3. Expand content with unique, city-specific, and topic-specific details.
  4. Ensure content uniqueness and avoid any repetitive structures.
  Return the full Markdown content.`

  const prompt = `Please rewrite this article to be unique, SEO-optimized, and free of templating. Ensure brand keyword '${brandKw}' is naturally integrated. \n\n${content}`

  const response = await generateWithRouter({ 
    prompt, 
    system, 
    providerOrder: "gemini,groq,cerebras" 
  })
  
  writeFileSync(fullPath, response.result.response, "utf8")
  console.log(`Successfully repaired: ${filePath}`)
}

async function main() {
  for (const file of FAILING_FILES) {
    await repairFile(file)
  }
}

main().catch(console.error)
