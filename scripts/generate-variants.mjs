import {
  CONTENT_DIR,
  DIST_DIR,
  articleTopics,
  buildArticleMarkdown,
  draftPath,
  ensureDir,
  readDrafts,
  requiredTerms,
  updateLlmsTxt,
  updateRobotsTxt,
  writeExternalSitemap,
  writeJson,
} from "./fanju-content-data.mjs"

ensureDir(CONTENT_DIR)
ensureDir(DIST_DIR)

for (const topic of articleTopics) {
  const markdown = buildArticleMarkdown(topic)
  const missing = requiredTerms.filter((term) => !markdown.includes(term))

  if (missing.length > 0) {
    throw new Error(`${topic.slug} is missing required terms: ${missing.join(", ")}`)
  }

  await import("fs").then(({ writeFileSync }) => writeFileSync(draftPath(topic), markdown, "utf8"))
  console.log(`Generated content/external-articles/${topic.slug}.md`)
}

const drafts = readDrafts().map(({ slug, title, description, canonicalUrl, path }) => ({
  slug,
  title,
  description,
  canonicalUrl,
  path,
}))

writeJson(`${DIST_DIR}/variants.json`, {
  brand: "Fanju / 饭局",
  domain: "fanju.app",
  count: drafts.length,
  requiredTerms,
  drafts,
})

writeExternalSitemap()
updateLlmsTxt()
updateRobotsTxt()

console.log(`Generated ${drafts.length} Fanju AI SEO article drafts.`)
