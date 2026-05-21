from __future__ import annotations

from playwright.async_api import async_playwright

from modal.platforms.base_adapter import BaseAdapter


class Adapter(BaseAdapter):
    platform = "weibo"

    async def publish(self, markdown_content: str) -> dict:
        # Weibo: post the first 140 chars of body as a status update.
        body_lines = [l for l in markdown_content.split("\n") if not l.startswith("---") and not l.startswith("title:") and not l.startswith("description:")]
        body = "\n".join(body_lines).strip()[:140]

        async with async_playwright() as p:
            context = await self._new_context(p)
            page = await context.new_page()
            await page.goto("https://weibo.com/", wait_until="networkidle")
            await self._random_delay(2, 3)

            textarea = page.locator("textarea").first
            await textarea.click()
            await page.keyboard.type(body, delay=8)
            await self._random_delay()

            await page.locator("button:has-text('发布'), button:has-text('发送')").first.click()
            await self._random_delay(3, 5)
            url = page.url
            await context.close()
            return {"url": url}
