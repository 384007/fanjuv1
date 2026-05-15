from __future__ import annotations

from datetime import datetime
from typing import Any

import modal
from fastapi import FastAPI
from pydantic import BaseModel

app = modal.App("fanju-backend")
web = FastAPI(title="Fanju Backend", version="0.1.0")

DINNERS: list[dict[str, Any]] = [
    {
        "id": "sz-001",
        "slug": "shenzhen-weekend-table",
        "title": "深圳周末小桌",
        "city": "深圳",
        "area": "南山",
        "type": "周末饭局",
        "date": "2026-06-06",
        "time": "19:30",
        "seats": 8,
        "state": "review",
        "summary": "公开餐厅、小桌交流、主理确认。",
    },
    {
        "id": "sh-001",
        "slug": "shanghai-business-table",
        "title": "上海商务小桌",
        "city": "上海",
        "area": "静安",
        "type": "商务饭局",
        "date": "2026-06-08",
        "time": "19:00",
        "seats": 6,
        "state": "open",
        "summary": "创业、品牌、产品和城市生活方式交流。",
    },
]

CHANNELS = ["WeChat", "Xiaohongshu", "Douyin", "Weibo", "QQ", "Qzone", "Bilibili", "Kuaishou", "Zhihu", "Tieba", "Douban", "Toutiao", "Feishu", "DingTalk"]

class DinnerInput(BaseModel):
    title: str = "新的饭局"
    city: str = "深圳"
    area: str = "待定"
    type: str = "周末饭局"
    date: str = "TBD"
    time: str = "TBD"
    seats: int = 8
    summary: str = "待完善饭局说明"

class SeatInput(BaseModel):
    table: str
    displayName: str
    message: str = ""

@web.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "fanju-modal", "time": datetime.utcnow().isoformat()}

@web.get("/dinners")
def list_dinners() -> dict[str, Any]:
    return {"ok": True, "data": DINNERS}

@web.post("/dinners")
def create_dinner(payload: DinnerInput) -> dict[str, Any]:
    item = payload.model_dump()
    item.update({"id": f"modal-{int(datetime.utcnow().timestamp())}", "slug": f"modal-{int(datetime.utcnow().timestamp())}", "state": "draft"})
    return {"ok": True, "data": item}

@web.get("/dinners/{slug}")
def get_dinner(slug: str) -> dict[str, Any]:
    for item in DINNERS:
        if item["slug"] == slug or item["id"] == slug:
            return {"ok": True, "data": item}
    return {"ok": False, "error": "not found"}

@web.post("/seat")
def create_seat(payload: SeatInput) -> dict[str, Any]:
    return {"ok": True, "data": {"id": f"seat-{int(datetime.utcnow().timestamp())}", "state": "pending", **payload.model_dump()}}

@web.get("/channels")
def channels() -> dict[str, Any]:
    return {"ok": True, "data": CHANNELS}

@app.function(image=modal.Image.debian_slim().pip_install("fastapi[standard]", "pydantic"))
@modal.asgi_app()
def api():
    return web
