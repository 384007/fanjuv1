export type ArticleIndexDecision = "index" | "noindex" | "reject"

export type ArticleLike = {
  status?: string
  robots?: string
  language?: string
  title?: string
  canonicalPath?: string
  directAnswer?: string
  searchIntent?: string
  targetAudience?: string
  fanjuAngle?: string
  sections?: { h2?: string; body?: string; links?: unknown[] }[]
  internalLinks?: { url?: string }[]
  qualityChecklist?: Record<string, boolean>
}

export type ArticleAudits = {
  qualityScore?: number
  invalidLinks?: string[]
  duplicateScore?: number
  hasFabricatedClaims?: boolean
  hasFanjuScenario?: boolean
  wordCount?: number
  sitemapEligible?: boolean
}

export type ArticleIndexDecisionResult = {
  decision: ArticleIndexDecision
  robots: "index,follow" | "noindex,follow"
  sitemapEligible: boolean
  reasons: string[]
}

const HARD_REJECT_RE =
  /保证脱单|保证成交|保证融资|保证收益|稳赚|必赚|100%成功|官方认证|上万人参加|媒体报道|合作餐厅|赌场|赌博|PUA|性暗示/i

function articleText(article: ArticleLike) {
  return [
    article.title,
    article.directAnswer,
    article.searchIntent,
    article.targetAudience,
    ...(article.sections || []).flatMap((section) => [section.h2, section.body]),
  ]
    .filter(Boolean)
    .join("\n")
}

function estimateLength(article: ArticleLike) {
  const text = articleText(article)
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length
  if (cjk > 0) return cjk
  return text.split(/\s+/).filter(Boolean).length
}

export function shouldIndexArticle(article: ArticleLike, audits: ArticleAudits = {}): ArticleIndexDecisionResult {
  const reasons: string[] = []
  const text = articleText(article)
  const qualityScore = audits.qualityScore ?? 0
  const length = audits.wordCount ?? estimateLength(article)

  if ((audits.invalidLinks || []).length > 0) {
    return {
      decision: "reject",
      robots: "noindex,follow",
      sitemapEligible: false,
      reasons: ["internal_links_invalid", ...audits.invalidLinks!.slice(0, 5)],
    }
  }

  if (audits.hasFabricatedClaims || HARD_REJECT_RE.test(text)) {
    return {
      decision: "reject",
      robots: "noindex,follow",
      sitemapEligible: false,
      reasons: ["fabricated_or_forbidden_claim"],
    }
  }

  const checklist = article.qualityChecklist || {}
  if (audits.hasFanjuScenario === false || checklist.hasFanjuConnection === false || checklist.hasSpecificScenario === false) {
    return {
      decision: "reject",
      robots: "noindex,follow",
      sitemapEligible: false,
      reasons: ["missing_fanju_dinner_scenario"],
    }
  }

  if ((audits.duplicateScore ?? 0) >= 0.82 || checklist.notTemplateSwap === false) {
    return {
      decision: "reject",
      robots: "noindex,follow",
      sitemapEligible: false,
      reasons: ["duplicate_or_template_swap"],
    }
  }

  const minLength = article.language === "en" ? 1000 : 1400
  if (length < minLength) {
    reasons.push(`content_too_short:${length}<${minLength}`)
    if (length < minLength * 0.65) {
      return {
        decision: "reject",
        robots: "noindex,follow",
        sitemapEligible: false,
        reasons,
      }
    }
  }

  if (qualityScore >= 43 && reasons.length === 0) {
    return {
      decision: "index",
      robots: "index,follow",
      sitemapEligible: audits.sitemapEligible !== false,
      reasons: ["quality_score_indexable"],
    }
  }

  if (qualityScore >= 34) {
    return {
      decision: "noindex",
      robots: "noindex,follow",
      sitemapEligible: false,
      reasons: reasons.length ? reasons : ["quality_score_needs_more_depth"],
    }
  }

  return {
    decision: "reject",
    robots: "noindex,follow",
    sitemapEligible: false,
    reasons: reasons.length ? reasons : ["quality_score_reject"],
  }
}
