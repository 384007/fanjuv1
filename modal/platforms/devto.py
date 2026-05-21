from __future__ import annotations

import os
import re

import httpx


class Adapter:
    """Dev.to uses REST API — no Playwright needed."""

    platform = "devto"

    def _extract(self, md: str) -> tuple[str, str, str]:
        title = re.search(r'^title:\s*"?(.+?)"?\s*$', md, re.MULTILINE)
        description = re.search(r'^description:\s*"?(.+?)"?\s*$', md, re.MULTILINE)
        body = re.sub(r"^---[\s\S]*?---\n", "", md.strip())
        return (
            title.group(1) if title else "Fanju Article",
            description.group(1) if description else "",
            body,
        )

    async def publish(self, markdown_content: str) -> dict:
        title, desc, body = self._extract(markdown_content)
        api_key = os.environ.get("DEVTO_API_KEY", "")
        if not api_key:
            raise RuntimeError("DEVTO_API_KEY not set")

        res = httpx.post(
            "https://dev.to/api/articles",
            headers={"api-key": api_key, "Content-Type": "application/json"},
            json={
                "article": {
                    "title": title,
                    "body_markdown": body,
                    "published": True,
                    "description": desc,
                    "tags": ["fanju", "social", "dining"],
                }
            },
            timeout=30,
        )
        data = res.json()
        return {"url": data.get("url", "")}
