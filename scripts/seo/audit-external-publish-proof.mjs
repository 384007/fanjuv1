import { existsSync, readdirSync, readFileSync } from "fs"
import { join } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "../..")
const STRICT = process.env.STRICT_PUBLISH === "1"
const explicit = process.env.PROOF_FILE ? join(ROOT, process.env.PROOF_FILE) : ""
const proofDir = join(ROOT, "data/seo")

function latestProofFile() {
  if (explicit) return explicit
  if (!existsSync(proofDir)) return ""
  return readdirSync(proofDir)
    .filter((name) => /^external-publish-proof-.+\.json$/.test(name))
    .map((name) => join(proofDir, name))
    .sort()
    .at(-1) || ""
}

const file = latestProofFile()
if (!file || !existsSync(file)) {
  console.error("External publish proof missing. Run pnpm seo:cloudflare:submit first.")
  process.exit(1)
}

const proof = JSON.parse(readFileSync(file, "utf8"))
const articles = Array.isArray(proof.articles) ? proof.articles : []
const errors = []
const warnings = []

if (!proof.runId) errors.push("missing-runId")
if (!articles.length) errors.push("no-article-evidence")

for (const article of articles) {
  const url = article.articleUrl || "(missing-url)"
  if (article.liveHttp?.status !== 200 || article.liveHttp?.ok !== true) errors.push(`${url}:live-http-not-200`)
  if (article.canonical?.ok !== true) errors.push(`${url}:canonical-not-self-referencing`)
  if (article.sitemapIncluded !== true) errors.push(`${url}:missing-from-sitemap`)

  for (const platform of ["indexnow", "baidu", "gist", "devto", "bluesky", "wordpress"]) {
    const status = article[platform]?.status || "missing"
    if (status === "failed") errors.push(`${url}:${platform}-failed`)
    if (status === "skipped" || status === "dry-run" || status === "missing") warnings.push(`${url}:${platform}-${status}`)
  }
}

if (proof.fullyDistributed === true && warnings.length) {
  errors.push("fullyDistributed-true-with-skipped-or-missing-platforms")
}

console.log(`proofFile=${file.replace(`${ROOT}/`, "")}`)
console.log(`status=${proof.status || "unknown"}`)
console.log(`fullyDistributed=${proof.fullyDistributed === true}`)
console.log(`articles=${articles.length}`)
console.log(`warnings=${warnings.length}`)
console.log(`errors=${errors.length}`)
for (const warning of warnings.slice(0, 20)) console.log(`warning=${warning}`)
for (const error of errors.slice(0, 20)) console.error(`error=${error}`)

if (errors.length || (STRICT && warnings.length)) process.exit(1)
