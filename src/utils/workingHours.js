const TIMEZONE = 'Africa/Cairo';

// Returns current Egypt time parts
function getEgyptNow() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    weekday: 'short', hour12: false,
  }).formatToParts(now);

  const get = (type) => parts.find(p => p.type === type)?.value;
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    dayIndex: weekdayMap[get('weekday')] ?? 0,
    hour:     parseInt(get('hour'),   10),
    minute:   parseInt(get('minute'), 10),
    second:   parseInt(get('second'), 10),
  };
}

// Parse "HH:MM" → { h, m }
function parseTime(str) {
  const [h, m] = (str || '00:00').split(':').map(Number);
  return { h, m };
}

// Total minutes since midnight
function toMinutes(h, m) { return h * 60 + m; }

// Is a given { open, close, off } entry currently open?
// close "00:00" means midnight = end of day (1440 min)
export function isEntryOpen(entry, hour, minute) {
  if (!entry || entry.off) return false;
  const { h: oh, m: om } = parseTime(entry.open);
  const { h: ch, m: cm } = parseTime(entry.close);
  const now   = toMinutes(hour, minute);
  const open  = toMinutes(oh, om);
  const close = cm === 0 && ch === 0 ? 1440 : toMinutes(ch, cm); // 00:00 → midnight
  return now >= open && now < close;
}

// Is the store currently within working hours?
export function isWithinWorkingHours(workingHours) {
  if (!workingHours?.length) return true; // no schedule → always open
  const { dayIndex, hour, minute } = getEgyptNow();
  return isEntryOpen(workingHours[dayIndex], hour, minute);
}

// Milliseconds until the next open slot, scanning up to 7 days ahead.
export function msUntilNextOpen(workingHours) {
  if (!workingHours?.length) return 0;

  const now = new Date();
  const { dayIndex, hour, minute, second } = getEgyptNow();

  for (let offset = 0; offset < 8; offset++) {
    const idx   = (dayIndex + offset) % 7;
    const entry = workingHours[idx];
    if (!entry || entry.off) continue;

    const { h: oh, m: om } = parseTime(entry.open);
    const openMinutes = toMinutes(oh, om);

    if (offset === 0) {
      // Today: only valid if open time is still in the future
      const nowMinutes = toMinutes(hour, minute);
      if (openMinutes > nowMinutes) {
        // minutes remaining today until open
        const diffMin = openMinutes - nowMinutes;
        return diffMin * 60 * 1000 - second * 1000;
      }
      // already past open time today → check if currently open (shouldn't reach here)
      continue;
    }

    // Future day: compute ms until midnight tonight + offset days + open time
    const secondsToMidnight = (24 - hour) * 3600 - minute * 60 - second;
    const msToMidnight      = secondsToMidnight * 1000;
    const msFutureDays      = (offset - 1) * 24 * 3600 * 1000;
    const msOpenTime        = (oh * 3600 + om * 60) * 1000;
    return msToMidnight + msFutureDays + msOpenTime;
  }

  return 0;
}

export function formatCountdown(ms) {
  if (ms <= 0) return '';
  const totalSec = Math.floor(ms / 1000);
  const h  = Math.floor(totalSec / 3600);
  const m  = Math.floor((totalSec % 3600) / 60);
  const s  = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Format "HH:MM" → "3 م" / "12 ص" style Arabic
export function formatArabicTime(str) {
  if (!str) return '';
  const { h, m } = parseTime(str);
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const suffix   = h < 12 ? 'ص' : 'م';
  const minPart  = m > 0 ? `:${String(m).padStart(2, '0')}` : '';
  return `${displayH}${minPart} ${suffix}`;
}
