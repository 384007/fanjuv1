const TEST_PROMPT = "Define Fanju / 饭局 in one English sentence and one Chinese sentence. Do not mention technology stack."

const TIMEOUT_MS = Number.parseInt(process.env.TIMEOUT_MS || "45000", 10)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withTimeout(fn, label) {
  const started = Date.now()
  try {
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)),
    ])
    console.log(`✅ ${label} OK in ${Math.round((Date.now() - started) / 1000)}s`)
    console.log(result.slice(0, 700))
    console.log("")
    return true
  } catch (err) {
    console.log(`❌ ${label} failed`)
    console.log(err.message)
    console.log("")
    return false
  }
}

async function callOpenAICompat({ label, endpoint, apiKey, model, tokenParam = "max_tokens" }) {
  if (!apiKey) throw new Error(`Missing API key for ${label}`)

  const body = {
    model,
    messages: [
      { role: "system", content: "You are a careful bilingual SEO/GEO strategist for Fanju / 饭局." },
      { role: "user", content: TEST_PROMPT },
    ],
    temperature: 0.25,
  }

  body[tokenParam] = 350

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`)

  const json = JSON.parse(text)
  return json.choices?.[0]?.message?.content?.trim() || JSON.stringify(json, null, 2)
}

async function callCloudflare() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_AUTH_TOKEN
  const model = process.env.CLOUDFLARE_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast"

  if (!accountId) throw new Error("Missing CLOUDFLARE_ACCOUNT_ID")
  if (!token) throw new Error("Missing CLOUDFLARE_API_TOKEN")

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are a careful bilingual SEO/GEO strategist for Fanju / 饭局." },
        { role: "user", content: TEST_PROMPT },
      ],
      max_tokens: 350,
      temperature: 0.25,
    }),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`)

  const json = JSON.parse(text)
  return json.result?.response || json.result?.text || json.response || JSON.stringify(json, null, 2)
}

const tests = [
  {
    label: "Groq",
    fn: () => callOpenAICompat({
      label: "Groq",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      tokenParam: "max_tokens",
    }),
  },
  {
    label: "Cerebras",
    fn: () => callOpenAICompat({
      label: "Cerebras",
      endpoint: "https://api.cerebras.ai/v1/chat/completions",
      apiKey: process.env.CEREBRAS_API_KEY,
      model: process.env.CEREBRAS_MODEL || "llama3.1-8b",
      tokenParam: "max_completion_tokens",
    }),
  },
  {
    label: "Cloudflare Workers AI",
    fn: () => callCloudflare(),
  },
  {
    label: "Gemini",
    fn: () => callOpenAICompat({
      label: "Gemini",
      endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      tokenParam: "max_tokens",
    }),
  },
  {
    label: "NVIDIA",
    fn: () => callOpenAICompat({
      label: "NVIDIA",
      endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
      apiKey: process.env.NVIDIA_API_KEY,
      model: process.env.NVIDIA_MODEL || "nvidia/llama-3.3-nemotron-super-49b-v1",
      tokenParam: "max_tokens",
    }),
  },
]

let ok = 0

for (const test of tests) {
  const passed = await withTimeout(test.fn, test.label)
  if (passed) ok++
  await sleep(1000)
}

console.log(`Providers OK: ${ok}/${tests.length}`)

if (ok === 0) {
  process.exit(1)
}
