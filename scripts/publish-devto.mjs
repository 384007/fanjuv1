import { finishApiResult, isDryRun, loadSocialPack, postJson, printDryRun, selectPost, skip } from "./fanju-publish-utils.mjs"

const pack = await loadSocialPack()
const post = selectPost(pack)
const payload = {
  article: {
    title: post.publishTitle,
    body_markdown: post.devto.bilingual,
    published: process.env.PUBLISH_LIVE !== "0",
    canonical_url: post.canonicalUrl,
    tags: ["social", "community", "networking"],
  },
}

if (isDryRun()) {
  printDryRun("DEV.to", {
    title: post.publishTitle,
    canonicalUrl: post.canonicalUrl,
    urlCount: 1,
    bilingualArticlePreview: `${post.devto.en.slice(0, 300)}\n...\n${post.devto.zh.slice(0, 300)}`,
    payloadSummary: {
      published: payload.article.published,
      tags: payload.article.tags,
      bodyChars: payload.article.body_markdown.length,
    },
  })
  process.exit(0)
}

const apiKey = process.env.DEVTO_API_KEY
if (!apiKey) skip("DEVTO_API_KEY is not configured.")

const { res, body } = await postJson("https://dev.to/api/articles", {
  method: "POST",
  headers: { "api-key": apiKey },
  body: JSON.stringify(payload),
})

// Canonical URL already taken = article already published, treat as success
if (!res.ok && res.status === 422 && typeof body === "object" && String(body?.error ?? "").includes("Canonical url has already been taken")) {
  console.log(`DEV.to: article already published for ${post.canonicalUrl} — skipping as non-fatal.`)
  process.exit(0)
}

finishApiResult("DEV.to", res, body)
