import { finishApiResult, isDryRun, loadSocialPack, postJson, printDryRun, selectPost, skip } from "./fanju-publish-utils.mjs"

const pack = await loadSocialPack()
const post = selectPost(pack)
const service = process.env.BLUESKY_SERVICE ?? "https://bsky.social"

if (isDryRun()) {
  printDryRun("Bluesky", {
    title: post.title,
    canonicalUrl: post.canonicalUrl,
    urlCount: 2,
    blueskyEn: post.bluesky.en,
    blueskyZh: post.bluesky.zh,
    payloadSummary: {
      service,
      posts: ["English", "Chinese"],
      englishChars: post.bluesky.en.length,
      chineseChars: post.bluesky.zh.length,
    },
  })
  process.exit(0)
}

const handle = process.env.BLUESKY_HANDLE
const password = process.env.BLUESKY_APP_PASSWORD

if (!handle || !password) skip("BLUESKY_HANDLE and BLUESKY_APP_PASSWORD are not both configured.")

const session = await postJson(`${service}/xrpc/com.atproto.server.createSession`, {
  method: "POST",
  body: JSON.stringify({ identifier: handle, password }),
})

if (!session.res.ok) {
  finishApiResult("Bluesky session", session.res, session.body)
  process.exit(0)
}

async function publishBluesky(text) {
  return postJson(`${service}/xrpc/com.atproto.repo.createRecord`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.body.accessJwt}` },
    body: JSON.stringify({
      repo: session.body.did,
      collection: "app.bsky.feed.post",
      record: {
        $type: "app.bsky.feed.post",
        text,
        createdAt: new Date().toISOString(),
      },
    }),
  })
}

finishApiResult("Bluesky English", ...(Object.values(await publishBluesky(post.bluesky.en))))
finishApiResult("Bluesky Chinese", ...(Object.values(await publishBluesky(post.bluesky.zh))))
