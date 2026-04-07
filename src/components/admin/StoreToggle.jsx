import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useStoreStatus } from '../../hooks/useStoreStatus';
import toast from 'react-hot-toast';
import content from '../../data/content.json';

const { storeStatus } = content;

export default function StoreToggle() {
  const { isStoreOpen, loading } = useStoreStatus();
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    const next = !isStoreOpen;
    try {
      await setDoc(doc(db, 'meta', 'settings'), { isStoreOpen: next }, { merge: true });
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

  return (
    <div className="flex items-center justify-center gap-3 mt-3">
      <span className={`text-sm font-bold ${isStoreOpen ? 'text-green-200' : 'text-red-300'}`}>
        {isStoreOpen ? storeStatus.openLabel : storeStatus.closedLabel}
      </span>
      <button
        onClick={toggle}
        disabled={saving}
        aria-label="تبديل حالة المتجر"
        className={`relative w-12 h-6 rounded-full transition-colors duration-300 disabled:opacity-60 focus:outline-none ${
          isStoreOpen ? 'bg-green-400' : 'bg-red-500'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
            isStoreOpen ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
