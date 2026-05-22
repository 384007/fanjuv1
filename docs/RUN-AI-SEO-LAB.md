# Run Fanju AI SEO Lab

This runbook keeps all secrets in Modal `custom-secret` and keeps public SEO pages free of implementation details.

## Non-negotiables

- Do not put cookies, API keys, tokens, or deploy hooks in code, `.env`, GitHub Secrets, or Cloudflare Pages env.
- Store every secret used by the lab in Modal Secret `custom-secret`.
- Use `python3 -m modal ...` for Modal commands.
- Do not run Modal with a framework path such as `/Library/Frameworks/Python.framework/Versions/3.13/bin/modal run ...`.
- `run_once` commits generated `content/seo-ready` Markdown to GitHub `main`, triggers Cloudflare Pages when configured, waits for live checks, then submits links.

## Required Modal Secret

Create or update Modal Secret `custom-secret` with key names only as needed:

### Core

- `GITHUB_TOKEN` or `GH_TOKEN`: required for production publishing to GitHub `main`.
- `GITHUB_REPOSITORY` or `GITHUB_REPO`: optional; defaults to `384007/fanjuv1`.
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_AUTH_TOKEN`
- `CLOUDFLARE_AI_API_TOKEN` when Cloudflare AI is used.
- `CF_PAGES_DEPLOY_HOOK`: optional. If missing, Modal prints `skipping Pages deploy trigger` and the run manifest records `pagesDeploy.status = skipped`.

### AI Providers

Configured key counts are checked for:

- `GROQ_API_KEY`, `GROQ_API_KEY_2` ... `GROQ_API_KEY_10`
- `CEREBRAS_API_KEY`, `CEREBRAS_API_KEY_2` ...
- `NVIDIA_API_KEY`, `NVIDIA_API_KEY_2` ...
- `GEMINI_API_KEY`, `GEMINI_API_KEY_2` ...
- `OPENROUTER_API_KEY`, `OPENROUTER_API_KEY_2` ...

### Cookie Platforms

Cookies are base64-encoded Playwright cookie arrays:

- `ZHIHU_COOKIES`
- `CSDN_COOKIES`
- `JUEJIN_COOKIES`
- `JIANSHU_COOKIES`
- `WEIBO_COOKIES`
- `XIAOHONGSHU_COOKIES`
- `DOUBAN_COOKIES`
- `TOUTIAO_COOKIES`
- `BAIJIAHAO_COOKIES`
- `BILIBILI_COOKIES`

### API-Key Platforms

- Dev.to: `DEVTO_API_KEY`
- Hashnode: `HASHNODE_API_KEY`, `HASHNODE_PUBLICATION_ID`
- Medium: `MEDIUM_API_KEY`
- Bluesky: `BLUESKY_IDENTIFIER`, `BLUESKY_APP_PASSWORD`
- Reddit: `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`, optional `REDDIT_SUBREDDIT`

## Health Checks

Run these from the repository root:

```bash
python3 -m modal run modal_growth_agent.py::check_keys
python3 -m modal run modal_growth_agent.py::health_check
python3 -m modal run modal_growth_agent.py::test_keys
```

`check_keys` and `health_check` print counts and configured key names only. They never print secret values or cookie contents.

The health report confirms:

- AI key counts.
- GitHub token presence.
- Cloudflare account/token presence.
- Which cookie/API-key platforms are configured.

## Deploy Modal Apps

```bash
python3 -m modal deploy modal_growth_agent.py
python3 -m modal deploy modal/lab_worker.py
```

The apps must use:

- `fanju-growth-agent` with `modal.Secret.from_name("custom-secret")`
- `fanju-lab-worker` with `modal.Secret.from_name("custom-secret")`

## Test Cookies

Deploy `modal/lab_worker.py`, then use either the admin UI or direct Worker routes:

- Admin: `/admin/lab/platform-accounts`
- Single platform: `POST /api/lab/check-cookie` with `{ "platform": "zhihu" }`
- All active platforms: `POST /api/lab/validate-all-cookies`

Frontend status meanings:

- `Not Set`: Modal reported the cookie/API credential is not present in `custom-secret`.
- `Expired`: credential exists but validation failed.
- `Valid`: validation succeeded.
- `Unknown`: Modal was not reachable or `MODAL_BASE_URL` is not configured.

Only short errors are shown. Cookie values are never returned to the frontend.

## Run One Production Publish

This command generates strict articles, commits ready Markdown to GitHub `main`, waits for Cloudflare live checks, writes a run manifest, and submits live article URLs:

```bash
python3 -m modal run modal_growth_agent.py::run_once --rounds 1 --run-limit 6 --upload-r2 true --submit-platforms all
```

The production chain runs:

```bash
pnpm seo:routes
pnpm seo:prompt-bank
pnpm seo:prompt-bank:check
pnpm seo:prompt-bank:cloudflare
pnpm seo:cloudflare:submit
```

Quality gates in the Modal run:

- `MIN_SCORE=90`
- `STRICT_PUBLISH=1`
- `AUTO_REPAIR_ARTICLE=1`
- ready source files must exist in `content/seo-ready`
- canonical route must match the generated route
- public metadata is checked for implementation leaks
- live article and live sitemap checks must pass before platform submission

If `GITHUB_TOKEN` / `GH_TOKEN` is missing, the run fails before committing. If `CF_PAGES_DEPLOY_HOOK` is missing, the run records deploy hook as skipped instead of pretending it triggered.

## Run Manifest

Modal writes `/outputs/<runId>/run-manifest.json` with:

- `runId`
- `routes`
- `commitSha` and `commitShas`
- `liveCheckPassed`
- `submittedPlatforms`
- `failedPlatforms`
- `failedReasons`
- per-round `pagesDeploy`, live-check, and submission report fields

## Supported Platforms

Lab publish adapters currently exist for:

`zhihu`, `csdn`, `juejin`, `jianshu`, `weibo`, `xiaohongshu`, `douban`, `toutiao`, `baijiahao`, `bilibili`, `devto`, `hashnode`, `medium`, `bluesky`, `reddit`.

Production link submission currently supports:

`indexnow`, `baidu`, `gist`, `devto`, `bluesky`, `wordpress`.

Do not list unsupported platforms as successful. Any future platform without an adapter must stay disabled / adapter missing.

## Local Acceptance

```bash
pnpm lint
pnpm build
pnpm seo:routes
pnpm seo:prompt-bank:check
python3 -m modal run modal_growth_agent.py::check_keys
python3 -m modal run modal_growth_agent.py::test_keys
python3 -m modal run modal_growth_agent.py::run_once --rounds 1 --run-limit 6 --upload-r2 true --submit-platforms all
```

Run the final `run_once` only when production publishing to GitHub `main` is intended.
