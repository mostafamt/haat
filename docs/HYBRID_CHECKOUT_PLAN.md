# Promo Code Enhancement Plan
**Feature:** Phone-based Promo Code Validation for Guest Checkout
**Status:** Review Draft — v2
**App Stack:** React 18 + Vite + Firebase Firestore + Tailwind CSS

---

## Overview

No login or registration required. The system uses the customer's **phone number** as the identity key for promo code validation — checking against completed orders in Firestore to prevent reuse.

---

## What Changes vs. What Stays the Same

| Area | Status | Notes |
|------|--------|-------|
| Guest checkout flow | **No change** | Name, phone, address, zone — same as today |
| Orders collection | **Minor update** | Add `promoCode` + `discount` fields |
| WhatsApp message | **Minor update** | Show discount line when promo applied |
| `CheckoutModal.jsx` | **Updated** | Add promo code section |
| Firestore `promo_codes` | **New collection** | Stores valid codes and their discount rules |
| `content.json` | **Updated** | Add promo UI strings |
| `Admin.jsx` | **Updated** | Show discount + promo code per order |

---

## Phase 1 — Promo Codes Firestore Collection

### Collection: `promo_codes`

Each document ID **is** the code string (e.g. `SAVE20`, `EID10`). Stored in uppercase.

```
promo_codes/{CODE}
  ├── discount_type: "percent" | "flat"
  │     "percent" → deduct X% from subtotal (before delivery)
  │     "flat"    → deduct fixed EGP amount from subtotal
  ├── discount_value: number        // e.g. 20 for 20% or 20 for 20 EGP
  ├── active: boolean               // false = code is disabled
  └── expires_at: Timestamp | null  // null = no expiry
```

**Example documents:**
```
promo_codes/SAVE20  → { discount_type: "percent", discount_value: 20, active: true, expires_at: null }
promo_codes/EID10   → { discount_type: "flat",    discount_value: 10, active: true, expires_at: <Timestamp> }
```

> **No per-user usage cap stored here.** Usage is validated by querying the `orders` collection at apply-time.

---

## Phase 2 — Orders Collection Update

### Current fields (unchanged)
`name`, `address`, `phone`, `zone`, `items`, `total`, `deliveryPrice`, `status`, `timestamp`

### New fields added to every order
```
orders/{orderId}
  ├── ...existing fields...
  ├── promoCode: string | null     // e.g. "SAVE20" or null if no promo used
  ├── discount: number             // EGP amount deducted, 0 if no promo
  └── subtotal: number             // item total before discount (total - deliveryPrice + discount)
```

**Why store `subtotal` separately?**
It allows the admin to see the original price, discount applied, and final total clearly — and makes future reporting straightforward.

**Order total calculation:**
```
subtotal     = sum of (item.price × item.quantity)
discount     = calculated from promo code (0 if none)
grandTotal   = subtotal - discount + deliveryPrice
```

> `name`, `phone`, and `address` are already saved as strings today. No structural change needed — this requirement is already met.

---

## Phase 3 — Promo Validation Logic

### When the user clicks "تطبيق" (Apply):

**Step 1 — Phone check**
- The phone field must be filled and valid (`/^01[0-9]{9}$/`) before applying.
- If phone is empty or invalid → show inline error: *"أدخل رقم هاتف صحيح أولاً لتطبيق الكود"*

**Step 2 — Code lookup**
- Fetch `promo_codes/{CODE.toUpperCase()}` from Firestore.
- If document does not exist → error: *"كود الخصم غير صحيح"*
- If `active === false` → error: *"هذا الكود غير متاح حالياً"*
- If `expires_at` is set and is in the past → error: *"انتهت صلاحية هذا الكود"*

**Step 3 — Usage check**
- Query Firestore `orders` collection:
  ```
  WHERE phone == <entered phone>
  AND   promoCode == <entered code>
  AND   status == "done"
  LIMIT 1
  ```
- If a matching order is found → error: *"هذا الكود مستخدم مسبقاً مع هذا الرقم"*

**Step 4 — Apply discount**
- Calculate discount amount:
  - `percent`: `discount = Math.round(subtotal × discount_value / 100)`
  - `flat`: `discount = Math.min(discount_value, subtotal)` *(cap at subtotal so total never goes negative)*
- Store in local state: `{ appliedPromo: { code, discount_type, discount_value }, discount }`
- Update the order summary UI to show the savings line.

**Step 5 — Allow removal**
- Show an "✕ إلغاء الكود" button next to the applied code.
- Clicking it resets `appliedPromo` and `discount` to null/0.

---

## Phase 4 — CheckoutModal UI Changes

### Promo Code Section (inserted between Phone and Submit button)

```
┌──────────────────────────────────────────────┐
│  🏷️ كود الخصم (اختياري)                      │
│  [________________________] [تطبيق]           │
│                                              │
│  ✅ تم تطبيق SAVE20 — وفّرت 48 جنيه!        │  ← success state
│  OR                                          │
│  ❌ هذا الكود مستخدم مسبقاً مع هذا الرقم    │  ← error state
└──────────────────────────────────────────────┘
```

### Updated Order Summary (when promo applied)

```
ملخص الطلب
─────────────────────────────
فرخة كاملة x1              240 جنيه
نص فرخة x2                 260 جنيه
─────────────────────────────
المجموع الفرعي              500 جنيه
خصم (SAVE20 - 20%)        - 100 جنيه   ← new line, shown in green
رسوم التوصيل (عزبة طه)      15 جنيه
─────────────────────────────
الإجمالي                    415 جنيه   ← updated total
```

