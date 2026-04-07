import { useState } from 'react';

export function useCart() {
  const [cart, setCart] = useState({});

  const addItem = (item) =>
    setCart(prev => ({ ...prev, [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 } }));

  const removeItem = (item) =>
    setCart(prev => {
      const qty = (prev[item.id]?.quantity || 0) - 1;
      if (qty <= 0) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return { ...prev, [item.id]: { ...item, quantity: qty } };
    });

  const clearCart = () => setCart({});
  const getQty = (id) => cart[id]?.quantity || 0;

  const cartItems = Object.values(cart);
  const total     = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return { cartItems, total, itemCount, getQty, addItem, removeItem, clearCart };
}
