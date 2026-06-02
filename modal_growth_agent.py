from __future__ import annotations

import json
import os
import re
import shlex
import shutil
import subprocess
import tarfile
import time
from datetime import datetime, timezone
from pathlib import Path

import modal

app = modal.App("fanju-growth-agent")
legacy_secret = modal.Secret.from_name("custom-secret")
hourly_schedule = None if os.environ.get("FANJU_DISABLE_MODAL_SCHEDULE") == "1" else modal.Cron("0 * * * *", timezone="Asia/Singapore")

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

AI_PROVIDER_ORDER = "cerebras,cerebras2,cerebras3,cerebras4,groq,groq2,gemini,gemini2,openrouter,nvidia,nvidia2,cloudflare"

RUNTIME_PIPELINE_FILES = [
    "components/seo-ready-article-page.tsx",
    "lib/seo-ready-articles.ts",
    "scripts/check-seo-ready-routes.mjs",
    "scripts/seo/build-random-prompt-bank.mjs",
    "scripts/seo/run-prompt-bank-to-cloudflare.mjs",
    "scripts/seo/submit-cloudflare-article-urls.mjs",
    "scripts/seo/audit-anti-template.mjs",
    "scripts/seo/audit-external-publish-proof.mjs",
]

QUALITY_SCORE_THRESHOLDS = {
    "OriginalityScore": 85,
    "AntiTemplateScore": 85,
    "LocalDetailScore": 60,
    "EntityScore": 90,
    "SearchIntentScore": 90,
    "InternalLinkScore": 90,
    "IndexabilityScore": 90,
}

_IGNORE = [
    ".git",
    ".venv",
    "venv",
    "__pycache__",
    "*.pyc",
    "node_modules",
    ".next",
    "dist",
    ".turbo",
    ".vercel",
    ".wrangler",
    ".env",
    ".env.*",
    ".cookie-profiles",
    "*_COOKIES.txt",
    "private",
    "docs",
    "modal",
    "sub2api",
    # NOTE: do NOT ignore content/seo-ready or content/seo-published —
    # they hold the git-committed seed articles that the Next.js
    # catch-all routes (app/[...slug], app/en/[...slug]) need at
    # build time. With output:"export", an empty generateStaticParams()
    # makes `next build` fail (#hourly_publish_cron 2026-05-17).
    "content/seo-ai-drafts",
    "public/sitemap.xml",
    "public/sitemap-index.xml",
    "tsconfig.tsbuildinfo",
    "out",
]

image = (
    modal.Image.debian_slim()
    .apt_install("curl", "ca-certificates", "git")
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -",
        "apt-get install -y nodejs",
        "npm i -g pnpm@9.15.9",
    )
    # Layer 1: only package files — cached unless lockfile changes
    .add_local_file("package.json", f"{APP_DIR}/package.json", copy=True)
    .add_local_file("pnpm-lock.yaml", f"{APP_DIR}/pnpm-lock.yaml", copy=True)
    .run_commands(f"cd {APP_DIR} && pnpm install --frozen-lockfile")
    # Layer 2: full source (invalidated by content changes, but deps already cached above)
    .add_local_dir(
        ".",
        APP_DIR,
        copy=True,
        ignore=_IGNORE,
    )
)

volume = modal.Volume.from_name("fanju-growth-output", create_if_missing=True)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def make_run_id(now: datetime | None = None) -> str:
    return (now or utc_now()).strftime("%Y%m%dT%H%M%SZ")


def run(cmd: str, cwd: str | None = None, timeout: int = 300) -> None:
    print(f"$ {cmd}", flush=True)
    # Explicitly pass current environment to ensure secrets are inherited
    result = subprocess.run(
        cmd,
        shell=True,
        cwd=cwd,
        text=True,
        timeout=timeout,
        env=os.environ, 
    )
    if result.returncode != 0:
        raise RuntimeError(f"Command failed with exit code {result.returncode}: {cmd}")


def run_args(args: list[str], cwd: str | None = None, timeout: int = 300, redacted: str | None = None) -> None:
    print(f"$ {redacted or shlex.join(args)}", flush=True)
    result = subprocess.run(args, cwd=cwd, text=True, timeout=timeout, env=os.environ)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed with exit code {result.returncode}: {redacted or shlex.join(args)}")


def run_capture(args: list[str], cwd: str | None = None, timeout: int = 300) -> str:
    result = subprocess.run(args, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout, env=os.environ)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed with exit code {result.returncode}: {shlex.join(args)}\n{result.stderr}")
    return result.stdout.strip()


def run_args_capture(
    args: list[str],
    cwd: str | None = None,
    timeout: int = 300,
    redacted: str | None = None,
) -> subprocess.CompletedProcess:
    print(f"$ {redacted or shlex.join(args)}", flush=True)
    try:
        return subprocess.run(
            args,
            cwd=cwd,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
            env=os.environ,
        )
    except subprocess.TimeoutExpired as exc:
        stdout = exc.stdout if isinstance(exc.stdout, str) else (exc.stdout or b"").decode(errors="replace")
        stderr = exc.stderr if isinstance(exc.stderr, str) else (exc.stderr or b"").decode(errors="replace")
        return subprocess.CompletedProcess(args, 124, stdout, f"{stderr}\nnetwork timeout after {timeout}s".strip())


