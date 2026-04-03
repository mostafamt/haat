import { useState } from 'react';
import { Phone, MapPin, User, X, Clock, Truck, Tag } from 'lucide-react';
import { collection, addDoc, serverTimestamp, getDocs, query, where, getDoc, setDoc, doc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import content from '../data/content.json';

const { checkout, whatsapp, delivery } = content;
const { promo } = checkout;

function getMaxPrepTime(cart) {
  const best = cart.reduce((max, item) => (item.prepMinutes ?? 0) > (max.prepMinutes ?? 0) ? item : max, cart[0]);
  return best?.prepTime || null;
}

export default function CheckoutModal({ cart, total, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', address: '', phone: '', zoneId: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [promoInput, setPromoInput] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discount, setDiscount] = useState(0);

  const maxPrepTime = getMaxPrepTime(cart);
  const selectedZone = form.zoneId !== '' ? delivery.zones[Number(form.zoneId)] : null;
  const deliveryPrice = selectedZone ? selectedZone.price : 0;
  const subtotal = total;
  const grandTotal = subtotal - discount + deliveryPrice;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = checkout.validation.nameRequired;
    if (!form.address.trim()) e.address = checkout.validation.addressRequired;
    if (!form.phone.trim() || !/^01[0-9]{9}$/.test(form.phone.trim())) e.phone = checkout.validation.phoneInvalid;
    if (!form.zoneId) e.zone = delivery.zoneRequired;
    return e;
  };

  const handlePhoneChange = (val) => {
    setForm({ ...form, phone: val });
    if (appliedPromo) {
      setAppliedPromo(null);
      setDiscount(0);
      setPromoError('');
    }
  };

  const applyPromo = async () => {
    const phone = form.phone.trim();
    const code = promoInput.trim().toUpperCase();

    if (!phone || !/^01[0-9]{9}$/.test(phone)) {
      setPromoError(promo.errors.phoneRequired);
      return;
    }
    if (!code) return;

    setPromoChecking(true);
    setPromoError('');

    try {
      // Step 1: fetch promo code document
      const promoDoc = await getDoc(doc(db, 'promo_codes', code));
      if (!promoDoc.exists()) {
        setPromoError(promo.errors.invalidCode);
        return;
      }
      const promoData = promoDoc.data();
      if (!promoData.active) {
        setPromoError(promo.errors.inactiveCode);
        return;
      }
      if (promoData.expires_at && promoData.expires_at.toDate() < new Date()) {
        setPromoError(promo.errors.expiredCode);
        return;
      }

      // Step 2: fetch all orders that used this code, check per-phone reuse and global limit
      const usageSnap = await getDocs(
        query(collection(db, 'orders'), where('promoCode', '==', code))
      );
      const usedPhones = [...new Set(usageSnap.docs.map(d => d.data().phone))];

      if (usedPhones.includes(phone)) {
        setPromoError(promo.errors.alreadyUsed);
        return;
      }
      if (promoData.max_uses !== null && usedPhones.length >= promoData.max_uses) {
        setPromoError(promo.errors.limitReached);
        return;
      }

      // Step 3: calculate discount amount
      let discountAmount = 0;
      if (promoData.discount_type === 'percent') {
        discountAmount = Math.round(subtotal * promoData.discount_value / 100);
      } else {
        discountAmount = Math.min(promoData.discount_value, subtotal);
      }

      setAppliedPromo({ code, discount_type: promoData.discount_type, discount_value: promoData.discount_value });
      setDiscount(discountAmount);
    } catch (err) {
      console.error(err);
      setPromoError(promo.errors.networkError);
    } finally {
      setPromoChecking(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setDiscount(0);
    setPromoInput('');
    setPromoError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const items = cart.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));
      const phone = form.phone.trim();
      const name  = form.name.trim();
      const address = form.address.trim();

      await addDoc(collection(db, 'orders'), {
        name,
        address,
        phone,
        zone: selectedZone.name,
        items,
        subtotal,
        discount,
        promoCode: appliedPromo ? appliedPromo.code : null,
        total: grandTotal,
        deliveryPrice,
        status: 'pending',
        timestamp: serverTimestamp(),
      });

      // Upsert user document — create on first order, update counts on repeat orders
      const userRef = doc(db, 'users', phone);
      const userSnap = await getDoc(userRef);
      await setDoc(userRef, {
        name,
        phone,
        address,
        lastOrderAt: serverTimestamp(),
        orderCount: increment(1),
        totalSpent: increment(grandTotal),
        ...(!userSnap.exists() && { firstOrderAt: serverTimestamp() }),
      }, { merge: true });

      const number = import.meta.env.VITE_WHATSAPP_NUMBER || '201000000000';
      const itemsList = cart.map(i => `${i.name} = ${i.price} × ${i.quantity} = ${i.price * i.quantity} ${whatsapp.currency}`).join('\n');
      const discountLine = appliedPromo ? `\n${whatsapp.discountLabel} (${appliedPromo.code}): - ${discount} ${whatsapp.currency}` : '';
      const msg = encodeURIComponent(
        `${whatsapp.header}\n\n${whatsapp.nameLabel} ${name}\n${whatsapp.addressLabel} ${address}\n${whatsapp.phoneLabel} ${phone}\n${delivery.zoneWhatsappLabel} ${selectedZone.name}\n\n${whatsapp.itemsLabel}\n${itemsList}${discountLine}\n\n${delivery.whatsappLabel} ${deliveryPrice} ${delivery.currency}\n${whatsapp.totalLabel} ${grandTotal} ${whatsapp.currency}\n${whatsapp.prepTimeLabel} ${maxPrepTime}`
      );
      window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
      onSuccess();
    } catch (err) {
      alert(checkout.errorAlert);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10 max-h-[90vh] overflow-y-auto" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-800">{checkout.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-amber-50 rounded-2xl p-4 mb-6">
          <h3 className="font-bold text-gray-700 mb-2">{checkout.orderSummaryTitle}</h3>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm text-gray-600 py-1">
              <span>{item.name} x{item.quantity}</span>
              <span className="font-bold">{item.price * item.quantity} {checkout.currency}</span>
            </div>
          ))}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600 py-1">
              <span>{promo.discountLabel} ({appliedPromo.code})</span>
              <span className="font-bold">- {discount} {checkout.currency}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600 py-1">
            <span>{delivery.label}{selectedZone ? ` (${selectedZone.name})` : ''}</span>
            <span className="font-bold">{selectedZone ? `${deliveryPrice} ${delivery.currency}` : '—'}</span>
          </div>
          <div className="border-t border-amber-200 mt-2 pt-2 flex justify-between font-black text-red-600">
            <span>{checkout.totalLabel}</span>
            <span>{grandTotal} {checkout.currency}</span>
          </div>
          {maxPrepTime && (
            <div className="flex items-center gap-2 mt-3 bg-amber-100 rounded-xl px-3 py-2">
              <Clock size={14} className="text-amber-700 shrink-0" />
              <span className="text-amber-800 text-sm font-semibold">{checkout.prepTimeLabel}: {maxPrepTime}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Zone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              <Truck size={14} className="inline ml-1" />{delivery.zoneLabel}
            </label>
            <select
              value={form.zoneId}
              onChange={e => setForm({ ...form, zoneId: e.target.value })}
              className={`w-full border ${errors.zone ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right bg-white focus:outline-none focus:ring-2 focus:ring-red-400`}
            >
              <option value="">{delivery.zonePlaceholder}</option>
              {delivery.zones.map((zone, index) => (
                <option key={index} value={index}>
                  {zone.name}
                </option>
              ))}
            </select>
            {errors.zone && <p className="text-red-500 text-xs mt-1">{errors.zone}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              <User size={14} className="inline ml-1" />{checkout.nameLabel}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder={checkout.namePlaceholder}
              className={`w-full border ${errors.name ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              <MapPin size={14} className="inline ml-1" />{checkout.addressLabel}
            </label>
            <textarea
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder={checkout.addressPlaceholder}
              rows={3}
              className={`w-full border ${errors.address ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400 resize-none`}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              <Phone size={14} className="inline ml-1" />{checkout.phoneLabel}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => handlePhoneChange(e.target.value)}
              placeholder={checkout.phonePlaceholder}
              className={`w-full border ${errors.phone ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Promo Code */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              <Tag size={14} className="inline ml-1" />{promo.label}
            </label>
            {appliedPromo ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <span className="text-green-700 font-bold text-sm">
                  ✓ {promo.successPrefix} {appliedPromo.code} — {promo.successSuffix} {discount} {checkout.currency}
                </span>
                <button type="button" onClick={removePromo} className="text-gray-400 hover:text-red-500 mr-2">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                  placeholder={promo.placeholder}
                  disabled={promoChecking}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  disabled={promoChecking || !promoInput.trim()}
                  className="bg-gray-800 text-white font-bold px-4 py-3 rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {promoChecking ? promo.checkingButton : promo.applyButton}
                </button>
              </div>
            )}
            {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 text-white font-black text-lg py-4 rounded-2xl mt-2 hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {loading ? checkout.loadingButton : checkout.submitButton}
          </button>
        </form>
      </div>
    </div>
  );
}
