const SITE_URL = "https://fanju.app"

/** Returns absolute canonical URL for a given path */
export function canonicalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  const clean = normalized.endsWith("/") && normalized.length > 1 ? normalized.slice(0, -1) : normalized
  return `${SITE_URL}${clean}`
}

/** Returns the alternate-language path */
export function alternatePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  const clean = normalized.endsWith("/") && normalized.length > 1 ? normalized.slice(0, -1) : normalized
  return clean.startsWith("/en/") ? clean.slice(3) : `/en${clean}`
}

/** Returns hreflang alternates object for Next.js metadata */
export function hreflangAlternates(currentPath: string) {
  const clean = currentPath.startsWith("/") ? currentPath : `/${currentPath}`
  const isEn = clean.startsWith("/en/")
  const enPath = isEn ? clean : `/en${clean}`
  const zhPath = isEn ? clean.slice(3) : clean

  return {
    canonical: canonicalUrl(currentPath),
    languages: {
      "zh": canonicalUrl(zhPath),
      "en": canonicalUrl(enPath),
      "x-default": canonicalUrl(enPath),
    },
  }
}

export { SITE_URL }
