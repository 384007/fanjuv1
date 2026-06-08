import {
  chatEndpointForKeyIndex,
  getVendorKeys,
  listAllEgresses,
} from "./llm-egress.mjs"

const DEFAULT_ORDER = "groq,nvidia,cerebras,gemini,openrouter,cloudflare"
const providerCooldownUntil = new Map()

const keyCooldownUntil = new Map() // "provider:keyIndex" -> timestamp
const keyCursor = new Map() // provider -> next preferred key index

function getProviderKeys(envPrefix) {
  const vendor = envPrefixToVendor(envPrefix)
  if (vendor) return getVendorKeys(vendor).map((row) => row.key)
  const keys = []
  const base = process.env[envPrefix]
  if (base) keys.push(base)
  for (let i = 2; i <= 10; i++) {
    const k = process.env[`${envPrefix}_${i}`]
    if (k) keys.push(k)
    else break
  }
  return keys
}

function envPrefixToVendor(envPrefix) {
  const map = {
    GROQ_API_KEY: "groq",
    CEREBRAS_API_KEY: "cerebras",
    NVIDIA_API_KEY: "nvidia",
    GEMINI_API_KEY: "gemini",
    MISTRAL_API_KEY: "mistral",
  }
  return map[envPrefix] || ""
}

function endpointForVendorKey(vendor, keyIndex, logLabel = "") {
  const route = chatEndpointForKeyIndex(vendor, keyIndex)
  if (logLabel) {
    console.log(`[egress] ${logLabel} slot=${route.slot} kind=${route.egressKind} base=${route.baseUrl}`)
  }
  return route.endpoint
}

// Log key counts at startup
;["GROQ_API_KEY", "CEREBRAS_API_KEY", "NVIDIA_API_KEY", "GEMINI_API_KEY", "OPENROUTER_API_KEY"].forEach((prefix) => {
  const n = getProviderKeys(prefix).length
  console.log(`[ai-router] ${prefix}: ${n} key(s) loaded`)
})
const egressSummary = listAllEgresses(["groq", "cerebras", "nvidia", "gemini"])
for (const [vendor, rows] of Object.entries(egressSummary)) {
  const kinds = rows.map((r) => `key_${r.slot}=${r.egress_kind}`).join(", ")
  if (kinds) console.log(`[ai-router] egress ${vendor}: ${kinds}`)
}

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
  return String(content)
    .replace(/^```json\s*/i, "")
    .replace(/^```markdown\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/^Here is[\s\S]*?\n/i, "")
    .replace(/^Below is[\s\S]*?\n/i, "")
    .trim()
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

