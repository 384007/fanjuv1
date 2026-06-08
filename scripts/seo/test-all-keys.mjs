#!/usr/bin/env node
// Test every configured key for groq, cerebras, nvidia, gemini via per-slot egress routing.
// Usage: node scripts/seo/test-all-keys.mjs

import {
  chatEndpointForKeyIndex,
  getVendorKeys,
  listAllEgresses,
} from "./llm-egress.mjs"

const PROVIDERS = [
  {
    name: "groq",
    vendor: "groq",
    model: () => process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    tokenParam: "max_tokens",
  },
  {
    name: "cerebras",
    vendor: "cerebras",
    model: () => process.env.CEREBRAS_MODEL || "llama3.1-8b",
    tokenParam: "max_completion_tokens",
  },
  {
    name: "nvidia",
    vendor: "nvidia",
    model: () => process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct",
    tokenParam: "max_tokens",
  },
  {
    name: "gemini",
    vendor: "gemini",
    model: () => process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    tokenParam: "max_tokens",
  },
  {
    name: "openrouter",
    vendor: "",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    envPrefix: "OPENROUTER_API_KEY",
    model: () => process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
    tokenParam: "max_tokens",
    extraHeaders: {
      "HTTP-Referer": "https://fanju.app",
      "X-Title": "Fanju SEO Publisher",
    },
  },
]

function getKeys(envPrefix) {
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

async function testKey(provider, key, index, endpoint, keyEnv) {
  const route = provider.vendor ? chatEndpointForKeyIndex(provider.vendor, index) : null
  const label = provider.vendor
    ? `${provider.name}[${index}] ${keyEnv || `slot=${route.slot}`} egress=${route.egressKind}`
    : `${provider.name}[${index}] (${provider.envPrefix}${index === 0 ? "" : `_${index + 1}`})`
  const body = {
    model: provider.model(),
    messages: [{ role: "user", content: "Reply with just: OK" }],
    [provider.tokenParam]: 10,
  }
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, ...(provider.extraHeaders || {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    })
    const json = await res.json()
    if (!res.ok) {
      const msg = json?.error?.message?.slice(0, 100) || JSON.stringify(json).slice(0, 100)
      if (res.status === 429) {
        console.log(`⚠️  ${label} — rate limited (key is valid): ${msg}`)
        return true
      }
      console.log(`❌ ${label} — HTTP ${res.status}: ${msg}`)
      return false
    }
    const text = json?.choices?.[0]?.message?.content || "(empty)"
    console.log(`✅ ${label} — ${text.trim().slice(0, 50)}`)
    return true
  } catch (err) {
    console.log(`❌ ${label} — ${err.message}`)
    return false
  }
}

console.log("Egress map:")
console.log(JSON.stringify(listAllEgresses(["groq", "cerebras", "nvidia", "gemini"]), null, 2))

let total = 0, passed = 0
for (const provider of PROVIDERS) {
  if (provider.vendor) {
    const rows = getVendorKeys(provider.vendor)
    if (rows.length === 0) {
      console.log(`⚠️  ${provider.name}: no keys configured`)
      continue
    }
    for (let i = 0; i < rows.length; i++) {
      total++
      const endpoint = chatEndpointForKeyIndex(provider.vendor, i).endpoint
      if (await testKey(provider, rows[i].key, i, endpoint, rows[i].keyEnv)) passed++
      if (i < rows.length - 1) await new Promise((r) => setTimeout(r, 1000))
    }
    continue
  }

  const keys = getKeys(provider.envPrefix)
  if (keys.length === 0) {
    console.log(`⚠️  ${provider.name}: no keys configured`)
    continue
  }
  for (let i = 0; i < keys.length; i++) {
    total++
    if (await testKey(provider, keys[i], i, provider.endpoint)) passed++
    if (i < keys.length - 1) await new Promise((r) => setTimeout(r, 1000))
  }
}

const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID
const cfToken = process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN
const cfModel = process.env.CLOUDFLARE_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast"
if (!cfAccountId || !cfToken) {
  console.log("⚠️  cloudflare: CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_AI_API_TOKEN not configured")
} else {
  total++
  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/${cfModel}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "Reply with just: OK" }], max_tokens: 10 }),
      signal: AbortSignal.timeout(15000),
    })
    const json = await res.json()
    if (!res.ok) {
      const msg = json?.errors?.[0]?.message?.slice(0, 100) || JSON.stringify(json).slice(0, 100)
      if (res.status === 429) { console.log(`⚠️  cloudflare[0] — rate limited (key valid): ${msg}`); passed++ }
      else { console.log(`❌ cloudflare[0] — HTTP ${res.status}: ${msg}`) }
    } else {
      console.log(`✅ cloudflare[0] (CLOUDFLARE_AI_API_TOKEN) — ${(json?.result?.response || "OK").slice(0, 50)}`)
      passed++
    }
  } catch (err) {
    console.log(`❌ cloudflare[0] — ${err.message}`)
  }
}

console.log(`\n${passed}/${total} keys OK`)
if (passed < total) process.exit(1)