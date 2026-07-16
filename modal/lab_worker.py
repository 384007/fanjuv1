"""
Fanju AI SEO Lab — Modal Worker
Handles: AI generation, SEO QC, platform rewrite, Playwright publish dispatch.

Article bodies live in a private GitHub content repo. D1 only stores task /
status metadata. R2 stores covers, error dumps, and SEO reports.
"""
from __future__ import annotations

import asyncio
import base64
import importlib
import json
import os
import re
from datetime import datetime
from typing import Any

import modal
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

# ── Modal image with Playwright ─────────────────────────────────────────────
image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        [
            "playwright",
            "anthropic",
            "httpx",
            "nanoid",
            "pygithub",
            "pillow",
            "openai",
            "fastapi",
            "pydantic",
        ]
    )
    .run_commands("playwright install chromium --with-deps")
)

app = modal.App("fanju-lab-worker", image=image)
web = FastAPI(title="Fanju Lab Worker")

# ── Secrets ─────────────────────────────────────────────────────────────────
SECRETS = modal.Secret.from_name("custom-secret")
# Required secret keys:
#   ANTHROPIC_API_KEY, GITHUB_TOKEN, GITHUB_REPO, GITHUB_CONTENT_OWNER
#   CF_WORKER_URL, CF_ADMIN_TOKEN
#   ZHIHU_COOKIES, CSDN_COOKIES, ... (base64 JSON per platform)


# ── Models ──────────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    topic: str
    lang: str = "zh"
    article_id: str


class RewriteRequest(BaseModel):
    job_id: str
    article_id: str
    platform: str
    github_path: str  # original article path


class PublishRequest(BaseModel):
    job_id: str
    platform: str
    rewrite_github_path: str
    article_id: str


class SeoCheckRequest(BaseModel):
    article_id: str
    github_path: str


# ── Helpers ─────────────────────────────────────────────────────────────────
def _short_error(exc: Exception, max_len: int = 200) -> str:
    """Return a cleaned, truncated error string safe for JSON responses."""
    msg = str(exc)
    msg = re.sub(r"\s+", " ", msg).strip()
    return msg[:max_len]


# ── Auth middleware ─────────────────────────────────────────────────────────
def verify_token(authorization: str = Header(default="")):
    token = os.environ.get("CF_ADMIN_TOKEN", "")
    if authorization != f"Bearer {token}":
        raise HTTPException(status_code=401, detail="unauthorized")


# ── GitHub helpers ──────────────────────────────────────────────────────────
def _github_repo_name() -> str:
    """
    Resolve the target GitHub repository.
    Supports two env-var styles:
      1. GITHUB_REPOSITORY=384007/fanjuv1   (single var, owner/repo format)
      2. GITHUB_CONTENT_OWNER=384007 + GITHUB_REPO=fanjuv1  (legacy two-var)
    """
    full = os.environ.get("GITHUB_REPOSITORY", "")
    if full and "/" in full:
        return full
    owner = os.environ.get("GITHUB_CONTENT_OWNER", "")
    repo = os.environ.get("GITHUB_REPO", "")
    if not owner or not repo:
        raise RuntimeError(
            "GitHub repo not configured. Set GITHUB_REPOSITORY=owner/repo "
            "or both GITHUB_CONTENT_OWNER and GITHUB_REPO."
        )
    return f"{owner}/{repo}"


def github_client():
    from github import Github

    return Github(os.environ["GITHUB_TOKEN"])


def read_github_file(path: str) -> str:
    g = github_client()
    repo = g.get_repo(_github_repo_name())
    return repo.get_contents(path).decoded_content.decode("utf-8")


def write_github_file(path: str, content: str, message: str) -> str:
    g = github_client()
    repo = g.get_repo(_github_repo_name())
    try:
        existing = repo.get_contents(path)
        repo.update_file(path, message, content, existing.sha)
    except Exception:
        repo.create_file(path, message, content)
    return path


