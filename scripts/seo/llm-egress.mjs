import { fileURLToPath } from "node:url"

/**
 * Multi-vendor egress routing — kept in sync with patentpaper/modal/llm_client.py
 *
 * key_1 → direct official API base (no ?k=)
 * key_2 → Cloudflare Worker proxy (?k=CF_PROXY_ACCESS_KEY)
 * key_3 → Deno proxy (?k=CF_PROXY_ACCESS_KEY)
 * key_4 → Vercel proxy (?k=CF_PROXY_ACCESS_KEY)
 * key_5 → Cerebras: CF Worker (extra parallel lane); others: direct unless override
 * key_6+ → direct unless {VENDOR}_EGRESS_N_BASE override
 */

const VENDOR_ENV_PREFIX = {
  gemini: "GEMINI",
  cerebras: "CEREBRAS",
  groq: "GROQ",
  nvidia: "NVIDIA",
  mistral: "MISTRAL",
}

const DIRECT_BASE = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
  cerebras: "https://api.cerebras.ai/v1",
  groq: "https://api.groq.com/openai/v1",
  nvidia: "https://integrate.api.nvidia.com/v1",
  mistral: "https://api.mistral.ai/v1",
}

const PROXY_PATH = {
  gemini: "/gemini/v1beta/openai",
  cerebras: "/cerebras/v1",
  groq: "/groq/v1",
  nvidia: "/nvidia/v1",
  mistral: "/mistral/v1",
}

/** @typedef {{ vendor: string, slot: number, key: string, keyEnv: string, baseUrl: string, viaProxy: boolean, egressKind: string }} EgressInfo */

export function cfProxyHost() {
  return (process.env.CF_PROXY_BASE_URL || "https://blue-forest-06e3.b384001.workers.dev").replace(/\/$/, "")
}

export function denoProxyHost() {
  return (process.env.DENO_PROXY_BASE_URL || "https://daring-okapi-27.b384001.deno.net").replace(/\/$/, "")
}

export function vercelProxyHost() {
  return (process.env.VERCEL_PROXY_BASE_URL || "https://v1-gamma-sandy.vercel.app").replace(/\/$/, "")
}

export function proxyAccessKey() {
  return (process.env.CF_PROXY_ACCESS_KEY || "").trim()
}

function vendorPrefix(vendor) {
  const v = String(vendor || "").trim().toLowerCase()
  const p = VENDOR_ENV_PREFIX[v]
  if (!p) throw new Error(`unsupported_vendor:${vendor}`)
  return p
}

function keyEnvCandidates(vendor, slot) {
  const p = vendorPrefix(vendor)
  const names = [`${p}_KEY_${slot}`]
  if (slot === 1) names.push(`${p}_API_KEY`)
  else names.push(`${p}_API_KEY_${slot}`)
  return names
}

export function readVendorKey(vendor, slot) {
  for (const envName of keyEnvCandidates(vendor, slot)) {
    const val = (process.env[envName] || "").trim()
    if (val) return { key: val, keyEnv: envName }
  }
  return { key: "", keyEnv: "" }
}

export function directBaseUrl(vendor) {
  const v = String(vendor || "").trim().toLowerCase()
  const p = vendorPrefix(v)
  const override = (process.env[`${p}_DIRECT_BASE`] || "").trim()
  if (override) return override.replace(/\/$/, "")
  return DIRECT_BASE[v].replace(/\/$/, "")
}

function cfProxyBaseUrl(vendor) {
  const v = String(vendor || "").trim().toLowerCase()
  const p = vendorPrefix(v)
  const override = (process.env[`${p}_PROXY_BASE`] || "").trim()
  if (override) return override.replace(/\/$/, "")
  return `${cfProxyHost()}${PROXY_PATH[v]}`.replace(/\/$/, "")
}

function denoProxyBaseUrl(vendor) {
  const v = String(vendor || "").trim().toLowerCase()
  const p = vendorPrefix(v)
  const override = (process.env[`${p}_DENO_PROXY_BASE`] || "").trim()
  if (override) return override.replace(/\/$/, "")
  return `${denoProxyHost()}${PROXY_PATH[v]}`.replace(/\/$/, "")
}

function vercelProxyBaseUrl(vendor) {
  const v = String(vendor || "").trim().toLowerCase()
  const p = vendorPrefix(v)
  const override = (process.env[`${p}_VERCEL_PROXY_BASE`] || "").trim()
  if (override) return override.replace(/\/$/, "")
  return `${vercelProxyHost()}${PROXY_PATH[v]}`.replace(/\/$/, "")
}

