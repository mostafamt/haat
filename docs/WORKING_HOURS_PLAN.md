# Working Hours & Countdown Timer — Implementation Plan

## Overview

Add automatic open/close scheduling (3 PM – 12 AM Egypt time) on top of the existing admin toggle. Outside working hours the store closes automatically and users see a live countdown to the next opening.

---

## Key Design Decisions

### 1 — Client-side time check, no Firestore scheduler

Working hours are evaluated entirely in the browser. No Cloud Functions, no cron jobs, no Firestore writes on a schedule. This keeps the implementation simple and free.

### 2 — Two independent conditions must both be true to open the store

```
effectivelyOpen = adminIsOpen  &&  isWithinWorkingHours()
```

| Admin toggle | Working hours | Result |
|---|---|---|
| ✅ On | ✅ In hours | Open |
| ✅ On | ❌ Off hours | Auto-closed (countdown shown) |
| ❌ Off | ✅ In hours | Manually closed by admin |
| ❌ Off | ❌ Off hours | Closed (off-hours reason shown) |

### 3 — Timezone: Egypt Standard Time (UTC+2, no DST)

Egypt abolished DST in 2011. The offset is always **UTC+2**.  
Converted at runtime using `Intl.DateTimeFormat` — no timezone library needed.

### 4 — Working hours: 15:00 – 24:00 (3 PM to midnight)

"12 AM" means midnight = start of the next day, so `hour >= 15 && hour < 24`.

### 5 — Admin toggle still works as a manual override

During working hours the admin can still force-close (e.g. out of stock). During off-hours the admin toggle has no user-visible effect (hours win).

---

## Countdown Logic

When the store is auto-closed by hours, compute:

```
msUntilOpen = (next 15:00 EGY in UTC) - (now in UTC)
```

- If current hour < 15 → next opening is **today at 15:00**
- If current hour >= 15 (impossible since that is working hours) → unreachable
- If current hour >= 24/0 (i.e. midnight to 2:59 AM) → next opening is **today at 15:00**

The countdown ticks every second via `setInterval`.

Format: `XX ساعة YY دقيقة ZZ ثانية`

---

## Files to Create

### `src/utils/workingHours.js`
```
OPEN_HOUR  = 15   (3 PM)
CLOSE_HOUR = 24   (midnight)
TIMEZONE   = 'Africa/Cairo'

isWithinWorkingHours() → boolean
getEgyptHour()         → number (0-23)
msUntilNextOpen()      → number (milliseconds)
formatCountdown(ms)    → string "XX ساعة YY دقيقة ZZ ثانية"
```

---

## Files to Modify

### `src/hooks/useStoreStatus.js`
Add a second parallel state for working hours, updated by a `setInterval` every minute (exact second not needed for the open/close decision — only the banner needs per-second updates).

Return shape changes from:
```js
{ isStoreOpen, loading }
```
to:
```js
{ isStoreOpen, loading, closedReason }
// closedReason: null | 'admin' | 'hours'
```

`isStoreOpen` continues to mean the **effective** combined result.  
`closedReason` lets the banner show different messages.

### `src/components/ClosedBanner.jsx`
Two display modes based on `closedReason`:

- **`'hours'`** → show static closed message + live countdown
  - "المطبخ مغلق حالياً..." (existing text)
  - Second line: "يفتح خلال XX ساعة YY دقيقة ZZ ثانية"
  - Countdown state lives inside this component (`setInterval` every second)

- **`'admin'`** → show static admin-closed message only  
  - "المطعم مغلق مؤقتاً من قِبل الإدارة"

### `src/services/ordersService.js` — `createOrder()`
Add working hours check alongside the existing admin check:

```js
// existing check
if (settingsSnap.data().isStoreOpen === false) throw new Error('STORE_CLOSED');

// new check
if (!isWithinWorkingHours()) throw new Error('STORE_CLOSED');
```

Both throw the same `STORE_CLOSED` error so `CheckoutModal` needs no changes.

### `src/components/admin/StoreToggle.jsx`
Show current working hours schedule as context text so the admin knows:
- "مواعيد العمل: ٣ عصراً — ١٢ منتصف الليل"
- Dim the toggle with a note when it is off-hours (the toggle still works, it just has no user-facing effect until opening time)

### `src/data/content.json` — `storeStatus` section
Add new keys:
```json
"autoClosedBanner": "المطبخ مغلق حالياً...",
"adminClosedBanner": "المطعم مغلق مؤقتاً من قِبل الإدارة 🔴",
"countdownPrefix": "يفتح خلال",
"countdownHour": "ساعة",
"countdownMinute": "دقيقة",
"countdownSecond": "ثانية",
"workingHoursNote": "مواعيد العمل: ٣ عصراً — ١٢ منتصف الليل"
```

---

## Implementation Order

1. **Add** new strings to `content.json`
2. **Create** `src/utils/workingHours.js`
3. **Update** `src/hooks/useStoreStatus.js` — add hours state + `closedReason`
4. **Update** `src/components/ClosedBanner.jsx` — countdown + dual-mode display
5. **Update** `src/services/ordersService.js` — add `isWithinWorkingHours()` guard
6. **Update** `src/components/admin/StoreToggle.jsx` — add schedule context text

---

## Behaviour Summary

| Time (Egypt) | Admin toggle | Banner | Cart/Checkout |
|---|---|---|---|
| 15:00 – 23:59 | On | Hidden | Active |
| 15:00 – 23:59 | Off | "مغلق مؤقتاً من الإدارة" | Disabled |
| 00:00 – 14:59 | On or Off | "مغلق + countdown" | Disabled |

No page refresh needed — the `setInterval` in `useStoreStatus` re-evaluates working hours every minute and triggers a re-render automatically.
