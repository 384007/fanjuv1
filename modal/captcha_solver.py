"""Captcha solving helpers — Claude Vision for image, mouse-trajectory for slider."""
from __future__ import annotations

import asyncio
import base64
import os
import random


async def solve_image_captcha(image_bytes: bytes) -> str:
    """Use Claude Vision to OCR a captcha image. Returns the recognized characters."""
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    img_data = base64.b64encode(image_bytes).decode()
    res = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=20,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": img_data,
                        },
                    },
                    {"type": "text", "text": "验证码是什么？只输出字符，不要标点和解释。"},
                ],
            }
        ],
    )
    return res.content[0].text.strip()


async def slide_with_human_trajectory(page, slider_selector: str, distance: int) -> None:
    """Generic slider captcha bypass simulating a human-like mouse trajectory."""
    slider = page.locator(slider_selector)
    box = await slider.bounding_box()
    if not box:
        return
    start_x = box["x"] + box["width"] / 2
    start_y = box["y"] + box["height"] / 2
    await page.mouse.move(start_x, start_y)
    await page.mouse.down()

    x = start_x
    target = start_x + distance
    while x < target - 5:
        step = (
            random.uniform(4, 9)
            if x < start_x + distance * 0.7
            else random.uniform(1, 3)
        )
        x = min(x + step, target + 3)
        y = start_y + random.uniform(-1.5, 1.5)
        await page.mouse.move(x, y)
        await asyncio.sleep(random.uniform(0.008, 0.02))
    await page.mouse.move(target + 2, start_y)
    await asyncio.sleep(0.08)
    await page.mouse.move(target, start_y)
    await page.mouse.up()
