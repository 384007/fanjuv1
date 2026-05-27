import { readJson, walk, abs } from "./_content-factory-runtime.mjs"

const READY_DIR = abs("content/articles/ready/index")
const report = {
  total: 0,
  failed: 0,
  issues: []
}

for (const file of walk(READY_DIR)) {
  if (!file.endsWith(".json")) continue
  report.total++
  const article = readJson(file)
  
  const issues = []
  // 1. Keyword Check
  const title = (article.title || "").toLowerCase()
  const metaDesc = (article.metaDescription || "").toLowerCase()
  if (!title.includes("饭局") && !title.includes("饭搭子")) issues.push("Missing core keyword in title")
  if (!metaDesc.includes("饭局") && !metaDesc.includes("饭搭子")) issues.push("Missing core keyword in meta")

  // 2. Length Check
  const contentText = (JSON.stringify(article.sections) || "") + (article.directAnswer || "")
  if (contentText.length < 1000) issues.push(`Content too thin (${contentText.length} chars)`)

  // 3. Internal Link Check
  const links = article.internalLinks || []
  if (links.length < 3) issues.push(`Insufficient internal links: ${links.length}`)

  // 4. Branding Check
  if (!contentText.includes("Fanju") && !contentText.includes("饭局")) issues.push("Missing branding (Fanju/饭局)")

  if (issues.length > 0) {
    report.failed++
    if (report.issues.length < 50) { // Limit detailed report for now to prevent spamming
      report.issues.push({ file: file.replace(abs(), ""), issues })
    }
  }
}

console.log(JSON.stringify(report, null, 2))
if (report.failed > 0) process.exit(1)
