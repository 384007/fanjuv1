"""Base adapter for Playwright-driven publishing platforms."""
from __future__ import annotations

import asyncio
import base64
import json
import os
import random

from playwright.async_api import BrowserContext


class BaseAdapter:
    platform: str = ""
    login_url: str = ""
    publish_url: str = ""

    def _load_cookies(self) -> list[dict]:
        """Load cookies from env var <PLATFORM>_COOKIES (base64 of cookie JSON)."""
        key = f"{self.platform.upper()}_COOKIES"
        raw = os.environ.get(key, "")
        if not raw:
            raise ValueError(f"No cookies found for {self.platform}. Set {key} secret.")
        return json.loads(base64.b64decode(raw).decode("utf-8"))

    async def _new_context(self, playwright) -> BrowserContext:
        browser = await playwright.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="zh-CN",
        )
        cookies = self._load_cookies()
        await context.add_cookies(cookies)
        return context

    async def _random_delay(self, min_s: float = 1.5, max_s: float = 4.0) -> None:
        await asyncio.sleep(random.uniform(min_s, max_s))

    async def _slide_captcha(self, page, slider_selector: str, distance: int) -> None:
        from modal.captcha_solver import slide_with_human_trajectory

        await slide_with_human_trajectory(page, slider_selector, distance)

    async def _solve_image_captcha(self, image_bytes: bytes) -> str:
        from modal.captcha_solver import solve_image_captcha

        return await solve_image_captcha(image_bytes)

    async def publish(self, markdown_content: str) -> dict:
        raise NotImplementedError
