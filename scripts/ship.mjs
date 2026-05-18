// scripts/ship.mjs
//
// One-command release:
//   1. Stage normal application/content/deployment changes.
//   2. Commit if anything is staged.
//   3. Push main.
//   4. Deploy Cloudflare Pages.
//   5. Deploy the city-route Worker.
//
// Optional:
//   SHIP_MESSAGE="fix: ..." pnpm ship

import { spawnSync } from "child_process"
import { existsSync } from "fs"
import { join } from "path"

const ROOT = process.cwd()
const COMMIT_MESSAGE = process.env.SHIP_MESSAGE || "chore: ship site updates"

const STAGE_PATHS = [
  "app",
  "components",
  "content",
  "data",
  "lib",
  "messages",
  "public",
  "scripts",
  "styles",
  "workers/fanju-seo/worker.js",
  "workers/fanju-seo/wrangler.toml",
  "modal_growth_agent.py",
  "next.config.mjs",
  "package.json",
  "pnpm-lock.yaml",
  "tailwind.config.ts",
  "tsconfig.json",
].filter((path) => existsSync(join(ROOT, path)))

function run(command, args, options = {}) {
  console.log(`$ ${[command, ...args].join(" ")}`)
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    ...options,
  })
  if (result.status !== 0) process.exit(result.status || 1)
}

function status(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "ignore",
    env: process.env,
  })
  return result.status || 0
}

function currentBranch() {
  const result = spawnSync("git", ["branch", "--show-current"], {
    cwd: ROOT,
    encoding: "utf8",
  })
  return result.stdout.trim()
}

if (currentBranch() !== "main") {
  console.error("pnpm ship must run on main.")
  process.exit(1)
}

if (STAGE_PATHS.length) {
  run("git", ["add", "--", ...STAGE_PATHS])
}

if (status("git", ["diff", "--cached", "--quiet"]) !== 0) {
  run("git", ["commit", "-m", COMMIT_MESSAGE])
} else {
  console.log("No staged changes to commit.")
}

run("git", ["push", "origin", "main"])
run("pnpm", ["cf:deploy"])
run("npx", ["wrangler", "deploy", "--config", "workers/fanju-seo/wrangler.toml"])
