import { finishApiResult, isDryRun, loadSocialPack, postJson, printDryRun, selectPost, skip } from "./fanju-publish-utils.mjs"

const instance = (process.env.MASTODON_INSTANCE ?? "").replace(/\/$/, "")
const token = process.env.MASTODON_ACCESS_TOKEN

const pack = await loadSocialPack()
const post = selectPost(pack)
const payloadEn = {
  status: post.mastodon.en,
  visibility: "public",
}
const payloadZh = {
  status: post.mastodon.zh,
  visibility: "public",
}

if (isDryRun()) {
  printDryRun("Mastodon", {
    title: post.title,
    canonicalUrl: post.canonicalUrl,
    urlCount: 2,
    mastodonEn: post.mastodon.en,
    mastodonZh: post.mastodon.zh,
    payloadSummary: {
      instance: instance || "(not configured)",
      visibility: "public",
      englishChars: payloadEn.status.length,
      chineseChars: payloadZh.status.length,
    },
  })
  process.exit(0)
}

if (!instance || !token) skip("MASTODON_INSTANCE and MASTODON_ACCESS_TOKEN are not both configured.")

const { res, body } = await postJson(`${instance}/api/v1/statuses`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(payloadEn),
})

finishApiResult("Mastodon English", res, body)

const { res: zhRes, body: zhBody } = await postJson(`${instance}/api/v1/statuses`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify(payloadZh),
})

finishApiResult("Mastodon Chinese", zhRes, zhBody)
