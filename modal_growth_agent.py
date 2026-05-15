from __future__ import annotations

import os
import subprocess
from datetime import datetime, timezone

import modal

app = modal.App("fanju-growth-agent")

image = (
    modal.Image.debian_slim()
    .apt_install("git", "curl", "ca-certificates")
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -",
        "apt-get install -y nodejs",
        "npm i -g pnpm@9.15.9",
    )
)

REPO = "https://github.com/dytsui/fanju.git"
WORKDIR = "/tmp/fanju"
GIT_TIMEOUT = 120  # seconds for any git network operation


def run(cmd: str, cwd: str | None = None, display_cmd: str | None = None,
        env: dict | None = None, timeout: int = 300) -> None:
    # Always print the display_cmd (safe/redacted version), never the raw cmd
    print(f"$ {display_cmd or cmd}", flush=True)
    result = subprocess.run(
        cmd,
        shell=True,
        cwd=cwd,
        env=env,
        text=True,
        capture_output=True,
        timeout=timeout,
    )
    if result.stdout:
        print(result.stdout, flush=True)
    if result.stderr:
        print(result.stderr, flush=True)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {display_cmd or cmd}")


def authed_repo_url(token: str) -> str:
    return f"https://x-access-token:{token}@github.com/dytsui/fanju.git"


def redacted_repo_url() -> str:
    return f"https://x-access-token:***REDACTED***@github.com/dytsui/fanju.git"


def clone_repo(token: str) -> None:
    run(f"rm -rf {WORKDIR}")
    url = authed_repo_url(token)
    run(
        f"git clone --depth 1 {url} {WORKDIR}",
        display_cmd=f"git clone --depth 1 {redacted_repo_url()} {WORKDIR}",
        timeout=GIT_TIMEOUT,
    )
    run('git config user.name "fanju-growth-bot"', cwd=WORKDIR)
    run('git config user.email "growth-bot@fanju.app"', cwd=WORKDIR)
    # embed token so push/pull never prompt — log only redacted form
    run(
        f"git remote set-url origin {url}",
        cwd=WORKDIR,
        display_cmd=f"git remote set-url origin {redacted_repo_url()}",
    )


def commit_and_push(token: str, message: str, paths: list[str]) -> None:
    pathspec = " ".join(paths)
    status = subprocess.run(
        f"git status --porcelain -- {pathspec}",
        shell=True, cwd=WORKDIR, capture_output=True, text=True, check=True,
    ).stdout.strip()

    if not status:
        print("No repo changes to commit.", flush=True)
        return

    print("Changed files:\n" + status, flush=True)
    run(f"git add -A -- {pathspec}", cwd=WORKDIR)
    run(f'git commit -m "{message}"', cwd=WORKDIR)
    # pull with rebase to handle concurrent pushes, then push
    url = authed_repo_url(token)
    run(
        f"git pull --rebase {url} main",
        cwd=WORKDIR,
        display_cmd=f"git pull --rebase {redacted_repo_url()} main",
        timeout=GIT_TIMEOUT,
    )
    run(
        f"git push {url} main",
        cwd=WORKDIR,
        display_cmd=f"git push {redacted_repo_url()} main",
        timeout=GIT_TIMEOUT,
    )


def run_hourly_generation_pipeline() -> None:
    started = datetime.now(timezone.utc).isoformat()
    print(f"Fanju hourly bilingual ready article generation started: {started}", flush=True)

    token = os.environ["GITHUB_TOKEN"]
    clone_repo(token)

    run("pnpm install --frozen-lockfile", cwd=WORKDIR, timeout=300)

    # ── Single atomic bilingual pipeline ─────────────────────────────────────
    # Generates exactly 3 ZH + 3 EN ready articles, runs build, then commits once.
    # If pnpm seo:ready:bilingual fails for any reason, we do NOT commit.
    run("pnpm seo:ready:bilingual", cwd=WORKDIR, timeout=900)

    # ── Show git status before committing ────────────────────────────────────
    run("git status", cwd=WORKDIR)

    # ── Single atomic commit ─────────────────────────────────────────────────
    commit_and_push(
        token,
        "chore: hourly generate Fanju bilingual ready SEO articles",
        [
            "content/seo-ready",
            "content/seo-ai-drafts",
            "data/seo",
            "dist/seo",
            "public/sitemap.xml",
            "public/sitemap-index.xml",
        ],
    )

    print("Fanju hourly bilingual ready article generation finished.", flush=True)


@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("fanju-growth-secrets"),
        modal.Secret.from_name("custom-secret"),
    ],
    timeout=1200,
    schedule=modal.Cron("0 * * * *", timezone="Asia/Tokyo"),
)
def hourly_publish_cron():
    run_hourly_generation_pipeline()


@app.function(
    image=image,
    secrets=[
        modal.Secret.from_name("fanju-growth-secrets"),
        modal.Secret.from_name("custom-secret"),
    ],
    timeout=1200,
)
def run_once():
    """Manual trigger: python3 -m modal run modal_growth_agent.py::run_once"""
    run_hourly_generation_pipeline()
