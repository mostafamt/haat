import { ShoppingCart } from 'lucide-react';

export default function CartBar({ itemCount, total, onCheckout }) {
  if (itemCount === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <button
        onClick={onCheckout}
        className="w-full bg-red-600 text-white rounded-2xl py-4 px-6 flex items-center justify-between shadow-2xl hover:bg-red-700 active:scale-98 transition-all"
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart size={22} />
          <span className="font-black text-lg">{itemCount} عنصر</span>
        </div>
        <div className="bg-white text-red-600 font-black px-4 py-1 rounded-full">
          {total} جنيه
        </div>
      </button>
    </div>
  );
}
