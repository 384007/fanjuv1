# Modal Growth Pipeline Without GitHub Runtime Dependency

This pipeline packages the current project into the Modal image at deploy time. Modal runtime jobs do not clone, pull, push, commit, or require `GITHUB_TOKEN`.

Generated results are saved in the `fanju-growth-output` Modal Volume under `latest/` and timestamped run directories.

## Deploy

```bash
python3 -m modal deploy modal_growth_agent.py
```

## Run once

```bash
python3 -m modal run modal_growth_agent.py::run_once
```

## View latest output

```bash
python3 -m modal run modal_growth_agent.py::list_outputs
```

## Download latest archive

```bash
python3 -m modal volume get fanju-growth-output latest/fanju-seo-output-latest.tar.gz ./fanju-seo-output-latest.tar.gz
```

## Configure AI secrets

```bash
python3 -m modal secret create custom-secret \
  CEREBRAS_API_KEY="xxx" \
  GROQ_API_KEY="xxx" \
  CLOUDFLARE_ACCOUNT_ID="xxx" \
  CLOUDFLARE_API_TOKEN="xxx" \
  GEMINI_API_KEY="xxx" \
  NVIDIA_API_KEY="xxx" \
  --force
```

## Runtime behavior

Modal runtime uses only the project code packaged during `modal deploy`. It does not clone, pull, push, commit, or need `GITHUB_TOKEN`.

The generation flow runs `pnpm seo:ready:bilingual`, then writes generated articles, drafts, SEO data, built SEO output, sitemaps, a manifest, and a tarball into the `fanju-growth-output` Volume.

If generated output should later be published to fanju.app, use Cloudflare Pages Direct Upload, R2, a CMS API, or a separate publishing process. Modal should not publish by pushing to GitHub.
