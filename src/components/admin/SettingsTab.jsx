import { useState } from 'react';
import toast from 'react-hot-toast';
import content from '../../data/content.json';
import { updateWorkingHours } from '../../services/settingsService';
import StoreToggle from './StoreToggle';

const wh = content.workingHours;

export default function SettingsTab({ workingHours }) {
  const [rows, setRows]     = useState(() => workingHours.map(r => ({ ...r })));
  const [saving, setSaving] = useState(false);

  // Keep rows in sync if parent workingHours prop changes (e.g. another admin tab updates)
  // We only reset if length changes, not on every render, to avoid clobbering edits
  const [prevLen, setPrevLen] = useState(workingHours.length);
  if (workingHours.length !== prevLen) {
    setRows(workingHours.map(r => ({ ...r })));
    setPrevLen(workingHours.length);
  }

  const update = (i, field, value) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateWorkingHours(rows);
      toast(wh.saveSuccess, { style: { fontFamily: 'inherit', direction: 'rtl' } });
    } catch (err) {
      console.error(err);
      toast.error(wh.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Store toggle */}
      <div className="bg-white rounded-2xl p-5 shadow-md">
        <p className="font-black text-gray-800 mb-4 text-lg">{wh.storeToggleTitle}</p>
        <StoreToggle inline />
      </div>

      {/* Working hours editor */}
      <div className="bg-white rounded-2xl p-5 shadow-md">
        <p className="font-black text-gray-800 mb-4 text-lg">{wh.title}</p>
        <div className="flex flex-col gap-3" dir="rtl">
          {rows.map((row, i) => (
            <div key={i} className={`flex items-center gap-2 ${row.off ? 'opacity-40' : ''}`}>
              {/* Day name */}
              <span className="w-20 text-sm font-bold text-gray-700 shrink-0">{row.day}</span>

              {/* Open time */}
              <input
                type="time"
                value={row.open}
                disabled={row.off}
                onChange={e => update(i, 'open', e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-50"
              />

              <span className="text-gray-400 text-xs shrink-0">—</span>

              {/* Close time */}
              <input
                type="time"
                value={row.close === '00:00' ? '00:00' : row.close}
                disabled={row.off}
                onChange={e => update(i, 'close', e.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-50"
              />

              {/* Day-off toggle */}
              <label className="flex items-center gap-1 shrink-0 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={row.off}
                  onChange={e => update(i, 'off', e.target.checked)}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="text-xs text-gray-500">{wh.offLabel}</span>
              </label>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 w-full bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {saving ? wh.savingButton : wh.saveButton}
        </button>
      </div>
    </div>
  );
}
