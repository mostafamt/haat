import { useEffect, useState } from 'react';
import content from '../../data/content.json';
import { fetchAllPromosWithUsage, addPromoCode, togglePromoCode } from '../../services/promoService';

const { admin } = content;
const promos = admin.promos;

export default function PromosTab() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [promoForm, setPromoForm] = useState({ code: '', discount_type: 'percent', discount_value: '', expires_at: '', max_uses: '' });
  const [promoFormErrors, setPromoFormErrors] = useState({});
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoToggling, setPromoToggling] = useState(null);

  useEffect(() => {
    setPromosLoading(true);
    fetchAllPromosWithUsage().then(codes => { setPromoCodes(codes); setPromosLoading(false); });
  }, []);

  const validatePromoForm = () => {
    const e = {};
    if (!promoForm.code.trim()) e.code = promos.errors.codeRequired;
    const val = Number(promoForm.discount_value);
    if (!promoForm.discount_value) e.discount_value = promos.errors.valueRequired;
    else if (isNaN(val) || val <= 0) e.discount_value = promos.errors.valueInvalid;
    return e;
  };

  const handleAddPromo = async (e) => {
    e.preventDefault();
    const errs = validatePromoForm();
    if (Object.keys(errs).length) { setPromoFormErrors(errs); return; }

    const code = promoForm.code.trim().toUpperCase();
    setPromoSaving(true);
    setPromoFormErrors({});
    try {
      const data = {
        discount_type: promoForm.discount_type,
        discount_value: Number(promoForm.discount_value),
        active: true,
        expires_at: promoForm.expires_at ? new Date(promoForm.expires_at) : null,
        max_uses: promoForm.max_uses ? Number(promoForm.max_uses) : null,
      };
      await addPromoCode(code, data);
      setPromoCodes(prev => [...prev, { id: code, ...data, usedCount: 0 }]);
      setPromoForm({ code: '', discount_type: 'percent', discount_value: '', expires_at: '', max_uses: '' });
    } catch (err) {
      if (err.message === 'codeExists') {
        setPromoFormErrors({ code: promos.errors.codeExists });
      } else {
        setPromoFormErrors({ code: promos.errors.saveFailed });
      }
    } finally {
      setPromoSaving(false);
    }
  };

  const handleToggle = async (id, currentActive) => {
    setPromoToggling(id);
    try {
      await togglePromoCode(id, !currentActive);
      setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, active: !currentActive } : p));
    } finally {
      setPromoToggling(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Add promo form */}
      <div className="bg-white rounded-2xl p-4 shadow-md">
        <h2 className="font-black text-gray-800 mb-4 text-lg">{promos.addTitle}</h2>
        <form onSubmit={handleAddPromo} className="flex flex-col gap-3">
          <div>
            <input
              type="text"
              value={promoForm.code}
              onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
              placeholder={promos.codePlaceholder}
              className={`w-full border ${promoFormErrors.code ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
            />
            {promoFormErrors.code && <p className="text-red-500 text-xs mt-1">{promoFormErrors.code}</p>}
          </div>

          <div className="flex gap-2">
            <select
              value={promoForm.discount_type}
              onChange={e => setPromoForm({ ...promoForm, discount_type: e.target.value })}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-white text-right focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="percent">{promos.typePercent}</option>
              <option value="fixed">{promos.typeFixed}</option>
            </select>
            <div className="flex-1">
              <input
                type="number"
                min="1"
                value={promoForm.discount_value}
                onChange={e => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                placeholder={promos.valuePlaceholder}
                className={`w-full border ${promoFormErrors.discount_value ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
              />
              {promoFormErrors.discount_value && <p className="text-red-500 text-xs mt-1">{promoFormErrors.discount_value}</p>}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={promoForm.expires_at}
              onChange={e => setPromoForm({ ...promoForm, expires_at: e.target.value })}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <input
              type="number"
              min="1"
              value={promoForm.max_uses}
              onChange={e => setPromoForm({ ...promoForm, max_uses: e.target.value })}
              placeholder={promos.maxUsesPlaceholder}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <button
            type="submit"
            disabled={promoSaving}
            className="w-full bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {promoSaving ? promos.savingButton : promos.addButton}
          </button>
        </form>
      </div>

      {/* Promo codes list */}
      {promosLoading && <p className="text-center text-gray-500 py-10">{admin.loading}</p>}
      {!promosLoading && promoCodes.length === 0 && (
        <p className="text-center text-gray-400 py-10">{promos.empty}</p>
      )}
      {promoCodes.map(p => (
        <div key={p.id} className="bg-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <p className="font-black text-gray-800 text-lg tracking-wider">{p.id}</p>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {p.active ? promos.statusActive : promos.statusInactive}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            {p.discount_type === 'percent' ? `${p.discount_value}%` : `${p.discount_value} ${admin.currency}`} {promos.discountSuffix}
          </p>
          <p className="text-xs text-gray-400 mb-3">
            {promos.usedLabel} {p.usedCount}{p.max_uses ? ` / ${p.max_uses}` : ''}
            {p.expires_at ? ` · ${promos.expiresLabel} ${new Date(p.expires_at.toDate ? p.expires_at.toDate() : p.expires_at).toLocaleDateString('ar-EG')}` : ''}
          </p>
          <button
            onClick={() => handleToggle(p.id, p.active)}
            disabled={promoToggling === p.id}
            className={`w-full font-bold py-2 rounded-xl transition-colors text-sm disabled:opacity-50 ${
              p.active
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {promoToggling === p.id ? promos.togglingButton : p.active ? promos.deactivateButton : promos.activateButton}
          </button>
        </div>
      ))}
    </div>
  );
}
