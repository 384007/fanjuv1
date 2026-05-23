import { cloneElement, isValidElement, type AnchorHTMLAttributes, type ReactElement, type ReactNode } from "react"

type HrefObject = {
  pathname?: string
  query?: Record<string, string | number | boolean | null | undefined>
  hash?: string
}

type StaticLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | HrefObject
  as?: string | HrefObject
  children?: ReactNode
  legacyBehavior?: boolean
  onNavigate?: unknown
  passHref?: boolean
  prefetch?: boolean | null
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
}

function formatHref(value: string | HrefObject) {
  if (typeof value === "string") return value

  const pathname = value.pathname || "/"
  const query = value.query
    ? new URLSearchParams(
        Object.entries(value.query)
          .filter(([, item]) => item !== null && item !== undefined)
          .map(([key, item]) => [key, String(item)]),
      ).toString()
    : ""
  const hash = value.hash ? (value.hash.startsWith("#") ? value.hash : `#${value.hash}`) : ""

  return `${pathname}${query ? `?${query}` : ""}${hash}`
}

export default function StaticLink({
  as,
  children,
  href,
  legacyBehavior,
  onNavigate: _onNavigate,
  passHref: _passHref,
  prefetch: _prefetch,
  replace: _replace,
  scroll: _scroll,
  shallow: _shallow,
  ...props
}: StaticLinkProps) {
  const finalHref = formatHref(as ?? href)

  if (legacyBehavior && isValidElement(children)) {
    return cloneElement(children as ReactElement<AnchorHTMLAttributes<HTMLAnchorElement>>, {
      ...props,
      href: finalHref,
    })
  }

  return (
    <a href={finalHref} {...props}>
      {children}
    </a>
  )
}
