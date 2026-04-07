import { useState } from 'react';
import { Phone, MapPin, User, X, Clock, Truck, Tag } from 'lucide-react';
import { collection, runTransaction, serverTimestamp, getDocs, query, where, limit, getDoc, setDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import content from '../data/content.json';

const { checkout, whatsapp, delivery } = content;
const { promo, prepayNotice } = checkout;

const PREPAY_THRESHOLD  = 500;
const VODAFONE_CASH_NUM = import.meta.env.VITE_VODAFONE_CASH_NUM || '01XXXXXXXXX';
const INSTAPAY_IPA      = import.meta.env.VITE_INSTAPAY_IPA      || 'youripa@bank';

function getMaxPrepTime(cart) {
  const best = cart.reduce((max, item) => (item.prepMinutes ?? 0) > (max.prepMinutes ?? 0) ? item : max, cart[0]);
  return best?.prepTime || null;
}

export default function CheckoutModal({ cart, total, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', address: '', phone: '', zoneId: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPrepayNotice, setShowPrepayNotice] = useState(false);
  const [prepayOrderNumber, setPrepayOrderNumber] = useState(null);
  const [prepayOrderId, setPrepayOrderId] = useState(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');
  const [proofUploading, setProofUploading] = useState(false);
  const [proofUploadError, setProofUploadError] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

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

  const buildWaMessage = (orderNumber, name, address, phone, isPrepay, payMethod = '') => {
    const itemsList = cart.map(i => `${i.name} = ${i.price} × ${i.quantity} = ${i.price * i.quantity} ${whatsapp.currency}`).join('\n');
    const discountLine = appliedPromo ? `\n${whatsapp.discountLabel} (${appliedPromo.code}): - ${discount} ${whatsapp.currency}` : '';
    const prepayHeader = isPrepay ? `${whatsapp.prepayFlag}\n` : '';
    const methodName = payMethod === 'vodafone' ? prepayNotice.vodafoneCashName : payMethod === 'instapay' ? prepayNotice.instaPayName : '';
    const prepayFooter = isPrepay ? `\n${whatsapp.prepayStatus}${methodName ? `\n${whatsapp.prepayMethodLabel} ${methodName}` : ''}` : '';
    return encodeURIComponent(
      `${prepayHeader}${whatsapp.header}\n${whatsapp.orderNumberLabel} #${orderNumber}\n\n${whatsapp.nameLabel} ${name}\n${whatsapp.addressLabel} ${address}\n${whatsapp.phoneLabel} ${phone}\n${delivery.zoneWhatsappLabel} ${selectedZone.name}\n\n${whatsapp.itemsLabel}\n${itemsList}${discountLine}\n\n${delivery.whatsappLabel} ${deliveryPrice} ${delivery.currency}\n${whatsapp.totalLabel} ${grandTotal} ${whatsapp.currency}\n${whatsapp.prepTimeLabel} ${maxPrepTime}${prepayFooter}`
    );
  };

  const openWhatsApp = (msg) => {
    const number = import.meta.env.VITE_WHATSAPP_NUMBER || '201000000000';
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
  };

  const resetProof = () => {
    setProofFile(null);
    setProofPreviewUrl('');
    setProofUrl('');
    setProofUploadError('');
  };

  const uploadProof = async () => {
    if (!proofFile) return;
    setProofUploading(true);
    setProofUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', proofFile);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'haat/proofs');
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      if (!res.ok) throw new Error('upload failed');
      const data = await res.json();
      const url = data.secure_url;
      setProofUrl(url);
      await updateDoc(doc(db, 'orders', prepayOrderId), { paymentProofUrl: url });
    } catch (err) {
      console.error(err);
      setProofUploadError(prepayNotice.proofUploadError);
    } finally {
      setProofUploading(false);
    }
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
      const phone   = form.phone.trim();
      const name    = form.name.trim();
      const address = form.address.trim();

      // Check if this phone has any previously completed (done) order
      const prevDoneSnap = await getDocs(
        query(collection(db, 'orders'), where('phone', '==', phone), where('status', '==', 'done'), limit(1))
      );
      const isNewCustomer = prevDoneSnap.empty;
      const requiresPrepay = isNewCustomer && grandTotal > PREPAY_THRESHOLD;

      const counterRef  = doc(db, 'meta', 'counters');
      const newOrderRef = doc(collection(db, 'orders'));
      let orderNumber;

      await runTransaction(db, async (txn) => {
        const counterSnap = await txn.get(counterRef);
        orderNumber = (counterSnap.exists() ? counterSnap.data().orderCount : 1000) + 1;
        txn.set(counterRef, { orderCount: orderNumber }, { merge: true });
        txn.set(newOrderRef, {
          orderNumber,
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
          status: requiresPrepay ? 'pending_payment' : 'pending',
          timestamp: serverTimestamp(),
        });
      });

      // Upsert user document — create on first order, update counts on repeat orders
      const userRef  = doc(db, 'users', phone);
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

      if (requiresPrepay) {
        setPrepayOrderNumber(orderNumber);
        setPrepayOrderId(newOrderRef.id);
        setSelectedPayMethod('');
        resetProof();
        setPaymentConfirmed(false);
        setShowPrepayNotice(true);
      } else {
        const msg = buildWaMessage(orderNumber, name, address, phone, false);
        openWhatsApp(msg);
        onSuccess();
      }
    } catch (err) {
      alert(checkout.errorAlert);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Pre-payment notice screen — shown after order is saved but before WhatsApp opens
  if (showPrepayNotice) {
    const methods = [
      {
        key: 'vodafone',
        label: prepayNotice.vodafoneCashLabel,
        detail: VODAFONE_CASH_NUM,
        activeBg: 'bg-red-50',
        activeBorder: 'border-red-400',
        labelColor: 'text-red-700',
      },
      {
        key: 'instapay',
        label: prepayNotice.instaPayLabel,
        detail: INSTAPAY_IPA,
        activeBg: 'bg-blue-50',
        activeBorder: 'border-blue-400',
        labelColor: 'text-blue-700',
      },
    ];

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0">
        <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-10 max-h-[90vh] overflow-y-auto" dir="rtl">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">⚠️</div>
            <h2 className="text-xl font-black text-red-600 mb-2">{prepayNotice.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{prepayNotice.body}</p>
          </div>

          {/* Payment method selector */}
          <p className="text-sm font-bold text-gray-700 mb-3">{prepayNotice.chooseMethodLabel}</p>
          <div className="flex flex-col gap-3 mb-5">
            {methods.map(({ key, label, detail, activeBg, activeBorder, labelColor }) => {
              const isSelected = selectedPayMethod === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setSelectedPayMethod(key); resetProof(); setPaymentConfirmed(false); }}
                  className={`w-full text-right border-2 rounded-2xl p-4 transition-all ${isSelected ? `${activeBg} ${activeBorder}` : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-gray-800 bg-gray-800' : 'border-gray-400'}`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`font-black text-sm ${isSelected ? labelColor : 'text-gray-600'}`}>{label}</p>
                      {isSelected && (
                        <p className="text-gray-700 text-sm mt-1">
                          {prepayNotice.transferTo}{' '}
                          <span className="font-black text-gray-900">{grandTotal} {prepayNotice.currency}</span>{' '}
                          {prepayNotice.toLabel}{' '}
                          <span className="font-black text-gray-900 tracking-wider">{detail}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Proof of payment upload */}
          {selectedPayMethod && (
            <div className="mb-5">
              <p className="text-sm font-bold text-gray-700 mb-2">{prepayNotice.proofUploadLabel}</p>
              {proofUrl ? (
                <div className="bg-green-50 border border-green-300 rounded-2xl p-3 flex items-center gap-3">
                  <img src={proofPreviewUrl} alt="proof" className="w-14 h-14 object-cover rounded-xl border border-green-200 shrink-0" />
                  <span className="text-green-700 font-bold text-sm">{prepayNotice.proofUploadSuccess}</span>
                </div>
              ) : (
                <div>
                  <label className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-colors ${proofFile ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}`}>
                    {proofPreviewUrl ? (
                      <img src={proofPreviewUrl} alt="preview" className="w-full max-h-40 object-contain rounded-xl" />
                    ) : (
                      <span className="text-gray-500 text-sm text-center">{prepayNotice.proofUploadHint}</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files[0];
                        if (!f) return;
                        setProofFile(f);
                        setProofPreviewUrl(URL.createObjectURL(f));
                        setProofUploadError('');
                      }}
                    />
                  </label>
                  {proofFile && (
                    <button
                      type="button"
                      onClick={uploadProof}
                      disabled={proofUploading}
                      className="w-full mt-2 bg-gray-800 text-white font-bold py-2.5 rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      {proofUploading ? prepayNotice.proofUploadingButton : prepayNotice.proofUploadButton}
                    </button>
                  )}
                  {proofUploadError && <p className="text-red-500 text-xs mt-1 text-center">{proofUploadError}</p>}
                </div>
              )}
            </div>
          )}

          {/* Payment done confirmation */}
          <button
            type="button"
            disabled={!selectedPayMethod}
            onClick={() => setPaymentConfirmed(true)}
            className={`w-full font-black text-base py-3 rounded-2xl mb-4 transition-all ${
              paymentConfirmed
                ? 'bg-green-500 text-white cursor-default'
                : selectedPayMethod
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {paymentConfirmed ? prepayNotice.paymentDoneConfirmed : prepayNotice.paymentDoneButton}
          </button>

          <p className="text-center text-gray-500 text-xs mb-5">{prepayNotice.afterTransferNote}</p>

          <button
            type="button"
            disabled={!paymentConfirmed}
            onClick={() => {
              const finalMsg = buildWaMessage(prepayOrderNumber, form.name.trim(), form.address.trim(), form.phone.trim(), true, selectedPayMethod);
              openWhatsApp(finalMsg);
              onSuccess();
            }}
            className={`w-full font-black text-lg py-4 rounded-2xl transition-colors ${
              paymentConfirmed
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {prepayNotice.confirmButton}
          </button>
        </div>
      </div>
    );
  }

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
