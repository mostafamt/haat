import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import content from '../data/content.json';

const { admin } = content;

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const markDone = async (id) => {
    await updateDoc(doc(db, 'orders', id), { status: 'done' });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-600 text-white text-center py-4 rounded-2xl mb-6">
          <h1 className="text-2xl font-black">{admin.dashboardTitle}</h1>
          <p className="text-sm opacity-80 mt-1">{orders.length} {admin.ordersTotal}</p>
        </div>

        {loading && <p className="text-center text-gray-500 py-10">{admin.loading}</p>}

        {!loading && orders.length === 0 && (
          <p className="text-center text-gray-500 py-10">{admin.noOrders}</p>
        )}

        <div className="flex flex-col gap-4">
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
      </div>
    </div>
  );
}
