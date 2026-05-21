from __future__ import annotations

import os
import re
from datetime import datetime, timezone

import httpx


class Adapter:
    """Bluesky AT Protocol publisher."""

    platform = "bluesky"

    def _extract_text(self, md: str) -> str:
        body = re.sub(r"^---[\s\S]*?---\n", "", md.strip())
        # Bluesky has a 300 grapheme limit; keep it short.
        return body[:280].strip()

    async def publish(self, markdown_content: str) -> dict:
        text = self._extract_text(markdown_content)
        identifier = os.environ.get("BLUESKY_IDENTIFIER", "")
        password = os.environ.get("BLUESKY_APP_PASSWORD", "")
        if not identifier or not password:
            raise RuntimeError("BLUESKY_IDENTIFIER or BLUESKY_APP_PASSWORD not set")

        # Create session
        session = httpx.post(
            "https://bsky.social/xrpc/com.atproto.server.createSession",
            json={"identifier": identifier, "password": password},
            timeout=20,
        ).json()
        access_jwt = session.get("accessJwt")
        did = session.get("did")
        if not access_jwt:
            raise RuntimeError(f"Bluesky auth failed: {session}")

        # Create post
        post = httpx.post(
            "https://bsky.social/xrpc/com.atproto.repo.createRecord",
            headers={"Authorization": f"Bearer {access_jwt}"},
            json={
                "repo": did,
                "collection": "app.bsky.feed.post",
                "record": {
                    "$type": "app.bsky.feed.post",
                    "text": text,
                    "createdAt": datetime.now(timezone.utc).isoformat(),
                },
            },
            timeout=20,
        ).json()
        uri = post.get("uri", "")
        # Convert at:// URI to a public web URL
        if uri:
            parts = uri.split("/")
            rkey = parts[-1] if parts else ""
            url = f"https://bsky.app/profile/{identifier}/post/{rkey}"
        else:
            url = ""
        return {"url": url}
