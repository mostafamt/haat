# Fraud Prevention — Pre-Payment Notice for New Large Orders

## Overview

Fraudulent or fake large orders from unknown customers are a real risk for small
local businesses. This feature adds a lightweight, zero-infrastructure guard:
whenever a **new phone number** places an order **over 500 EGP**, the checkout
flow stops and shows a mandatory notice explaining that the order will only be
confirmed after an advance payment is verified via **Vodafone Cash** or
**InstaPay**.

The order is saved immediately (so the admin can see it) but with a new status
`"pending_payment"` that blocks it from the normal fulfilment queue until the
admin manually marks it as verified.

---

## Rules (when does the gate trigger?)

| Condition | Value |
|-----------|-------|
| Order total threshold | **> 500 EGP** |
| Customer scope | **First transaction only** — any phone number with no prior completed order |
| Payment methods shown | Vodafone Cash, InstaPay |
| Status assigned | `"pending_payment"` |

A returning customer (any order previously placed and **status = "done"**) is
never gated, even on large orders.

---

## What "new customer" means (detection logic)

The `users/{phone}` Firestore document already tracks `orderCount` and
`firstOrderAt`. However, a user doc can exist with `orderCount = 1` even if
that first order was never delivered (e.g., an abandoned or fake order). To be
safe, "new customer" is defined as:

> The phone number has **zero orders with `status = "done"`** in the `orders`
> collection.

This is checked once — right before the order is saved — with a small Firestore
query:

```js
const prevDone = await getDocs(
  query(
    collection(db, 'orders'),
    where('phone', '==', phone),
    where('status', '==', 'done'),
    limit(1)
  )
);
const isNewCustomer = prevDone.empty;
```

---

## User Flow

### Normal checkout (returning customer OR total ≤ 500 EGP)

```
Fill form → Submit → Order saved (status: "pending") → WhatsApp opens
```

No change from today.

---

### Gated checkout (new customer AND total > 500 EGP)

```
Fill form → Submit
  └─► [CheckoutModal checks new-customer + total]
        └─► Order saved (status: "pending_payment")
              └─► Pre-payment notice overlay shown (replaces form)
                    ├─ Vodafone Cash number + amount
                    ├─ InstaPay ID + amount
                    └─ "Got it" button → WhatsApp opens (same as today)
```

The WhatsApp message is also updated to include a pre-payment flag so the owner
can see the order needs verification before preparation starts.

---

## Screens & UI Changes

### 1. `CheckoutModal.jsx` — new state & logic

**New state variable:**

```js
const [showPrepayNotice, setShowPrepayNotice] = useState(false);
```

**Updated `handleSubmit`:**

1. Run existing validation (unchanged).
2. Check if `isNewCustomer && total > 500`.
3. If **gated**: save order with `status: "pending_payment"`, set
   `showPrepayNotice = true`. Do **not** open WhatsApp yet.
4. If **not gated**: save order with `status: "pending"`, open WhatsApp
   immediately (existing behaviour).

**New JSX block — pre-payment notice overlay:**

Rendered instead of the form when `showPrepayNotice === true`.

```
┌─────────────────────────────────────────────┐
│  ⚠️  تنبيه: مطلوب دفع مقدم               │
│                                             │
│  لأن هذا أول طلب من رقمك وقيمته أكثر       │
│  من 500 جنيه، يجب سداد المبلغ مقدماً       │
│  قبل بدء التحضير.                          │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ 💳 فودافون كاش                       │  │
│  │  حوّل  [AMOUNT] جنيه إلى            │  │
│  │  01XXXXXXXXX                        │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ 🏦 إنستاباي                          │  │
│  │  حوّل  [AMOUNT] جنيه إلى            │  │
│  │  IPA: youripa@bank                  │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  بعد التحويل، سيتواصل معك المطعم على       │
│  واتساب لتأكيد استلام الدفعة.              │
│                                             │
│  [  فهمت — فتح واتساب  ]                  │
└─────────────────────────────────────────────┘
```

Pressing "فهمت — فتح واتساب" opens WhatsApp with a modified message that
includes the pre-payment flag (see WhatsApp section below), then calls
`onSuccess()`.

---

### 2. WhatsApp message — updated template (gated orders only)

