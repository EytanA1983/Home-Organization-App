# Product note: Categories, Emotional, Content, Inventory

## Emotional

- Canonical entry: **`/categories/emotional`** (product category `emotional`).
- **Reflection journal** remains at **`/emotional-journal`** (stable API + route).
- Shell navigation “Emotional” opens the category page; the journal stays highlighted as part of the same tab group.
- Category detail shows a card that frames the journal as part of the Emotional category, not a separate app.

## Content (tips hub)

- Route: **`/content-hub`** (unchanged).
- Positioned as a **support layer for categories**: copy + “All categories” link + quick picks (kitchen, closet, bedroom, bathroom, living, emotional category).
- Backend still uses legacy **media area** keys (`kitchen`, `closet`, …) for `/content/engine`; UI labels explain the link to home categories without overbuilding a media platform.

## Inventory

- **Removed from the main bottom tab bar** to reduce tension with the category-first model.
- Repositioned as **optional “Supplies & home catalog”**:
  - Entry from **Settings** (“Supplies & home catalog” → open catalog).
  - On-inventory page kicker + link back to **Categories**.
- Full CRUD and routes **`/inventory`** are unchanged.

## Phase 2 ideas

- Map `/content/engine` `room` param to explicit product-category keys if the API evolves.
- Inline a slim journal preview on `/categories/emotional` (behind feature flag).
- Optional: inventory areas tagged with a product category for cross-linking.
