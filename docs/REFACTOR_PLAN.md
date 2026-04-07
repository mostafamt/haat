# Refactor Plan — DRY & SOLID

## Goals

- Remove duplicated logic that lives in more than one file
- Break oversized files into single-responsibility units
- Centralise all Firebase calls and env-var access behind thin abstractions
- Zero behaviour changes — this is a structural refactor only

---

## New Directory Layout

```
src/
├── config/
│   └── env.js                   # single place for all import.meta.env reads
├── services/
│   ├── uploadService.js         # Cloudinary uploads (menu + proofs)
│   ├── ordersService.js         # Firestore CRUD for orders
│   ├── promoService.js          # Firestore reads/writes for promo_codes
│   ├── menuService.js           # Firestore CRUD for menuItems + extras
│   └── usersService.js          # Firestore reads/writes for users
├── hooks/
│   ├── useCart.js               # cart state + add/remove/clear helpers
│   └── useFormState.js          # generic form + errors + reset
├── utils/
│   ├── validators.js            # PHONE_REGEX + validate helpers
│   └── formatters.js            # date + price formatting helpers
├── components/
│   ├── ui/
│   │   ├── TabSwitcher.jsx      # reusable tab bar
│   │   ├── StatusBadge.jsx      # order status pill
│   │   └── FormInput.jsx        # input + textarea with error border
│   ├── checkout/
│   │   ├── CheckoutForm.jsx     # form fields only
│   │   ├── PromoCodeField.jsx   # promo apply/remove UI + logic
│   │   └── PrepayNotice.jsx     # full pre-payment screen
│   ├── admin/
│   │   ├── OrdersTab.jsx
│   │   ├── MenuTab.jsx
│   │   ├── ExtrasTab.jsx
│   │   ├── PromosTab.jsx
│   │   └── CustomersTab.jsx
│   ├── CheckoutModal.jsx        # thin orchestrator (keeps same public API)
│   ├── Hero.jsx                 # unchanged except imports
│   ├── Footer.jsx               # unchanged except imports
│   ├── CartBar.jsx              # unchanged
│   ├── MenuCard.jsx             # unchanged
│   ├── MyOrders.jsx             # unchanged except imports
│   └── ItemModal.jsx            # unchanged
└── pages/
    ├── Home.jsx                 # uses useCart hook
    └── Admin.jsx                # thin shell, renders admin/* tabs
```

---

## Changes — by area

### 1. `src/config/env.js` (new)

**Problem:** `import.meta.env.*` scattered across 5 files. One rename = 5 edits.

```js
export const config = {
  whatsappNumber:   import.meta.env.VITE_WHATSAPP_NUMBER   || '201000000000',
  vodafoneCashNum:  import.meta.env.VITE_VODAFONE_CASH_NUM || '01XXXXXXXXX',
  instaPayIPA:      import.meta.env.VITE_INSTAPAY_IPA      || 'youripa@bank',
  cloudinary: {
    cloud:  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  },
};
```

**Files simplified:** `CheckoutModal.jsx`, `Hero.jsx`, `Footer.jsx`, `Admin.jsx`

---

### 2. `src/services/uploadService.js` (new)

**Problem:** Identical Cloudinary upload code copy-pasted in `Admin.jsx` (lines 12–24)
and `CheckoutModal.jsx` (lines 164–177). Two separate `FormData` blocks, same logic.

```js
export async function uploadImage(file, folder = 'haat/misc') { … }
```

Callers:
- `Admin.jsx` → `uploadImage(file, 'haat/menu')`
- `CheckoutModal.jsx` → `uploadImage(file, 'haat/proofs')`

---

### 3. `src/services/ordersService.js` (new)

**Problem:** Raw `getDocs`, `runTransaction`, `updateDoc` calls spread across
`CheckoutModal.jsx`, `MyOrders.jsx`, and `Admin.jsx`. Firebase import lists are long
and repeated.

Exports:
```js
createOrder(payload)            // runTransaction — order counter + order doc
upsertUser(phone, data)         // setDoc merge on users/{phone}
fetchOrdersByPhone(phone)       // MyOrders lookup
updateOrderStatus(id, status)   // markDone / confirmPayment / revertPayment
updateOrderProof(id, url)       // paymentProofUrl patch
hasCompletedOrder(phone)        // boolean — new-customer gate check
```

**Files simplified:** `CheckoutModal.jsx`, `MyOrders.jsx`, `Admin.jsx`

---

### 4. `src/services/promoService.js` (new)

**Problem:** Promo validation query block in `CheckoutModal.jsx` (lines 64–119) and
usage-count query in `Admin.jsx` (lines 78–84) both query the same collections with
raw Firestore calls.

Exports:
```js
validatePromoCode(code, phone, subtotal)   // returns { discount, appliedPromo } or throws
fetchAllPromosWithUsage()                  // Admin promo list
addPromoCode(code, data)                   // Admin add
togglePromoCode(id, active)               // Admin toggle
```

---

### 5. `src/services/menuService.js` (new)

**Problem:** Menu and extras Firestore listeners/mutations are all inline in `Admin.jsx`
(lines 157–339). Keeps Admin.jsx focused on UI only.

Exports:
```js
subscribeMenuItems(callback)    // onSnapshot — returns unsubscribe fn
subscribeExtras(callback)
saveMenuItem(data, id?)
deleteMenuItem(id)
saveExtra(data, id?)
deleteExtra(id)
```

