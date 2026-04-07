import { useState } from 'react';
import toast from 'react-hot-toast';
import { useStoreStatus } from '../../hooks/useStoreStatus';
import { toggleStore } from '../../services/settingsService';
import content from '../../data/content.json';

const { storeStatus } = content;

// inline=true → renders as a row card without its own header padding (used inside SettingsTab)
// inline=false (default) → renders as the compact toggle shown in the admin header
export default function StoreToggle({ inline = false }) {
  const { isStoreOpen, adminIsOpen, loading } = useStoreStatus();
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    setSaving(true);
    const next = !adminIsOpen;
    try {
      await toggleStore(next);
      toast(next ? storeStatus.toastOpened : storeStatus.toastClosed, {
        duration: 3000,
        style: { fontFamily: 'inherit', direction: 'rtl' },
      });
    } catch (err) {
      console.error(err);
      toast.error('فشل تحديث الحالة');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  const switchEl = (
    <button
      onClick={handleToggle}
      disabled={saving}
      aria-label="تبديل حالة المتجر"
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 disabled:opacity-60 focus:outline-none shrink-0 ${
        adminIsOpen ? 'bg-green-400' : 'bg-red-500'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
          adminIsOpen ? 'translate-x-6' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  if (inline) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`font-bold text-sm ${adminIsOpen ? 'text-green-600' : 'text-red-600'}`}>
            {adminIsOpen ? storeStatus.openLabel : storeStatus.closedLabel}
          </p>
          {!isStoreOpen && adminIsOpen && (
            <p className="text-xs text-gray-400 mt-0.5">مغلق تلقائياً خارج أوقات العمل</p>
          )}
        </div>
        {switchEl}
      </div>
    );
  }

  // Compact header variant
  return (
    <div className="flex items-center justify-center gap-3 mt-3">
      <span className={`text-sm font-bold ${adminIsOpen ? 'text-green-200' : 'text-red-300'}`}>
        {adminIsOpen ? storeStatus.openLabel : storeStatus.closedLabel}
      </span>
      {switchEl}
    </div>
  );
}
