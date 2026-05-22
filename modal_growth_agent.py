from __future__ import annotations

import json
import os
import re
import shlex
import shutil
import subprocess
import tarfile
from datetime import datetime, timezone
from pathlib import Path

import modal

app = modal.App("fanju-growth-agent")
CUSTOM_SECRET = modal.Secret.from_name("custom-secret")
hourly_schedule = None if os.environ.get("FANJU_DISABLE_MODAL_SCHEDULE") == "1" else modal.Cron("0 * * * *", timezone="Asia/Singapore")

APP_DIR = "/app"
REPO_ROOT = Path(__file__).resolve().parent
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
AI_KEY_PREFIXES = [
    "GROQ_API_KEY",
    "CEREBRAS_API_KEY",
    "NVIDIA_API_KEY",
    "GEMINI_API_KEY",
    "OPENROUTER_API_KEY",
]
COOKIE_PLATFORMS = [
    "zhihu",
    "csdn",
    "juejin",
    "jianshu",
    "weibo",
    "xiaohongshu",
    "douban",
    "toutiao",
    "baijiahao",
    "bilibili",
]
API_PLATFORM_KEYS = {
    "devto": ["DEVTO_API_KEY"],
    "hashnode": ["HASHNODE_API_KEY", "HASHNODE_PUBLICATION_ID"],
    "medium": ["MEDIUM_API_KEY"],
    "bluesky": ["BLUESKY_IDENTIFIER", "BLUESKY_APP_PASSWORD"],
    "reddit": ["REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USERNAME", "REDDIT_PASSWORD"],
}
PRODUCTION_SUBMIT_PLATFORMS = ["indexnow", "baidu", "gist", "devto", "bluesky", "wordpress"]

