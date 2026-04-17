# Menu Page — Improvement Plan

## Current Issues

1. **Logo repeated 3 times** — once in the top header, then again at the top of each column. This is redundant and wastes valuable space, especially on mobile.
2. **Two-column layout breaks on mobile** — the red and white columns stack vertically, forcing the user to scroll through all "إضافات" before seeing the main meals.
3. **No visual hierarchy between sections** — "الوجبات الرئيسية" and "الإضافات" feel like equal siblings, but the meals are the hero content.
4. **Side items have no price badge in proportion** — the yellow circle (w-20 h-20) is the same visual weight as the item name, which is distracting for low-price add-ons.
5. **Header is plain white with no brand personality** — just a logo on a flat white bar. No color, no tagline, no texture.
6. **Footer is information-dense but hard to scan** — three lines of contact info all look the same size and weight, making it hard to find the phone number quickly.
7. **No section divider or label** between the two columns on desktop — a reader scanning the page doesn't immediately know which side is which.
8. **Images are third-party Unsplash URLs** — can be replaced with the real food photos already in `public/photos/`.

---

## Improvement List

### 1. Unify the header — remove duplicate logos
- Keep only one logo in the top header bar.
- Give the header a red-to-dark gradient background instead of plain white.
- Add the tagline **"أصل المشويات"** and optionally the phone number as a sticky CTA.

### 2. Restructure layout — meals first, extras second
- On **mobile**: show main meals at the top as full-width cards, then extras below in a compact horizontal scroll strip.
- On **desktop**: keep the two-column split, but swap the order so meals are on the right (RTL reading start) and extras on the left.

### 3. Elevate meal cards
- Make meal images larger and full-width within the card (cover style, not a square thumbnail).
- Add a subtle "الأكثر طلباً 🔥" badge on the most popular item (النص فرخة).
- Add a thin red left-border accent on the card instead of the full red-50 background gradient.

### 4. Redesign extras section
- Replace full cards with a compact **grid (2 columns)** instead of stacked rows — extras don't need as much space.
- Make price badges smaller and inline with the name (not a large yellow circle).
- Add a subtle label strip at the top: **"الإضافات — تُضاف لأي وجبة"**.

### 5. Improve the footer
- Make the phone number the largest and most prominent element — bold, big, stands alone on its line.
- Separate the three info blocks with subtle dividers.
- Add a WhatsApp button (green) next to the phone number for quick tap-to-chat on mobile.
- Reduce footer padding on mobile so it doesn't take up half the screen.

### 6. Typography upgrade
- Import **Cairo** font (already used in the sticker) for consistent Arabic typography across the brand.
- Use font-weight 900 for section titles, 700 for item names, 400 for descriptions.

### 7. Use real brand photos
- Replace Unsplash images with the actual food photos from `public/photos/`.
- Use the existing `public/full-chicken.png`, `public/half-chicken.png`, `public/quarter-chicken.png` for the three main meals.

### 8. Add a subtle dark overlay texture to the red column
- A light grain or diagonal pattern on the red background gives it a premium printed-menu feel instead of a flat color block.

---

## Priority Order

| # | Improvement | Impact | Effort |
|---|---|---|---|
| 1 | Remove duplicate logos + redesign header | High | Low |
| 7 | Use real brand photos | High | Low |
| 2 | Restructure layout (meals first) | High | Medium |
| 3 | Elevate meal cards | High | Medium |
| 5 | Improve footer | Medium | Low |
| 4 | Redesign extras as compact grid | Medium | Medium |
| 6 | Cairo font | Medium | Low |
| 8 | Red column texture | Low | Low |

---

## Next step
Confirm which improvements to apply and I'll implement them all in one go.
