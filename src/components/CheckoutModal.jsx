import { useState } from 'react';
import { Phone, MapPin, User, X } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import content from '../data/content.json';

const { checkout, whatsapp } = content;

export default function CheckoutModal({ cart, total, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = checkout.validation.nameRequired;
    if (!form.address.trim()) e.address = checkout.validation.addressRequired;
    if (!form.phone.trim() || !/^01[0-9]{9}$/.test(form.phone.trim())) e.phone = checkout.validation.phoneInvalid;
    return e;
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
      await addDoc(collection(db, 'orders'), {
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim(),
        items,
        total,
        status: 'pending',
        timestamp: serverTimestamp(),
      });

      const number = import.meta.env.VITE_WHATSAPP_NUMBER || '201000000000';
      const itemsList = cart.map(i => `- ${i.name} x${i.quantity} = ${i.price * i.quantity} ${whatsapp.currency}`).join('\n');
      const msg = encodeURIComponent(
        `${whatsapp.header}\n\n${whatsapp.nameLabel} ${form.name}\n${whatsapp.addressLabel} ${form.address}\n${whatsapp.phoneLabel} ${form.phone}\n\n${whatsapp.itemsLabel}\n${itemsList}\n\n${whatsapp.totalLabel} ${total} ${whatsapp.currency}`
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

        <div className="bg-amber-50 rounded-2xl p-4 mb-6">
          <h3 className="font-bold text-gray-700 mb-2">{checkout.orderSummaryTitle}</h3>
          {cart.map(item => (
            <div key={item.id} className="flex justify-between text-sm text-gray-600 py-1">
              <span>{item.name} x{item.quantity}</span>
              <span className="font-bold">{item.price * item.quantity} {checkout.currency}</span>
            </div>
          ))}
          <div className="border-t border-amber-200 mt-2 pt-2 flex justify-between font-black text-red-600">
            <span>{checkout.totalLabel}</span>
            <span>{total} {checkout.currency}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              <User size={14} className="inline ml-1" />{checkout.nameLabel}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder={checkout.namePlaceholder}
              className={`w-full border ${errors.name ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              <MapPin size={14} className="inline ml-1" />{checkout.addressLabel}
            </label>
            <textarea
              value={form.address}
              onChange={e => setForm({...form, address: e.target.value})}
              placeholder={checkout.addressPlaceholder}
              rows={3}
              className={`w-full border ${errors.address ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400 resize-none`}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              <Phone size={14} className="inline ml-1" />{checkout.phoneLabel}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              placeholder={checkout.phonePlaceholder}
              className={`w-full border ${errors.phone ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
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
