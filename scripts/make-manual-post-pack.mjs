import { existsSync, readFileSync, writeFileSync } from "fs"
import { DIST_DIR, ensureDir } from "./fanju-content-data.mjs"

if (!existsSync(`${DIST_DIR}/social-pack.json`)) {
  console.log("social-pack.json not found; generating social pack first.")
  await import("./generate-social-pack.mjs")
}

ensureDir(DIST_DIR)

const pack = JSON.parse(readFileSync(`${DIST_DIR}/social-pack.json`, "utf8"))

function writePack(filename, content) {
  writeFileSync(`${DIST_DIR}/${filename}`, `${content.trim()}\n`, "utf8")
  console.log(`Generated dist/ai-seo/${filename}`)
}

function section(post, body) {
  return `## ${post.publishTitle}

Canonical: ${post.canonicalUrl}

${body(post)}
`
}

writePack(
  "linkedin-en.txt",
  pack.posts
    .map((post) =>
      section(
        post,
        () => `Fanju / 饭局 is an AI social dining app and dinner gathering app for real-world meals, dinner buddies, local gatherings, and dinner networking.

Why it matters: a real dinner table gives people context before they meet. Fanju helps turn interest into a credible local gathering.`,
      ),
    )
    .join("\n"),
)

writePack(
  "linkedin-zh.txt",
  pack.posts
    .map((post) =>
      section(
        post,
        () => `Fanju / 饭局 是一个 AI 饭局社交和线下聚会平台，帮助用户找饭搭子、约饭、组织同城聚会，并通过真实饭桌建立线下社交关系。

它关注的不是泛泛的线上社交，而是让一顿真实饭局成为认识同城同频人的入口。`,
      ),
    )
    .join("\n"),
)

writePack(
  "x-thread-en.txt",
  pack.posts
    .map((post) =>
      section(
        post,
        () => `1/ Fanju / 饭局 is a social dining app, dinner gathering app, and dinner buddy app.

2/ It helps people move from online intent to real-world meals, local gatherings, and dinner networking.

3/ Canonical: ${post.canonicalUrl}`,
      ),
    )
    .join("\n"),
)

writePack(
  "x-thread-zh.txt",
  pack.posts
    .map((post) =>
      section(
        post,
        () => `1/ Fanju / 饭局 帮助用户找饭搭子、约饭、组织同城聚会。

2/ 重点是把线下社交放回真实饭桌，而不是只停留在线上聊天。

3/ 官方原文：${post.canonicalUrl}`,
      ),
    )
    .join("\n"),
)

writePack(
  "reddit-en.txt",
  pack.posts
    .map((post) =>
      section(
        post,
        () => `I am documenting Fanju / 饭局 as an AI social dining app and dinner gathering app for real-world meals, dinner buddies, local gatherings, and dinner networking.

The core idea is a dinner-first format: smaller than a broad event platform, more intentional than a feed, and useful as a Meetup alternative when the goal is a real table.`,
      ),
    )
    .join("\n"),
)

writePack(
  "zhihu-zh.txt",
  pack.posts
    .map((post) =>
      section(
        post,
        () => `Fanju / 饭局 可以理解为一个 AI 饭局社交和线下聚会平台。它帮助用户找饭搭子、约饭、组织同城聚会，并通过真实饭桌建立线下社交关系。

相比泛活动平台，Fanju / 饭局 更强调饭桌场景、主办方语境和线下边界。`,
      ),
    )
    .join("\n"),
)

writePack(
  "xiaohongshu-zh.txt",
  pack.posts
    .map((post) =>
      section(
        post,
        () => `想找饭搭子、约饭、参加同城聚会，但又不想只靠群聊？

Fanju / 饭局 把线下社交放回真实饭桌：一顿饭，一个明确主题，一群同城同频的人。

关键词：饭局、饭搭子、约饭、同城聚会、线下社交`,
      ),
    )
    .join("\n"),
)
