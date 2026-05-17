from __future__ import annotations

import json
import shutil
import subprocess
import tarfile
from datetime import datetime, timezone
from pathlib import Path

import modal

app = modal.App("fanju-growth-agent")
legacy_secret = modal.Secret.from_name("custom-secret")

APP_DIR = "/app"
WORKDIR = "/tmp/fanju-run"
OUTPUT_ROOT = "/outputs"

OUTPUT_PATHS = [
    "content/seo-ready",
    "content/seo-ai-drafts",
    "data/seo",
    "dist/seo",
    "public/sitemap.xml",
    "public/sitemap-index.xml",
]

image = (
    modal.Image.debian_slim()
    .apt_install("curl", "ca-certificates")
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -",
        "apt-get install -y nodejs",
        "npm i -g pnpm@9.15.9",
    )
    .add_local_dir(
        ".",
        APP_DIR,
        copy=True,
        ignore=[
            ".git",
            "node_modules",
            ".next",
            "dist",
            ".turbo",
            ".vercel",
            ".wrangler",
            ".env",
            ".env.*",
            "content/seo-ai-drafts",
            "content/seo-ready",
            "content/seo-published",
            "public/sitemap.xml",
            "public/sitemap-index.xml",
            "tsconfig.tsbuildinfo",
        ],
    )
    .run_commands(f"cd {APP_DIR} && pnpm install --frozen-lockfile")
)

volume = modal.Volume.from_name("fanju-growth-output", create_if_missing=True)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def make_run_id(now: datetime | None = None) -> str:
    return (now or utc_now()).strftime("%Y%m%dT%H%M%SZ")


