import { useEffect, useState } from 'react';
import { subscribeSettings, DEFAULT_WORKING_HOURS } from '../services/settingsService';
import { formatArabicTime } from '../utils/workingHours';
import content from '../data/content.json';

const wh = content.workingHours;

function getEgyptDayIndex() {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', weekday: 'short' })
    .format(new Date());
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[part] ?? 0;
}

// Group consecutive days with identical hours into ranges
function groupDays(hours) {
  const groups = [];
  let i = 0;
  while (i < hours.length) {
    const cur = hours[i];
    let j = i + 1;
    while (
      j < hours.length &&
      hours[j].off === cur.off &&
      hours[j].open === cur.open &&
      hours[j].close === cur.close
    ) j++;
    const days = hours.slice(i, j);
    groups.push({
      label: days.length === 1
        ? days[0].day
        : `${days[0].day} – ${days[days.length - 1].day}`,
      indices: days.map((_, k) => i + k),
      open:  cur.open,
      close: cur.close,
      off:   cur.off,
    });
    i = j;
  }
  return groups;
}

export default function WorkingHoursDisplay() {
  const [hours, setHours] = useState(DEFAULT_WORKING_HOURS);
  const todayIndex = getEgyptDayIndex();

  useEffect(() => {
    const unsub = subscribeSettings(({ workingHours }) => setHours(workingHours));
    return unsub;
  }, []);

  const groups = groupDays(hours);

  return (
    <div className="mt-5 text-right" dir="rtl">
      <p className="text-gray-400 text-xs font-bold mb-2">🕐 {wh.title}</p>
      <div className="flex flex-col gap-1">
        {groups.map((g, i) => {
          const isToday = g.indices.includes(todayIndex);
          return (
            <div
              key={i}
              className={`flex justify-between text-xs gap-4 ${isToday ? 'text-white font-black' : 'text-gray-400'}`}
            >
              <span>{g.label}</span>
              {g.off
                ? <span className="text-red-400">{wh.closedDay}</span>
                : <span>{formatArabicTime(g.open)} – {formatArabicTime(g.close)}</span>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
