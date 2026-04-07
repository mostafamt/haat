import { useEffect, useRef, useState } from 'react';
import Hero from '../components/Hero';
import MenuCard from '../components/MenuCard';
import CartBar from '../components/CartBar';
import CheckoutModal from '../components/CheckoutModal';
import Footer from '../components/Footer';
import ItemModal from '../components/ItemModal';
import MyOrders from '../components/MyOrders';
import content from '../data/content.json';
import { subscribeMenuItems, subscribeExtras } from '../services/menuService';
import { useCart } from '../hooks/useCart';
import { useStoreStatus } from '../hooks/useStoreStatus';
import ClosedBanner from '../components/ClosedBanner';

const { menu, home } = content;

export default function Home() {
  const [tab, setTab] = useState('menu');
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [extras, setExtras] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const menuRef = useRef(null);

  const { cartItems, total, itemCount, getQty, addItem, removeItem, clearCart } = useCart();
  const { isStoreOpen, closedReason, workingHours } = useStoreStatus();

  useEffect(() => {
    const unsubMenu   = subscribeMenuItems(items => { setMenuItems(items); setMenuLoading(false); });
    const unsubExtras = subscribeExtras(items => setExtras(items));
    return () => { unsubMenu(); unsubExtras(); };
  }, []);

  const handleSuccess = () => {
    clearCart();
    setShowCheckout(false);
    setOrderDone(true);
    setTimeout(() => setOrderDone(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {!isStoreOpen && <ClosedBanner closedReason={closedReason} workingHours={workingHours} />}
      <div className={!isStoreOpen ? 'pt-12' : ''}>
      <Hero onOrderClick={() => menuRef.current?.scrollIntoView({ behavior: 'smooth' })} />

      {orderDone && (
        <div className="bg-green-500 text-white text-center py-3 font-bold text-lg">
          {home.orderSuccess}
        </div>
      )}

      {/* Tab switcher */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm">
          <button
            onClick={() => setTab('menu')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${tab === 'menu' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {home.tabs.menu}
          </button>
          <button
            onClick={() => setTab('myOrders')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${tab === 'myOrders' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {home.tabs.myOrders}
          </button>
        </div>
      </div>

      {tab === 'menu' && (
        <div ref={menuRef} className="max-w-lg mx-auto px-4 py-8" id="menu-section">
          <h2 className="text-2xl font-black text-gray-800 mb-4 text-center">{menu.sectionTitle}</h2>
          {menuLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {menuItems.map(item => (
                <MenuCard
                  key={item.id}
                  item={item}
                  quantity={getQty(item.id)}
                  onAdd={() => addItem(item)}
                  onRemove={() => removeItem(item)}
                  onOpen={() => setSelectedItem(item)}
                  disabled={!isStoreOpen}
                />
              ))}
            </div>
          )}

          <h2 className="text-2xl font-black text-gray-800 mt-8 mb-4 text-center">{menu.extrasSectionTitle}</h2>
          <div className="grid grid-cols-2 gap-3">
            {extras.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                quantity={getQty(item.id)}
                onAdd={() => addItem(item)}
                onRemove={() => removeItem(item)}
                onOpen={() => setSelectedItem(item)}
                disabled={!isStoreOpen}
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'myOrders' && <MyOrders />}

      <div className="pb-24" />
      <Footer />

      <CartBar itemCount={itemCount} total={total} onCheckout={() => setShowCheckout(true)} disabled={!isStoreOpen} />

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          quantity={getQty(selectedItem.id)}
          onAdd={() => addItem(selectedItem)}
          onRemove={() => removeItem(selectedItem)}
          onClose={() => setSelectedItem(null)}
          disabled={!isStoreOpen}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          cart={cartItems}
          total={total}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleSuccess}
        />
      )}
      </div>
    </div>
  );
}
