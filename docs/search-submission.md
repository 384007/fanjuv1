# Search Submission

## Google

Google Search Console has submitted these sitemap files:

- `https://fanju.app/sitemap-index.xml`
- `https://fanju.app/sitemap.xml`
- `https://fanju.app/product-sitemap.xml`

Do not use the Google Indexing API for normal Fanju pages. For priority pages, use URL Inspection in Google Search Console and click **Request indexing** manually.

## Baidu

Baidu Search Resource Platform should submit:

- `https://fanju.app/sitemap.xml`
- `https://fanju.app/product-sitemap.xml`

Do not submit `https://fanju.app/sitemap-index.xml` to Baidu.

Store the full Baidu push API URL in GitHub Secrets as `BAIDU_API`. Do not commit the token or print it in logs.

Run locally with:

```bash
BAIDU_API="..." pnpm submit:baidu
```