def cf_update_job(job_id: str, data: dict):
    """Notify Cloudflare Worker to update job status in D1."""
    import httpx

    url = os.environ["CF_WORKER_URL"]
    token = os.environ["CF_ADMIN_TOKEN"]
    try:
        httpx.patch(
            f"{url}/api/lab/publish-jobs/{job_id}",
            json=data,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
    except Exception as e:
        print(f"[cf_update_job] failed: {e}")


# ── AI generation ───────────────────────────────────────────────────────────
@web.post("/generate")
async def generate_article(req: GenerateRequest, authorization: str = Header(default="")):
    verify_token(authorization)
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    lang_instruction = "用中文写" if req.lang == "zh" else "Write in English"
    prompt = f"""
你是 Fanju（饭局）的 SEO 内容编辑。Fanju 是一个社交聚餐平台，连接全球华语社群。
{lang_instruction}，为以下话题写一篇 1500-2500 字的 SEO 优化文章：

话题：{req.topic}

要求：
- 标题带核心关键词
- 副标题（H2/H3）结构清晰
- 自然融入 fanju.app 的内链（如 https://fanju.app 或相关城市页面）
- 结尾有 CTA，引导读者了解饭局
- 输出纯 Markdown 格式，不含任何代码块包裹

Frontmatter 格式：
---
title: "..."
description: "..."
lang: "{req.lang}"
topic: "{req.topic}"
generated_at: "{datetime.utcnow().isoformat()}"
article_id: "{req.article_id}"
---
"""
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.content[0].text

    date_str = datetime.utcnow().strftime("%Y/%m")
    github_path = f"content/articles/{date_str}/{req.article_id}.md"
    write_github_file(github_path, content, f"feat: generate article {req.article_id}")
    return {
        "github_path": github_path,
        "preview": content[:300],
        "article_id": req.article_id,
    }


# ── SEO Quality Check ───────────────────────────────────────────────────────
@web.post("/seo-check")
async def seo_check(req: SeoCheckRequest, authorization: str = Header(default="")):
    verify_token(authorization)
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    content = read_github_file(req.github_path)
    prompt = f"""
你是专业 SEO 质检员。分析以下文章并返回 JSON：

{{
  "score": 0-100,
  "issues": ["issue1", "issue2"],
  "title_ok": true/false,
  "meta_desc_ok": true/false,
  "word_count": number,
  "h2_count": number,
  "internal_links": number,
  "keyword_density": "ok"|"low"|"high",
  "cta_present": true/false,
  "verdict": "ready"|"needs_revision"|"reject"
}}

只返回 JSON，不要其他文字。

文章内容：
{content[:3000]}
"""
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()
    try:
        report = json.loads(raw)
    except Exception:
        report = {"score": 50, "verdict": "needs_revision", "issues": ["parse_error"]}

    return report


# ── Platform Rewrite ────────────────────────────────────────���───────────────
PLATFORM_STYLES = {
    "zhihu":       "知乎风格：专业深度，多用「我认为」「我的经验」，适合问答形式",
    "csdn":        "CSDN风格：技术向，加代码示例，清单式结构",
    "juejin":      "掘金风格：开发者社群，轻松但专业，多用 emoji",
    "jianshu":     "简书风格：文艺轻量，叙事性，段落简短",
    "weibo":       "微博风格：140字以内核心，加话题标签 #，情绪化标题",
    "xiaohongshu": "小红书风格：种草体，多 emoji，图文并茂，结尾加标签",
    "douban":      "豆瓣风格：文化味，深度思考，社区氛围",
    "toutiao":     "头条风格：标题党但真实，数字+悬念，下沉用户友好",
    "baijiahao":   "百家号风格：百度 SEO 优化，关键词堆叠合理，权威感",
    "bilibili":    "B站风格：年轻化，弹幕互动感，口语化",
    "devto":       "Dev.to style: English, developer-focused, code examples, conversational",
    "hashnode":    "Hashnode style: English, technical blog, clean structure, personal voice",
    "medium":      "Medium style: English, story-driven, reflective, global audience",
    "bluesky":     "Bluesky style: English, concise, 300 chars max, link + hook",
    "reddit":      "Reddit style: English, community tone, no self-promotion feel, value-first",
}


@web.post("/rewrite")
async def rewrite_for_platform(req: RewriteRequest, authorization: str = Header(default="")):
    verify_token(authorization)
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    original = read_github_file(req.github_path)
    style = PLATFORM_STYLES.get(req.platform, "通用风格")

    prompt = f"""
将以下 Fanju 文章改写为适合「{req.platform}」平台的版本。
风格要求：{style}

改写规则：
- 保留核心信息和 fanju.app 链接
- 适配平台字数限制和文化语境
- 标题必须重写
- 禁止与原文重复率超过 40%
- 输出纯 Markdown，加 frontmatter（platform: {req.platform}）

原文：
{original[:4000]}
"""
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )
    rewritten = response.content[0].text

    date_str = datetime.utcnow().strftime("%Y/%m")
    rewrite_path = f"content/rewrites/{date_str}/{req.article_id}_{req.platform}.md"
    write_github_file(
        rewrite_path,
        rewritten,
        f"feat: rewrite {req.article_id} for {req.platform}",
    )
    return {"rewrite_github_path": rewrite_path}


# ── Publish dispatcher ──────────────────────────────────────────────────────
PLATFORM_ADAPTER_MODULES = {
    "zhihu":    "modal.platforms.zhihu",
    "csdn":     "modal.platforms.csdn",
    "juejin":   "modal.platforms.juejin",
    "jianshu":  "modal.platforms.jianshu",
    "devto":    "modal.platforms.devto",
    "hashnode": "modal.platforms.hashnode",
    "medium":   "modal.platforms.medium",
    "bluesky":  "modal.platforms.bluesky",
    "reddit":   "modal.platforms.reddit",
    "weibo":    "modal.platforms.weibo",
    "xiaohongshu": "modal.platforms.xiaohongshu",
    "douban":   "modal.platforms.douban",
    "toutiao":  "modal.platforms.toutiao",
    "baijiahao": "modal.platforms.baijiahao",
    "bilibili": "modal.platforms.bilibili",
}


