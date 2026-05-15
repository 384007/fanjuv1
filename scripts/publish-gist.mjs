import { finishApiResult, isDryRun, loadSocialPack, postJson, printDryRun, skip } from "./fanju-publish-utils.mjs"

const pack = await loadSocialPack()
const payload = {
  description: pack.gist.description,
  public: process.env.GIST_PUBLIC !== "0",
  files: {
    [pack.gist.filename]: {
      content: pack.gist.bilingual,
    },
  },
}

if (isDryRun()) {
  printDryRun("GitHub Gist", {
    title: pack.gist.description,
    canonicalUrl: "multiple Fanju canonical URLs",
    urlCount: pack.posts.length,
    gistBilingualPreview: pack.gist.bilingual.slice(0, 700),
    payloadSummary: {
      filename: pack.gist.filename,
      public: payload.public,
      contentChars: pack.gist.bilingual.length,
    },
  })
  process.exit(0)
}

const token = process.env.GIST_TOKEN
if (!token) skip("GIST_TOKEN is not configured.")

const { res, body } = await postJson("https://api.github.com/gists", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  },
  body: JSON.stringify(payload),
})

finishApiResult("GitHub Gist", res, body)
