import { existsSync, mkdirSync, unlinkSync } from "fs"
import { dirname, extname, join } from "path"
import { abs, loadValidInternalUrls, readJson, walk, writeJson } from "./_content-factory-runtime.mjs"
import { normalizePath } from "./_content-factory-catalog.mjs"

const INPUT_DIRS = [
  abs("content/articles/ready/index"),
  abs("content/articles/ready/noindex"),
]
const REJECTED_DIR = abs("content/articles/rejected")

function collectArticleLinks(article) {
  const links = []
  for (const item of article.internalLinks || []) links.push({ owner: item, key: "url", url: item.url })
  for (const section of article.sections || []) {
    if (!Array.isArray(section.links)) section.links = []
    for (const url of section.links) links.push({ owner: section.links, key: null, url })
  }
  for (const item of article.faq || []) {
    for (const match of String(`${item.question} ${item.answer}`).matchAll(/https?:\/\/fanju\.app[^\s)]+|\/[a-z0-9][a-z0-9/-]*/gi)) {
      links.push({ owner: null, key: null, url: match[0] })
    }
  }
  for (const item of article.breadcrumbs || []) links.push({ owner: item, key: "url", url: item.url })
  for (const item of article.hreflang || []) links.push({ owner: item, key: "url", url: item.url || item.href })
  if (article.cta?.url) links.push({ owner: article.cta, key: "url", url: article.cta.url })
  if (article.canonicalPath) links.push({ owner: article, key: "canonicalPath", url: article.canonicalPath })
  return links
}

function audit(article, validUrls) {
  const invalidLinks = []
  const removedLinks = []
  const validLinks = []

  for (const entry of collectArticleLinks(article)) {
    const path = normalizePath(entry.url || "")
    if (!path) continue
    const isCanonical = path === normalizePath(article.canonicalPath)
    if (validUrls.has(path) || isCanonical) {
      validLinks.push(path)
      continue
    }
    invalidLinks.push(path)
    if (entry.owner && entry.key) {
      entry.owner[entry.key] = ""
      removedLinks.push(path)
    }
  }

  if (Array.isArray(article.internalLinks)) {
    article.internalLinks = article.internalLinks.filter((link) => link.url && validUrls.has(normalizePath(link.url)))
  }
  for (const section of article.sections || []) {
    if (Array.isArray(section.links)) {
      section.links = section.links.filter((url) => validUrls.has(normalizePath(url)))
    }
  }
  if (Array.isArray(article.breadcrumbs)) {
    article.breadcrumbs = article.breadcrumbs.filter((item) => item.url === article.canonicalPath || validUrls.has(normalizePath(item.url)))
  }
  if (article.cta?.url && !validUrls.has(normalizePath(article.cta.url))) {
    removedLinks.push(article.cta.url)
    article.cta = undefined
  }

  const uniqueValid = [...new Set(validLinks.filter((url) => url !== article.canonicalPath))]
  let status = invalidLinks.length ? "fixed" : "pass"
  if (uniqueValid.length < 3) {
    article.status = "noindex"
    article.robots = "noindex,follow"
    article.sitemapEligible = false
    status = "noindex"
  }
  if (!article.canonicalPath || invalidLinks.includes(normalizePath(article.canonicalPath))) {
    article.status = "reject"
    article.robots = "noindex,follow"
    article.sitemapEligible = false
    status = "reject"
  }

  article.audit = {
    ...(article.audit || {}),
    linkAudit: {
      status,
      invalidLinks: [...new Set(invalidLinks)],
      removedLinks: [...new Set(removedLinks)],
      validLinks: uniqueValid,
      redirectLinks: [],
      noindexLinks: [],
    },
  }
  return article.audit.linkAudit
}

function destinationFor(article, file) {
  const name = file.split("/").pop()
  if (article.status === "publish") return abs("content/articles/ready/index", name)
  if (article.status === "noindex") return abs("content/articles/ready/noindex", name)
  return join(REJECTED_DIR, name)
}

const validUrls = loadValidInternalUrls()
const report = {
  status: "pass",
  scanned: 0,
  invalidLinks: [],
  removedLinks: [],
  fixed: 0,
  noindex: 0,
  reject: 0,
  validLinks: [],
}

for (const dir of INPUT_DIRS) {
  for (const file of walk(dir)) {
    if (extname(file) !== ".json") continue
    const article = readJson(file)
    if (!article) continue
    const before = article.status
    const linkReport = audit(article, validUrls)
    const dest = destinationFor(article, file)
    writeJson(dest, article)
    if (dest !== file && existsSync(file)) {
      mkdirSync(dirname(dest), { recursive: true })
      try { unlinkSync(file) } catch { /* non-fatal */ }
    }
    report.scanned++
    report.invalidLinks.push(...linkReport.invalidLinks)
    report.removedLinks.push(...linkReport.removedLinks)
    report.validLinks.push(...linkReport.validLinks)
    if (linkReport.status === "fixed") report.fixed++
    if (article.status === "noindex" && before !== "noindex") report.noindex++
    if (article.status === "reject") report.reject++
  }
}

report.invalidLinks = [...new Set(report.invalidLinks)]
report.removedLinks = [...new Set(report.removedLinks)]
report.validLinks = [...new Set(report.validLinks)]
report.status = report.reject ? "reject" : report.noindex ? "noindex" : report.fixed ? "fixed" : "pass"
writeJson(abs("data/seo/link-audit-report.json"), report)

console.log(`linkAuditStatus=${report.status}`)
console.log(`scanned=${report.scanned}`)
console.log(`invalidLinks=${report.invalidLinks.length}`)
console.log(`removedLinks=${report.removedLinks.length}`)
console.log(`noindex=${report.noindex}`)
console.log(`reject=${report.reject}`)
