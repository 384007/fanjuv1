# Cloudflare Pages deploy

This repo is configured for static export to avoid the free Workers 3 MiB limit.

## Build settings

Build command:

```bash
pnpm run build
```

Output directory is controlled by `wrangler.toml`:

```toml
pages_build_output_dir = "out"
```

If the Cloudflare UI output directory is greyed out, keep it as-is and let `wrangler.toml` control the output directory.

Do not use:

```bash
pnpm dlx @cloudflare/next-on-pages@1
```

That command creates Pages Functions / Worker output and can exceed the 3 MiB free-plan Worker size limit.

## Backend

The backend is not deployed on Cloudflare Pages Functions.
Use Modal instead:

```bash
pip install modal
modal setup
pnpm modal:deploy
```

Then set this environment variable in Cloudflare Pages if you want live backend calls:

```text
NEXT_PUBLIC_FANJU_API_BASE=https://your-modal-endpoint.modal.run
```

Without that variable, the site uses static/demo responses and still builds as a static site.
