import { createSign } from "crypto"

const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
const SITE_URL = process.env.GSC_SITE_URL ?? "sc-domain:fanju.app"
const SITEMAP_URL = process.env.GSC_SITEMAP_URL ?? "https://fanju.app/sitemap-index.xml"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const SCOPE = "https://www.googleapis.com/auth/webmasters"

if (!SERVICE_ACCOUNT_JSON) {
  console.log("GOOGLE_SERVICE_ACCOUNT_JSON is not set. Skipping Google sitemap submission.")
  process.exit(0)
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function signJwt(serviceAccount) {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "RS256", typ: "JWT" }
  const claim = {
    iss: serviceAccount.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`
  const signer = createSign("RSA-SHA256")
  signer.update(unsigned)
  signer.end()
  const signature = signer
    .sign(serviceAccount.private_key)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")

  return `${unsigned}.${signature}`
}

let serviceAccount
try {
  serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON)
} catch (err) {
  console.error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.")
  console.error(err.message)
  process.exit(1)
}

if (!serviceAccount.client_email || !serviceAccount.private_key) {
  console.error("GOOGLE_SERVICE_ACCOUNT_JSON must include client_email and private_key.")
  process.exit(1)
}

const assertion = signJwt(serviceAccount)
const tokenRes = await fetch(TOKEN_URL, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  }),
})

const tokenPayload = await tokenRes.json().catch(() => ({}))
if (!tokenRes.ok || !tokenPayload.access_token) {
  console.error("Failed to obtain Google OAuth token.")
  console.error(JSON.stringify(tokenPayload, null, 2))
  process.exit(1)
}

const submitUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`
const submitRes = await fetch(submitUrl, {
  method: "PUT",
  headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
})

const text = await submitRes.text()
console.log(`Google sitemap submit: ${submitRes.status} ${submitRes.statusText}`)
if (text) console.log(text)

if (!submitRes.ok) {
  console.error(`Make sure ${serviceAccount.client_email} is added to Google Search Console for ${SITE_URL}.`)
  process.exit(1)
}

console.log(`Submitted ${SITEMAP_URL} for ${SITE_URL}.`)
