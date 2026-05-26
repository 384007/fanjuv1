// DEFAULT_ORDER is built dynamically at startup based on how many keys are
// configured for each provider, so adding more keys never requires a code change.
function buildDefaultOrder() {
  const parts = []
  const addSlots = (base, envPrefix) => {
    const n = getProviderKeys(envPrefix).length
    if (n === 0) return
    parts.push(base)
    for (let i = 2; i <= n; i++) parts.push(`${base}${i}`)
  }
  // Add new providers here — that's the only place you ever need to touch.
  addSlots("aion",       "AION_API_KEY")
  addSlots("cerebras",   "CEREBRAS_API_KEY")
  addSlots("groq",       "GROQ_API_KEY")
  addSlots("gemini",     "GEMINI_API_KEY")
  addSlots("openrouter", "OPENROUTER_API_KEY")
  addSlots("nvidia",     "NVIDIA_API_KEY")
  if (process.env.CLOUDFLARE_ACCOUNT_ID) parts.push("cloudflare")
  return parts.join(",")
}

// ─── Provider registry ────────────────────────────────────────────────────────
// Each entry describes one provider family. The router uses this table to call
// any providerN slot without hardcoding names or counts anywhere else.
//
// Fields:
//   envPrefix   – env var prefix for getProviderKeys()
//   endpoint    – API endpoint URL (string or () => string)
//   model       – model name (string or () => string)
//   tokenParam  – request field for max tokens
//   maxTokens   – optional cap on maxTokens (() => number)
//   timeoutMs   – optional override (() => number)
//   cooldownMs  – default cooldown on 429
//   extraHeaders– optional extra request headers (() => object)
//   rotating    – if true, "base" provider name rotates across all keys;
//                 numbered variants (base2, base3…) pin to a specific key index
//
// To add a new AI provider: add one entry here + its env key. Done.
const PROVIDER_REGISTRY = {
  aion: {
    envPrefix: "AION_API_KEY",
    endpoint: () => process.env.AION_ENDPOINT || "https://api.aionlabs.ai/v1/chat/completions",
    model: () => process.env.AION_MODEL || AION_DEFAULT_MODEL,
    tokenParam: "max_tokens",
    maxTokens: () => Math.min(Infinity, Number.parseInt(process.env.AION_MAX_TOKENS || "7200", 10)),
    timeoutMs: () => Number.parseInt(process.env.AION_TIMEOUT_MS || "0", 10) || null,
    cooldownMs: 60000,
    rotating: true,
  },
  cerebras: {
    envPrefix: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    model: () => process.env.CEREBRAS_MODEL || "qwen-3-235b-a22b-instruct-2507",
    tokenParam: "max_completion_tokens",
    cooldownMs: 86400000,
    rotating: true,
  },
  groq: {
    envPrefix: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: () => process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    tokenParam: "max_tokens",
    maxTokens: () => Math.min(Infinity, Number.parseInt(process.env.GROQ_MAX_TOKENS || "4200", 10)),
    cooldownMs: 60000,
    rotating: true,
  },
  gemini: {
    envPrefix: "GEMINI_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    model: () => process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    tokenParam: "max_tokens",
    cooldownMs: 3600000,
    rotating: true,
  },
  openrouter: {
    envPrefix: "OPENROUTER_API_KEY",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: () => process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
    tokenParam: "max_tokens",
    cooldownMs: 30000,
    extraHeaders: () => ({
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://fanju.app",
      "X-Title": process.env.OPENROUTER_APP_NAME || "Fanju SEO Publisher",
    }),
    rotating: true,
  },
  nvidia: {
    envPrefix: "NVIDIA_API_KEY",
    endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
    model: () => process.env.NVIDIA_MODEL || "nvidia/llama-3.3-nemotron-super-49b-v1",
    tokenParam: "max_tokens",
    timeoutMs: () => Number.parseInt(process.env.NVIDIA_TIMEOUT_MS || "30000", 10),
    cooldownMs: 60000,
    rotating: true,
  },
}

// Resolve a provider name like "cerebras", "cerebras2", "groq5" to its registry
// entry and the specific key index to use. Returns null if not in registry.
function resolveProvider(provider) {
  // Exact match (base name, e.g. "groq")
  if (PROVIDER_REGISTRY[provider]) {
    return { entry: PROVIDER_REGISTRY[provider], base: provider, keyIndex: null }
  }
  // Numbered variant (e.g. "groq2", "cerebras10")
  const m = provider.match(/^([a-z]+?)(\d+)$/)
  if (m && PROVIDER_REGISTRY[m[1]]) {
    return { entry: PROVIDER_REGISTRY[m[1]], base: m[1], keyIndex: Number.parseInt(m[2], 10) - 1 }
  }
  return null
}

