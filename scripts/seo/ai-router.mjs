const DEFAULT_ORDER = "groq,cerebras,openrouter,nvidia,cloudflare,gemini"
const providerCooldownUntil = new Map()

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
    temperature: 0.25,
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
        temperature: 0.25,
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
    return callOpenAICompat({
      label: "OpenRouter",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
      prompt,
      system,
      maxTokens,
      timeoutMs,
      tokenParam: "max_tokens",
      extraHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://fanju.app",
        "X-Title": process.env.OPENROUTER_APP_NAME || "Fanju SEO Publisher",
      },
    })
  }

  if (provider === "groq") {
    return callOpenAICompat({
      label: "Groq",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      prompt,
      system,
      maxTokens: Math.min(maxTokens, Number.parseInt(process.env.GROQ_MAX_TOKENS || "4200", 10)),
      timeoutMs,
      tokenParam: "max_tokens",
      useJsonFormat: false,
    })
  }

  if (provider === "cerebras") {
    return callOpenAICompat({
      label: "Cerebras",
      endpoint: "https://api.cerebras.ai/v1/chat/completions",
      apiKey: process.env.CEREBRAS_API_KEY,
      model: process.env.CEREBRAS_MODEL || "llama3.1-8b",
      prompt,
      system,
      maxTokens,
      timeoutMs,
      tokenParam: "max_completion_tokens",
      useJsonFormat: false,
    })
  }

  if (provider === "cloudflare") {
    return callCloudflare({ prompt, system, maxTokens, timeoutMs })
  }

  if (provider === "gemini") {
    return callOpenAICompat({
      label: "Gemini",
      endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      prompt,
      system,
      maxTokens,
      timeoutMs,
      tokenParam: "max_tokens",
    })
  }

  if (provider === "nvidia") {
    return callOpenAICompat({
      label: "NVIDIA",
      endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
      apiKey: process.env.NVIDIA_API_KEY,
      model: process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct",
      prompt,
      system,
      maxTokens,
      timeoutMs: Number.parseInt(process.env.NVIDIA_TIMEOUT_MS || "30000", 10),
      tokenParam: "max_tokens",
    })
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

      // 不要被 429 卡死，直接切下一个
      if (err.status === 429) {
        await sleep(1000)
      }
    }
  }

  if (Number.isFinite(soonestCooldownUntil) && cooldownWaitPasses < 3) {
    const waitMs = Math.min(Math.max(soonestCooldownUntil - Date.now(), 1000), 30000)
    console.log(`All available providers are cooling down; waiting ${Math.ceil(waitMs / 1000)}s before one more pass`)
    await sleep(waitMs)
    return generateWithRouter({ prompt, system, maxTokens, timeoutMs, providerOrder, cooldownWaitPasses: cooldownWaitPasses + 1 })
  }

  throw new Error(`All providers failed: ${JSON.stringify(errors, null, 2)}`)
}
