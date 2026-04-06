import { useEffect, useRef, useState } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, setDoc, getDoc, getDocs, where,
  addDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import content from '../data/content.json';

const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file) {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', CLOUDINARY_PRESET);
  form.append('folder', 'haat/menu');
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  return data.secure_url;
}

const { admin } = content;
const { promos, customers: customersContent, menu: menuContent } = admin;
const extrasContent = menuContent.extras;

export default function Admin() {
  const [tab, setTab] = useState('orders');

  // ── Orders state ──────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState('');

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

  // ── Menu state ────────────────────────────────────────────
  const [menuSubTab, setMenuSubTab] = useState('items');

  // Menu items
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [menuForm, setMenuForm] = useState({ name: '', price: '', description: '', prepTime: '', prepMinutes: '', includes: '', image: '' });
  const [menuFormErrors, setMenuFormErrors] = useState({});
  const [menuSaving, setMenuSaving] = useState(false);
  const [menuImageFile, setMenuImageFile] = useState(null);
  const [menuImagePreview, setMenuImagePreview] = useState('');
  const [menuDeleteConfirm, setMenuDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (tab !== 'menu') return;
    setMenuLoading(true);
    const q = query(collection(db, 'menuItems'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setMenuLoading(false);
    });
    return unsub;
  }, [tab]);

  const resetMenuForm = () => {
    setShowMenuForm(false);
    setEditingMenuId(null);
    setMenuForm({ name: '', price: '', description: '', prepTime: '', prepMinutes: '', includes: '', image: '' });
    setMenuFormErrors({});
    setMenuImageFile(null);
    setMenuImagePreview('');
    setMenuDeleteConfirm(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEditMenuItem = (item) => {
    setEditingMenuId(item.id);
    setMenuForm({
      name: item.name || '',
      price: item.price?.toString() || '',
      description: item.description || '',
      prepTime: item.prepTime || '',
      prepMinutes: item.prepMinutes?.toString() || '',
      includes: (item.includes || []).join('، '),
      image: item.image || '',
    });
    setMenuImagePreview(item.image || '');
    setMenuImageFile(null);
    setMenuFormErrors({});
    setShowMenuForm(true);
    setMenuDeleteConfirm(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMenuImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMenuImageFile(file);
    setMenuImagePreview(URL.createObjectURL(file));
  };

  const handleMenuSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!menuForm.name.trim()) errs.name = menuContent.errors.nameRequired;
    const priceNum = Number(menuForm.price);
    if (!menuForm.price || isNaN(priceNum) || priceNum <= 0) errs.price = menuContent.errors.priceInvalid;
    if (Object.keys(errs).length) { setMenuFormErrors(errs); return; }

    setMenuSaving(true);
    setMenuFormErrors({});
    try {
      let imageUrl = menuForm.image || '';
      if (menuImageFile) {
        imageUrl = await uploadToCloudinary(menuImageFile);
      }
      const includesArray = menuForm.includes
        ? menuForm.includes.split(/[,،]/).map(s => s.trim()).filter(Boolean)
        : [];
      const data = {
        name: menuForm.name.trim(),
        price: priceNum,
        description: menuForm.description.trim(),
        prepTime: menuForm.prepTime.trim(),
        prepMinutes: menuForm.prepMinutes ? Number(menuForm.prepMinutes) : 0,
        includes: includesArray,
        image: imageUrl,
        order: editingMenuId
          ? (menuItems.find(m => m.id === editingMenuId)?.order ?? menuItems.length)
          : menuItems.length,
      };
      if (editingMenuId) {
        await updateDoc(doc(db, 'menuItems', editingMenuId), data);
      } else {
        await addDoc(collection(db, 'menuItems'), data);
      }
      resetMenuForm();
    } catch (err) {
      console.error(err);
      setMenuFormErrors({ name: menuContent.errors.saveFailed });
    } finally {
      setMenuSaving(false);
    }
  };

  const handleMenuDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'menuItems', id));
      setMenuDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Extras
  const [extrasItems, setExtrasItems] = useState([]);
  const [extrasLoading, setExtrasLoading] = useState(false);
  const [showExtrasForm, setShowExtrasForm] = useState(false);
  const [editingExtraId, setEditingExtraId] = useState(null);
  const [extrasForm, setExtrasForm] = useState({ name: '', price: '', emoji: '' });
  const [extrasFormErrors, setExtrasFormErrors] = useState({});
  const [extrasSaving, setExtrasSaving] = useState(false);
  const [extrasDeleteConfirm, setExtrasDeleteConfirm] = useState(null);

  useEffect(() => {
    if (tab !== 'menu') return;
    setExtrasLoading(true);
    const q = query(collection(db, 'extras'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setExtrasItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setExtrasLoading(false);
    });
    return unsub;
  }, [tab]);

  const resetExtrasForm = () => {
    setShowExtrasForm(false);
    setEditingExtraId(null);
    setExtrasForm({ name: '', price: '', emoji: '' });
    setExtrasFormErrors({});
    setExtrasDeleteConfirm(null);
  };

  const startEditExtra = (item) => {
    setEditingExtraId(item.id);
    setExtrasForm({
      name: item.name || '',
      price: item.price?.toString() || '',
      emoji: item.emoji || '',
    });
    setExtrasFormErrors({});
    setShowExtrasForm(true);
    setExtrasDeleteConfirm(null);
  };

  const handleExtrasSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!extrasForm.name.trim()) errs.name = extrasContent.errors.nameRequired;
    const priceNum = Number(extrasForm.price);
    if (!extrasForm.price || isNaN(priceNum) || priceNum <= 0) errs.price = extrasContent.errors.priceInvalid;
    if (Object.keys(errs).length) { setExtrasFormErrors(errs); return; }

    setExtrasSaving(true);
    setExtrasFormErrors({});
    try {
      const data = {
        name: extrasForm.name.trim(),
        price: priceNum,
        emoji: extrasForm.emoji.trim() || '✨',
        order: editingExtraId
          ? (extrasItems.find(e => e.id === editingExtraId)?.order ?? extrasItems.length)
          : extrasItems.length,
      };
      if (editingExtraId) {
        await updateDoc(doc(db, 'extras', editingExtraId), data);
      } else {
        await addDoc(collection(db, 'extras'), data);
      }
      resetExtrasForm();
    } catch (err) {
      console.error(err);
      setExtrasFormErrors({ name: extrasContent.errors.saveFailed });
    } finally {
      setExtrasSaving(false);
    }
  };

  const handleExtrasDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'extras', id));
      setExtrasDeleteConfirm(null);
    } catch (err) {
      console.error(err);
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

        {/* Main tab switcher */}
        <div className="grid grid-cols-4 bg-white rounded-2xl p-1 mb-6 shadow-sm gap-1">
          {[
            { key: 'orders',    label: admin.tabs.orders },
            { key: 'menu',      label: admin.tabs.menu },
            { key: 'promos',    label: admin.tabs.promos },
            { key: 'customers', label: admin.tabs.customers },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); resetMenuForm(); resetExtrasForm(); }}
              className={`py-2.5 rounded-xl font-bold text-sm transition-colors ${tab === key ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Orders Tab ── */}
        {tab === 'orders' && (
          <div className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="number"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                placeholder={admin.searchPlaceholder}
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400 shadow-sm"
              />
              {orderSearch && (
                <button
                  onClick={() => setOrderSearch('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                >✕</button>
              )}
            </div>

            {ordersLoading && <p className="text-center text-gray-500 py-10">{admin.loading}</p>}
            {!ordersLoading && orders.length === 0 && (
              <p className="text-center text-gray-500 py-10">{admin.noOrders}</p>
            )}
            {orders
              .filter(o => !orderSearch.trim() || String(o.orderNumber).includes(orderSearch.trim()))
              .map(order => (
              <div
                key={order.id}
                className={`bg-white rounded-2xl p-4 shadow-md border-r-4 ${order.status === 'done' ? 'border-green-500' : 'border-amber-400'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    {order.orderNumber && (
                      <p className="text-xs font-bold text-gray-400 mb-0.5">#{order.orderNumber}</p>
                    )}
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

        {/* ── Menu Tab ── */}
        {tab === 'menu' && (
          <div className="flex flex-col gap-4">

            {/* Sub-tab switcher */}
            <div className="flex bg-white rounded-2xl p-1 shadow-sm gap-1">
              <button
                onClick={() => { setMenuSubTab('items'); resetMenuForm(); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${menuSubTab === 'items' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {menuContent.itemsSubTab}
              </button>
              <button
                onClick={() => { setMenuSubTab('extras'); resetExtrasForm(); }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${menuSubTab === 'extras' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {menuContent.extrasSubTab}
              </button>
            </div>

            {/* ── Menu Items sub-tab ── */}
            {menuSubTab === 'items' && (
              <>
                {!showMenuForm && (
                  <button
                    onClick={() => { resetMenuForm(); setShowMenuForm(true); }}
                    className="w-full bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="text-xl leading-none">+</span>
                    {menuContent.addButton}
                  </button>
                )}

                {showMenuForm && (
                  <div className="bg-white rounded-2xl p-4 shadow-md">
                    <h2 className="font-black text-gray-800 mb-4 text-lg">
                      {editingMenuId ? menuContent.editTitle : menuContent.addTitle}
                    </h2>
                    <form onSubmit={handleMenuSave} className="flex flex-col gap-3">

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{menuContent.imageLabel}</label>
                        <div className="flex items-center gap-3">
                          {menuImagePreview && (
                            <img src={menuImagePreview} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-gray-200 shrink-0" />
                          )}
                          <label className="flex-1 cursor-pointer">
                            <div className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-center text-sm text-gray-400 hover:border-red-400 hover:text-red-400 transition-colors">
                              {menuImagePreview ? menuContent.imageChange : menuContent.imageChoose}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleMenuImageChange} className="hidden" />
                          </label>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={menuForm.name}
                          onChange={e => setMenuForm({ ...menuForm, name: e.target.value })}
                          placeholder={menuContent.namePlaceholder}
                          className={`w-full border ${menuFormErrors.name ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
                        />
                        {menuFormErrors.name && <p className="text-red-500 text-xs mt-1">{menuFormErrors.name}</p>}
                      </div>

                      <div>
                        <input
                          type="number"
                          min="1"
                          value={menuForm.price}
                          onChange={e => setMenuForm({ ...menuForm, price: e.target.value })}
                          placeholder={menuContent.pricePlaceholder}
                          className={`w-full border ${menuFormErrors.price ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
                        />
                        {menuFormErrors.price && <p className="text-red-500 text-xs mt-1">{menuFormErrors.price}</p>}
                      </div>

                      <textarea
                        rows={2}
                        value={menuForm.description}
                        onChange={e => setMenuForm({ ...menuForm, description: e.target.value })}
                        placeholder={menuContent.descriptionPlaceholder}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                      />

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={menuForm.prepTime}
                          onChange={e => setMenuForm({ ...menuForm, prepTime: e.target.value })}
                          placeholder={menuContent.prepTimePlaceholder}
                          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                        />
                        <input
                          type="number"
                          min="1"
                          value={menuForm.prepMinutes}
                          onChange={e => setMenuForm({ ...menuForm, prepMinutes: e.target.value })}
                          placeholder={menuContent.prepMinutesPlaceholder}
                          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
                        />
                      </div>

                      <input
                        type="text"
                        value={menuForm.includes}
                        onChange={e => setMenuForm({ ...menuForm, includes: e.target.value })}
                        placeholder={menuContent.includesPlaceholder}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400"
                      />

                      <div className="flex gap-2 mt-1">
                        <button
                          type="submit"
                          disabled={menuSaving}
                          className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
                        >
                          {menuSaving ? menuContent.savingButton : menuContent.saveButton}
                        </button>
                        <button
                          type="button"
                          onClick={resetMenuForm}
                          className="px-5 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          {menuContent.cancelButton}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {menuLoading && <p className="text-center text-gray-500 py-10">{admin.loading}</p>}
                {!menuLoading && menuItems.length === 0 && (
                  <p className="text-center text-gray-400 py-10">{menuContent.noItems}</p>
                )}

                {menuItems.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-md border-r-4 border-red-400 overflow-hidden">
                    <div className="flex gap-3 p-4">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl shrink-0" />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0 flex items-center justify-center text-3xl">🍗</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-black text-gray-800 text-lg leading-tight">{item.name}</p>
                          <p className="text-red-600 font-black text-lg shrink-0">{item.price} {menuContent.currency}</p>
                        </div>
                        {item.description && <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{item.description}</p>}
                        {item.prepTime && <p className="text-gray-400 text-xs mt-1">⏱ {item.prepTime}</p>}
                        {item.includes?.length > 0 && (
                          <p className="text-gray-400 text-xs mt-0.5">{menuContent.includesLabel} {item.includes.join(' · ')}</p>
                        )}
                      </div>
                    </div>

                    {menuDeleteConfirm === item.id ? (
                      <div className="border-t border-gray-100 px-4 py-3 bg-red-50 flex items-center justify-between gap-2">
                        <p className="text-sm text-red-700 font-bold">{menuContent.confirmDeleteMsg}</p>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleMenuDelete(item.id)} className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-red-700 transition-colors">
                            {menuContent.confirmYes}
                          </button>
                          <button onClick={() => setMenuDeleteConfirm(null)} className="bg-gray-100 text-gray-600 text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors">
                            {menuContent.confirmNo}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-gray-100 px-4 py-2.5 flex gap-2">
                        <button onClick={() => startEditMenuItem(item)} className="flex-1 bg-gray-100 text-gray-700 font-bold text-sm py-2 rounded-xl hover:bg-gray-200 transition-colors">
                          ✏️ {menuContent.editButton}
                        </button>
                        <button onClick={() => setMenuDeleteConfirm(item.id)} className="flex-1 bg-red-50 text-red-600 font-bold text-sm py-2 rounded-xl hover:bg-red-100 transition-colors">
                          🗑 {menuContent.deleteButton}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* ── Extras sub-tab ── */}
            {menuSubTab === 'extras' && (
              <>
                {!showExtrasForm && (
                  <button
                    onClick={() => { resetExtrasForm(); setShowExtrasForm(true); }}
                    className="w-full bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="text-xl leading-none">+</span>
                    {extrasContent.addButton}
                  </button>
                )}

                {showExtrasForm && (
                  <div className="bg-white rounded-2xl p-4 shadow-md">
                    <h2 className="font-black text-gray-800 mb-4 text-lg">
                      {editingExtraId ? extrasContent.editTitle : extrasContent.addTitle}
                    </h2>
                    <form onSubmit={handleExtrasSave} className="flex flex-col gap-3">

                      <div>
                        <input
                          type="text"
                          value={extrasForm.name}
                          onChange={e => setExtrasForm({ ...extrasForm, name: e.target.value })}
                          placeholder={extrasContent.namePlaceholder}
                          className={`w-full border ${extrasFormErrors.name ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
                        />
                        {extrasFormErrors.name && <p className="text-red-500 text-xs mt-1">{extrasFormErrors.name}</p>}
                      </div>

                      <div>
                        <input
                          type="number"
                          min="1"
                          value={extrasForm.price}
                          onChange={e => setExtrasForm({ ...extrasForm, price: e.target.value })}
                          placeholder={extrasContent.pricePlaceholder}
                          className={`w-full border ${extrasFormErrors.price ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
                        />
                        {extrasFormErrors.price && <p className="text-red-500 text-xs mt-1">{extrasFormErrors.price}</p>}
                      </div>

                      <input
                        type="text"
                        value={extrasForm.emoji}
                        onChange={e => setExtrasForm({ ...extrasForm, emoji: e.target.value })}
                        placeholder={extrasContent.emojiPlaceholder}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400"
                      />

                      <div className="flex gap-2 mt-1">
                        <button
                          type="submit"
                          disabled={extrasSaving}
                          className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors"
                        >
                          {extrasSaving ? extrasContent.savingButton : extrasContent.saveButton}
                        </button>
                        <button
                          type="button"
                          onClick={resetExtrasForm}
                          className="px-5 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                        >
                          {extrasContent.cancelButton}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {extrasLoading && <p className="text-center text-gray-500 py-10">{admin.loading}</p>}
                {!extrasLoading && extrasItems.length === 0 && (
                  <p className="text-center text-gray-400 py-10">{extrasContent.noItems}</p>
                )}

                {extrasItems.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-md border-r-4 border-amber-400 overflow-hidden">
                    <div className="flex items-center gap-4 p-4">
                      <span className="text-4xl shrink-0">{item.emoji || '✨'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-800 text-lg">{item.name}</p>
                        <p className="text-red-600 font-bold">{item.price} {extrasContent.currency}</p>
                      </div>
                    </div>

                    {extrasDeleteConfirm === item.id ? (
                      <div className="border-t border-gray-100 px-4 py-3 bg-red-50 flex items-center justify-between gap-2">
                        <p className="text-sm text-red-700 font-bold">{extrasContent.confirmDeleteMsg}</p>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleExtrasDelete(item.id)} className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-red-700 transition-colors">
                            {extrasContent.confirmYes}
                          </button>
                          <button onClick={() => setExtrasDeleteConfirm(null)} className="bg-gray-100 text-gray-600 text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-200 transition-colors">
                            {extrasContent.confirmNo}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-gray-100 px-4 py-2.5 flex gap-2">
                        <button onClick={() => startEditExtra(item)} className="flex-1 bg-gray-100 text-gray-700 font-bold text-sm py-2 rounded-xl hover:bg-gray-200 transition-colors">
                          ✏️ {extrasContent.editButton}
                        </button>
                        <button onClick={() => setExtrasDeleteConfirm(item.id)} className="flex-1 bg-red-50 text-red-600 font-bold text-sm py-2 rounded-xl hover:bg-red-100 transition-colors">
                          🗑 {extrasContent.deleteButton}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
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
            <div className="bg-white rounded-2xl p-4 shadow-md">
              <h2 className="font-black text-gray-800 mb-4">{promos.addTitle}</h2>
              <form onSubmit={handleAddPromo} className="flex flex-col gap-3">
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
