# SEO Audit Report - Fanju (fanju.app)

## Executive Summary
This report documents the audit of current site pages based on the mandate to achieve top-3 rankings for "饭局" and "饭搭子". The current site relies on templated components (`HeroSection`, `MarketsSection`, etc.), leading to potential thin content issues across dynamic routes.

## Audit Findings (Sample)

### 1. Home Page (`/`)
- **Status:** Needs optimization.
- **Findings:**
  - Metadata is bare; missing Title/Description constraints.
  - Relying on component-driven content; need to ensure keywords ("饭局", "饭搭子", "约饭") are explicitly present in the DOM via H1 and static text.
  - FAQ and HowTo schemas are currently not visible in the component structure.

### 2. City Pages (`/city/[city]`)
- **Status:** High Risk (Potential templating).
- **Findings:**
  - Currently likely generating generic text based on `[city]` variable.
  - **Action Required:** Must inject real-world city data (commercial landmarks, local dietary habits, unique dining scenarios) as per mandate.

### 3. Article/Dynamic Pages (`/articles/[slug]`)
- **Status:** High Risk.
- **Findings:**
  - Content appears to be generated via `scripts/seo/generate-ai-seo-articles.mjs`.
  - Need to verify if the 3000+ generated articles meet the >300 word requirement and have >3 internal links per page.

## Action Plan
1. **Infrastructure:** Update `layout.tsx` to include default schema and metadata providers.
2. **Templating:** Refactor `scripts/seo/generate-ai-seo-articles.mjs` to inject unique, non-templated content.
3. **Internal Linking:** Create a robust internal link mapper that dynamically links pages based on keywords, ensuring no page is isolated.
4. **Content Quality:** Audit all 3000+ pages for word count and uniqueness (as requested in the directive).