def run(cmd: str, cwd: str | None = None, timeout: int = 300) -> None:
    print(f"$ {cmd}", flush=True)
    result = subprocess.run(
        cmd,
        shell=True,
        cwd=cwd,
        text=True,
        timeout=timeout,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Command failed with exit code {result.returncode}: {cmd}")


def prepare_workdir() -> None:
    workdir = Path(WORKDIR)
    if workdir.exists():
        shutil.rmtree(workdir)
    shutil.copytree(APP_DIR, workdir, symlinks=True)


def ensure_dependencies() -> None:
    if not Path(WORKDIR, "node_modules").exists():
        run("pnpm install --frozen-lockfile", cwd=WORKDIR, timeout=600)


def copy_output_path(relative_path: str, destination_root: Path) -> bool:
    source = Path(WORKDIR, relative_path)
    if not source.exists():
        return False

    destination = destination_root / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    if source.is_dir():
        shutil.copytree(source, destination, dirs_exist_ok=True)
    else:
        shutil.copy2(source, destination)
    return True


def ready_markdown_files(output_dir: Path) -> list[str]:
    ready_dir = output_dir / "content" / "seo-ready"
    if not ready_dir.exists():
        return []
    return sorted(str(path.relative_to(ready_dir)) for path in ready_dir.rglob("*.md"))


def create_archive(output_dir: Path, archive_name: str) -> None:
    archive_path = output_dir / archive_name
    with tarfile.open(archive_path, "w:gz") as archive:
        for relative_path in OUTPUT_PATHS:
            path = output_dir / relative_path
            if path.exists():
                archive.add(path, arcname=relative_path)
        manifest_path = output_dir / "run-manifest.json"
        if manifest_path.exists():
            archive.add(manifest_path, arcname="run-manifest.json")


def write_manifest(path: Path, manifest: dict) -> None:
    path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def collect_outputs(run_id: str, started_at: str) -> dict:
    output_root = Path(OUTPUT_ROOT)
    run_output_dir = output_root / run_id
    latest_dir = output_root / "latest"

    if run_output_dir.exists():
        shutil.rmtree(run_output_dir)
    if latest_dir.exists():
        shutil.rmtree(latest_dir)

    run_output_dir.mkdir(parents=True, exist_ok=True)

    missing_outputs = []
    for relative_path in OUTPUT_PATHS:
        if not copy_output_path(relative_path, run_output_dir):
            missing_outputs.append(relative_path)

    ready_files = ready_markdown_files(run_output_dir)
    if not ready_files:
        raise RuntimeError("No ready markdown files were produced in content/seo-ready.")

    archive_name = f"fanju-seo-output-{run_id}.tar.gz"
    latest_archive_name = "fanju-seo-output-latest.tar.gz"
    finished_at = utc_now().isoformat()
    sitemap_exists = (run_output_dir / "public" / "sitemap.xml").exists()
    sitemap_index_exists = (run_output_dir / "public" / "sitemap-index.xml").exists()

    manifest = {
        "runId": run_id,
        "startedAt": started_at,
        "finishedAt": finished_at,
        "status": "success",
        "workdir": WORKDIR,
        "outputDir": str(run_output_dir),
        "latestDir": str(latest_dir),
        "readyFileCount": len(ready_files),
        "readyFiles": ready_files,
        "sitemapExists": sitemap_exists,
        "sitemapIndexExists": sitemap_index_exists,
        "archive": archive_name,
        "latestArchive": latest_archive_name,
        "missingOutputs": missing_outputs,
    }

    write_manifest(run_output_dir / "run-manifest.json", manifest)
    create_archive(run_output_dir, archive_name)

    shutil.copytree(run_output_dir, latest_dir)
    latest_archive_path = latest_dir / archive_name
    if latest_archive_path.exists():
        latest_archive_path.rename(latest_dir / latest_archive_name)
    write_manifest(latest_dir / "run-manifest.json", manifest)

    return manifest


def run_hourly_generation_pipeline() -> dict:
    started = utc_now()
    started_at = started.isoformat()
    run_id = make_run_id(started)
    print(f"Fanju bilingual ready article generation started: {started_at} ({run_id})", flush=True)

    prepare_workdir()
    ensure_dependencies()
    run("pnpm seo:ready:bilingual", cwd=WORKDIR, timeout=1200)

    manifest = collect_outputs(run_id, started_at)
    volume.commit()
    print(
        "Fanju bilingual ready article generation finished: "
        f"{manifest['readyFileCount']} ready files saved to {manifest['outputDir']}",
        flush=True,
    )
    return manifest


@app.function(
    image=image,
    secrets=[legacy_secret],
    volumes={OUTPUT_ROOT: volume},
    timeout=1800,
    schedule=modal.Cron("0 * * * *", timezone="Asia/Singapore"),
)
def hourly_publish_cron():
    return run_hourly_generation_pipeline()


@app.function(
    image=image,
    secrets=[legacy_secret],
    volumes={OUTPUT_ROOT: volume},
    timeout=1800,
)
def run_once():
    """Manual trigger: python3 -m modal run modal_growth_agent.py::run_once"""
    return run_hourly_generation_pipeline()


@app.function(
    image=image,
    secrets=[legacy_secret],
    volumes={OUTPUT_ROOT: volume},
    timeout=21600,
)
def publish_prompt_bank_to_cloudflare(run_limit: int = 6, upload_r2: bool = True):
    """Publish ready prompt-bank articles to Cloudflare D1/R2 without GitHub."""
    safe_run_limit = max(1, int(run_limit))
    upload_r2_flag = "1" if upload_r2 else "0"
    prepare_workdir()
    ensure_dependencies()
    run("pnpm seo:routes", cwd=WORKDIR, timeout=600)
    run("LIMIT=${LIMIT:-1000} LANG=all pnpm seo:prompt-bank", cwd=WORKDIR, timeout=600)
    run("pnpm seo:prompt-bank:check", cwd=WORKDIR, timeout=600)
    run(
        f"RUN_LIMIT={safe_run_limit} CONCURRENCY=3 RATE_DELAY_MS=1000 BATCH_SIZE=3 "
        f"UPLOAD_R2={upload_r2_flag} QUALITY_ATTEMPTS=2 QUALITY_RETRY_DELAY_MS=2500 MAX_TOKENS=4200 "
        "NVIDIA_TIMEOUT_MS=30000 AI_PROVIDER_LANES=groq,cerebras,openrouter,nvidia,cloudflare,gemini "
        "AI_PROVIDER_ORDER=groq,cerebras,openrouter,nvidia,cloudflare,gemini pnpm seo:prompt-bank:cloudflare",
        cwd=WORKDIR,
        timeout=21000,
    )
    run(f"URL_LIMIT={safe_run_limit} pnpm seo:cloudflare:submit", cwd=WORKDIR, timeout=600)
    return {"ok": True, "publishedBy": "cloudflare", "runLimit": safe_run_limit, "uploadR2": upload_r2}


@app.function(
    image=image,
    secrets=[legacy_secret],
    volumes={OUTPUT_ROOT: volume},
    timeout=900,
)
def submit_cloudflare_article_urls(platforms: str = "all"):
    """Submit latest Cloudflare-published article URLs to indexing/link platforms."""
    prepare_workdir()
    ensure_dependencies()
    safe_platforms = "".join(ch for ch in str(platforms) if ch.isalnum() or ch in ",_-").strip(",") or "all"
    run(f"PLATFORMS={safe_platforms} pnpm seo:cloudflare:submit", cwd=WORKDIR, timeout=600)
    return {"ok": True, "submitted": "latest-cloudflare-article-urls", "platforms": safe_platforms}


@app.function(
    image=image,
    secrets=[legacy_secret],
    timeout=120,
)
def debug_wordpress_env():
    """Print which WordPress env vars exist in Modal without exposing values."""
    import os

    names = [
        "WORDPRESS_SITE_URL",
        "WORDPRESS_CLIENT_ID",
        "WORDPRESS_CLIENT_SECRET",
        "WORDPRESS_ACCESS_TOKEN",
        "WORDPRESS_SITE_ID",
        "WORDPRESS_URL",
        "WORDPRESS_SITE",
        "WORDPRESS_BASE_URL",
        "WP_URL",
        "WP_SITE_URL",
        "WP_SITE",
        "WORDPRESS_USERNAME",
        "WORDPRESS_USER",
        "WORDPRESS_LOGIN",
        "WORDPRESS_EMAIL",
        "WP_USERNAME",
        "WP_USER",
        "WP_LOGIN",
        "WP_EMAIL",
        "WORDPRESS_APP_PASSWORD",
        "WORDPRESS_APPLICATION_PASSWORD",
        "WORDPRESS_PASSWORD",
        "WP_APP_PASSWORD",
        "WP_APPLICATION_PASSWORD",
        "WP_PASSWORD",
        "WORDPRESS",
    ]
    presence = {name: bool(os.environ.get(name)) for name in names}
    print(json.dumps(presence, indent=2), flush=True)
    return presence


@app.function(
    image=image,
    secrets=[legacy_secret],
    volumes={OUTPUT_ROOT: volume},
    timeout=300,
)
def list_outputs():
    """Inspect outputs: python3 -m modal run modal_growth_agent.py::list_outputs"""
    volume.reload()
    output_root = Path(OUTPUT_ROOT)
    if not output_root.exists():
        raise RuntimeError(f"Output root does not exist: {OUTPUT_ROOT}")

    entries = sorted(path.name for path in output_root.iterdir())
    print(f"{OUTPUT_ROOT}: {entries}", flush=True)

    manifest_path = output_root / "latest" / "run-manifest.json"
    if not manifest_path.exists():
        raise RuntimeError("Missing latest run manifest.")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    print(json.dumps(manifest, indent=2, ensure_ascii=False), flush=True)
    return manifest
