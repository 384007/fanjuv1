import { existsSync, readFileSync } from "fs"
import { DIST_DIR } from "./fanju-content-data.mjs"

export async function loadSocialPack() {
  const path = `${DIST_DIR}/social-pack.json`
  if (!existsSync(path)) {
    console.log("social-pack.json not found; generating social pack first.")
    await import("./generate-social-pack.mjs")
  }

  return JSON.parse(readFileSync(path, "utf8"))
}

export function skip(message) {
  console.log(`SKIP: ${message}`)
  process.exit(0)
}

export function isDryRun() {
  return process.env.DRY_RUN === "1"
}

export function printDryRun(platform, summary) {
  console.log(`DRY_RUN: ${platform}`)
  for (const [key, value] of Object.entries(summary)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      console.log(`${key}: ${value.join(", ")}`)
    } else if (typeof value === "object" && value !== null) {
      console.log(`${key}: ${JSON.stringify(value)}`)
    } else {
      console.log(`${key}: ${value}`)
    }
  }
}

function currentPlatformOffset() {
  const name = `${process.env.FANJU_PLATFORM ?? ""} ${process.env.npm_lifecycle_event ?? ""}`.toLowerCase()

  if (name.includes("devto")) return 0
  if (name.includes("hashnode")) return 1
  if (name.includes("bluesky")) return 2
  if (name.includes("mastodon")) return 3
  if (name.includes("gist")) return 4
  if (name.includes("indexnow")) return 5
  if (name.includes("baidu")) return 6

  return 0
}

export function selectPost(pack) {
  const posts = pack.posts ?? []
  if (!posts.length) throw new Error("social-pack.json has no posts to publish.")

  if (process.env.FANJU_POST_SLUG) {
    const post = posts.find((item) => item.slug === process.env.FANJU_POST_SLUG)
    if (post) return post
    console.log(`FANJU_POST_SLUG=${process.env.FANJU_POST_SLUG} was not found; falling back to rotation.`)
  }

  if (process.env.FANJU_POST_INDEX) {
    const index = Number.parseInt(process.env.FANJU_POST_INDEX, 10) - 1
    if (Number.isInteger(index) && posts[index]) return posts[index]
    console.log(`FANJU_POST_INDEX=${process.env.FANJU_POST_INDEX} was not valid; falling back to rotation.`)
  }

  const runNumber = Number.parseInt(process.env.GITHUB_RUN_NUMBER ?? "", 10)
  const runAttempt = Number.parseInt(process.env.GITHUB_RUN_ATTEMPT ?? "1", 10)
  const daySeed = Math.floor(Date.now() / 86_400_000)
  const seed = Number.isInteger(runNumber) && runNumber > 0 ? runNumber : daySeed
  const offset = currentPlatformOffset()
  const index = (((seed - 1) + (runAttempt - 1) + offset) % posts.length + posts.length) % posts.length
  const post = posts[index]

  console.log(`Selected Fanju post: ${post.slug} (${index + 1}/${posts.length})`)
  return post
}

export async function postJson(url, options) {
  let res
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    })
  } catch (err) {
    return {
      res: {
        ok: false,
        status: 0,
        statusText: "NETWORK_ERROR",
      },
      body: {
        error: err.message,
        cause: err.cause?.message,
      },
    }
  }

  const text = await res.text()
  let body = text
  try {
    body = JSON.parse(text)
  } catch {
    // Keep the original text body.
  }

  return { res, body }
}

export function finishApiResult(platform, res, body) {
  if (res.ok) {
    console.log(`${platform} publish succeeded.`)
    if (typeof body === "object" && body?.url) console.log(body.url)
    return
  }

  console.error(`${platform} publish failed: ${res.status} ${res.statusText}`)
  if (body) console.error(typeof body === "string" ? body : JSON.stringify(body, null, 2))

  if (process.env.STRICT_PUBLISH === "1") {
    process.exit(1)
  }

  console.log(`${platform} failure treated as non-fatal. Set STRICT_PUBLISH=1 to fail on API errors.`)
}