const DEFAULT_ORDER = buildDefaultOrder()
const AION_DEFAULT_MODEL = "aion-labs/aion-2.5"
const providerCooldownUntil = new Map()
const providerLocks = new Map()

// Multi-key support: GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3, ...
// Same pattern for CEREBRAS_API_KEY, NVIDIA_API_KEY
const keyCooldownUntil = new Map() // "provider:keyIndex" -> timestamp
const keyCursor = new Map() // provider -> next preferred key index

function getProviderKeys(envPrefix) {
  const keys = []
  const base = process.env[envPrefix]
  if (base) keys.push(base)
  for (let i = 2; i <= 99; i++) {
    const k = process.env[`${envPrefix}_${i}`]
    if (k) keys.push(k)
    else break
  }
  return keys
}

function isAionProvider(provider) {
  return provider === "aion" || /^aion\d+$/.test(provider)
}

function aionKeyIndex(provider) {
  if (provider === "aion") return process.env.ASSIGN_PROVIDER_PER_CITY === "1" ? 0 : null
  const match = provider.match(/^aion(\d+)$/)
  return match ? Number.parseInt(match[1], 10) - 1 : undefined
}

function providerMutexEnabled() {
  return process.env.AI_PROVIDER_MUTEX !== "0"
}

async function withProviderLock(provider, task) {
  if (!providerMutexEnabled()) return task()
  const previous = providerLocks.get(provider) || Promise.resolve()
  let release
  const current = new Promise((resolve) => {
    release = resolve
  })
  const chained = previous.then(() => current, () => current)
  providerLocks.set(provider, chained)
  await previous.catch(() => {})
  try {
    return await task()
  } finally {
    release()
    if (providerLocks.get(provider) === chained) providerLocks.delete(provider)
  }
}

// Log key counts at startup — reads from registry so new providers appear automatically
Object.entries(PROVIDER_REGISTRY).forEach(([name, entry]) => {
  const n = getProviderKeys(entry.envPrefix).length
  if (n > 0) console.log(`[ai-router] ${entry.envPrefix}: ${n} key(s) loaded`)
})
console.log(`[ai-router] active order: ${DEFAULT_ORDER || "(none — check env keys)"}`)


function cooldownKey(provider, keyIndex, ms) {
  const mapKey = `${provider}:${keyIndex}`
  keyCooldownUntil.set(mapKey, Date.now() + ms)
  console.log(`Provider ${provider} key[${keyIndex}] cooldown ${Math.ceil(ms / 1000)}s`)
}

function providerKeyCooldownUntil(provider) {
  let until = 0
  for (const [key, value] of keyCooldownUntil.entries()) {
    if (key.startsWith(`${provider}:`)) until = Math.max(until, value)
  }
  return until
}

function rotatingKeyIndexes(provider, keyCount) {
  if (keyCount <= 0) return []
  const start = (keyCursor.get(provider) || 0) % keyCount
  keyCursor.set(provider, (start + 1) % keyCount)
  return Array.from({ length: keyCount }, (_, offset) => (start + offset) % keyCount)
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function cleanContent(content = "") {
  const cleaned = String(content)
    .replace(/^```json\s*/i, "")
    .replace(/^```markdown\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/^Here is[\s\S]*?\n/i, "")
    .replace(/^Below is[\s\S]*?\n/i, "")
    .trim()
  // If the model returned HTML meta tags instead of JSON/Markdown, reject it
  // immediately so the router can fall through to the next provider.
  if (/^<(title|meta|html|head|body|!DOCTYPE)/i.test(cleaned) || /<title[\s>]/i.test(cleaned)) {
    throw Object.assign(new Error("provider returned HTML instead of JSON/Markdown"), { status: 422 })
  }
  return cleaned
}

function timeoutPromise(ms, label) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms))
}

async function callOpenAICompat({ label, endpoint, apiKey, model, prompt, system, maxTokens, timeoutMs, tokenParam = "max_tokens", extraHeaders = {}, useJsonFormat = false }) {
  if (!apiKey) throw new Error(`${label}: missing API key`)

  const body = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  }

  if (useJsonFormat && process.env.AI_RESPONSE_FORMAT !== "text") {
    body.response_format = { type: "json_object" }
  }

  body[tokenParam] = maxTokens

  const req = async () => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    })

    const text = await res.text()

    if (!res.ok) {
      const err = new Error(`${label} failed ${res.status}: ${text}`)
      err.status = res.status
      err.body = text
      throw err
    }

    const json = JSON.parse(text)
    return cleanContent(json.choices?.[0]?.message?.content || "")
  }

  return Promise.race([req(), timeoutPromise(timeoutMs, label)])
}

