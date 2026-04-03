import { useState, useRef } from 'react';
import Hero from '../components/Hero';
import MenuCard from '../components/MenuCard';
import CartBar from '../components/CartBar';
import CheckoutModal from '../components/CheckoutModal';
import Footer from '../components/Footer';
import ItemModal from '../components/ItemModal';
import MyOrders from '../components/MyOrders';
import { menuItems, extras } from '../data/menuItems';
import content from '../data/content.json';

const { menu, home } = content;

export default function Home() {
  const [tab, setTab] = useState('menu');
  const [cart, setCart] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const menuRef = useRef(null);

  const getQty = (id) => cart[id]?.quantity || 0;
  const addItem = (item) => {
    setCart(prev => ({
      ...prev,
      [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 },
    }));
  };
  const removeItem = (item) => {
    setCart(prev => {
      const qty = (prev[item.id]?.quantity || 0) - 1;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: { ...item, quantity: qty } };
    });
  };

  const cartItems = Object.values(cart);
  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const handleSuccess = () => {
    setCart({});
    setShowCheckout(false);
    setOrderDone(true);
    setTimeout(() => setOrderDone(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
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
        <div ref={menuRef} className="max-w-lg mx-auto px-4 py-8">
          <h2 className="text-2xl font-black text-gray-800 mb-4 text-center">{menu.sectionTitle}</h2>
          <div className="grid gap-4">
            {menuItems.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                quantity={getQty(item.id)}
                onAdd={() => addItem(item)}
                onRemove={() => removeItem(item)}
                onOpen={() => setSelectedItem(item)}
              />
            ))}
          </div>

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
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'myOrders' && <MyOrders />}

      <div className="pb-24" />

      <Footer />

      <CartBar itemCount={itemCount} total={total} onCheckout={() => setShowCheckout(true)} />

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          quantity={getQty(selectedItem.id)}
          onAdd={() => addItem(selectedItem)}
          onRemove={() => removeItem(selectedItem)}
          onClose={() => setSelectedItem(null)}
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
  );
}
