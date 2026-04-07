import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import content from '../../data/content.json';
import { formatDateTime } from '../../utils/formatters';

const { admin } = content;
const customersContent = admin.customers;

export default function CustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDocs(query(collection(db, 'users'), orderBy('lastOrderAt', 'desc'))).then(snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-center text-gray-500 py-10">{admin.loading}</p>;
  if (customers.length === 0) return <p className="text-center text-gray-400 py-10">{customersContent.empty}</p>;

  return (
    <div className="flex flex-col gap-4">
      {customers.map(c => (
        <div key={c.id} className="bg-white rounded-2xl p-4 shadow-md">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-black text-gray-800">{c.name}</p>
              <p className="text-gray-500 text-sm">📞 {c.phone}</p>
              {c.address && <p className="text-gray-400 text-xs mt-0.5">📍 {c.address}</p>}
            </div>
            <div className="text-right">
              <p className="text-red-600 font-black text-lg">{c.totalSpent ?? 0} {admin.currency}</p>
              <p className="text-gray-400 text-xs">{c.orderCount ?? 0} {customersContent.ordersLabel}</p>
            </div>
          </div>
          {c.lastOrderAt && (
            <p className="text-xs text-gray-400">{customersContent.lastOrderLabel} {formatDateTime(c.lastOrderAt)}</p>
          )}
        </div>
      ))}
    </div>
  );
}