PUSH_RETRY_DELAYS = [10, 20, 40, 60, 90, 120, 180, 240]
RETRYABLE_PUSH_PATTERNS = [
    r"remote:\s*Internal Server Error",
    r"HTTP\s*50[0-4]",
    r"\b50[0-4]\b",
    r"remote rejected[\s\S]*Internal Server Error",
    r"failed to push some refs[\s\S]*(?:Internal Server Error|HTTP\s*50[0-4]|\b50[0-4]\b)",
    r"network timeout",
    r"timed?\s*out",
    r"connection reset",
    r"TLS.*(?:error|fail|reset|closed)",
    r"SSL.*(?:error|fail|reset|closed)",
    r"non-fast-forward",
    r"fetch first",
    r"Updates were rejected",
]
NON_RETRYABLE_PUSH_PATTERNS = [
    r"authentication failed",
    r"permission denied",
    r"protected branch.*rejected",
    r"required status checks failed",
    r"repository not found",
]


def combined_output(result: subprocess.CompletedProcess) -> str:
    return f"{result.stdout or ''}\n{result.stderr or ''}"


def is_retryable_push_error(text: str) -> bool:
    value = text or ""
    return any(re.search(pattern, value, re.I) for pattern in RETRYABLE_PUSH_PATTERNS)


def is_non_retryable_push_error(text: str) -> bool:
    value = text or ""
    return any(re.search(pattern, value, re.I) for pattern in NON_RETRYABLE_PUSH_PATTERNS)


def git_conflict_files(cwd: str | None = None) -> list[str]:
    result = run_args_capture(["git", "diff", "--name-only", "--diff-filter=U"], cwd=cwd, timeout=60)
    if result.returncode != 0:
        return []
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def print_rebase_diagnostics(cwd: str | None = None) -> None:
    status = run_args_capture(["git", "status", "--short"], cwd=cwd, timeout=60)
    print("GIT_STATUS_AFTER_REBASE_FAILURE", flush=True)
    print(status.stdout or "(empty)", flush=True)
    conflicts = git_conflict_files(cwd)
    print(f"REBASE_CONFLICT_FILES={','.join(conflicts) if conflicts else '(none reported)'}", flush=True)