async function callProvider(provider, { prompt, system, maxTokens, timeoutMs }) {
  if (provider === "openrouter") {
    const keys = getProviderKeys("OPENROUTER_API_KEY")
    for (const i of rotatingKeyIndexes("openrouter", keys.length)) {
      if ((keyCooldownUntil.get(`openrouter:${i}`) || 0) > Date.now()) continue
      try {
        return await callOpenAICompat({
          label: `OpenRouter[${i}]`, endpoint: "https://openrouter.ai/api/v1/chat/completions",
          apiKey: keys[i], model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
          prompt, system, maxTokens, timeoutMs, tokenParam: "max_tokens",
          extraHeaders: { "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://fanju.app", "X-Title": process.env.OPENROUTER_APP_NAME || "Fanju SEO Publisher" },
        })
      } catch (err) {
        if (err?.status === 429) { cooldownKey("openrouter", i, retryDelayMs(err) || 30000); continue }
        throw err
      }
    }
    throw Object.assign(new Error("OpenRouter: all keys on cooldown"), { status: 429 })
  }

  if (provider === "groq") {
    const keys = getProviderKeys("GROQ_API_KEY")
    for (const i of rotatingKeyIndexes("groq", keys.length)) {
      if ((keyCooldownUntil.get(`groq:${i}`) || 0) > Date.now()) continue
      try {
        return await callOpenAICompat({
          label: `Groq[${i}]`, endpoint: endpointForVendorKey("groq", i),
          apiKey: keys[i], model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          prompt, system, maxTokens: Math.min(maxTokens, Number.parseInt(process.env.GROQ_MAX_TOKENS || "4200", 10)),
          timeoutMs, tokenParam: "max_tokens", useJsonFormat: false,
        })
      } catch (err) {
        if (err?.status === 429) { cooldownKey("groq", i, retryDelayMs(err) || 60000); continue }
        throw err
      }
    }
    throw Object.assign(new Error("Groq: all keys on cooldown"), { status: 429 })
  }

  if (provider === "groq2") {
    const keys = getProviderKeys("GROQ_API_KEY")
    const i = 1; const apiKey = keys[i]
    if (!apiKey) throw Object.assign(new Error("groq2: key not configured"), { status: 503 })
    if ((keyCooldownUntil.get(`groq:${i}`) || 0) > Date.now()) throw Object.assign(new Error("groq2: key on cooldown"), { status: 429 })
    try {
      return await callOpenAICompat({
        label: `Groq[${i}]`, endpoint: endpointForVendorKey("groq", i),
        apiKey, model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        prompt, system, maxTokens: Math.min(maxTokens, Number.parseInt(process.env.GROQ_MAX_TOKENS || "4200", 10)),
        timeoutMs, tokenParam: "max_tokens", useJsonFormat: false,
      })
    } catch (err) {
      if (err?.status === 429) cooldownKey("groq", i, retryDelayMs(err) || 60000)
      throw err
    }
  }

  if (provider === "cerebras") {
    const keys = getProviderKeys("CEREBRAS_API_KEY")
    const models = ["gpt-oss-120b", "zai-glm-4.7", "llama-3.3-70b", "qwen-3-32b"]
    for (const i of rotatingKeyIndexes("cerebras", keys.length)) {
      if ((keyCooldownUntil.get(`cerebras:${i}`) || 0) > Date.now()) continue
      for (const model of models) {
        try {
          return await callOpenAICompat({
            label: `Cerebras[${i}]-${model}`, endpoint: endpointForVendorKey("cerebras", i),
            apiKey: keys[i], model,
            prompt, system, maxTokens,
            timeoutMs: Number.parseInt(process.env.CEREBRAS_TIMEOUT_MS || "30000", 10), tokenParam: "max_completion_tokens",
          })
        } catch (err) {
          if (err?.status === 429) { cooldownKey("cerebras", i, retryDelayMs(err) || 60000); break }
          if (err?.status === 404) { console.log(`Model ${model} not found, trying next model...`); continue }
          throw err
        }
      }
    }
    throw Object.assign(new Error("Cerebras: all models failed or keys on cooldown"), { status: 429 })
  }

  if (provider === "cerebras2" || provider === "cerebras3" || provider === "cerebras4" || provider === "cerebras5" || provider === "cerebras6") {
    const keyIndex = provider === "cerebras2" ? 1 : provider === "cerebras3" ? 2 : provider === "cerebras4" ? 3 : provider === "cerebras5" ? 4 : 5
    const keys = getProviderKeys("CEREBRAS_API_KEY")
    const apiKey = keys[keyIndex]
    if (!apiKey) throw Object.assign(new Error(`${provider}: key not configured`), { status: 503 })
    const mapKey = `cerebras:${keyIndex}`
    if ((keyCooldownUntil.get(mapKey) || 0) > Date.now())
      throw Object.assign(new Error(`${provider}: key on cooldown`), { status: 429 })
    const cerebras24Models = process.env.CEREBRAS_MODEL
      ? [process.env.CEREBRAS_MODEL]
      : ["gpt-oss-120b", "qwen-3-32b", "llama-3.3-70b"]
    let lastErr
    for (const model of cerebras24Models) {
      try {
        return await callOpenAICompat({
          label: `Cerebras[${keyIndex}]-${model}`, endpoint: endpointForVendorKey("cerebras", keyIndex, provider),
          apiKey, model,
          prompt, system, maxTokens, timeoutMs, tokenParam: "max_completion_tokens", useJsonFormat: false,
        })
      } catch (err) {
        if (err?.status === 429) { cooldownKey("cerebras", keyIndex, retryDelayMs(err) || 86400000); throw err }
        if (err?.status === 404) { lastErr = err; continue }
        throw err
      }
    }
    throw lastErr || Object.assign(new Error(`${provider}: all models failed`), { status: 503 })
  }

  if (provider === "cloudflare") {
    return callCloudflare({ prompt, system, maxTokens, timeoutMs })
  }

  if (provider === "gemini") {
    const keys = getProviderKeys("GEMINI_API_KEY")
    for (const i of rotatingKeyIndexes("gemini", keys.length)) {
      if ((keyCooldownUntil.get(`gemini:${i}`) || 0) > Date.now()) continue
      try {
        return await callOpenAICompat({
          label: `Gemini[${i}]`, endpoint: endpointForVendorKey("gemini", i),
          apiKey: keys[i], model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
          prompt, system, maxTokens, timeoutMs, tokenParam: "max_tokens",
        })
      } catch (err) {
        if (err?.status === 429) { cooldownKey("gemini", i, retryDelayMs(err) || 3600000); continue }
        throw err
      }
    }
    throw Object.assign(new Error("Gemini: all keys on cooldown"), { status: 429 })
  }

  if (provider === "gemini2" || provider === "gemini3" || provider === "gemini4") {
    const keys = getProviderKeys("GEMINI_API_KEY")
    const i = provider === "gemini2" ? 1 : provider === "gemini3" ? 2 : 3
    const apiKey = keys[i]
    if (!apiKey) throw Object.assign(new Error(`${provider}: key not configured`), { status: 503 })
    if ((keyCooldownUntil.get(`gemini:${i}`) || 0) > Date.now()) throw Object.assign(new Error(`${provider}: key on cooldown`), { status: 429 })
    try {
      return await callOpenAICompat({
        label: `Gemini[${i}]`, endpoint: endpointForVendorKey("gemini", i),
        apiKey, model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        prompt, system, maxTokens, timeoutMs, tokenParam: "max_tokens",
      })
    } catch (err) {
      if (err?.status === 429) cooldownKey("gemini", i, retryDelayMs(err) || 3600000)
      throw err
    }
  }

  if (provider === "nvidia") {
    const keys = getProviderKeys("NVIDIA_API_KEY")
    for (const i of rotatingKeyIndexes("nvidia", keys.length)) {
      if ((keyCooldownUntil.get(`nvidia:${i}`) || 0) > Date.now()) continue
      try {
        return await callOpenAICompat({
          label: `NVIDIA[${i}]`, endpoint: endpointForVendorKey("nvidia", i),
          apiKey: keys[i], model: process.env.NVIDIA_MODEL || "nvidia/llama-3.3-nemotron-super-49b-v1",
          prompt, system, maxTokens,
          timeoutMs: Number.parseInt(process.env.NVIDIA_TIMEOUT_MS || "30000", 10), tokenParam: "max_tokens",
        })
      } catch (err) {
        if (err?.status === 429) { cooldownKey("nvidia", i, retryDelayMs(err) || 60000); continue }
        throw err
      }
    }
    throw Object.assign(new Error("NVIDIA: all keys on cooldown"), { status: 429 })
  }

  if (provider === "nvidia2") {
    const keys = getProviderKeys("NVIDIA_API_KEY")
    const i = 1; const apiKey = keys[i]
    if (!apiKey) throw Object.assign(new Error("nvidia2: key not configured"), { status: 503 })
    if ((keyCooldownUntil.get(`nvidia:${i}`) || 0) > Date.now()) throw Object.assign(new Error("nvidia2: key on cooldown"), { status: 429 })
    try {
      return await callOpenAICompat({
        label: `NVIDIA[${i}]`, endpoint: endpointForVendorKey("nvidia", i),
        apiKey, model: process.env.NVIDIA_MODEL || "nvidia/llama-3.3-nemotron-super-49b-v1",
        prompt, system, maxTokens,
        timeoutMs: Number.parseInt(process.env.NVIDIA_TIMEOUT_MS || "30000", 10), tokenParam: "max_tokens",
      })
    } catch (err) {
      if (err?.status === 429) cooldownKey("nvidia", i, retryDelayMs(err) || 60000)
      throw err
    }
  }

  throw new Error(`Unknown provider: ${provider}`)
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
  else if (err?.status === 429 && /free_tier_requests|quota exceeded|current quota/i.test(text)) ms = 60 * 60 * 1000
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
      const content = await callProvider(provider, { prompt, system, maxTokens, timeoutMs })

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