image = (
    modal.Image.debian_slim()
    .apt_install("curl", "ca-certificates", "git")
    .run_commands(
        "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -",
        "apt-get install -y nodejs",
        "npm i -g pnpm@9.15.9",
    )
    .add_local_dir(
        str(REPO_ROOT),
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
            ".cookie-profiles",
            "*_COOKIES.txt",
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


def run_args(args: list[str], cwd: str | None = None, timeout: int = 300, redacted: str | None = None) -> None:
    print(f"$ {redacted or shlex.join(args)}", flush=True)
    result = subprocess.run(args, cwd=cwd, text=True, timeout=timeout)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed with exit code {result.returncode}: {redacted or shlex.join(args)}")


def run_capture(args: list[str], cwd: str | None = None, timeout: int = 300) -> str:
    result = subprocess.run(args, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
    if result.returncode != 0:
        raise RuntimeError(f"Command failed with exit code {result.returncode}: {shlex.join(args)}\n{result.stderr}")
    return result.stdout.strip()


def run_shell_status(cmd: str, cwd: str | None = None, timeout: int = 300) -> int:
    print(f"$ {cmd}", flush=True)
    result = subprocess.run(cmd, shell=True, cwd=cwd, text=True, timeout=timeout)
    return result.returncode


def run_shell_capture_status(cmd: str, cwd: str | None = None, timeout: int = 300) -> tuple[int, str]:
    print(f"$ {cmd}", flush=True)
    result = subprocess.run(cmd, shell=True, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout)
    if result.stdout:
        print(result.stdout, flush=True)
    return result.returncode, result.stdout or ""


def github_token() -> str:
    return (os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN") or "").strip()


def github_repository() -> str:
    return (
        os.environ.get("GITHUB_REPOSITORY")
        or os.environ.get("GITHUB_REPO")
        or "384007/fanjuv1"
    ).strip().removeprefix("https://github.com/").removesuffix(".git")


def configured_env_names(names: list[str]) -> list[str]:
    """Return configured key names only. Never return secret values."""
    return [name for name in names if os.environ.get(name)]


def count_numbered_keys(prefix: str, max_index: int = 10) -> list[str]:
    names = [prefix] + [f"{prefix}_{index}" for index in range(2, max_index + 1)]
    return configured_env_names(names)


def collect_secret_health() -> dict:
    ai_keys = {
        prefix: {
            "count": len(found),
            "configuredNames": found,
        }
        for prefix in AI_KEY_PREFIXES
        for found in [count_numbered_keys(prefix)]
    }
    github = {
        "token": "set" if github_token() else "missing",
        "repository": "set" if (os.environ.get("GITHUB_REPOSITORY") or os.environ.get("GITHUB_REPO")) else "default:384007/fanjuv1",
    }
    cloudflare_token = bool(os.environ.get("CLOUDFLARE_API_TOKEN") or os.environ.get("CLOUDFLARE_AUTH_TOKEN"))
    cloudflare = {
        "accountId": "set" if os.environ.get("CLOUDFLARE_ACCOUNT_ID") else "missing",
        "apiToken": "set" if cloudflare_token else "missing",
        "aiToken": "set" if os.environ.get("CLOUDFLARE_AI_API_TOKEN") else "missing",
        "pagesDeployHook": "set" if os.environ.get("CF_PAGES_DEPLOY_HOOK") else "skipped",
    }
    platforms = {}
    for platform in COOKIE_PLATFORMS:
        key = f"{platform.upper()}_COOKIES"
        platforms[platform] = {
            "authType": "cookie",
            "configured": bool(os.environ.get(key)),
            "requiredKeys": [key],
        }
    for platform, keys in API_PLATFORM_KEYS.items():
        present = configured_env_names(keys)
        platforms[platform] = {
            "authType": "api-key",
            "configured": len(present) == len(keys),
            "configuredKeyCount": len(present),
            "requiredKeyCount": len(keys),
            "requiredKeys": keys,
        }
    return {
        "secret": "custom-secret",
        "aiKeys": ai_keys,
        "github": github,
        "cloudflare": cloudflare,
        "platforms": platforms,
    }


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


def git_commit_and_push(routes: list[str], run_id: str, round_no: int) -> dict:
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
    run_args(["git", "fetch", "origin", "main"], cwd=WORKDIR, timeout=300)
    run_args(["git", "rebase", "--autostash", "origin/main"], cwd=WORKDIR, timeout=300)
    run_args(["git", "push", "origin", "main"], cwd=WORKDIR, timeout=900)
    sha = run_capture(["git", "rev-parse", "HEAD"], cwd=WORKDIR)
    print(f"GITHUB_MAIN_COMMIT={sha}", flush=True)
    pages_deploy = trigger_pages_deploy()
    return {"commitSha": sha, "pagesDeploy": pages_deploy}


def trigger_pages_deploy() -> dict:
    hook_url = os.environ.get("CF_PAGES_DEPLOY_HOOK", "").strip()
    if not hook_url:
        print("CF_PAGES_DEPLOY_HOOK not set; skipping Pages deploy trigger", flush=True)
        return {"configured": False, "triggered": False, "status": "skipped", "reason": "CF_PAGES_DEPLOY_HOOK not set"}
    import urllib.request
    req = urllib.request.Request(hook_url, method="POST", data=b"")
    with urllib.request.urlopen(req, timeout=30) as resp:
        print(f"PAGES_DEPLOY_TRIGGERED status={resp.status}", flush=True)
        return {"configured": True, "triggered": True, "status": "triggered", "statusCode": resp.status}


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
    r"本站|联系QQ|本地联系|站长|广告合作|域名出售|私下交易|加微信|加QQ|备案号|"
    r"\bQQ\b|domain\s+for\s+sale|parked\s+domain|advertising\s+cooperation|"
    r"开头段落|正文要求|只返回合法 JSON|"
    r"markdown skeleton|Return valid JSON|Body requirements|Intro paragraph mentioning",
    re.I,
)


def load_json_state(relative_path: str) -> dict:
    state_path = Path(WORKDIR, relative_path)
    if not state_path.exists():
        return {"drafts": []}
    return json.loads(state_path.read_text(encoding="utf-8"))


def load_submission_report(relative_path: str) -> dict:
    report_path = Path(WORKDIR, relative_path)
    if not report_path.exists():
        return {
            "submittedPlatforms": [],
            "failedPlatforms": [],
            "failedReasons": {"submission": "report file missing"},
        }
    return json.loads(report_path.read_text(encoding="utf-8"))


def requested_submit_platforms(value: str) -> list[str]:
    safe = (value or "all").strip().lower()
    if safe == "all":
        return PRODUCTION_SUBMIT_PLATFORMS
    return [item for item in safe.split(",") if item]


def skipped_submission_report(reason: str, platforms: str) -> dict:
    requested = requested_submit_platforms(platforms)
    return {
        "submittedPlatforms": [],
        "failedPlatforms": requested,
        "failedReasons": {platform: reason for platform in requested},
        "skipped": True,
    }


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


def validate_ready_entries(entries: list[dict], min_score: int = 90) -> None:
    bad_entries = [
        entry
        for entry in entries
        if (entry.get("score") or 0) < min_score
        or BAD_PUBLIC_METADATA_RE.search(json.dumps(entry, ensure_ascii=False))
    ]
    if bad_entries:
        raise RuntimeError(f"Invalid published metadata: {bad_entries[:2]}")


def run_cloudflare_publish_pipeline(
    rounds: int = 1,
    run_limit: int = 6,
    upload_r2: bool = True,
    submit_platforms: str = "all",
) -> dict:
    """Production path: generate articles, commit Markdown to GitHub main, let Cloudflare Pages deploy, then submit URLs."""
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
        submission_report_file = f"dist/seo/{run_id}-round-{round_no}-submission.json"

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
            "STRICT_PUBLISH=1 NVIDIA_TIMEOUT_MS=15000 GROQ_MAX_TOKENS=6000 "
            "MULTI_AI_CANDIDATES=0 ASSIGN_PROVIDER_PER_CITY=1 STRICT_CITY_PROVIDER=0 "
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
        # Run check as info only - generation quality gate (score>=90) is the single source of truth
        subprocess.run(
            "node scripts/check-seo-ready-routes.mjs || true",
            shell=True, cwd=WORKDIR, capture_output=False, timeout=120
        )
        commit_result = git_commit_and_push(routes, run_id, round_no)
        # Wait for CF Pages build to finish (max 5 min), then submit
        live_check_passed = True
        live_check_error = None
        try:
            wait_for_live_routes(routes, max_attempts=10, delay_seconds=30)
        except RuntimeError as exc:
            live_check_passed = False
            live_check_error = str(exc)
            print(f"WARN: routes not live yet after 5min; skipping platform submission: {live_check_error}", flush=True)

        if live_check_passed:
            submit_routes = ",".join(routes)
            submit_code, _submit_output = run_shell_capture_status(
                f"URLS={shlex.quote(submit_routes)} URL_LIMIT={safe_run_limit} PLATFORMS={safe_platforms} "
                f"SUBMISSION_REPORT_FILE={shlex.quote(submission_report_file)} "
                "STRICT_PUBLISH=1 pnpm seo:cloudflare:submit",
                cwd=WORKDIR,
                timeout=1200,
            )
            submission_report = load_submission_report(submission_report_file)
            if submit_code != 0:
                submission_report.setdefault("failedReasons", {})
                submission_report["failedReasons"]["submission-command"] = f"exit code {submit_code}"
        else:
            submission_report = skipped_submission_report(live_check_error or "live check failed", safe_platforms)

        round_summary = {
            "round": round_no,
            "seed": round_seed,
            "publishedFile": published_file,
            "failedFile": failed_file,
            "submissionReportFile": submission_report_file,
            "publishedTotal": len(ready_entries),
            "failedTotal": len(failed_state.get("drafts", [])),
            "latest": latest_entries,
            "routes": routes,
            "commitSha": commit_result["commitSha"],
            "pagesDeploy": commit_result["pagesDeploy"],
            "liveCheckPassed": live_check_passed,
            "liveCheckError": live_check_error,
            "submittedPlatforms": submission_report.get("submittedPlatforms", []),
            "failedPlatforms": submission_report.get("failedPlatforms", []),
            "failedReasons": submission_report.get("failedReasons", {}),
        }
        round_summaries.append(round_summary)
        print(f"PRODUCTION_ROUND_OK {round_no}/{safe_rounds} routes={','.join(routes)}", flush=True)

    output_root = Path(OUTPUT_ROOT) / run_id
    output_root.mkdir(parents=True, exist_ok=True)
    copy_output_path("data/seo/route-manifest.json", output_root)
    copy_output_path("data/seo/random-prompt-bank.jsonl", output_root)
    copy_output_path("dist/seo", output_root)
    routes = [route for summary in round_summaries for route in summary.get("routes", [])]
    commit_shas = [summary.get("commitSha") for summary in round_summaries if summary.get("commitSha")]
    submitted_platforms = sorted(
        {platform for summary in round_summaries for platform in summary.get("submittedPlatforms", [])}
    )
    failed_platforms = sorted(
        {platform for summary in round_summaries for platform in summary.get("failedPlatforms", [])}
    )
    failed_reasons = {
        f"round-{summary.get('round')}:{platform}": reason
        for summary in round_summaries
        for platform, reason in summary.get("failedReasons", {}).items()
    }
    live_check_passed = all(summary.get("liveCheckPassed") for summary in round_summaries)
    run_status = "success" if live_check_passed and not failed_platforms else "partial"
    write_manifest(
        output_root / "run-manifest.json",
        {
            "runId": run_id,
            "startedAt": started_at,
            "finishedAt": utc_now().isoformat(),
            "status": run_status,
            "publishedBy": "cloudflare",
            "contentPublishedBy": "github-main",
            "routes": routes,
            "commitSha": commit_shas[-1] if commit_shas else None,
            "commitShas": commit_shas,
            "liveCheckPassed": live_check_passed,
            "submittedPlatforms": submitted_platforms,
            "failedPlatforms": failed_platforms,
            "failedReasons": failed_reasons,
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
        "status": run_status,
        "runId": run_id,
        "publishedBy": "cloudflare",
        "contentPublishedBy": "github-main",
        "routes": routes,
        "commitSha": commit_shas[-1] if commit_shas else None,
        "commitShas": commit_shas,
        "liveCheckPassed": live_check_passed,
        "submittedPlatforms": submitted_platforms,
        "failedPlatforms": failed_platforms,
        "failedReasons": failed_reasons,
        "rounds": safe_rounds,
        "runLimit": safe_run_limit,
        "uploadR2": upload_r2,
        "submitPlatforms": safe_platforms,
        "roundSummaries": round_summaries,
    }


@app.function(
    image=image,
    secrets=[CUSTOM_SECRET],
    volumes={OUTPUT_ROOT: volume},
    timeout=21600,
    schedule=hourly_schedule,
)
def hourly_publish_cron():
    return run_cloudflare_publish_pipeline(rounds=1, run_limit=10, upload_r2=True, submit_platforms="all")


@app.function(
    image=image,
    secrets=[CUSTOM_SECRET],
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
    secrets=[CUSTOM_SECRET],
    volumes={OUTPUT_ROOT: volume},
    timeout=21600,
)
def publish_prompt_bank_to_cloudflare(run_limit: int = 6, upload_r2: bool = True):
    """Publish ready prompt-bank articles to GitHub main plus Cloudflare D1/R2."""
    return run_cloudflare_publish_pipeline(rounds=1, run_limit=run_limit, upload_r2=upload_r2, submit_platforms="all")


@app.function(
    image=image,
    secrets=[CUSTOM_SECRET],
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
            f"UPLOAD_R2={upload_r2_flag} MIN_SCORE=90 AUTO_REPAIR_ARTICLE=1 QUALITY_ATTEMPTS=5 QUALITY_RETRY_DELAY_MS=240000 MAX_TOKENS=7200 AI_COOLDOWN_WAIT_PASSES=40 "
            f"PUBLISHED_FILE={shlex.quote(published_file)} FAILED_LOG_FILE={shlex.quote(failed_file)} "
            "STRICT_PUBLISH=1 NVIDIA_TIMEOUT_MS=15000 GROQ_MAX_TOKENS=6000 "
            "MULTI_AI_CANDIDATES=0 ASSIGN_PROVIDER_PER_CITY=1 STRICT_CITY_PROVIDER=0 "
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
    secrets=[CUSTOM_SECRET],
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
    secrets=[CUSTOM_SECRET],
    volumes={OUTPUT_ROOT: volume},
    timeout=21600,
)
def publish_prompt_bank_to_cloudflare_rounds(rounds: int = 10, run_limit: int = 2, upload_r2: bool = True):
    """Run the real prompt-bank -> GitHub main -> Cloudflare Pages -> URL-submit flow multiple times."""
    return run_cloudflare_publish_pipeline(rounds=rounds, run_limit=run_limit, upload_r2=upload_r2, submit_platforms="all")


@app.function(
    image=image,
    secrets=[CUSTOM_SECRET],
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
    secrets=[CUSTOM_SECRET],
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
    secrets=[CUSTOM_SECRET],
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


@app.function(image=image, secrets=[CUSTOM_SECRET])
def check_keys():
    """Check configured keys without printing any secret values."""
    health = collect_secret_health()
    print(json.dumps(health, indent=2, ensure_ascii=False), flush=True)
    return health


@app.function(image=image, secrets=[CUSTOM_SECRET])
def health_check():
    """Lightweight health check: python3 -m modal run modal_growth_agent.py::health_check"""
    health = collect_secret_health()
    print(json.dumps(health, indent=2, ensure_ascii=False), flush=True)
    return health


@app.function(image=image, secrets=[CUSTOM_SECRET])
def test_keys():
    """Test every AI key with a real request: python3 -m modal run modal_growth_agent.py::test_keys"""
    import subprocess
    prepare_workdir()
    ensure_dependencies()
    result = subprocess.run(["node", "scripts/seo/test-all-keys.mjs"], cwd=WORKDIR, capture_output=False)
    print(f"Exit code: {result.returncode}", flush=True)
    if result.returncode != 0:
        raise RuntimeError("AI key test failed; see log above.")
    return {"ok": True, "exitCode": result.returncode}
