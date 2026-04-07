# Working Hours — Display & Admin Control Plan

## Overview

Store working hours are saved in Firestore so the admin can edit them from the dashboard without touching code. The customer-facing site reads them in real-time and shows them in the Footer and as part of the closed banner countdown. The existing `WORKING_HOURS_PLAN.md` (client-side time check + countdown) is implemented on top of these dynamic hours — the hardcoded 15:00/24:00 is replaced by whatever is saved in Firestore.

---

## Data Model

**Firestore document:** `meta/settings` (already exists for `isStoreOpen`)

Add a `workingHours` field — an array of 7 day objects, index 0 = Sunday … 6 = Saturday:

```json
{
  "isStoreOpen": true,
  "workingHours": [
    { "day": "الأحد",     "open": "15:00", "close": "00:00", "off": false },
    { "day": "الاثنين",   "open": "15:00", "close": "00:00", "off": false },
    { "day": "الثلاثاء",  "open": "15:00", "close": "00:00", "off": false },
    { "day": "الأربعاء",  "open": "15:00", "close": "00:00", "off": false },
    { "day": "الخميس",    "open": "15:00", "close": "00:00", "off": false },
    { "day": "الجمعة",    "open": "15:00", "close": "00:00", "off": false },
    { "day": "السبت",     "open": "15:00", "close": "00:00", "off": false }
  ]
}
```

**Field notes:**
- `open` / `close` — 24-hour strings `"HH:MM"`. `"00:00"` for close means midnight (end of day).
- `off: true` — day is fully closed regardless of open/close times (e.g. Friday).
- Default seeded on first admin save. If the doc has no `workingHours` field yet, the app falls back to 15:00 – 00:00 every day.

---

## Files to Create

### `src/services/settingsService.js`
Single responsibility: read and write `meta/settings`.

```js
subscribeSettings(callback)              // onSnapshot → full settings doc
updateWorkingHours(workingHoursArray)    // updateDoc with new array
toggleStore(isOpen)                      // updateDoc isStoreOpen (moves logic out of StoreToggle)
```

### `src/components/admin/SettingsTab.jsx`
New tab in the admin dashboard. Contains:
- The existing `StoreToggle` (moved here from the header)
- A working hours editor (see UI section below)

### `src/components/WorkingHoursDisplay.jsx`
Reusable card showing the 7-day schedule, used in:
- The **Footer** (customer view, always visible)
- Optionally inside the **ClosedBanner** (compact, 1-line today only)

---

## Files to Modify

### `src/hooks/useStoreStatus.js`
Currently subscribes to `meta/settings` and reads only `isStoreOpen`.

**Change:** also read `workingHours` from the same snapshot. No second Firestore read needed.

Return shape expands to:
```js
{
  isStoreOpen,      // effective combined result (admin && hours)
  adminIsOpen,      // raw Firestore isStoreOpen flag
  closedReason,     // null | 'admin' | 'hours' | 'day-off'
  workingHours,     // full 7-day array (for display)
  todayHours,       // { open, close, off } for today
  loading,
}
```

### `src/utils/workingHours.js` *(new file from previous plan)*
Replace hardcoded `OPEN_HOUR = 15` / `CLOSE_HOUR = 24` with dynamic values:

```js
isWithinWorkingHours(todayEntry)   // takes { open, close, off }
msUntilNextOpen(workingHours)      // iterates days to find next open slot
formatCountdown(ms)
```

### `src/components/ClosedBanner.jsx`
- Receives `closedReason` and `todayHours` / `workingHours` as props (passed from `Home.jsx`)
- `'hours'` or `'day-off'` → show countdown to next open day+time
- `'admin'` → show "مغلق مؤقتاً من الإدارة" with no countdown

### `src/components/Footer.jsx`
Add `<WorkingHoursDisplay />` between the contact buttons and the copyright line. The component subscribes to settings directly (small isolated subscription — no prop drilling needed).

