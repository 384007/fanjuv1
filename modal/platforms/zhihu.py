from __future__ import annotations

from playwright.async_api import async_playwright

from modal.platforms.base_adapter import BaseAdapter


def md_to_zhihu(md: str) -> tuple[str, str]:
    """Extract title and body from frontmatter-prefixed markdown."""
    lines = md.strip().split("\n")
    title = ""
    body_lines: list[str] = []
    in_frontmatter = False
    frontmatter_done = False

    for line in lines:
        if line.strip() == "---" and not frontmatter_done:
            in_frontmatter = not in_frontmatter
            if not in_frontmatter:
                frontmatter_done = True
            continue
        if in_frontmatter:
            if line.startswith("title:"):
                title = line.replace("title:", "").strip().strip('"')
            continue
        body_lines.append(line)

    body = "\n".join(body_lines).strip()
    return title, body


class Adapter(BaseAdapter):
    platform = "zhihu"

    async def publish(self, markdown_content: str) -> dict:
        title, body = md_to_zhihu(markdown_content)
        async with async_playwright() as p:
            context = await self._new_context(p)
            page = await context.new_page()

            await page.goto("https://zhuanlan.zhihu.com/write", wait_until="networkidle")
            await self._random_delay(2, 4)

            if "login" in page.url or "signin" in page.url:
                raise RuntimeError("zhihu session expired - re-save cookie")

            title_input = page.locator(".WriteIndex-titleInput, [placeholder*='标题']").first
            await title_input.click()
            await title_input.fill(title)
            await self._random_delay()

            editor = page.locator(".ql-editor, .DraftEditor-editorContainer").first
            await editor.click()
            await page.keyboard.type(body, delay=5)
            await self._random_delay(2, 3)

            publish_btn = page.locator(
                "button:has-text('发布'), button:has-text('发表文章')"
            ).first
            await publish_btn.click()
            await self._random_delay(3, 5)

            confirm = page.locator(
                "button:has-text('确定发布'), button:has-text('确认')"
            ).first
            if await confirm.count() > 0:
                await confirm.click()
                await self._random_delay(2, 4)

            url = page.url
            await context.close()
            return {"url": url}