async function callCloudflare({ prompt, system, maxTokens, timeoutMs }) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_AUTH_TOKEN
  const model = process.env.CLOUDFLARE_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast"

  if (!accountId) throw new Error("Cloudflare: missing CLOUDFLARE_ACCOUNT_ID")
  if (!token) throw new Error("Cloudflare: missing CLOUDFLARE_AI_API_TOKEN/CLOUDFLARE_API_TOKEN")

  const req = async () => {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    })

    const text = await res.text()

    if (!res.ok) {
      const err = new Error(`Cloudflare failed ${res.status}: ${text}`)
      err.status = res.status
      err.body = text
      throw err
    }

    const json = JSON.parse(text)
    return cleanContent(json.result?.response || json.result?.text || json.response || "")
  }

  return Promise.race([req(), timeoutPromise(timeoutMs, "Cloudflare")])
}

async function callRegistryProvider(provider, resolved, { prompt, system, maxTokens, timeoutMs }) {
  const { entry, base, keyIndex } = resolved
  const keys = getProviderKeys(entry.envPrefix)
  const endpoint = typeof entry.endpoint === "function" ? entry.endpoint() : entry.endpoint
  const model = typeof entry.model === "function" ? entry.model() : entry.model
  const tokenParam = entry.tokenParam || "max_tokens"
  const effectiveMaxTokens = entry.maxTokens ? Math.min(maxTokens, entry.maxTokens()) : maxTokens
  const effectiveTimeoutMs = (entry.timeoutMs ? entry.timeoutMs() : null) || timeoutMs
  const extraHeaders = entry.extraHeaders ? entry.extraHeaders() : {}
  const cooldownMs = entry.cooldownMs || 15000

  // Base provider name (e.g. "groq") rotates across all keys.
  // Numbered variant (e.g. "groq2") pins to a specific key index.
  const isRotating = keyIndex === null && entry.rotating && process.env.ASSIGN_PROVIDER_PER_CITY !== "1"
  const indexes = isRotating ? rotatingKeyIndexes(base, keys.length) : [keyIndex ?? 0]

  for (const i of indexes) {
    const apiKey = keys[i]
    if (!apiKey) {
      if (!isRotating) throw Object.assign(new Error(`${provider}: key not configured`), { status: 503 })
      continue
    }
    if ((keyCooldownUntil.get(`${base}:${i}`) || 0) > Date.now()) {
      if (!isRotating) throw Object.assign(new Error(`${provider}: key on cooldown`), { status: 429 })
      continue
    }
    try {
      return await callOpenAICompat({
        label: `${base}[${i}]`, endpoint, apiKey, model, prompt, system,
        maxTokens: effectiveMaxTokens, timeoutMs: effectiveTimeoutMs,
        tokenParam, extraHeaders,
      })
    } catch (err) {
      if (err?.status === 429) {
        const text = `${err?.message || ""}\n${err?.body || ""}`
        const isDaily = /daily free-tier|tokens per day|token_quota_exceeded|daily.*limit|quota exceeded/i.test(text)
        cooldownKey(base, i, isDaily ? 60 * 60 * 1000 : (retryDelayMs(err) || cooldownMs))
        if (isRotating) continue
      }
      throw err
    }
  }
  throw Object.assign(new Error(`${base}: all keys on cooldown`), { status: 429 })
}

async function callProvider(provider, { prompt, system, maxTokens, timeoutMs }) {
  // Aion has special per-city assignment logic, keep its own path
  if (isAionProvider(provider)) {
    const resolved = resolveProvider(provider)
    if (!resolved) throw new Error(`Unknown Aion provider: ${provider}`)
    // Override keyIndex for ASSIGN_PROVIDER_PER_CITY mode
    if (provider === "aion" && process.env.ASSIGN_PROVIDER_PER_CITY === "1") {
      resolved.keyIndex = 0
    }
    return callRegistryProvider(provider, resolved, { prompt, system, maxTokens, timeoutMs })
  }

  // Cloudflare has a completely different API shape
  if (provider === "cloudflare") {
    return callCloudflare({ prompt, system, maxTokens, timeoutMs })
  }

  // All registry providers (cerebras, groq, gemini, openrouter, nvidia, and any future ones)
  const resolved = resolveProvider(provider)
  if (resolved) {
    return callRegistryProvider(provider, resolved, { prompt, system, maxTokens, timeoutMs })
  }

  throw new Error(`Unknown provider: ${provider}`)
}