### Validation rules for the Apply button

| Condition | Behavior |
|-----------|---------|
| Phone field empty or invalid | Block apply — show phone error |
| Code field empty | Block apply — no request made |
| Promo already applied | Show current applied code, offer remove |
| Network/Firestore error | Show: *"تعذّر التحقق من الكود، حاول مرة أخرى"* |

### Apply button loading state
- Show a small spinner on the Apply button while Firestore queries run (replaces button text with *"جاري التحقق..."*).
- Disable both the Apply button and the code input during validation to prevent double-submission.

---

## Phase 5 — WhatsApp Message Update

When a promo is applied, add a discount line to the message:

```
🍗 طلب جديد من هات

👤 الاسم: محمد أحمد
📍 العنوان: شارع الجمهورية
📞 الهاتف: 01012345678
📍 منطقة التوصيل: عزبة طه

📋 الطلب:
فرخة كاملة = 240 × 1 = 240 جنيه
نص فرخة = 130 × 2 = 260 جنيه

💸 خصم (SAVE20): - 100 جنيه       ← new line, only shown when promo applied
🛵 رسوم التوصيل: 15 جنيه
💰 الإجمالي: 415 جنيه
⏳ وقت التحضير المتوقع: 60-40 دقيقة
```

---

## Phase 6 — Admin Dashboard Updates (`Admin.jsx`)

Each order card should display:

- **Current:** name, phone, address, zone, items, total, status, timestamp
- **New:** discount badge and promo code (only shown when `discount > 0`)

```
┌─────────────────────────────────────────────┐
│ محمد أحمد  |  01012345678  |  عزبة طه      │
│ ...items...                                 │
│                                             │
│ المجموع الفرعي: 500 جنيه                   │
│ 🏷️ SAVE20 — خصم 100 جنيه                  │  ← new, shown when promoCode exists
│ توصيل: 15 جنيه                             │
│ الإجمالي: 415 جنيه                         │
│                                  [تم التسليم ✅] │
└─────────────────────────────────────────────┘
```

---

## Phase 7 — content.json Additions

New strings to add under `"checkout"`:

```json
"promo": {
  "label": "كود الخصم (اختياري)",
  "placeholder": "أدخل الكود",
  "applyButton": "تطبيق",
  "checkingButton": "جاري التحقق...",
  "removeButton": "إلغاء الكود",
  "successPrefix": "تم تطبيق",
  "successSuffix": "— وفّرت",
  "discountLabel": "خصم",
  "errors": {
    "phoneRequired": "أدخل رقم هاتف صحيح أولاً لتطبيق الكود",
    "invalidCode": "كود الخصم غير صحيح",
    "inactiveCode": "هذا الكود غير متاح حالياً",
    "expiredCode": "انتهت صلاحية هذا الكود",
    "alreadyUsed": "هذا الكود مستخدم مسبقاً مع هذا الرقم",
    "networkError": "تعذّر التحقق من الكود، حاول مرة أخرى"
  }
}
```

And under `"whatsapp"`:
```json
"discountLabel": "💸 خصم"
```

---

## Implementation Order

| Step | Task | File |
|------|------|------|
| 1 | Create `promo_codes` collection in Firebase Console with 1-2 test codes | Firebase Console |
| 2 | Add promo strings to `content.json` | `content.json` |
| 3 | Add promo state + validation logic to `CheckoutModal.jsx` | `CheckoutModal.jsx` |
| 4 | Add promo UI section to `CheckoutModal.jsx` | `CheckoutModal.jsx` |
| 5 | Update order summary display in `CheckoutModal.jsx` | `CheckoutModal.jsx` |
| 6 | Update `addDoc` call to include `promoCode`, `discount`, `subtotal` fields | `CheckoutModal.jsx` |
| 7 | Update WhatsApp message string to include discount line | `CheckoutModal.jsx` |
| 8 | Update order cards in `Admin.jsx` to show promo badge | `Admin.jsx` |

---

## Edge Cases Handled

| Scenario | Handling |
|----------|---------|
| User changes phone after applying promo | Remove applied promo when phone field changes |
| User submits with applied promo but no phone validation | Final `validate()` before submit re-checks phone |
| Two tabs / race condition on last use | Acceptable risk — usage check is best-effort, not transactional |
| Promo code with 0 or negative discount value | Validate `discount_value > 0` in the apply logic |
| Order total after discount goes below delivery fee | Grand total floor = deliveryPrice (discount only applies to subtotal) |
| Firestore offline / slow connection | Show network error, allow retry |

---

## Files Changed Summary

| File | Change Type | Summary |
|------|-------------|---------|
| `src/components/CheckoutModal.jsx` | Modify | Add promo state, validation, UI section, updated order save + WhatsApp message |
| `src/pages/Admin.jsx` | Modify | Show promo code + discount on order cards |
| `src/data/content.json` | Modify | Add promo UI strings |
| Firebase Console | Manual | Create `promo_codes` collection with initial codes |

**No new files required.**

---

## Open Questions Before Implementation

1. **Discount type preference** — do you want to support both `percent` and `flat` EGP discounts, or just one type for now?
2. **Expiry dates** — will codes have expiry dates, or are they open-ended?
3. **Code format** — uppercase letters only (e.g. `SAVE20`), or allow numbers/mixed case?
4. **Validation scope** — check only `status: "done"` orders (delivered), or also `status: "pending"` (in-progress)?
   - Checking pending too = stricter (recommended), prevents someone ordering twice in one session.
5. **First test code** — what code name and discount value should be used for testing?