@web.post("/publish")
async def publish(req: PublishRequest, authorization: str = Header(default="")):
    verify_token(authorization)

    cf_update_job(req.job_id, {
        "status": "running",
        "started_at": datetime.utcnow().isoformat(),
    })

    content = read_github_file(req.rewrite_github_path)

    try:
        module_path = PLATFORM_ADAPTER_MODULES.get(req.platform)
        if not module_path:
            cf_update_job(req.job_id, {
                "status": "skipped",
                "error_msg": f"no adapter for {req.platform}",
                "finished_at": datetime.utcnow().isoformat(),
            })
            return {"status": "skipped", "reason": f"no adapter for {req.platform}"}

        mod = importlib.import_module(module_path)
        adapter = mod.Adapter()
        result = await adapter.publish(content)

        cf_update_job(req.job_id, {
            "status": "success",
            "published_url": result.get("url"),
            "finished_at": datetime.utcnow().isoformat(),
        })
        return {"status": "success", "url": result.get("url")}
    except Exception as e:
        cf_update_job(req.job_id, {
            "status": "failed",
            "error_msg": str(e)[:500],
            "finished_at": datetime.utcnow().isoformat(),
        })
        return {"status": "failed", "error": str(e)}


# ── Cookie validation ───────────────────────────────────────────────────────
class ValidateCookiesRequest(BaseModel):
    platforms: list[str]  # e.g. ["zhihu", "csdn"]


# Maps platform → URL to check login state (redirects to login = expired)
PLATFORM_CHECK_URLS: dict[str, str] = {
    "zhihu":        "https://www.zhihu.com/settings/profile",
    "csdn":         "https://mp.csdn.net/mp_blog/manage/article",
    "juejin":       "https://juejin.cn/user/center/following",
    "jianshu":      "https://www.jianshu.com/writer",
    "weibo":        "https://weibo.com/u/page/home",
    "xiaohongshu":  "https://creator.xiaohongshu.com/publish/publish",
    "douban":       "https://www.douban.com/mine/",
    "toutiao":      "https://mp.toutiao.com/profile_v4/index",
    "baijiahao":    "https://baijiahao.baidu.com/builder/rc/home",
    "bilibili":     "https://member.bilibili.com/platform/home",
    # API-key platforms — mark as valid if key is set, no browser check needed
    "devto":        "",
    "hashnode":     "",
    "medium":       "",
    "bluesky":      "",
    "reddit":       "",
}

LOGIN_PATTERNS = [
    "login", "signin", "sign-in", "passport", "accounts.google",
    "auth", "sso", "oauth", "register", "signup",
]


async def _check_one(platform: str) -> dict:
    """Returns {"valid": bool, "configured": bool, "error": str|None}"""
    key = f"{platform.upper()}_COOKIES"
    raw = os.environ.get(key, "")

    # API-key platforms
    if PLATFORM_CHECK_URLS.get(platform) == "":
        api_keys = {
            "devto":    "DEVTO_API_KEY",
            "hashnode": "HASHNODE_API_KEY",
            "medium":   "MEDIUM_API_KEY",
            "bluesky":  "BLUESKY_IDENTIFIER",
            "reddit":   "REDDIT_CLIENT_ID",
        }
        env_key = api_keys.get(platform, "")
        configured = bool(os.environ.get(env_key, ""))
        return {"valid": configured, "configured": configured, "error": None}

    if not raw:
        return {"valid": False, "configured": False, "error": "no cookie secret"}

    try:
        cookies = json.loads(base64.b64decode(raw).decode("utf-8"))
    except Exception as e:
        return {"valid": False, "configured": True, "error": f"cookie decode error: {e}"}

    check_url = PLATFORM_CHECK_URLS.get(platform)
    if not check_url:
        return {"valid": False, "configured": True, "error": "no check url"}

    try:
        from playwright.async_api import async_playwright
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            ctx = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
            )
            await ctx.add_cookies(cookies)
            page = await ctx.new_page()
            await page.goto(check_url, wait_until="domcontentloaded", timeout=20000)
            final_url = page.url.lower()
            await browser.close()

        expired = any(pat in final_url for pat in LOGIN_PATTERNS)
        return {"valid": not expired, "configured": True, "error": None}
    except Exception as e:
        return {"valid": False, "configured": True, "error": _short_error(e)}


@web.post("/validate-cookies")
async def validate_cookies(req: ValidateCookiesRequest, authorization: str = Header(default="")):
    verify_token(authorization)
    results = await asyncio.gather(*[_check_one(p) for p in req.platforms])
    return {p: r for p, r in zip(req.platforms, results)}


@app.function(secrets=[SECRETS], timeout=600)
@modal.asgi_app()
def lab_worker_web():
    return web
