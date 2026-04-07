# Pre-Payment Notice UX Update — Payment Method Selection & Confirmation

## Overview

Two small but important UX improvements to the pre-payment notice overlay shown
inside `CheckoutModal.jsx` when a new customer places an order over 500 EGP:

1. **Payment method selector** — radio buttons let the customer pick either
   Vodafone Cash or InstaPay. Only the selected method's card is shown fully
   (with the number/IPA and amount). The other is collapsed.
2. **"تم الدفع" confirmation** — a button the customer taps after completing the
   transfer. Tapping it marks payment as acknowledged and unlocks the
   "فهمت — فتح واتساب" submit button, which is disabled until then.

---

## Screen Wireframe

```
┌─────────────────────────────────────────────────────┐
│                    ⚠️                               │
│          تنبيه: مطلوب دفع مقدم                     │
│  لأن هذا أول طلب... وقيمته أكثر من 500 جنيه...     │
│                                                     │
│  اختر طريقة الدفع:                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  ● 💳 فودافون كاش                           │   │   ← selected
│  │    حوّل  XXX جنيه  إلى  01XXXXXXXXX        │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │  ○ 🏦 إنستاباي                              │   │   ← collapsed
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  [ تم الدفع ✓ ]    ← green when tapped     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  بعد التحويل، سيتواصل معك المطعم...               │
│                                                     │
│  [ فهمت — فتح واتساب 💬 ]  ← disabled until above │
└─────────────────────────────────────────────────────┘
```

---

## Interaction Rules

| State | Description |
|-------|-------------|
| Initial | No method selected. Both cards shown as selectable rows. "تم الدفع" button visible but greyed out. "فهمت" button disabled. |
| Method selected | The chosen card expands to show the full transfer details (number/IPA + amount). The other card collapses to just its label. "تم الدفع" becomes tappable. |
| "تم الدفع" tapped | Button turns green with a checkmark. "فهمت — فتح واتساب" becomes enabled. |
| "فهمت" tapped | WhatsApp opens, `onSuccess()` is called (cart cleared). |

The selected payment method is also included in the WhatsApp message so the
owner knows which channel to check.

---

## State Changes (CheckoutModal.jsx)

Two new state variables added to the pre-payment notice section:

```js
const [selectedPayMethod, setSelectedPayMethod] = useState('');   // '' | 'vodafone' | 'instapay'
const [paymentConfirmed, setPaymentConfirmed]   = useState(false);
```

Both reset to their defaults each time `showPrepayNotice` becomes `true`
(i.e., they are initialised fresh on every checkout that triggers the gate —
no persistent state across sessions).

---

## WhatsApp Message Update

The `buildWaMessage` helper already accepts `isPrepay`. A small addition passes
the chosen method name into the message:

```
🚨 طلب يحتاج تحقق من الدفع المقدم
...
⚠️ الحالة: في انتظار تأكيد الدفع المقدم
💳 طريقة الدفع المختارة: فودافون كاش   ← new line
```

The method line is only added when `selectedPayMethod` is set.

---

## content.json Additions

All new strings added under `checkout.prepayNotice`:

```json
"chooseMethodLabel": "اختر طريقة الدفع:",
"paymentDoneButton": "تم الدفع ✓",
"paymentDoneConfirmed": "تم تأكيد الدفع ✓"
```

And under `whatsapp`:

```json
"prepayMethodLabel": "💳 طريقة الدفع المختارة:"
```

And under `delivery` (for method names used in WhatsApp):

```json
"vodafoneCashName": "فودافون كاش",
"instaPayName": "إنستاباي"
```

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/CheckoutModal.jsx` | Add `selectedPayMethod` + `paymentConfirmed` state; update pre-payment overlay JSX with radio rows + confirm button + disabled logic; update `buildWaMessage` to include method name |
| `src/data/content.json` | Add 4 new strings listed above |

No changes to `Admin.jsx` or any other file.

---

## Implementation Order

1. Add new strings to `content.json`.
2. Add the two new state variables in `CheckoutModal.jsx`.
3. Replace the pre-payment notice JSX with the new layout.
4. Update `buildWaMessage` to append the chosen method.
