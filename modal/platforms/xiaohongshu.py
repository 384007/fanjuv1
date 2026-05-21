from __future__ import annotations

from playwright.async_api import async_playwright

from modal.platforms.base_adapter import BaseAdapter


class Adapter(BaseAdapter):
    platform = "xiaohongshu"

    async def publish(self, markdown_content: str) -> dict:
        lines = markdown_content.split("\n")
        title = next(
            (l.replace("title:", "").strip().strip('"') for l in lines if l.startswith("title:")),
            "Fanju",
        )

        async with async_playwright() as p:
            context = await self._new_context(p)
            page = await context.new_page()
            await page.goto("https://creator.xiaohongshu.com/publish/publish", wait_until="networkidle")
            await self._random_delay(3, 5)

            await page.locator("text=上传图文").click()
            await self._random_delay()

            title_input = page.locator("input[placeholder*='标题']").first
            await title_input.fill(title[:20])

            body_input = page.locator("textarea, [contenteditable=true]").first
            await body_input.click()
            await page.keyboard.type(markdown_content[:1000], delay=8)
            await self._random_delay(2, 3)

            await page.locator("button:has-text('发布')").first.click()
            await self._random_delay(4, 6)
            url = page.url
            await context.close()
            return {"url": url}
