# Modal Growth Pipeline Through GitHub Main

Modal is the only runtime publisher. It generates article Markdown, writes the D1 index, commits `content/seo-ready/*.md` to GitHub `main`, then waits for Cloudflare Pages to build from that branch.

Do not add GitHub Actions for this flow. Cloudflare Pages owns build, sitemap generation, and deploy after it observes the `main` push.

## Required Modal Secret

```bash
python3 -m modal secret create custom-secret \
  GITHUB_TOKEN="xxx" \
  GITHUB_REPOSITORY="384007/fanjuv1" \
  CEREBRAS_API_KEY="xxx" \
  GROQ_API_KEY="xxx" \
  CLOUDFLARE_ACCOUNT_ID="xxx" \
  CLOUDFLARE_API_TOKEN="xxx" \
  CLOUDFLARE_D1_DATABASE_ID="58d63133-adeb-4efd-b9eb-a9b056271ca5" \
  CLOUDFLARE_R2_BUCKET="fanju-articles-prod" \
  GEMINI_API_KEY="xxx" \
  NVIDIA_API_KEY="xxx" \
  --force
```

## Deploy Modal

```bash
python3 -m modal deploy modal_growth_agent.py
```

## Run Production

```bash
python3 -m modal run modal_growth_agent.py::run_once --rounds 2 --run-limit 2 --submit-platforms all
```

Each round:

1. Rebuilds the route manifest and prompt bank.
2. Generates only real provider output that passes strict article checks.
3. Writes source Markdown under `content/seo-ready/`.
4. Upserts D1 index rows with `source_path`.
5. Runs `pnpm build` locally.
6. Commits and pushes only `content/seo-ready` to `main`.
7. Waits until `fanju.app` article pages return 200, have enough rendered content, have no bad public phrases, and internal links return non-4xx.
8. Waits until live sitemap files contain the new routes.
9. Submits the verified URLs through the configured indexing platforms.

