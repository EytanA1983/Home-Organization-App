"""Vision board API schemas."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


def _normalize_intentions(raw: List[str]) -> List[str]:
    out: List[str] = []
    for s in raw[:3]:
        t = (s or "").strip()
        if len(t) > 500:
            t = t[:500]
        out.append(t)
    while len(out) < 3:
        out.append("")
    return out


class VisionBoardRead(BaseModel):
    vision_statement: str = ""
    intentions: List[str] = Field(default_factory=lambda: ["", "", ""], min_length=3, max_length=3)
    image_url: Optional[str] = None
    quote: Optional[str] = None

    model_config = {"from_attributes": True}


class VisionBoardUpdate(BaseModel):
    vision_statement: str = Field(default="", max_length=4000)
    intentions: List[str] = Field(default_factory=list, max_length=3)
    image_url: Optional[str] = Field(default=None, max_length=2048)
    quote: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("intentions", mode="before")
    @classmethod
    def cap_intentions(cls, v: object) -> List[str]:
        if v is None:
            return []
        if not isinstance(v, list):
            raise TypeError("intentions must be a list of strings")
        return _normalize_intentions([str(x) for x in v])

    @field_validator("vision_statement", mode="before")
    @classmethod
    def strip_vision(cls, v: object) -> str:
        if v is None:
            return ""
        s = str(v).strip()
        return s[:4000]

    @field_validator("image_url", "quote", mode="before")
    @classmethod
    def empty_to_none(cls, v: object) -> Optional[str]:
        if v is None:
            return None
        s = str(v).strip()
        return s if s else None
