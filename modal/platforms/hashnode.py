from __future__ import annotations

import os
import re

import httpx


class Adapter:
    """Hashnode GraphQL API publisher."""

    platform = "hashnode"

    def _extract(self, md: str) -> tuple[str, str]:
        title = re.search(r'^title:\s*"?(.+?)"?\s*$', md, re.MULTILINE)
        body = re.sub(r"^---[\s\S]*?---\n", "", md.strip())
        return title.group(1) if title else "Fanju Article", body

    async def publish(self, markdown_content: str) -> dict:
        title, body = self._extract(markdown_content)
        api_key = os.environ.get("HASHNODE_API_KEY", "")
        publication_id = os.environ.get("HASHNODE_PUBLICATION_ID", "")
        if not api_key or not publication_id:
            raise RuntimeError("HASHNODE_API_KEY or HASHNODE_PUBLICATION_ID not set")

        query = """
        mutation PublishPost($input: PublishPostInput!) {
          publishPost(input: $input) { post { id slug url } }
        }
        """
        variables = {
            "input": {
                "title": title,
                "contentMarkdown": body,
                "publicationId": publication_id,
                "tags": [{"slug": "social", "name": "Social"}],
            }
        }
        res = httpx.post(
            "https://gql.hashnode.com/",
            headers={"Authorization": api_key, "Content-Type": "application/json"},
            json={"query": query, "variables": variables},
            timeout=30,
        )
        data = res.json()
        post = data.get("data", {}).get("publishPost", {}).get("post", {})
        return {"url": post.get("url", "")}
