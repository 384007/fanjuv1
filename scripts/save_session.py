"""Save Playwright session cookies for a platform.

Usage:
    python scripts/save_session.py zhihu

Run interactively (headed mode), log in, then press Enter.
The script prints a base64-encoded cookies blob that you save as
the corresponding Modal Secret (e.g. ZHIHU_COOKIES).
"""
from __future__ import annotations

import asyncio
import base64
import json
import sys

from playwright.async_api import async_playwright

PLATFORM_URLS = {
    "zhihu":       "https://www.zhihu.com",
    "csdn":        "https://www.csdn.net",
    "juejin":      "https://juejin.cn",
    "jianshu":     "https://www.jianshu.com",
    "weibo":       "https://weibo.com",
    "xiaohongshu": "https://www.xiaohongshu.com",
    "douban":      "https://www.douban.com",
    "toutiao":     "https://mp.toutiao.com",
    "baijiahao":   "https://baijiahao.baidu.com",
    "bilibili":    "https://www.bilibili.com",
}


async def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/save_session.py <platform>")
        sys.exit(1)
    platform = sys.argv[1]
    url = PLATFORM_URLS.get(platform, "https://www.zhihu.com")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        await page.goto(url)

        print(f"Please log into {platform} in the opened browser, then press Enter...")
        input()

        cookies = await context.cookies()
        encoded = base64.b64encode(json.dumps(cookies).encode()).decode()
        print(f"\nSet Modal Secret '{platform.upper()}_COOKIES' to:\n")
        print(encoded)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
