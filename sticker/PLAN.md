# Haat Bag Sticker — Design Plan

## Goal
A printable HTML/CSS sticker to be photographed and stuck on a white bag for the **هات** brand.

---

## Layout (vertical flow, top → bottom)

```
┌─────────────────────────┐
│                         │
│        [LOGO]           │  ← logo.png, centered, ~120px
│                         │
│          هات            │  ← Arabic, ultra-bold, ~72px
│                         │
│     أصل المشويات        │  ← Arabic, medium-bold, ~28px
│                         │
│  ─────────────────────  │  ← thin decorative divider
│                         │
│  📞  01X-XXX-XXXX       │  ← mobile number (RTL)
│  💬  01X-XXX-XXXX       │  ← WhatsApp number (RTL)
│                         │
└─────────────────────────┘
```

---

## Visual Design

| Property | Value |
|---|---|
| **Shape** | Rounded rectangle (border-radius: 20px) |
| **Size** | 300 × 400 px — maps to ~8 × 10.5 cm when printed at 96 dpi |
| **Background** | Deep charcoal `#1a1a1a` — stands out on the white bag and matches grilled/barbecue aesthetic |
| **Primary text** | White `#ffffff` |
| **Accent color** | Brand red `#dc2626` — used on tagline and divider |
| **Font** | [Cairo](https://fonts.google.com/specimen/Cairo) from Google Fonts — supports Arabic, ultra-bold weights |
| **Direction** | RTL (`dir="rtl"`) |

---

## Element Details

### Logo
- Source: `/public/logo.png`
- Size: 110 × 110 px, `object-contain`
- Slight drop-shadow to lift it off the dark background

### Brand Name — هات
- Font size: 72px
- Font weight: 900 (black)
- Color: White
- Letter-spacing: wide

### Tagline — أصل المشويات
- Font size: 26px
- Font weight: 700 (bold)
- Color: Brand red `#dc2626`

### Divider
- Thin 1px line, red, 60% width, centered
- Small flame icon (🔥) centered on the divider

### Contact Section
- Two rows, each with an icon + number
- 📞 Phone number
- 💬 WhatsApp number (green icon)
- Font size: 18px, white

---

## Questions before building

1. **Phone number** — what is the mobile number to display?
2. **WhatsApp number** — same as mobile, or different?
3. **Background color preference** — dark charcoal (above) or red background with white text?
4. **Sticker shape** — rounded rectangle (above) or circle?
5. **Print size** — should the sticker be square (~10×10 cm), portrait rectangle, or do you have a specific size?

---

## File output
- Single standalone `sticker/index.html` file (no build step needed)
- All styles inlined in a `<style>` tag
- Google Fonts loaded via CDN
- `@media print` CSS so it prints correctly with no browser chrome
- No JavaScript — static HTML/CSS only

---

## Next step
Once you confirm the details above, I'll build `sticker/index.html` immediately.
