from __future__ import annotations

from playwright.async_api import async_playwright

from modal.platforms.base_adapter import BaseAdapter


class Adapter(BaseAdapter):
    platform = "douban"

    async def publish(self, markdown_content: str) -> dict:
        lines = markdown_content.split("\n")
        title = next(
            (l.replace("title:", "").strip().strip('"') for l in lines if l.startswith("title:")),
            "Fanju 文章",
        )

        async with async_playwright() as p:
            context = await self._new_context(p)
            page = await context.new_page()
            await page.goto("https://www.douban.com/note/create", wait_until="networkidle")
            await self._random_delay(2, 3)

            await page.locator("input[name='title']").fill(title)
            await page.locator("textarea[name='note_content'], #note_content").click()
            await page.keyboard.type(markdown_content, delay=4)
            await self._random_delay()

            await page.locator("input[type=submit][value*='发布'], button:has-text('发布')").first.click()
            await self._random_delay(3, 5)
            url = page.url
            await context.close()
            return {"url": url}