---

### 6. `src/utils/validators.js` (new)

**Problem:** `/^01[0-9]{9}$/` written literally in `CheckoutModal.jsx` (line 50),
`MyOrders.jsx` (line 17), and `Admin.jsx` promo form. One regex, three places.

```js
export const PHONE_REGEX = /^01[0-9]{9}$/;
export const isValidPhone = (v) => PHONE_REGEX.test(v.trim());
export const isPositiveNumber = (v) => !isNaN(Number(v)) && Number(v) > 0;
```

---

### 7. `src/utils/formatters.js` (new)

**Problem:** `new Date(ts.toDate()).toLocaleString('ar-EG')` duplicated in
`MyOrders.jsx` (line 86) and `Admin.jsx` (line 453).

```js
export const formatDateTime = (ts) =>
  ts ? new Date(ts.toDate()).toLocaleString('ar-EG') : '';

export const formatDate = (ts) =>
  ts ? new Date(ts.toDate()).toLocaleDateString('ar-EG') : '';
```

---

### 8. `src/hooks/useCart.js` (new)

**Problem:** `Home.jsx` holds cart state + 4 cart-management functions inline
(lines 15–69). Cart logic is not a page concern.

```js
export function useCart() {
  // returns: cartItems, total, itemCount, getQty, addItem, removeItem, clearCart
}
```

`Home.jsx` becomes: `const { cartItems, … } = useCart();`

---

### 9. `src/hooks/useFormState.js` (new)

**Problem:** `Admin.jsx` has `resetMenuForm` (lines 177–186) and `resetExtrasForm`
(lines 288–294) — same shape, different field names. Pattern will repeat for any new
form added.

```js
export function useFormState(initial) {
  // returns: form, setForm, errors, setErrors, resetForm
}
```

Used by `MenuTab`, `ExtrasTab`, `PromosTab` in the refactored admin.

---

### 10. `src/components/ui/TabSwitcher.jsx` (new)

**Problem:** Tab button groups manually written in `Home.jsx` (lines 84–96),
`Admin.jsx` main tabs (lines 363–378), and `Admin.jsx` menu sub-tabs (lines 533–546).
Same conditional class logic, three times.

```jsx
<TabSwitcher
  tabs={[{ key: 'orders', label: 'الطلبات' }, …]}
  active={tab}
  onChange={setTab}
/>
```

---

### 11. `src/components/ui/StatusBadge.jsx` (new)

**Problem:** Order status pill styling duplicated in `MyOrders.jsx` and `Admin.jsx`
with the same three-way conditional.

```jsx
<StatusBadge status={order.status} labels={content.admin.status} />
```

---

### 12. `src/components/ui/FormInput.jsx` (new)

**Problem:** `border ${errors.x ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 …`
pattern repeated ~10 times across `CheckoutModal.jsx` and `Admin.jsx`.

```jsx
<FormInput error={errors.name} value={…} onChange={…} />
<FormTextarea error={errors.address} … />
```

---

### 13. Split `CheckoutModal.jsx` → `src/components/checkout/`

**Problem:** 500+ line file handles form validation, promo logic, Cloudinary upload,
Firestore transaction, WhatsApp message, pre-payment screen UI — six responsibilities.

| New file | Responsibility |
|----------|---------------|
| `CheckoutForm.jsx` | Controlled form fields (zone, name, address, phone) |
| `PromoCodeField.jsx` | Promo input, apply/remove, error display |
| `PrepayNotice.jsx` | Full pre-payment overlay (method radio, proof upload, confirm) |
| `CheckoutModal.jsx` | Orchestrator: state, calls services, renders the three above |

`CheckoutModal.jsx` public API (`{ cart, total, onClose, onSuccess }`) stays identical.

---

### 14. Split `Admin.jsx` → `src/components/admin/`

**Problem:** 1000-line file renders four unrelated tabs, each with its own
state + queries + forms.

| New file | Responsibility |
|----------|---------------|
| `OrdersTab.jsx` | Orders list, pagination, status actions |
| `MenuTab.jsx` | Menu items CRUD + image upload |
| `ExtrasTab.jsx` | Extras CRUD |
| `PromosTab.jsx` | Promo codes CRUD + usage count |
| `CustomersTab.jsx` | Customer list |
| `Admin.jsx` | Tab switcher shell only, imports the five above |

---

## What is NOT changing

- Firebase schema — no collection or field renames
- `content.json` — no string changes
- Component public APIs — all props stay the same
- `App.jsx`, `main.jsx`, `firebase.js` — untouched
- Routing — `/` and `/admin` unchanged
- Tailwind classes and visual design — pixel-identical output

---

## Implementation Order

Each step is independently deployable with no broken intermediate state.

1. `config/env.js` — zero-risk, just moves constants
2. `utils/validators.js` + `utils/formatters.js` — pure functions, easy to verify
3. `services/uploadService.js` — replaces two identical blocks
4. `services/ordersService.js` — most impactful; unblocks steps 5–7
5. `services/promoService.js`
6. `services/menuService.js`
7. `hooks/useCart.js` — simplifies `Home.jsx`
8. `hooks/useFormState.js` — used by refactored admin tabs
9. `components/ui/*` — TabSwitcher, StatusBadge, FormInput
10. `components/checkout/*` — split CheckoutModal
11. `components/admin/*` — split Admin.jsx (largest step, do last)
