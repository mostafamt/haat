import { useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Phone, Search } from 'lucide-react';
import content from '../data/content.json';

const t = content.myOrders;

export default function MyOrders() {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState(null); // null = not searched yet

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !/^01[0-9]{9}$/.test(phone.trim())) {
      setPhoneError(t.phoneInvalid);
      return;
    }
    setPhoneError('');
    setLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'orders'),
          where('phone', '==', phone.trim()),
          orderBy('timestamp', 'desc')
        )
      );
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Phone lookup form */}
      <form onSubmit={handleLookup} className="flex flex-col gap-3 mb-8">
        <h2 className="text-xl font-black text-gray-800 text-center mb-1">{t.title}</h2>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Phone size={16} className="absolute top-1/2 -translate-y-1/2 right-3 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setPhoneError(''); setOrders(null); }}
              placeholder={t.phonePlaceholder}
              className={`w-full border ${phoneError ? 'border-red-400' : 'border-gray-200'} rounded-xl pr-9 pl-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400`}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 text-white font-bold px-4 py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Search size={16} />
            {loading ? t.lookupLoading : t.lookupButton}
          </button>
        </div>
        {phoneError && <p className="text-red-500 text-xs">{phoneError}</p>}
      </form>

      {/* Results */}
      {orders !== null && orders.length === 0 && (
        <p className="text-center text-gray-400 py-10">{t.noOrders}</p>
      )}

      {orders && orders.length > 0 && (
        <div className="flex flex-col gap-4">
          {orders.map((order, index) => (
            <div
              key={order.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border-r-4 ${order.status === 'done' ? 'border-green-500' : 'border-amber-400'}`}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  {order.orderNumber && (
                    <p className="font-black text-gray-700 text-base">#{order.orderNumber}</p>
                  )}
                  <span className="text-gray-400 text-xs">
                    {order.timestamp ? new Date(order.timestamp.toDate()).toLocaleString('ar-EG') : ''}
                  </span>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${order.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {t.status[order.status] || order.status}
                </span>
              </div>

              {/* Items */}
              <div className="bg-gray-50 rounded-xl p-3 mb-3 flex flex-col gap-0.5">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-bold">{item.price * item.quantity} {t.currency}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-1">
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t.discountLabel} ({order.promoCode})</span>
                    <span className="font-bold">- {order.discount} {t.currency}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{t.deliveryLabel} ({order.zone})</span>
                  <span>{order.deliveryPrice} {t.currency}</span>
                </div>
                <div className="flex justify-between font-black text-red-600 text-base border-t border-gray-100 pt-1 mt-1">
                  <span>{t.totalLabel}</span>
                  <span>{order.total} {t.currency}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