An extra line is prepended/appended so the business owner immediately knows:

```
🚨 طلب يحتاج تحقق من الدفع المقدم
🍗 طلب جديد من هات
🔢 رقم الطلب #XXXX
...
💰 الإجمالي: XXX جنيه
⚠️ الحالة: في انتظار تأكيد الدفع المقدم
```

---

### 3. `Admin.jsx` — new status handling

#### Orders list

A new status badge is added alongside the existing `"pending"` / `"done"` ones:

| `status` value | Badge colour | Badge text |
|----------------|-------------|------------|
| `"pending"` | Yellow | قيد التحضير |
| `"pending_payment"` | Red/Orange | في انتظار الدفع |
| `"done"` | Green | تم التسليم |

#### Action buttons per order card

| Status | Buttons shown |
|--------|---------------|
| `"pending"` | تم التسليم |
| `"pending_payment"` | ✅ تأكيد الدفع → moves to `"pending"` + WhatsApp notify option |
| `"done"` | — |

A new admin function `confirmPayment(orderId)`:

```js
const confirmPayment = async (id) => {
  await updateDoc(doc(db, 'orders', id), { status: 'pending' });
};
```

After confirmation the order joins the normal queue and WhatsApp can be opened
manually by the admin if needed.

---

## Firestore Changes

### `orders` collection — status enum expanded

| Old values | New value added |
|------------|----------------|
| `"pending"`, `"done"` | `"pending_payment"` |

No schema migration needed — existing documents are unaffected.

### `meta/config` document (new, optional)

Store the configurable threshold and payment details so they can be changed from
the admin panel later without a code deploy:

```js
// meta/config
{
  prepayThreshold: 500,           // EGP
  vodafoneCashNumber: "01XXXXXXXXX",
  instaPayIPA: "youripa@bank"
}
```

For the initial implementation these values can be **hardcoded as constants** in
`CheckoutModal.jsx` and documented here. The `meta/config` approach is noted as
a future upgrade.

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/CheckoutModal.jsx` | New state, new isNewCustomer query, split submit path, pre-payment notice JSX, updated WhatsApp message |
| `src/pages/Admin.jsx` | New badge colour/text for `"pending_payment"`, new `confirmPayment()` function, new button in order card |
| `src/data/content.json` | New Arabic strings for the notice, badge label, button label |

No new files need to be created.

---

## Constants (hardcoded for v1)

```js
// CheckoutModal.jsx — top of file
const PREPAY_THRESHOLD    = 500;          // EGP
const VODAFONE_CASH_NUM   = '01XXXXXXXXX'; // replace with real number
const INSTAPAY_IPA        = 'youripa@bank'; // replace with real IPA
```

---

## Edge Cases & Decisions

| Scenario | Decision |
|----------|----------|
| Customer already has orders but all are `"pending_payment"` (never verified) | Still treated as new → gate applies. Prevents repeated fake orders from the same number. |
| Customer has one `"done"` order, then places a 600 EGP order | Not gated — they are verified. |
| Order total is exactly 500 EGP | Not gated — rule is **strictly > 500**. |
| Customer applies a promo code that brings total below 500 | Use the **final total after discount** for the threshold check. |
| Admin never verifies a `"pending_payment"` order | Order stays in queue indefinitely. Admin can add a delete/cancel button in a future iteration. |
| Two tabs / race condition on same phone | Firestore transaction for order numbering already exists; the `isNewCustomer` query runs slightly before save but is not in a transaction — acceptable for a manual-verification flow. |

---

## Out of Scope (this iteration)

- Automatic payment verification via Vodafone Cash / InstaPay APIs
- Sending an SMS or push notification to the customer
- Admin ability to reject/cancel a `"pending_payment"` order (can be done manually via Firebase console for now)
- Configurable threshold from the admin UI (hardcoded constant for v1)
- Authentication on the admin route

---

## Implementation Order

1. **`content.json`** — add all new Arabic strings first.
2. **`CheckoutModal.jsx`** — add constants, `isNewCustomer` query, split submit,
   pre-payment notice overlay.
3. **`Admin.jsx`** — add badge, button, `confirmPayment()` function.
4. **Manual test** — place a first order > 500, verify notice appears, verify
   admin sees correct badge and confirm button, verify second order skips gate.
