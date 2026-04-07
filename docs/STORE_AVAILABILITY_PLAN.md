# Store Availability Toggle — Implementation Plan

## Stack Context

This app has **no traditional backend**. All data lives in Firebase Firestore. The plan below maps every requirement to the actual stack:

| Requirement (as stated) | Actual implementation |
|---|---|
| `GET /api/settings` | `onSnapshot` on `meta/settings` Firestore doc |
| `PUT /api/admin/settings` | `updateDoc(doc(db, 'meta', 'settings'), ...)` |
| Toast notifications | `react-hot-toast` (new dependency, ~3 KB) |
| Backend 403 on closed store | Guard check inside `createOrder()` in `ordersService.js` before the Firestore transaction |
| Real-time propagation | Same `onSnapshot` used by the hook — all tabs update instantly |

---

## Data Model

**Firestore document:** `meta/settings`

```json
{
  "isStoreOpen": true
}
```

No migration needed — the doc will be created on first toggle. If the doc doesn't exist yet, the hook defaults to `true` (open) so existing users see no change before the admin sets it.

---

## Files to Create

### `src/hooks/useStoreStatus.js`
Custom hook that subscribes to `meta/settings` with `onSnapshot`. Returns `{ isStoreOpen, loading }`. Used by both the user-facing app and the admin panel to react in real time.

### `src/components/admin/StoreToggle.jsx`
Toggle switch component rendered inside the Admin dashboard header. Shows current status, sends `updateDoc` on click, and fires a toast on success/error.

### `src/components/ClosedBanner.jsx`
Fixed top banner shown to users when `isStoreOpen === false`. Text: "المطعم مغلق حالياً — وضع التصفح فقط". Positioned below the browser chrome with `z-50`.

---

## Files to Modify

### `src/services/ordersService.js` — `createOrder()`
Add a guard at the top of the function (before the transaction):
```js
const settingsSnap = await getDoc(doc(db, 'meta', 'settings'));
if (settingsSnap.exists() && settingsSnap.data().isStoreOpen === false) {
  throw new Error('STORE_CLOSED');
}
```
`CheckoutModal` will catch `STORE_CLOSED` and show a clear Arabic error instead of the generic alert.

### `src/pages/Home.jsx`
- Import `useStoreStatus`
- Pass `isStoreOpen` down to `<CartBar>` and `<MenuCard>` (via props or context)
- Render `<ClosedBanner>` when closed

### `src/components/CartBar.jsx`
- Disable the checkout button and dim it when `isStoreOpen === false`

### `src/components/MenuCard.jsx`
- Disable the "+" Add button and apply `opacity-50 grayscale` when `isStoreOpen === false`

### `src/components/ItemModal.jsx`
- Same: disable Add button when store is closed

### `src/pages/Admin.jsx`
- Render `<StoreToggle>` in the dashboard header

### `src/data/content.json`
Add keys under a new `storeStatus` section:
```json
"storeStatus": {
  "openLabel": "المتجر مفتوح",
  "closedLabel": "المتجر مغلق",
  "closedBanner": "المطعم مغلق حالياً — وضع التصفح فقط",
  "toastOpened": "✅ تم فتح المتجر",
  "toastClosed": "🔴 تم إغلاق المتجر",
  "orderBlockedError": "المطعم مغلق حالياً ولا يقبل طلبات."
}
```

---

## New Dependency

```
react-hot-toast
```

Lightweight (~3 KB), no configuration needed beyond wrapping the app with `<Toaster />` in `App.jsx` (or `Home.jsx`). No other toast library is in the project.

---

## Implementation Order

1. **Install** `react-hot-toast` and add `<Toaster />` to `App.jsx`
2. **Add** `storeStatus` strings to `content.json`
3. **Create** `src/hooks/useStoreStatus.js`
4. **Create** `src/components/ClosedBanner.jsx`
5. **Create** `src/components/admin/StoreToggle.jsx`
6. **Update** `ordersService.js` — guard in `createOrder()`
7. **Update** `Home.jsx` — consume hook, render banner, pass flag down
8. **Update** `CartBar.jsx`, `MenuCard.jsx`, `ItemModal.jsx` — disable on closed
9. **Update** `Admin.jsx` — add `StoreToggle` to header

---

## Behaviour Summary

| Scenario | Result |
|---|---|
| Store open (default) | Everything works as today |
| Admin closes store | Banner appears instantly for all open tabs; Add/Checkout buttons disabled |
| User tries to submit order while closed (race condition) | `createOrder` throws `STORE_CLOSED`; modal shows Arabic error message |
| Admin reopens store | Banner disappears; buttons re-enable — no page refresh needed |
| `meta/settings` doc missing | Hook defaults to `true` (open); no disruption |