function hostInUrl(host, url) {
  return url.includes(host.replace(/^https?:\/\//, ""))
}

export function egressKind(baseUrl, viaProxy) {
  if (!viaProxy) return "direct"
  if (hostInUrl(denoProxyHost(), baseUrl)) return "deno_proxy"
  if (hostInUrl(cfProxyHost(), baseUrl)) return "cf_worker"
  if (hostInUrl(vercelProxyHost(), baseUrl)) return "vercel_proxy"
  return "proxy"
}

/** @returns {{ baseUrl: string, viaProxy: boolean }} */
export function egressBaseForSlot(vendor, slot) {
  const v = String(vendor || "").trim().toLowerCase()
  if (slot === 1) return { baseUrl: directBaseUrl(v), viaProxy: false }
  if (slot === 2) return { baseUrl: cfProxyBaseUrl(v), viaProxy: true }
  if (slot === 3) return { baseUrl: denoProxyBaseUrl(v), viaProxy: true }
  if (slot === 4) return { baseUrl: vercelProxyBaseUrl(v), viaProxy: true }
  if (slot === 5 && v === "cerebras") return { baseUrl: cfProxyBaseUrl(v), viaProxy: true }

  const p = vendorPrefix(v)
  const custom = (process.env[`${p}_EGRESS_${slot}_BASE`] || "").trim().replace(/\/$/, "")
  if (custom) {
    const viaFlag = (process.env[`${p}_EGRESS_${slot}_VIA_PROXY`] || "").trim().toLowerCase()
    const via =
      viaFlag === "1" || viaFlag === "true" || viaFlag === "yes" ||
      hostInUrl(cfProxyHost(), custom) ||
      hostInUrl(denoProxyHost(), custom) ||
      hostInUrl(vercelProxyHost(), custom)
    return { baseUrl: custom, viaProxy: via }
  }
  return { baseUrl: directBaseUrl(v), viaProxy: false }
}

export function chatCompletionsUrl(baseUrl, viaProxy) {
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/chat/completions`)
  if (viaProxy) {
    const k = proxyAccessKey()
    if (!k) throw new Error("CF_PROXY_ACCESS_KEY missing for proxy egress")
    url.searchParams.set("k", k)
  }
  return url.toString()
}

/** keyIndex is 0-based (ai-router array index); slot = keyIndex + 1 */
export function chatEndpointForKeyIndex(vendor, keyIndex) {
  const slot = keyIndex + 1
  return chatEndpointForSlot(vendor, slot)
}

export function chatEndpointForSlot(vendor, slot) {
  const { baseUrl, viaProxy } = egressBaseForSlot(vendor, slot)
  return {
    slot,
    baseUrl,
    viaProxy,
    egressKind: egressKind(baseUrl, viaProxy),
    endpoint: chatCompletionsUrl(baseUrl, viaProxy),
    label: `${vendor}:key_${slot}`,
  }
}

/** All configured keys for a vendor (slot 1..N). */
export function getVendorKeys(vendor) {
  const keys = []
  for (let slot = 1; slot <= 20; slot++) {
    const { key, keyEnv } = readVendorKey(vendor, slot)
    if (!key) break
    keys.push({ slot, key, keyEnv })
  }
  return keys
}

/** @returns {EgressInfo[]} */
export function listEgresses(vendor) {
  return getVendorKeys(vendor).map(({ slot, key, keyEnv }) => {
    const { baseUrl, viaProxy } = egressBaseForSlot(vendor, slot)
    return {
      vendor,
      slot,
      key,
      keyEnv,
      baseUrl,
      viaProxy,
      egressKind: egressKind(baseUrl, viaProxy),
    }
  })
}

export function listAllEgresses(vendors = Object.keys(VENDOR_ENV_PREFIX)) {
  const out = {}
  for (const vendor of vendors) {
    out[vendor] = listEgresses(vendor).map((row) => ({
      slot: row.slot,
      label: `${vendor}:key_${row.slot}`,
      key_env: row.keyEnv,
      base_url: row.baseUrl,
      via_proxy: row.viaProxy,
      egress_kind: row.egressKind,
      has_key: Boolean(row.key),
      warn: row.viaProxy && !proxyAccessKey() ? "CF_PROXY_ACCESS_KEY missing" : undefined,
    }))
  }
  return out
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(listAllEgresses(), null, 2))
}