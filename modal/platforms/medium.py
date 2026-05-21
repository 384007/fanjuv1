from __future__ import annotations

import os
import re

import httpx


class Adapter:
    """Medium REST API publisher (legacy v1 API)."""

    platform = "medium"

    def _extract(self, md: str) -> tuple[str, str]:
        title = re.search(r'^title:\s*"?(.+?)"?\s*$', md, re.MULTILINE)
        body = re.sub(r"^---[\s\S]*?---\n", "", md.strip())
        return title.group(1) if title else "Fanju Article", body

    async def publish(self, markdown_content: str) -> dict:
        title, body = self._extract(markdown_content)
        api_key = os.environ.get("MEDIUM_API_KEY", "")
        if not api_key:
            raise RuntimeError("MEDIUM_API_KEY not set")

        me = httpx.get(
            "https://api.medium.com/v1/me",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=20,
        ).json()
        user_id = me.get("data", {}).get("id")
        if not user_id:
            raise RuntimeError("Medium: failed to fetch user id")

        res = httpx.post(
            f"https://api.medium.com/v1/users/{user_id}/posts",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "title": title,
                "contentFormat": "markdown",
                "content": f"# {title}\n\n{body}",
                "tags": ["fanju", "social-dining"],
                "publishStatus": "public",
            },
            timeout=30,
        )
        data = res.json()
        return {"url": data.get("data", {}).get("url", "")}
