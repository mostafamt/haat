import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, getDoc, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import content from '../data/content.json';

const { admin } = content;
const { promos, customers: customersContent } = admin;

export default function Admin() {
  const [tab, setTab] = useState('orders');

  // ── Orders state ──────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setOrdersLoading(false);
    });
    return unsub;
  }, []);

  const markDone = async (id) => {
    await updateDoc(doc(db, 'orders', id), { status: 'done' });
  };

  // ── Customers state ───────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'customers') return;
    setCustomersLoading(true);
    getDocs(query(collection(db, 'users'), orderBy('lastOrderAt', 'desc'))).then(snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCustomersLoading(false);
    });
  }, [tab]);

  // ── Promo codes state ──────────────────────────────────────
  const [promoCodes, setPromoCodes] = useState([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: '', discount_type: 'percent', discount_value: '', expires_at: '', max_uses: '' });
  const [promoFormErrors, setPromoFormErrors] = useState({});
  const [promoSaving, setPromoSaving] = useState(false);
  const [promoToggling, setPromoToggling] = useState(null);

  useEffect(() => {
    if (tab !== 'promos') return;
    setPromosLoading(true);
    getDocs(collection(db, 'promo_codes')).then(async snap => {
      const codes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // fetch unique-phone usage count per code
      const withCounts = await Promise.all(codes.map(async c => {
        const usageSnap = await getDocs(query(collection(db, 'orders'), where('promoCode', '==', c.id)));
        const usedCount = new Set(usageSnap.docs.map(d => d.data().phone)).size;
        return { ...c, usedCount };
      }));
      setPromoCodes(withCounts);
      setPromosLoading(false);
    });
  }, [tab]);

  const validatePromoForm = () => {
    const e = {};
    const code = promoForm.code.trim().toUpperCase();
    if (!code) e.code = promos.errors.codeRequired;
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
      const existing = await getDoc(doc(db, 'promo_codes', code));
      if (existing.exists()) {
        setPromoFormErrors({ code: promos.errors.codeExists });
        return;
      }

      const data = {
        discount_type: promoForm.discount_type,
        discount_value: Number(promoForm.discount_value),
        active: true,
        expires_at: promoForm.expires_at ? new Date(promoForm.expires_at) : null,
        max_uses: promoForm.max_uses ? Number(promoForm.max_uses) : null,
      };

      await setDoc(doc(db, 'promo_codes', code), data);
      setPromoCodes(prev => [...prev, { id: code, ...data, usedCount: 0 }]);
      setPromoForm({ code: '', discount_type: 'percent', discount_value: '', expires_at: '', max_uses: '' });
    } catch (err) {
      console.error(err);
      setPromoFormErrors({ code: promos.errors.saveFailed });
    } finally {
      setPromoSaving(false);
    }
  };

  const togglePromo = async (id, currentActive) => {
    setPromoToggling(id);
    try {
      await updateDoc(doc(db, 'promo_codes', id), { active: !currentActive });
      setPromoCodes(prev => prev.map(p => p.id === id ? { ...p, active: !currentActive } : p));
    } finally {
      setPromoToggling(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-red-600 text-white text-center py-4 rounded-2xl mb-4">
          <h1 className="text-2xl font-black">{admin.dashboardTitle}</h1>
          {tab === 'orders' && (
            <p className="text-sm opacity-80 mt-1">{orders.length} {admin.ordersTotal}</p>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm">
          <button
            onClick={() => setTab('orders')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${tab === 'orders' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {admin.tabs.orders}
          </button>
          <button
            onClick={() => setTab('customers')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${tab === 'customers' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {admin.tabs.customers}
          </button>
          <button
            onClick={() => setTab('promos')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${tab === 'promos' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {admin.tabs.promos}
          </button>
        </div>

        {/* ── Orders Tab ── */}
        {tab === 'orders' && (
          <div className="flex flex-col gap-4">
            {ordersLoading && <p className="text-center text-gray-500 py-10">{admin.loading}</p>}
            {!ordersLoading && orders.length === 0 && (
              <p className="text-center text-gray-500 py-10">{admin.noOrders}</p>
            )}
            {orders.map(order => (
              <div
                key={order.id}
                className={`bg-white rounded-2xl p-4 shadow-md border-r-4 ${order.status === 'done' ? 'border-green-500' : 'border-amber-400'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-black text-gray-800 text-lg">{order.name}</p>
                    <p className="text-gray-500 text-sm">📞 {order.phone}</p>
                    <p className="text-gray-500 text-sm">📍 {order.address}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${order.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {admin.status[order.status] || order.status}
                    </span>
                    <p className="text-red-600 font-black text-lg mt-2">{order.total} {admin.currency}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  {(order.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-600 py-0.5">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{item.price * item.quantity} {admin.currency}</span>
                    </div>
                  ))}
                  {order.promoCode && order.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 pt-1 mt-1 border-t border-gray-200">
                      <span>🏷️ {order.promoCode}</span>
                      <span>- {order.discount} {admin.currency}</span>
                    </div>
                  )}
                </div>

                {order.timestamp && (
                  <p className="text-xs text-gray-400 mb-3">
                    {new Date(order.timestamp.toDate()).toLocaleString('ar-EG')}
                  </p>
                )}

                {order.status !== 'done' && (
                  <button
                    onClick={() => markDone(order.id)}
                    className="w-full bg-green-500 text-white font-bold py-2.5 rounded-xl hover:bg-green-600 transition-colors"
                  >
                    {admin.markDoneButton}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Customers Tab ── */}
        {tab === 'customers' && (
          <div className="flex flex-col gap-4">
            {customersLoading && <p className="text-center text-gray-500 py-10">{admin.loading}</p>}
            {!customersLoading && customers.length === 0 && (
              <p className="text-center text-gray-500 py-10">{customersContent.noCustomers}</p>
            )}
            {customers.map(c => (
              <div key={c.id} className="bg-white rounded-2xl p-4 shadow-md border-r-4 border-blue-400">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 text-lg">{c.name}</p>
                    <p className="text-gray-500 text-sm mt-0.5">📞 {c.phone}</p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">📍 {c.address}</p>
                    <div className="flex gap-3 mt-1">
                      {c.firstOrderAt && (
                        <p className="text-gray-400 text-xs">
                          {customersContent.firstOrder}: {c.firstOrderAt.toDate().toLocaleDateString('ar-EG')}
                        </p>
                      )}
                      {c.lastOrderAt && (
                        <p className="text-gray-400 text-xs">
                          {customersContent.lastOrder}: {c.lastOrderAt.toDate().toLocaleDateString('ar-EG')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left mr-3 shrink-0">
                    <p className="text-blue-600 font-black text-lg">{c.orderCount} {customersContent.ordersCount}</p>
                    <p className="text-gray-500 text-sm font-bold mt-0.5">{c.totalSpent} {admin.currency}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Promo Codes Tab ── */}
        {tab === 'promos' && (
          <div className="flex flex-col gap-4">

            {/* Add new promo form */}
            <div className="bg-white rounded-2xl p-4 shadow-md">
              <h2 className="font-black text-gray-800 mb-4">{promos.addTitle}</h2>
              <form onSubmit={handleAddPromo} className="flex flex-col gap-3">

                {/* Code */}
                <div>
                  <input
                    type="text"
                    value={promoForm.code}
                    onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    placeholder={promos.codePlaceholder}
                    className={`w-full border ${promoFormErrors.code ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400 font-mono tracking-widest`}
                  />
                  {promoFormErrors.code && <p className="text-red-500 text-xs mt-1">{promoFormErrors.code}</p>}
                </div>

                {/* Discount type + value side by side */}
                <div className="flex gap-2">
                  <select
                    value={promoForm.discount_type}
                    onChange={e => setPromoForm({ ...promoForm, discount_type: e.target.value })}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-3 text-right bg-white focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                  >
                    <option value="percent">{promos.typePercent}</option>
                    <option value="flat">{promos.typeFlat}</option>
                  </select>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="1"
                      value={promoForm.discount_value}
                      onChange={e => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                      placeholder={promos.discountValuePlaceholder}
                      className={`w-full border ${promoFormErrors.discount_value ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
                    />
                  </div>
                </div>
                {promoFormErrors.discount_value && <p className="text-red-500 text-xs -mt-2">{promoFormErrors.discount_value}</p>}

                {/* Max uses */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{promos.maxUsesLabel}</label>
                  <input
                    type="number"
                    min="1"
                    value={promoForm.max_uses}
                    onChange={e => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                    placeholder={promos.maxUsesPlaceholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>

                {/* Expiry date */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">{promos.expiryLabel}</label>
                  <input
                    type="date"
                    value={promoForm.expires_at}
                    onChange={e => setPromoForm({ ...promoForm, expires_at: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={promoSaving}
                  className="bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {promoSaving ? promos.addingButton : promos.addButton}
                </button>
              </form>
            </div>

            {/* Existing promo codes list */}
            {promosLoading && <p className="text-center text-gray-500 py-6">{admin.loading}</p>}
            {!promosLoading && promoCodes.length === 0 && (
              <p className="text-center text-gray-500 py-6">{promos.noPromos}</p>
            )}
            {promoCodes.map(p => (
              <div key={p.id} className={`bg-white rounded-2xl p-4 shadow-md border-r-4 ${p.active ? 'border-green-500' : 'border-gray-300'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-gray-800 text-lg font-mono tracking-widest">{p.id}</p>
                    <p className="text-gray-500 text-sm mt-0.5">
                      {p.discount_type === 'percent'
                        ? `${promos.discountPercent} ${p.discount_value}%`
                        : `${promos.discountFlat} ${p.discount_value}`}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {p.expires_at
                        ? (p.expires_at.toDate ? p.expires_at.toDate().toLocaleDateString('ar-EG') : new Date(p.expires_at).toLocaleDateString('ar-EG'))
                        : promos.noExpiry}
                    </p>
                    <p className={`text-xs mt-1 font-bold ${p.max_uses !== null && p.usedCount >= p.max_uses ? 'text-red-500' : 'text-gray-500'}`}>
                      {promos.usageCount} {p.usedCount ?? 0}
                      {p.max_uses !== null ? ` ${promos.usageOf} ${p.max_uses}` : ` (${promos.unlimited})`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.active ? promos.activeBadge : promos.inactiveBadge}
                    </span>
                    <button
                      onClick={() => togglePromo(p.id, p.active)}
                      disabled={promoToggling === p.id}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 ${p.active ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {promoToggling === p.id ? '...' : p.active ? promos.toggleDeactivate : promos.toggleActivate}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