### `src/pages/Admin.jsx`
- Add a fifth tab **"الإعدادات"** to the main tab grid (`grid-cols-5`)
- Render `<SettingsTab />` for that tab
- Remove `<StoreToggle />` from the header (it moves into `SettingsTab`)

### `src/data/content.json`
Add under `admin.tabs`:
```json
"settings": "الإعدادات"
```

Add new top-level `workingHours` section:
```json
"workingHours": {
  "title": "مواعيد العمل",
  "todayOpen": "مفتوح اليوم",
  "todayOff": "مغلق اليوم",
  "openLabel": "من",
  "closeLabel": "إلى",
  "offToggleLabel": "إجازة",
  "saveButton": "حفظ المواعيد",
  "savingButton": "جاري الحفظ...",
  "saveSuccess": "✅ تم حفظ المواعيد",
  "saveError": "فشل حفظ المواعيد"
}
```

---

## Admin UI — Working Hours Editor

Inside `SettingsTab.jsx`, below the store toggle:

```
┌─────────────────────────────────────────┐
│  مواعيد العمل                           │
├────────┬──────────┬──────────┬──────────┤
│ اليوم  │ من       │ إلى      │ إجازة   │
├────────┼──────────┼──────────┼──────────┤
│ الأحد  │ [15:00▼] │ [00:00▼] │  □       │
│ الاثنين│ [15:00▼] │ [00:00▼] │  □       │
│ ...    │ ...      │ ...      │  □       │
│ الجمعة │ [15:00▼] │ [00:00▼] │  ☑       │
├────────┴──────────┴──────────┴──────────┤
│        [ حفظ المواعيد ]                 │
└─────────────────────────────────────────┘
```

- Time fields are `<input type="time">` (native mobile time picker, no extra library)
- "إجازة" checkbox grays out the time inputs for that row
- Single **حفظ المواعيد** button saves all 7 days at once via `updateWorkingHours()`
- Toast on success / error (already have `react-hot-toast`)

---

## Customer UI — Working Hours Display

Inside `WorkingHoursDisplay.jsx`:

```
┌─────────────────────────────┐
│  🕐 مواعيد العمل            │
│  الأحد – الخميس  3م – 12ص  │
│  الجمعة           مغلق      │
│  السبت           3م – 12ص   │
└─────────────────────────────┘
```

Smart grouping: consecutive days with the same hours are grouped into a range (e.g. "الأحد – الخميس") to keep it compact. Days marked `off: true` show "مغلق".

Today's row is **bold** to help customers find it instantly.

---

## Implementation Order

1. Add strings to `content.json` (`admin.tabs.settings`, `workingHours.*`)
2. Create `src/services/settingsService.js`
3. Create `src/utils/workingHours.js` (dynamic version — replaces hardcoded hours)
4. Update `src/hooks/useStoreStatus.js` — read `workingHours` from same snapshot
5. Create `src/components/WorkingHoursDisplay.jsx`
6. Create `src/components/admin/SettingsTab.jsx` (StoreToggle + hours editor)
7. Update `src/pages/Admin.jsx` — add settings tab, remove StoreToggle from header
8. Update `src/components/Footer.jsx` — add WorkingHoursDisplay
9. Update `src/components/ClosedBanner.jsx` — dynamic countdown using real hours
10. Update `src/services/ordersService.js` — pass `workingHours` to `isWithinWorkingHours()`

---

## Behaviour Summary

| Who | Action | Result |
|---|---|---|
| Admin | Opens Settings tab | Sees store toggle + 7-day hours table |
| Admin | Changes Friday to "إجازة", saves | Firestore updates; all open tabs reflect change instantly |
| Admin | Changes open time from 15:00 to 14:00 | Store opens 1 hour earlier; countdown recalculates |
| Customer | Views Footer | Sees full weekly schedule; today's row is bold |
| Customer | Visits at 2 PM on a normal day | Sees closed banner with countdown to 3 PM |
| Customer | Visits on Friday (إجازة) | Sees closed banner with countdown to Saturday 3 PM |
| Customer | Submits order at 2:59 AM | `createOrder()` checks dynamic hours, throws `STORE_CLOSED` |
