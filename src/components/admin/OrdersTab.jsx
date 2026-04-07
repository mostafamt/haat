import { useState } from 'react';
import content from '../../data/content.json';
import { formatDateTime } from '../../utils/formatters';
import StatusBadge from '../ui/StatusBadge';
import { updateOrderStatus } from '../../services/ordersService';

const { admin } = content;
const PAGE_SIZE = 10;

export default function OrdersTab({ orders, ordersLoading }) {
  const [orderSearch, setOrderSearch] = useState('');
  const [ordersPage, setOrdersPage]   = useState(1);

  const markDone       = (id) => updateOrderStatus(id, 'done');
  const confirmPayment = (id) => updateOrderStatus(id, 'pending');
  const revertPayment  = (id) => updateOrderStatus(id, 'pending_payment');

  const filtered   = orders.filter(o => !orderSearch.trim() || String(o.orderNumber).includes(orderSearch.trim()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(ordersPage, totalPages);
  const pageOrders = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (val) => { setOrderSearch(val); setOrdersPage(1); };

  return (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="relative">
        <input
          type="number"
          value={orderSearch}
          onChange={e => handleSearch(e.target.value)}
          placeholder={admin.searchPlaceholder}
          className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400 shadow-sm"
        />
        {orderSearch && (
          <button
            onClick={() => handleSearch('')}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >✕</button>
        )}
      </div>

      {ordersLoading && <p className="text-center text-gray-500 py-10">{admin.loading}</p>}
      {!ordersLoading && filtered.length === 0 && (
        <p className="text-center text-gray-500 py-10">{admin.noOrders}</p>
      )}

      {/* Order cards */}
      {pageOrders.map(order => (
        <div
          key={order.id}
          className={`bg-white rounded-2xl p-4 shadow-md border-r-4 ${
            order.status === 'done' ? 'border-green-500'
            : order.status === 'pending_payment' ? 'border-red-500'
            : 'border-amber-400'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              {order.orderNumber && (
                <p className="text-xs font-bold text-gray-400 mb-0.5">#{order.orderNumber}</p>
              )}
              <p className="font-black text-gray-800 text-lg">{order.name}</p>
              <p className="text-gray-500 text-sm">📞 {order.phone}</p>
              <p className="text-gray-500 text-sm">📍 {order.address}</p>
              {order.zone && (
                <p className="text-gray-500 text-sm">
                  🛵 {order.zone}{order.deliveryPrice != null ? ` — ${order.deliveryPrice} ${admin.currency}` : ''}
                </p>
              )}
            </div>
            <div className="text-right">
              <StatusBadge status={order.status} labels={admin.status} />
              <p className="text-red-600 font-black text-lg mt-2">{order.total} {admin.currency}</p>
            </div>
          </div>

          {/* Items */}
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
            <p className="text-xs text-gray-400 mb-3">{formatDateTime(order.timestamp)}</p>
          )}

          {/* Payment proof */}
          {order.paymentProofUrl && (
            <div className="mb-3">
              <p className="text-xs font-bold text-gray-500 mb-1">إيصال الدفع</p>
              <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={order.paymentProofUrl}
                  alt="إيصال الدفع"
                  className="w-full max-h-48 object-contain rounded-xl border border-gray-200 bg-gray-50"
                />
              </a>
            </div>
          )}

          {/* Actions */}
          {order.status === 'pending_payment' && (
            <button
              onClick={() => confirmPayment(order.id)}
              className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 transition-colors mb-2"
            >
              {admin.confirmPaymentButton}
            </button>
          )}
          {order.status === 'pending' && (
            <div className="flex flex-col gap-2">
              {order.paymentProofUrl && (
                <button
                  onClick={() => revertPayment(order.id)}
                  className="w-full bg-orange-100 text-orange-700 font-bold py-2 rounded-xl hover:bg-orange-200 transition-colors text-sm"
                >
                  {admin.revertPaymentButton}
                </button>
              )}
              <button
                onClick={() => markDone(order.id)}
                className="w-full bg-green-500 text-white font-bold py-2.5 rounded-xl hover:bg-green-600 transition-colors"
              >
                {admin.markDoneButton}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm mt-2">
          <button
            onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="text-sm font-bold text-gray-600 disabled:text-gray-300 hover:text-red-600 disabled:cursor-not-allowed transition-colors"
          >
            → السابق
          </button>
          <span className="text-sm text-gray-500 font-bold">{safePage} / {totalPages}</span>
          <button
            onClick={() => setOrdersPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="text-sm font-bold text-gray-600 disabled:text-gray-300 hover:text-red-600 disabled:cursor-not-allowed transition-colors"
          >
            التالي ←
          </button>
        </div>
      )}
    </div>
  );
}
