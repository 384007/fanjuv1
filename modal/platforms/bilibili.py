from __future__ import annotations

from playwright.async_api import async_playwright

from modal.platforms.base_adapter import BaseAdapter


class Adapter(BaseAdapter):
    platform = "bilibili"

    async def publish(self, markdown_content: str) -> dict:
        lines = markdown_content.split("\n")
        title = next(
            (l.replace("title:", "").strip().strip('"') for l in lines if l.startswith("title:")),
            "Fanju Article",
        )

        async with async_playwright() as p:
            context = await self._new_context(p)
            page = await context.new_page()
            await page.goto("https://member.bilibili.com/read/editor/", wait_until="networkidle")
            await self._random_delay(3, 5)

            await page.locator("input[placeholder*='标题']").first.fill(title)
            editor = page.locator(".ql-editor, [contenteditable=true]").first
            await editor.click()
            await page.keyboard.type(markdown_content, delay=4)
            await self._random_delay(2, 3)

            await page.locator("button:has-text('发布')").first.click()
            await self._random_delay(4, 6)
            url = page.url
            await context.close()
            return {"url": url}
