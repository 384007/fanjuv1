import { finishApiResult, isDryRun, loadSocialPack, postJson, printDryRun, selectPost, skip } from "./fanju-publish-utils.mjs"

const pack = await loadSocialPack()
const post = selectPost(pack)
const rawToken = process.env.HASHNODE_TOKEN
const authHeader = rawToken?.startsWith("Bearer ") ? rawToken : `Bearer ${rawToken}`

if (isDryRun()) {
  printDryRun("Hashnode", {
    title: post.publishTitle,
    canonicalUrl: post.canonicalUrl,
    urlCount: 1,
    bilingualArticlePreview: `${post.hashnode.en.slice(0, 300)}\n...\n${post.hashnode.zh.slice(0, 300)}`,
    payloadSummary: {
      hasPublicationId: Boolean(process.env.HASHNODE_PUBLICATION_ID),
      contentChars: post.hashnode.bilingual.length,
      tags: ["social-dining", "community", "networking"],
    },
  })
  process.exit(0)
}

if (!rawToken) skip("HASHNODE_TOKEN is not configured.")

// Hashnode GraphQL API requires a paid plan as of 2025.
// Test if the API is accessible before proceeding.
const testRes = await fetch("https://gql.hashnode.com", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: authHeader },
  body: JSON.stringify({ query: "{ __typename }" }),
})
const testText = await testRes.text()
if (!testRes.ok || testText.trim().startsWith("<")) {
  console.log("SKIP: Hashnode GraphQL API is not accessible (may require a paid plan). See: https://hashnode.com/announcements/graphql-api")
  process.exit(0)
}

async function resolvePublicationId() {
  if (process.env.HASHNODE_PUBLICATION_ID) return process.env.HASHNODE_PUBLICATION_ID

  const { res, body } = await postJson("https://gql.hashnode.com", {
    method: "POST",
    headers: { Authorization: authHeader },
    body: JSON.stringify({
      query: `query Me { me { publications(first: 1) { edges { node { id title url } } } } }`,
    }),
  })

  if (!res.ok || body?.errors?.length) {
    console.log("Could not resolve a Hashnode publication from HASHNODE_TOKEN.")
    if (body?.errors) console.log(JSON.stringify(body.errors, null, 2))
    return undefined
  }

  return body?.data?.me?.publications?.edges?.[0]?.node?.id
}

const publicationId = await resolvePublicationId()
if (!publicationId) skip("No Hashnode publication found. Set HASHNODE_PUBLICATION_ID to enable Hashnode publishing.")

const query = `
mutation PublishPost($input: PublishPostInput!) {
  publishPost(input: $input) {
    post {
      id
      url
      title
    }
  }
}
`

const { res, body } = await postJson("https://gql.hashnode.com", {
  method: "POST",
  headers: { Authorization: authHeader },
  body: JSON.stringify({
    query,
    variables: {
      input: {
        publicationId,
        title: post.publishTitle,
        contentMarkdown: post.hashnode.bilingual,
        originalArticleURL: post.canonicalUrl,
        tags: [
          { name: "Social Dining", slug: "social-dining" },
          { name: "Community", slug: "community" },
          { name: "Networking", slug: "networking" },
        ],
        publishedAt: process.env.PUBLISH_LIVE === "1" ? new Date().toISOString() : undefined,
      },
    },
  }),
})

finishApiResult("Hashnode", res, body)
