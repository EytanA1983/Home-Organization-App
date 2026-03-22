"""
Map legacy room/category labels → stable product category keys for progress charts.

Aligned conceptually with frontend `domain/productCategories.ts` (heuristics, not identical strings).
"""

from __future__ import annotations

import re
from typing import Optional

# Stable keys consumed by the dashboard chart + i18n `productCategories.items.*`.
PRODUCT_CATEGORY_KEYS = (
    "kitchen",
    "clothes",
    "shoes",
    "accessories",
    "office",
    "kids_toys_games",
    "kids_craft",
    "bathroom_beauty",
    "bedroom",
    "emotional",
)


def _norm(s: str) -> str:
    return s.strip().lower()


def infer_product_category_from_text(label: Optional[str]) -> Optional[str]:
    """Return a key from PRODUCT_CATEGORY_KEYS or None."""
    if not label:
        return None
    n = _norm(label)
    if not n:
        return None

    # High-signal phrases (order matters).
    if re.search(r"נעל|סנדל|shoe|footwear|boot", n, re.I):
        return "shoes"
    if re.search(r"יצירה|craft|קרפט|arts?\s*&\s*crafts", n, re.I):
        return "kids_craft"
    if re.search(r"רגש|emotional|יומן\s*רגש|declutter\s*emotion", n, re.I):
        return "emotional"
    if re.search(r"תכשיט|אביזר|accessor|jewelry|belt|scarf", n, re.I):
        return "accessories"
    if re.search(r"צעצוע|משחק|toy|games?", n, re.I):
        return "kids_toys_games"
    if re.search(r"מקלחת|אמבט|beauty|איפור|makeup|skincare", n, re.I):
        return "bathroom_beauty"

    if "kitchen" in n or "מטבח" in n:
        return "kitchen"
    if "bedroom" in n or "שינה" in n or "חדר שינה" in n:
        return "bedroom"
    if "bathroom" in n or "אמבטיה" in n or "שירותים" in n:
        return "bathroom_beauty"
    if "office" in n or "משרד" in n or "עבודה" in n:
        return "office"
    if "closet" in n or "wardrobe" in n or "ארון" in n or "בגד" in n or "laundry" in n or "כביסה" in n:
        return "clothes"
    if "kids" in n or "ילדים" in n or "playroom" in n:
        return "kids_toys_games"
    if "living" in n or "סלון" in n:
        return "bedroom"
    if "garage" in n or "מחסן" in n:
        return "office"
    if "balcony" in n or "מרפסת" in n:
        return "accessories"

    return None


def infer_category_for_task(
    room_name: Optional[str],
    category_name: Optional[str],
) -> Optional[str]:
    """Prefer room name, then user category name."""
    for raw in (room_name, category_name):
        hit = infer_product_category_from_text(raw)
        if hit:
            return hit
    return None
