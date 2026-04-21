# Bug Fix Plan: StoreToggle ON but ClosedBanner Still Shows

## Problem

When the admin toggles the store **ON** from the admin panel, the `ClosedBanner` is still displayed on the home page if the current time is outside working hours.

---

## Root Cause

### File: `src/hooks/useStoreStatus.js` — line 31

```js
const isStoreOpen = adminIsOpen && withinHours;
```

`isStoreOpen` requires **both** conditions to be true simultaneously:
- `adminIsOpen` — the admin toggle is ON in Firestore
- `withinHours` — the current time falls within the configured working hours

So when the admin explicitly toggles the store ON (`adminIsOpen = true`) but the current time is outside working hours (`withinHours = false`), the result is:

```
isStoreOpen = true && false = false
```

`Home.jsx` line 45 then renders `<ClosedBanner>` because `!isStoreOpen`:

```jsx
{!isStoreOpen && <ClosedBanner closedReason={closedReason} workingHours={workingHours} />}
```

The admin toggle has **no power to override working hours** — it is silently overruled.

---

## Design Intent vs. Current Behavior

| Scenario | Admin Toggle | Within Hours | Expected | Actual |
|---|---|---|---|---|
| Normal open hours, toggle ON | ✅ | ✅ | Open | Open ✅ |
| Outside hours, toggle OFF | ❌ | ❌ | Closed | Closed ✅ |
| Outside hours, toggle ON | ✅ | ❌ | **Open (override)** | **Closed ❌ Bug** |
| Inside hours, toggle OFF | ❌ | ✅ | Closed (admin override) | Closed ✅ |

---

## Fix

Make the **admin toggle the master control**. The toggle explicitly sets the store state. Working hours become informational — shown in the admin UI — but do not override an explicit admin decision.

### Change in `src/hooks/useStoreStatus.js`

```js
// Before (line 31)
const isStoreOpen = adminIsOpen && withinHours;

// After
const isStoreOpen = adminIsOpen;
```

### Update `closedReason` logic (same file, lines 33–37)

```js
// Before
const closedReason = isStoreOpen
  ? null
  : !withinHours
    ? 'hours'
    : 'admin';

// After
const closedReason = isStoreOpen ? null : 'admin';
```

> The `'hours'` reason is no longer needed because working hours no longer close the store automatically. The admin is the only actor that can close it.

---

## Impact on Other Components

### `StoreToggle.jsx` (admin UI)

The note "مغلق تلقائياً خارج أوقات العمل" (closed automatically outside working hours) will no longer be shown, since working hours no longer auto-close the store. This line should be **removed**:

```jsx
// Remove this block from StoreToggle.jsx
{!isStoreOpen && adminIsOpen && (
  <p className="text-xs text-gray-400 mt-0.5">مغلق تلقائياً خارج أوقات العمل</p>
)}
```

### `ClosedBanner.jsx`

The `'hours'` branch (countdown timer) will never be reached after the fix. It can be kept for safety or removed. No change is strictly required for the fix to work.

### `settingsService.js`

No change needed. `toggleStore()` already writes `{ isStoreOpen: boolean }` correctly.

---

## Files to Change

| File | Change |
|---|---|
| `src/hooks/useStoreStatus.js` | Line 31: remove `&& withinHours`; update `closedReason` |
| `src/components/admin/StoreToggle.jsx` | Remove "مغلق تلقائياً" note |

---

## Optional: Keep Auto-Close via Working Hours

If auto-closing by working hours is desired in the future, introduce a 3-state `adminOverride` field in Firestore:

| Value | Meaning |
|---|---|
| `true` | Force open (override hours) |
| `false` | Force closed (override hours) |
| `null` | Auto — follow working hours |

This adds complexity and is not needed for the immediate fix.

---

## Summary

**One-line fix:** Change `const isStoreOpen = adminIsOpen && withinHours` to `const isStoreOpen = adminIsOpen` in `useStoreStatus.js`. The admin toggle then does exactly what it says.