// Returns false if the provider requires a key that isn't configured, so the
// router can skip it silently instead of attempting a call that will always fail.
function isProviderConfigured(provider) {
  if (provider === "cloudflare") {
    return !!(process.env.CLOUDFLARE_ACCOUNT_ID &&
      (process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_AUTH_TOKEN))
  }
  const resolved = resolveProvider(provider)
  if (!resolved) return true // unknown — let it try and fail naturally
  const keys = getProviderKeys(resolved.entry.envPrefix)
  if (resolved.keyIndex === null) return keys.length > 0   // base name: needs at least one key
  return !!keys[resolved.keyIndex]                         // numbered: needs that specific slot
}

function retryDelayMs(err) {
  const text = `${err?.message || ""}\n${err?.body || ""}`
  const retry = text.match(/(?:retry|try again) in ([0-9.]+)\s*s/i)
  if (retry) return Math.ceil(Number.parseFloat(retry[1]) * 1000)
  if (err?.status === 429) return 15000
  return 0
}

function cooldownProvider(provider, err) {
  const text = `${err?.message || ""}\n${err?.body || ""}`
  let ms = 0
  if (err?.status === 401 || err?.status === 403) ms = 60 * 60 * 1000
  else if (err?.status === 429 && /free_tier_requests|quota exceeded|current quota|daily free-tier|tokens per day|token_quota_exceeded|daily.*limit/i.test(text)) ms = 60 * 60 * 1000
  else if (err?.status === 429 && /all keys on cooldown/i.test(text)) {
    const keyUntil = providerKeyCooldownUntil(provider)
    ms = keyUntil > Date.now() ? keyUntil - Date.now() + 5000 : 15000
  }
  else if (err?.status === 429) ms = retryDelayMs(err)
  if (ms > 0) {
    const until = Date.now() + ms
    providerCooldownUntil.set(provider, until)
    console.log(`Provider ${provider} cooldown ${Math.ceil(ms / 1000)}s`)
  }
}

export async function generateWithRouter({ prompt, system, maxTokens = 1200, timeoutMs = 45000, providerOrder = "", cooldownWaitPasses = 0 }) {
  const order = (providerOrder || process.env.AI_PROVIDER_ORDER || DEFAULT_ORDER)
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)

  const errors = []
  let soonestCooldownUntil = Infinity

  for (const provider of order) {
    if (!isProviderConfigured(provider)) {
      // silently skip — no key configured for this slot
      continue
    }

    const cooldownUntil = providerCooldownUntil.get(provider) || 0
    if (cooldownUntil > Date.now()) {
      const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000)
      console.log(`Skipping provider ${provider}: cooldown ${remaining}s`)
      errors.push({ provider, error: `cooldown ${remaining}s` })
      soonestCooldownUntil = Math.min(soonestCooldownUntil, cooldownUntil)
      continue
    }

    const started = Date.now()

    try {
      console.log(`Trying provider: ${provider}`)
      const content = await withProviderLock(provider, () => callProvider(provider, { prompt, system, maxTokens, timeoutMs }))

      if (!content || content.length < 200) {
        throw new Error(`${provider}: empty or too short response`)
      }

      console.log(`Provider ${provider} succeeded in ${Math.round((Date.now() - started) / 1000)}s`)
      return { provider, content }
    } catch (err) {
      console.log(`Provider ${provider} failed: ${err.message.slice(0, 500)}`)
      errors.push({ provider, error: err.message })
      cooldownProvider(provider, err)
      const cooldownUntil = providerCooldownUntil.get(provider) || 0
      if (cooldownUntil > Date.now()) {
        soonestCooldownUntil = Math.min(soonestCooldownUntil, cooldownUntil)
      }

      // 不要被 429 卡死，直接切下一个
      if (err.status === 429) {
        await sleep(1000)
      }
    }
  }

  const maxCooldownWaitPasses = Number.parseInt(process.env.AI_COOLDOWN_WAIT_PASSES || "12", 10)
  if (Number.isFinite(soonestCooldownUntil) && cooldownWaitPasses < maxCooldownWaitPasses) {
    const waitMs = Math.min(Math.max(soonestCooldownUntil - Date.now() + 1000, 1000), 90000)
    console.log(`All available providers are cooling down; waiting ${Math.ceil(waitMs / 1000)}s before one more pass`)
    await sleep(waitMs)
    return generateWithRouter({ prompt, system, maxTokens, timeoutMs, providerOrder, cooldownWaitPasses: cooldownWaitPasses + 1 })
  }

  throw new Error(`All providers failed: ${JSON.stringify(errors, null, 2)}`)
}
