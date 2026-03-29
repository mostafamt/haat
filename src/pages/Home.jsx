import { useState, useRef } from 'react';
import Hero from '../components/Hero';
import MenuCard from '../components/MenuCard';
import CartBar from '../components/CartBar';
import CheckoutModal from '../components/CheckoutModal';
import { menuItems, extras } from '../data/menuItems';

export default function Home() {
  const [cart, setCart] = useState({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const menuRef = useRef(null);

  const allItems = [...menuItems, ...extras];

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
          ✅ تم استلام طلبك! سيتواصل معك فريقنا قريباً
        </div>
      )}

      <div ref={menuRef} className="max-w-lg mx-auto px-4 py-8">
        <h2 className="text-2xl font-black text-gray-800 mb-4 text-center">قائمتنا 🍗</h2>
        <div className="grid gap-4">
          {menuItems.map(item => (
            <MenuCard
              key={item.id}
              item={item}
              quantity={getQty(item.id)}
              onAdd={() => addItem(item)}
              onRemove={() => removeItem(item)}
            />
          ))}
        </div>

        <h2 className="text-2xl font-black text-gray-800 mt-8 mb-4 text-center">إضافات ✨</h2>
        <div className="grid grid-cols-2 gap-3">
          {extras.map(item => (
            <MenuCard
              key={item.id}
              item={item}
              quantity={getQty(item.id)}
              onAdd={() => addItem(item)}
              onRemove={() => removeItem(item)}
            />
          ))}
        </div>
      </div>

      <div className="pb-24" />

      <CartBar itemCount={itemCount} total={total} onCheckout={() => setShowCheckout(true)} />

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