def git_blob_at(ref: str, path: str, cwd: str | None = None) -> bytes | None:
    try:
        result = subprocess.run(
            ["git", "show", f"{ref}:{path}"],
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=60,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if result.returncode != 0:
        return None
    return result.stdout


def git_commit_paths(commit_sha: str, cwd: str | None = None) -> list[str]:
    result = run_args_capture(
        ["git", "diff-tree", "--no-commit-id", "--name-only", "-r", commit_sha, "--", "content/seo-ready"],
        cwd=cwd,
        timeout=60,
    )
    if result.returncode != 0:
        raise RuntimeError(f"Could not list committed article paths for {commit_sha}\nstdout={result.stdout}\nstderr={result.stderr}")
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def remote_already_has_commit_files(
    commit_sha: str,
    expected_paths: list[str],
    conflict_paths: list[str],
    cwd: str | None = None,
) -> bool:
    expected = set(expected_paths)
    conflicts = set(conflict_paths)
    if not expected or not conflicts:
        return False
    if not conflicts.issubset(expected):
        return False

    for path in sorted(conflicts):
        local_blob = git_blob_at(commit_sha, path, cwd=cwd)
        remote_blob = git_blob_at("origin/main", path, cwd=cwd)
        if local_blob is None or remote_blob is None or local_blob != remote_blob:
            return False
    return True


def abort_rebase(cwd: str | None = None) -> None:
    subprocess.run(["git", "rebase", "--abort"], cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)


def rebase_or_fail(
    run_id: str,
    round_no: int,
    cwd: str | None = None,
    local_commit_sha: str | None = None,
    committed_paths: list[str] | None = None,
) -> str | None:
    fetch = run_args_capture(["git", "fetch", "origin", "main"], cwd=cwd, timeout=300)
    if fetch.returncode != 0:
        raise RuntimeError(
            f"git fetch origin main failed during push retry "
            f"run_id={run_id} round_no={round_no}\nstdout={fetch.stdout}\nstderr={fetch.stderr}"
        )
    rebase = run_args_capture(["git", "rebase", "--autostash", "origin/main"], cwd=cwd, timeout=300)
    if rebase.returncode != 0:
        print_rebase_diagnostics(cwd)
        conflict_paths = git_conflict_files(cwd)
        if local_commit_sha and committed_paths and remote_already_has_commit_files(
            local_commit_sha,
            committed_paths,
            conflict_paths,
            cwd=cwd,
        ):
            remote_sha = run_capture(["git", "rev-parse", "origin/main"], cwd=cwd)
            abort_rebase(cwd)
            print(
                "GITHUB_REMOTE_ALREADY_HAS_ARTICLES "
                f"run_id={run_id} round_no={round_no} remote_commit={remote_sha} "
                f"duplicate_files={','.join(conflict_paths)}",
                flush=True,
            )
            return remote_sha
        raise RuntimeError(
            "git rebase --autostash origin/main failed during push retry; "
            f"run_id={run_id} round_no={round_no}. Resolve the conflict manually; no force push was attempted.\n"
            f"stdout={rebase.stdout}\nstderr={rebase.stderr}"
        )
    return None


def final_push_failure_message(
    run_id: str,
    round_no: int,
    commit_sha: str,
    branch: str,
    result: subprocess.CompletedProcess,
) -> str:
    return (
        "git push origin main failed after 8 attempts.\n"
        f"run_id={run_id}\n"
        f"round_no={round_no}\n"
        f"commit_sha={commit_sha}\n"
        f"branch={branch}\n"
        f"last_push_stdout={result.stdout or ''}\n"
        f"last_push_stderr={result.stderr or ''}\n"
        "Manual recovery commands:\n"
        "git fetch origin main\n"
        "git rebase --autostash origin/main\n"
        "git push origin main"
    )


def push_current_commit_with_retry(
    run_id: str,
    round_no: int,
    cwd: str | None = None,
    sleep_fn=time.sleep,
    committed_paths: list[str] | None = None,
) -> str:
    last_result: subprocess.CompletedProcess | None = None
    for attempt in range(1, 9):
        commit_sha = run_capture(["git", "rev-parse", "HEAD"], cwd=cwd)
        branch = run_capture(["git", "branch", "--show-current"], cwd=cwd)
        result = run_args_capture(["git", "push", "origin", "main"], cwd=cwd, timeout=900)
        last_result = result
        if result.returncode == 0:
            final_sha = run_capture(["git", "rev-parse", "HEAD"], cwd=cwd)
            print(f"GITHUB_PUSH_OK attempt={attempt} commit={final_sha}", flush=True)
            return final_sha

        text = combined_output(result)
        if is_non_retryable_push_error(text):
            raise RuntimeError(
                f"Non-retryable git push failure run_id={run_id} round_no={round_no} "
                f"commit_sha={commit_sha} branch={branch}\nstdout={result.stdout}\nstderr={result.stderr}"
            )
        if not is_retryable_push_error(text):
            raise RuntimeError(
                f"git push failed with a non-retryable or unknown error run_id={run_id} round_no={round_no} "
                f"commit_sha={commit_sha} branch={branch}\nstdout={result.stdout}\nstderr={result.stderr}"
            )
        if attempt >= 8:
            raise RuntimeError(final_push_failure_message(run_id, round_no, commit_sha, branch, result))

        delay = PUSH_RETRY_DELAYS[attempt - 1]
        print(
            f"GITHUB_PUSH_RETRYABLE_FAILURE attempt={attempt}/8 delay={delay}s "
            f"run_id={run_id} round_no={round_no} commit={commit_sha}",
            flush=True,
        )
        duplicate_sha = rebase_or_fail(
            run_id,
            round_no,
            cwd=cwd,
            local_commit_sha=commit_sha,
            committed_paths=committed_paths,
        )
        if duplicate_sha:
            return duplicate_sha
        sleep_fn(delay)

    assert last_result is not None
    commit_sha = run_capture(["git", "rev-parse", "HEAD"], cwd=cwd)
    branch = run_capture(["git", "branch", "--show-current"], cwd=cwd)
    raise RuntimeError(final_push_failure_message(run_id, round_no, commit_sha, branch, last_result))


def run_shell_status(cmd: str, cwd: str | None = None, timeout: int = 300) -> int:
    print(f"$ {cmd}", flush=True)
    result = subprocess.run(cmd, shell=True, cwd=cwd, text=True, timeout=timeout)
    return result.returncode


def github_token() -> str:
    return (os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN") or "").strip()


def github_repository() -> str:
    return (
        os.environ.get("GITHUB_REPOSITORY")
        or os.environ.get("GITHUB_REPO")
        or "384007/fanjuv1"
    ).strip().removeprefix("https://github.com/").removesuffix(".git")


def prepare_workdir(use_github: bool = False) -> None:
    workdir = Path(WORKDIR)
    if workdir.exists():
        shutil.rmtree(workdir)
    if not use_github:
        shutil.copytree(APP_DIR, workdir, symlinks=True)
        return

    token = github_token()
    if not token:
        raise RuntimeError("Missing GITHUB_TOKEN or GH_TOKEN in Modal secret; cannot commit generated articles to GitHub main.")

    repo = github_repository()
    remote = f"https://x-access-token:{token}@github.com/{repo}.git"
    run_args(
        ["git", "clone", "--depth", "1", "--branch", "main", remote, WORKDIR],
        timeout=900,
        redacted=f"git clone --depth 1 --branch main https://x-access-token:***@github.com/{repo}.git {WORKDIR}",
    )

    image_modules = Path(APP_DIR, "node_modules")
    work_modules = Path(WORKDIR, "node_modules")
    if image_modules.exists() and not work_modules.exists():
        shutil.copytree(image_modules, work_modules, symlinks=True)


def ensure_dependencies() -> None:
    if not Path(WORKDIR, "node_modules").exists():
        run("pnpm install --frozen-lockfile", cwd=WORKDIR, timeout=600)


def git_commit_and_push(routes: list[str], run_id: str, round_no: int) -> str:
    run_args(["git", "config", "user.name", os.environ.get("GIT_AUTHOR_NAME", "Fanju Modal Publisher")], cwd=WORKDIR)
    run_args(["git", "config", "user.email", os.environ.get("GIT_AUTHOR_EMAIL", "modal-publisher@fanju.app")], cwd=WORKDIR)
    run_args(["git", "add", "--", "content/seo-ready"], cwd=WORKDIR)

    diff_status = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=WORKDIR)
    if diff_status.returncode == 0:
        raise RuntimeError(f"No Markdown article changes staged for round {round_no}; refusing to push an empty publish.")

    subject_routes = ", ".join(routes[:3])
    if len(routes) > 3:
        subject_routes += f", +{len(routes) - 3} more"
    message = f"content: publish Fanju articles {run_id} round {round_no}"
    run_args(["git", "commit", "-m", message, "-m", f"Routes: {subject_routes}"], cwd=WORKDIR, timeout=900)
    local_commit_sha = run_capture(["git", "rev-parse", "HEAD"], cwd=WORKDIR)
    committed_paths = git_commit_paths(local_commit_sha, cwd=WORKDIR)
    token = github_token()
    repo = github_repository()
    remote_url = f"https://x-access-token:{token}@github.com/{repo}.git"
    run_args(
        ["git", "remote", "set-url", "origin", remote_url],
        cwd=WORKDIR,
        redacted=f"git remote set-url origin https://x-access-token:***@github.com/{repo}.git",
    )
    # unshallow so rebase works on depth-1 clone
    subprocess.run(["git", "fetch", "--unshallow", "origin", "main"], cwd=WORKDIR, capture_output=True)
    duplicate_sha = rebase_or_fail(
        run_id,
        round_no,
        cwd=WORKDIR,
        local_commit_sha=local_commit_sha,
        committed_paths=committed_paths,
    )
    sha = duplicate_sha or push_current_commit_with_retry(
        run_id,
        round_no,
        cwd=WORKDIR,
        committed_paths=committed_paths,
    )
    print(f"GITHUB_MAIN_COMMIT={sha}", flush=True)
    return sha


def trigger_pages_deploy() -> None:
    hook_url = os.environ.get("CF_PAGES_DEPLOY_HOOK", "").strip()
    if not hook_url:
        print("CF_PAGES_DEPLOY_HOOK not set; skipping Pages deploy trigger", flush=True)
        return
    import urllib.request
    req = urllib.request.Request(hook_url, method="POST", data=b"")
    with urllib.request.urlopen(req, timeout=30) as resp:
        print(f"PAGES_DEPLOY_TRIGGERED status={resp.status}", flush=True)


def wait_for_live_routes(routes: list[str], max_attempts: int = 30, delay_seconds: int = 30) -> None:
    routes_csv = ",".join(routes)
    article_cmd = f"BASE_URL=https://fanju.app REQUIRE_SOURCE_MATCH=1 URLS={shlex.quote(routes_csv)} pnpm seo:article:live:check"
    sitemap_cmd = f"BASE_URL=https://fanju.app URLS={shlex.quote(routes_csv)} pnpm seo:sitemap:live:contains"
    last_code = 1
    for attempt in range(1, max_attempts + 1):
        print(f"LIVE_DEPLOY_CHECK attempt={attempt}/{max_attempts} routes={routes_csv}", flush=True)
        article_code = run_shell_status(article_cmd, cwd=WORKDIR, timeout=900)
        sitemap_code = run_shell_status(sitemap_cmd, cwd=WORKDIR, timeout=300) if article_code == 0 else 1
        if article_code == 0 and sitemap_code == 0:
            print("LIVE_DEPLOY_CHECK_OK", flush=True)
            return
        last_code = article_code or sitemap_code
        if attempt < max_attempts:
            import time
            time.sleep(delay_seconds)
    raise RuntimeError(f"Live deploy checks did not pass after {max_attempts} attempts; last exit code {last_code}.")


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


BAD_PUBLIC_METADATA_RE = re.compile(
    r"domain\s+for\s+sale|parked\s+domain|"
    r"markdown skeleton|Return valid JSON|Body requirements",
    re.I,
)


def load_json_state(relative_path: str) -> dict:
    state_path = Path(WORKDIR, relative_path)
    if not state_path.exists():
        return {"drafts": []}
    return json.loads(state_path.read_text(encoding="utf-8"))


def ready_entries_from_state(state: dict) -> list[dict]:
    return [entry for entry in state.get("drafts", []) if entry.get("status") == "ready"]


def public_route_for_entry(entry: dict) -> str:
    route = entry.get("canonicalPath") or entry.get("route") or entry.get("slug") or ""
    route = str(route).strip()
    if not route:
        raise RuntimeError(f"Published entry has no route: {entry}")
    return route if route.startswith("/") else f"/{route}"


def parse_frontmatter(path: Path) -> dict:
    try:
        raw = path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return {}
    match = re.match(r"^---\r?\n([\s\S]*?)\r?\n---", raw)
    if not match:
        return {}
    meta: dict[str, str] = {}
    for line in match.group(1).splitlines():
        m = re.match(r"^(\w+):\s*\"?([^\"]*)\"?\s*$", line)
        if m:
            meta[m.group(1)] = m.group(2).strip()
    return meta


def ensure_ready_source_entries(entries: list[dict], stage: str) -> None:
    missing: list[str] = []
    invalid: list[str] = []
    for entry in entries:
        route = public_route_for_entry(entry)
        source_path = str(entry.get("sourcePath") or "").strip()
        if not source_path:
            missing.append(f"{route} (no sourcePath)")
            continue
        path = Path(WORKDIR, source_path)
        if not path.exists():
            missing.append(f"{route} ({source_path})")
            continue
        meta = parse_frontmatter(path)
        score = int(meta.get("aiQualityScore") or "0")
        canonical = str(meta.get("canonicalPath") or "").strip()
        if meta.get("status") != "ready" or score < 90 or canonical != route:
            invalid.append(f"{route} ({source_path}, status={meta.get('status')}, score={score}, canonical={canonical})")
    if missing or invalid:
        raise RuntimeError(
            f"Ready source validation failed at {stage}: "
            f"missing={missing[:8]} invalid={invalid[:8]}"
        )


def run_seo_ready_files_check(entries: list[dict], stage: str) -> None:
    files = [str(entry.get("sourcePath") or "").strip() for entry in entries]
    if not files or any(not path for path in files):
        raise RuntimeError(f"Cannot run SEO_READY_FILES check at {stage}: missing sourcePath in latest entries.")
    unique_files = sorted(set(files))
    env = os.environ.copy()
    env["SEO_READY_FILES"] = ",".join(unique_files)
    redacted = f"SEO_READY_FILES={env['SEO_READY_FILES']} node scripts/check-seo-ready-routes.mjs"
    print(f"$ {redacted}", flush=True)
    result = subprocess.run(
        ["node", "scripts/check-seo-ready-routes.mjs"],
        cwd=WORKDIR,
        text=True,
        env=env,
        timeout=600,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"SEO_READY_FILES validation failed at {stage}; refusing to commit or push. "
            f"files={unique_files}"
        )


def validate_ready_entries(entries: list[dict], min_score: int = 90) -> None:
    def score_failures(entry: dict) -> list[str]:
        scores = entry.get("qualityScores") or {}
        failures: list[str] = []
        for key, threshold in QUALITY_SCORE_THRESHOLDS.items():
            value = scores.get(key)
            if not isinstance(value, (int, float)) or value < threshold:
                failures.append(f"{key}={value!r}<{threshold}")
        return failures

    bad_entries = [
        entry
        for entry in entries
        if (entry.get("score") or 0) < min_score
        or BAD_PUBLIC_METADATA_RE.search(json.dumps(entry, ensure_ascii=False))
        or score_failures(entry)
    ]
    if bad_entries:
        summarized = [
            {
                "route": public_route_for_entry(entry),
                "score": entry.get("score"),
                "qualityScores": entry.get("qualityScores"),
                "scoreFailures": score_failures(entry),
            }
            for entry in bad_entries[:2]
        ]
        raise RuntimeError(f"Invalid published metadata: {summarized}")


def run_cloudflare_publish_pipeline(
    rounds: int = 1,
    run_limit: int = 6,
    upload_r2: bool = True,
    submit_platforms: str = "all",
) -> dict:
    """Production path: generate qualified Markdown and push it to GitHub main.

    Cloudflare Pages deployment and external-platform submission are verified
    outside Modal after the pushed routes are live.
    """
    safe_rounds = min(24, max(1, int(rounds)))
    safe_run_limit = max(6, int(run_limit))
    if safe_run_limit % 2 != 0:
        safe_run_limit += 1

    upload_r2_flag = "1" if upload_r2 else "0"
    safe_platforms = "".join(ch for ch in str(submit_platforms) if ch.isalnum() or ch in ",_-").strip(",") or "all"
    started = utc_now()
    started_at = started.isoformat()
    run_id = f"production-cloudflare-{make_run_id(started)}"

    print(
        f"Fanju production publish started: {started_at} ({run_id}), "
        f"rounds={safe_rounds}, runLimit={safe_run_limit}, uploadR2={upload_r2}",
        flush=True,
    )

    prepare_workdir(use_github=True)
    ensure_dependencies()

    round_summaries = []
    for round_no in range(1, safe_rounds + 1):
        round_seed = f"{run_id}-round-{round_no}"
        published_file = f"dist/seo/{run_id}-round-{round_no}-published.json"
        failed_file = f"dist/seo/{run_id}-round-{round_no}-failed.json"

        print(f"PRODUCTION_ROUND_START {round_no}/{safe_rounds} seed={round_seed}", flush=True)
        run("pnpm seo:routes", cwd=WORKDIR, timeout=600)
        run(
            f"LIMIT=1000 LANG=all EN_TOP_CITY_LIMIT=100 RANDOM_SEED={shlex.quote(round_seed)} pnpm seo:prompt-bank",
            cwd=WORKDIR,
            timeout=600,
        )
        run("EN_TOP_CITY_LIMIT=100 pnpm seo:prompt-bank:check", cwd=WORKDIR, timeout=600)
        run(
            f"RUN_LIMIT={safe_run_limit} CONCURRENCY=4 RATE_DELAY_MS=5000 BATCH_SIZE=2 "
            f"UPLOAD_R2={upload_r2_flag} MIN_SCORE=90 AUTO_REPAIR_ARTICLE=1 QUALITY_ATTEMPTS=5 "
            f"QUALITY_RETRY_DELAY_MS=15000 MAX_TOKENS=7200 AI_COOLDOWN_WAIT_PASSES=2 "
            f"PUBLISHED_FILE={shlex.quote(published_file)} FAILED_LOG_FILE={shlex.quote(failed_file)} "
            f"PUBLISHED_RUN_ID={shlex.quote(run_id)} "
            "STRICT_PUBLISH=1 NVIDIA_TIMEOUT_MS=15000 GROQ_MAX_TOKENS=6000 "
            "MULTI_AI_CANDIDATES=0 ASSIGN_PROVIDER_PER_CITY=1 STRICT_CITY_PROVIDER=0 "
            "CLOUDFLARE_MODEL=@cf/meta/llama-3.3-70b-instruct-fp8-fast "
            f"AI_PROVIDER_ORDER={AI_PROVIDER_ORDER} pnpm seo:prompt-bank:cloudflare",
            cwd=WORKDIR,
            timeout=21000,
        )

        published_state = load_json_state(published_file)
        failed_state = load_json_state(failed_file)
        ready_entries = ready_entries_from_state(published_state)
        if len(ready_entries) < safe_run_limit:
            raise RuntimeError(f"Round {round_no} published {len(ready_entries)} ready articles, expected {safe_run_limit}")
        latest_entries = ready_entries[-safe_run_limit:]
        validate_ready_entries(latest_entries, min_score=90)
        ensure_ready_source_entries(latest_entries, f"round-{round_no}-after-generation")

        routes = [public_route_for_entry(entry) for entry in latest_entries]
        run("node scripts/seo/recover-missing-from-d1.mjs", cwd=WORKDIR, timeout=300)
        run_seo_ready_files_check(latest_entries, f"round-{round_no}-before-git-push")
        commit_sha = git_commit_and_push(routes, run_id, round_no)

        round_summary = {
            "round": round_no,
            "seed": round_seed,
            "publishedFile": published_file,
            "failedFile": failed_file,
            "publishedTotal": len(ready_entries),
            "failedTotal": len(failed_state.get("drafts", [])),
            "latest": latest_entries,
            "routes": routes,
            "commitSha": commit_sha,
            "siteAndExternalSubmit": "deferred-until-live",
        }
        round_summaries.append(round_summary)
        print(f"PRODUCTION_ROUND_OK {round_no}/{safe_rounds} routes={','.join(routes)}", flush=True)

    output_root = Path(OUTPUT_ROOT) / run_id
    output_root.mkdir(parents=True, exist_ok=True)
    copy_output_path("data/seo/route-manifest.json", output_root)
    copy_output_path("data/seo/random-prompt-bank.jsonl", output_root)
    copy_output_path("dist/seo", output_root)
    write_manifest(
        output_root / "run-manifest.json",
        {
            "runId": run_id,
            "startedAt": started_at,
            "finishedAt": utc_now().isoformat(),
            "status": "success",
            "publishedBy": "cloudflare",
            "contentPublishedBy": "github-main",
            "rounds": safe_rounds,
            "runLimit": safe_run_limit,
            "uploadR2": upload_r2,
            "submitPlatforms": safe_platforms,
            "roundSummaries": round_summaries,
        },
    )
    volume.commit()
    print(f"PRODUCTION_CLOUDFLARE_RUN_ID={run_id}", flush=True)
    print(json.dumps(round_summaries, ensure_ascii=False, indent=2), flush=True)
    return {
        "ok": True,
        "runId": run_id,
        "publishedBy": "cloudflare",
        "contentPublishedBy": "github-main",
        "rounds": safe_rounds,
        "runLimit": safe_run_limit,
        "uploadR2": upload_r2,
        "roundSummaries": round_summaries,
    }


@app.function(
    image=image,
    secrets=[legacy_secret],
    volumes={OUTPUT_ROOT: volume},
    timeout=21600,
    schedule=hourly_schedule,
)
def hourly_publish_cron():
    return run_cloudflare_publish_pipeline(rounds=1, run_limit=10, upload_r2=True, submit_platforms="all")


@app.function(
    image=image,
    secrets=[legacy_secret],
    volumes={OUTPUT_ROOT: volume},
    timeout=21600,
)
def run_once(rounds: int = 1, run_limit: int = 10, upload_r2: bool = True, submit_platforms: str = "all"):
    """Manual production trigger: python3 -m modal run modal_growth_agent.py::run_once"""
    return run_cloudflare_publish_pipeline(
        rounds=rounds,
        run_limit=run_limit,
        upload_r2=upload_r2,
        submit_platforms=submit_platforms,
    )


@app.function(
    image=image,
    secrets=[legacy_secret],
    volumes={OUTPUT_ROOT: volume},
    timeout=21600,
)
def publish_prompt_bank_to_cloudflare(run_limit: int = 6, upload_r2: bool = True):
    """Publish ready prompt-bank articles to GitHub main plus Cloudflare D1/R2."""
    return run_cloudflare_publish_pipeline(rounds=1, run_limit=run_limit, upload_r2=upload_r2, submit_platforms="all")


@app.function(
    image=image,
    secrets=[legacy_secret],
    volumes={OUTPUT_ROOT: volume},
    timeout=21600,
)
def publish_routes_to_cloudflare(target_routes: str, upload_r2: bool = True):
    """Generate and publish exact route(s), one route at a time, with real AI output only."""
    routes = [route.strip() for route in str(target_routes or "").split(",") if route.strip()]
    if not routes:
        raise ValueError("target_routes is required")

    upload_r2_flag = "1" if upload_r2 else "0"
    started = utc_now()
    run_id = f"target-cloudflare-routes-{make_run_id(started)}"

    prepare_workdir()
    ensure_dependencies()
    run("pnpm seo:routes", cwd=WORKDIR, timeout=600)

    summaries = []
    for index, route in enumerate(routes, start=1):
        lang = "en" if route.startswith("/en/") else "zh"
        published_file = f"dist/seo/{run_id}-{index}-published.json"
        failed_file = f"dist/seo/{run_id}-{index}-failed.json"
        print(f"TARGET_ROUTE_START {index}/{len(routes)} {route}", flush=True)
        run(
            f"TARGET_ROUTES={shlex.quote(route)} LIMIT=1 LANG={lang} RANDOM_SEED={shlex.quote(f'{run_id}-{index}')} pnpm seo:prompt-bank",
            cwd=WORKDIR,
            timeout=600,
        )
        run(
            f"RUN_LIMIT=1 CONCURRENCY=1 RATE_DELAY_MS=15000 BATCH_SIZE=1 "
            f"UPLOAD_R2={upload_r2_flag} MIN_SCORE=96 AUTO_REPAIR_ARTICLE=1 QUALITY_ATTEMPTS=5 QUALITY_RETRY_DELAY_MS=240000 MAX_TOKENS=7200 AI_COOLDOWN_WAIT_PASSES=40 "
            f"PUBLISHED_FILE={shlex.quote(published_file)} FAILED_LOG_FILE={shlex.quote(failed_file)} "
            f"PUBLISHED_RUN_ID={shlex.quote(run_id)} "
            "STRICT_PUBLISH=1 NVIDIA_TIMEOUT_MS=15000 GROQ_MAX_TOKENS=6000 "
            "MULTI_AI_CANDIDATES=0 ASSIGN_PROVIDER_PER_CITY=1 STRICT_CITY_PROVIDER=0 "
            "CLOUDFLARE_MODEL=@cf/meta/llama-3.3-70b-instruct-fp8-fast "
            f"AI_PROVIDER_ORDER={AI_PROVIDER_ORDER} pnpm seo:prompt-bank:cloudflare",
            cwd=WORKDIR,
            timeout=21000,
        )

        published_path = Path(WORKDIR, published_file)
        failed_path = Path(WORKDIR, failed_file)
        published_state = json.loads(published_path.read_text(encoding="utf-8")) if published_path.exists() else {"drafts": []}
        failed_state = json.loads(failed_path.read_text(encoding="utf-8")) if failed_path.exists() else {"drafts": []}
        ready_entries = [entry for entry in published_state.get("drafts", []) if entry.get("status") == "ready"]
        if len(ready_entries) != 1 or ready_entries[-1].get("route") != route:
            raise RuntimeError(f"Route {route} did not publish exactly one ready article: {ready_entries}")
        run(
            f"BASE_URL=https://fanju.app URLS={shlex.quote(route)} node scripts/seo/check-live-article-content-soft.mjs",
            cwd=WORKDIR,
            timeout=900,
        )
        run(
            f"URLS={shlex.quote(route)} URL_LIMIT=1 STRICT_PUBLISH=1 pnpm seo:cloudflare:submit",
            cwd=WORKDIR,
            timeout=900,
        )
        summaries.append({"route": route, "ready": ready_entries[-1], "failed": failed_state.get("drafts", [])})

    output_root = Path(OUTPUT_ROOT) / run_id
    output_root.mkdir(parents=True, exist_ok=True)
    write_manifest(output_root / "run-manifest.json", {"runId": run_id, "routes": routes, "summaries": summaries})
    volume.commit()
    print(f"TARGET_CLOUDFLARE_RUN_ID={run_id}", flush=True)
    print(json.dumps(summaries, ensure_ascii=False, indent=2), flush=True)
    return {"ok": True, "runId": run_id, "summaries": summaries}


@app.function(
    image=image,
    secrets=[legacy_secret],
    volumes={OUTPUT_ROOT: volume},
    timeout=21600,
)
def test_target_city_articles():
    """Generate the known missing city article routes on Modal using the ready-draft pipeline."""
    target_routes = [
        "/en/city/hangzhou/curated-dinner",
        "/en/city/san-francisco/newcomer-dinner",
        "/en/city/tokyo/curated-dinner",
        "/city/fuzhou/stranger-dinner",
        "/city/jinan/chinese-social-dining",
        "/city/ningbo/newcomer-dinner",
    ]
    target_slugs = [
        "en-hangzhou-curated-dinner",
        "en-san-francisco-newcomer-dinner",
        "en-tokyo-curated-dinner",
        "fuzhou-stranger-dinner",
        "jinan-chinese-social-dining",
        "ningbo-newcomer-dinner",
    ]
    started = utc_now()
    run_id = f"target-city-articles-{make_run_id(started)}"
    prepare_workdir()
    ensure_dependencies()
    for slug in target_slugs:
        for relative_dir in ["content/seo-ready", "content/seo-ai-drafts"]:
            path = Path(WORKDIR, relative_dir, f"{slug}.md")
            if path.exists():
                path.unlink()

    zh_routes = [route for route in target_routes if not route.startswith("/en/")]
    en_routes = [route for route in target_routes if route.startswith("/en/")]
    zh_drafts_file = f"dist/seo/{run_id}-generated-drafts-zh.json"
    en_drafts_file = f"dist/seo/{run_id}-generated-drafts-en.json"

    def run_ready_pipeline(lang: str, routes: list[str], drafts_file: str) -> None:
        if not routes:
            return

        routes_csv = ",".join(routes)
        command = "pnpm seo:drafts:router:en" if lang == "en" else "pnpm seo:drafts:router"
        max_tokens = "5200" if lang == "en" else "4200"

        run(
            " ".join(
                [
                    f"LANG={lang}",
                    f"LIMIT={len(routes)}",
                    "MIN_SCORE=90",
                    f"MAX_TOKENS={max_tokens}",
                    "TIMEOUT_MS=90000",
                    "RATE_DELAY_MS=15000",
                    "MAX_PER_CITY_PER_RUN=1",
                    "RANDOMIZE_OPPORTUNITIES=0",
                    "QUALITY_ATTEMPTS=5",
                    "QUALITY_RETRY_DELAY_MS=240000",
                    "AI_COOLDOWN_WAIT_PASSES=40",
                    f"AI_PROVIDER_ORDER={AI_PROVIDER_ORDER}",
                    f"TARGET_ROUTES={shlex.quote(routes_csv)}",
                    f"GENERATED_DRAFTS_FILE={shlex.quote(drafts_file)}",
                    'PUBLISHED_FILE="data/seo/published-ready-drafts.json"',
                    command,
                ]
            ),
            cwd=WORKDIR,
            timeout=21000,
        )
        run(f"GENERATED_DRAFTS_FILE={shlex.quote(drafts_file)} pnpm seo:fix-drafts", cwd=WORKDIR, timeout=600)
        run(f"GENERATED_DRAFTS_FILE={shlex.quote(drafts_file)} MIN_SCORE=90 pnpm seo:promote-ready", cwd=WORKDIR, timeout=600)

    run("pnpm seo:opportunities", cwd=WORKDIR, timeout=600)
    run_ready_pipeline("zh", zh_routes, zh_drafts_file)
    run_ready_pipeline("en", en_routes, en_drafts_file)
    run("pnpm generate:sitemaps", cwd=WORKDIR, timeout=600)
    run("node scripts/check-seo-ready-routes.mjs || true", cwd=WORKDIR, timeout=120)

    def load_drafts(relative_path: str) -> list[dict]:
        drafts_path = Path(WORKDIR, relative_path)
        if not drafts_path.exists():
            return []
        return json.loads(drafts_path.read_text(encoding="utf-8")).get("drafts", [])

    draft_entries = load_drafts(zh_drafts_file) + load_drafts(en_drafts_file)
    ready_entries = []
    failed_entries = []
    for entry in draft_entries:
        ready_path = Path(WORKDIR, "content/seo-ready", entry.get("file", ""))
        if ready_path.exists():
            ready_raw = ready_path.read_text(encoding="utf-8")
            score = None
            for line in ready_raw.splitlines():
                if line.startswith("aiQualityScore:"):
                    score = int(line.split(":", 1)[1].strip())
                    break
            ready_entries.append(
                {
                    "file": entry.get("file"),
                    "route": entry.get("canonicalPath"),
                    "score": score,
                    "provider": entry.get("provider"),
                }
            )
        else:
            failed_entries.append(entry)

    output_root = Path(OUTPUT_ROOT) / run_id
    output_root.mkdir(parents=True, exist_ok=True)
    generated_ready_dir = output_root / "generated-ready"
    generated_ready_dir.mkdir(parents=True, exist_ok=True)
    for entry in ready_entries:
        source = Path(WORKDIR, "content/seo-ready", entry["file"])
        if source.exists():
            shutil.copy2(source, generated_ready_dir / entry["file"])

    copy_output_path("content/seo-ready", output_root)
    copy_output_path(zh_drafts_file, output_root)
    copy_output_path(en_drafts_file, output_root)
    copy_output_path("public/sitemap.xml", output_root)
    copy_output_path("public/sitemap-index.xml", output_root)
    write_manifest(
        output_root / "run-manifest.json",
        {
            "runId": run_id,
            "targetRoutes": target_routes,
            "readyCount": len(ready_entries),
            "failedCount": len(failed_entries),
            "ready": ready_entries,
            "failed": failed_entries,
        },
    )
    volume.commit()
    ok = len(ready_entries) == len(target_routes) and all((entry.get("score") or 0) >= 90 for entry in ready_entries)
    print(f"TARGET_READY_RUN_ID={run_id}", flush=True)
    print(json.dumps({"ready": ready_entries, "failed": failed_entries}, ensure_ascii=False, indent=2), flush=True)

    return {
        "ok": ok,
        "runId": run_id,
        "targetRoutes": target_routes,
        "readyCount": len(ready_entries),
        "failedCount": len(failed_entries),
        "ready": ready_entries,
        "failed": failed_entries,
    }


@app.function(
    image=image,
    secrets=[legacy_secret],
    volumes={OUTPUT_ROOT: volume},
    timeout=21600,
)
def publish_prompt_bank_to_cloudflare_rounds(rounds: int = 10, run_limit: int = 2, upload_r2: bool = True):
    """Run the real prompt-bank -> GitHub main -> Cloudflare Pages -> URL-submit flow multiple times."""
    return run_cloudflare_publish_pipeline(rounds=rounds, run_limit=run_limit, upload_r2=upload_r2, submit_platforms="all")


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


@app.function(image=image, secrets=[legacy_secret])
def check_keys():
    """Check which AI keys are loaded: python3 -m modal run modal_growth_agent.py::check_keys"""
    import os
    for prefix in ["GROQ_API_KEY", "CEREBRAS_API_KEY", "NVIDIA_API_KEY", "GEMINI_API_KEY", "OPENROUTER_API_KEY"]:
        found = [k for k in [prefix] + [f"{prefix}_{i}" for i in range(2, 11)] if os.environ.get(k)]
        print(f"{prefix}: {len(found)} key(s) found: {found or 'NONE'}", flush=True)
    for k in ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_AI_API_TOKEN", "CLOUDFLARE_API_TOKEN", "GITHUB_TOKEN", "GH_TOKEN", "GITHUB_REPOSITORY", "GITHUB_REPO"]:
        print(f"{k}: {'SET' if os.environ.get(k) else 'MISSING'}", flush=True)


@app.function(image=image, secrets=[legacy_secret])
def test_keys():
    """Test every AI key with a real request: python3 -m modal run modal_growth_agent.py::test_keys"""
    import subprocess
    prepare_workdir()
    ensure_dependencies()
    result = subprocess.run(["node", "scripts/seo/test-all-keys.mjs"], cwd=WORKDIR, capture_output=False)
    print(f"Exit code: {result.returncode}", flush=True)
