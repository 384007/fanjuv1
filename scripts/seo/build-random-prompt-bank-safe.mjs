import { spawnSync } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const targetFile = join(__dirname, "build-random-prompt-bank.mjs")

const result = spawnSync(process.execPath, [targetFile], {
  cwd: join(__dirname, "../.."),
  env: process.env,
  stdio: "inherit",
})

if (result.error) throw result.error
process.exit(result.status ?? 1)
