import { useEffect, useState } from 'react';
import content from '../data/content.json';
import { subscribeOrders } from '../services/ordersService';
import { useStoreStatus } from '../hooks/useStoreStatus';
import OrdersTab from '../components/admin/OrdersTab';
import MenuTab from '../components/admin/MenuTab';
import PromosTab from '../components/admin/PromosTab';
import CustomersTab from '../components/admin/CustomersTab';
import SettingsTab from '../components/admin/SettingsTab';
import StoreToggle from '../components/admin/StoreToggle';

const { admin } = content;

export default function Admin() {
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const { workingHours } = useStoreStatus();

  useEffect(() => {
    const unsub = subscribeOrders(data => { setOrders(data); setOrdersLoading(false); });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="bg-red-600 text-white text-center py-4 rounded-2xl mb-4">
          <h1 className="text-2xl font-black">{admin.dashboardTitle}</h1>
          {tab === 'orders' && (
            <p className="text-sm opacity-80 mt-1">{orders.length} {admin.ordersTotal}</p>
          )}
          <StoreToggle />
        </div>

        {/* Main tab switcher */}
        <div className="grid grid-cols-5 bg-white rounded-2xl p-1 mb-6 shadow-sm gap-1">
          {[
            { key: 'orders',    label: admin.tabs.orders },
            { key: 'menu',      label: admin.tabs.menu },
            { key: 'promos',    label: admin.tabs.promos },
            { key: 'customers', label: admin.tabs.customers },
            { key: 'settings',  label: admin.tabs.settings },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`py-2.5 rounded-xl font-bold text-xs transition-colors ${tab === key ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'orders'    && <OrdersTab orders={orders} ordersLoading={ordersLoading} />}
        {tab === 'menu'      && <MenuTab />}
        {tab === 'promos'    && <PromosTab />}
        {tab === 'customers' && <CustomersTab />}
        {tab === 'settings'  && workingHours && <SettingsTab workingHours={workingHours} />}

      </div>
    </div>
  );
}
