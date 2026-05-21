from __future__ import annotations

import os
import re

import httpx


class Adapter:
    """Reddit OAuth2 (script app) publisher."""

    platform = "reddit"

    def _extract(self, md: str) -> tuple[str, str]:
        title = re.search(r'^title:\s*"?(.+?)"?\s*$', md, re.MULTILINE)
        body = re.sub(r"^---[\s\S]*?---\n", "", md.strip())
        return title.group(1) if title else "Fanju Article", body

    async def publish(self, markdown_content: str) -> dict:
        title, body = self._extract(markdown_content)
        client_id = os.environ.get("REDDIT_CLIENT_ID", "")
        client_secret = os.environ.get("REDDIT_CLIENT_SECRET", "")
        username = os.environ.get("REDDIT_USERNAME", "")
        password = os.environ.get("REDDIT_PASSWORD", "")
        subreddit = os.environ.get("REDDIT_SUBREDDIT", "test")

        if not all([client_id, client_secret, username, password]):
            raise RuntimeError("Reddit credentials missing")

        ua = "fanju-lab/0.1"
        # OAuth password grant
        auth = httpx.BasicAuth(client_id, client_secret)
        token_res = httpx.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=auth,
            data={"grant_type": "password", "username": username, "password": password},
            headers={"User-Agent": ua},
            timeout=20,
        ).json()
        access_token = token_res.get("access_token")
        if not access_token:
            raise RuntimeError(f"Reddit auth failed: {token_res}")

        submit = httpx.post(
            "https://oauth.reddit.com/api/submit",
            headers={"Authorization": f"bearer {access_token}", "User-Agent": ua},
            data={
                "sr": subreddit,
                "kind": "self",
                "title": title[:300],
                "text": body[:40000],
                "api_type": "json",
            },
            timeout=30,
        ).json()
        data = submit.get("json", {}).get("data", {})
        return {"url": data.get("url", "")}
