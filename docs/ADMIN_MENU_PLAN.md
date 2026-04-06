# Admin Dashboard — Menu Management Plan

## Context

- **Stack**: React + Vite + Tailwind CSS + Firebase (Firestore + Storage)
- **UI direction**: RTL Arabic
- **Current Admin tabs**: Orders · Customers · Promo Codes
- **Goal**: Add a 4th tab — **"القائمة"** (Menu) — with full CRUD for menu items

---

## Current Data Model (`content.json`)

```json
{
  "id": 1,
  "name": "فرخة كاملة",
  "price": 240,
  "image": "/full-chicken.png",
  "includes": ["أرز", "سلطة", "طحينة", "خبز"],
  "prepTime": "60-40 دقيقة",
  "prepMinutes": 60
}
```

## New Data Model (Firestore `menuItems` collection)

```json
{
  "id": "auto-generated",
  "name": "فرخة كاملة",
  "price": 240,
  "image": "https://firebasestorage...",
  "includes": ["أرز", "سلطة", "طحينة", "خبز"],
  "prepTime": "60-40 دقيقة",
  "prepMinutes": 60,
  "description": "فرخة مشوية كاملة مع الأرز والسلطة",   ← NEW
  "order": 0                                               ← NEW (display order)
}
```

---

## Migration Strategy

- **Phase 1 (this plan)**: Admin writes/reads from Firestore `menuItems` collection.  
- **Phase 2 (later)**: Update `Home.jsx` to read from Firestore instead of `content.json`.  
  Until Phase 2, the live menu still uses the static JSON — no breaking change.

---

## Features to Implement

### 1. View All Items
- List of cards showing image thumbnail, name, price, description preview, prepTime
- Sorted by `order` field (ascending)

### 2. Add New Item
Form fields:
| Field | Type | Required |
|---|---|---|
| name | text | ✅ |
| price | number | ✅ |
| description | textarea | optional |
| prepTime | text | e.g. "40-60 دقيقة" |
| prepMinutes | number | numeric value for logic |
| includes | tag-input (comma separated) | optional |
| image | file upload → Firebase Storage | optional |

### 3. Edit Item
- Clicking an "Edit" button opens the same form pre-filled with item data
- Saves via `updateDoc` to Firestore
- Image re-upload replaces the old Storage file and updates the URL

### 4. Delete Item
- Red "Delete" button with a confirmation dialog (window.confirm or inline confirm state)
- Deletes the Firestore document; optionally deletes the Storage file

### 5. Image Upload
- `<input type="file" accept="image/*">`
- On selection: show a local preview immediately (`URL.createObjectURL`)
- On save: upload to Firebase Storage at path `menuImages/{itemId}/{filename}`
- Store the public download URL in Firestore

### 6. Inline State Updates
- All operations update local React state immediately (optimistic UI) **and** persist to Firestore
- `onSnapshot` listener keeps the list live across devices

---

## File Changes

| File | Change |
|---|---|
| `src/pages/Admin.jsx` | Add `menu` tab + all CRUD state & handlers |
| `src/firebase.js` | Add `getStorage` export |
| `src/data/content.json` | Add Arabic copy strings for new menu tab under `admin.menu` |
| `firestore.rules` *(if exists)* | Ensure `menuItems` collection is writable by admin |

> **No new files needed** — all logic lives inside the existing `Admin.jsx` to stay consistent with the codebase pattern.

---

## UI Layout (Menu Tab)

```
┌─────────────────────────────────────────┐
│  + إضافة وجبة جديدة          [زر أخضر]  │
├─────────────────────────────────────────┤
│  ┌────────────────────────────────────┐ │
│  │ 🖼  فرخة كاملة          240 جنيه  │ │
│  │     فرخة مشوية كاملة...           │ │
│  │     ⏱ 60 دقيقة                    │ │
│  │                  [تعديل] [حذف]    │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  ...next item...                   │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

Add/Edit opens as an **inline expanding form** (no modal) above the list, keeping the mobile-first UX of the rest of the admin.

---

## Implementation Steps (in order)

1. **Export Firebase Storage** — add `getStorage` to `src/firebase.js`
2. **Add Arabic copy strings** — add `admin.menu` keys to `content.json`
3. **Add Firestore listener** for `menuItems` collection in `Admin.jsx`
4. **Build the item list** UI in the new `menu` tab
5. **Build the Add/Edit form** with all fields + image preview
6. **Wire up Add handler** — upload image → get URL → `addDoc` to Firestore
7. **Wire up Edit handler** — optional image re-upload → `updateDoc`
8. **Wire up Delete handler** — confirm → `deleteDoc`
9. **Tab button** — add "القائمة" to the tab switcher

---

## Out of Scope (for this plan)

- Auth/password protection for the admin route (already unprotected in current app)
- Reordering items via drag-and-drop (can be added later using `order` field)
- Migrating `Home.jsx` to read from Firestore (Phase 2)
- Deleting old Storage files on item delete (minor cleanup, can add later)

---

## Review Checklist

- [ ] Plan approved by developer
- [ ] Firebase Storage bucket enabled in Firebase Console
- [ ] Firestore `menuItems` collection rules allow writes
- [ ] Implement Step 1–9 above
