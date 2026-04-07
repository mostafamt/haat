import { ShoppingCart } from 'lucide-react';
import content from '../data/content.json';

const { cart: c } = content;

export default function CartBar({ itemCount, total, onCheckout, disabled }) {
  if (itemCount === 0) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <button
        onClick={disabled ? undefined : onCheckout}
        disabled={disabled}
        className={`w-full rounded-2xl py-4 px-6 flex items-center justify-between shadow-2xl transition-all ${
          disabled
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-70 grayscale'
            : 'bg-red-600 text-white hover:bg-red-700 active:scale-98'
        }`}
        dir="rtl"
      >
        <div className="flex items-center gap-2">
          <ShoppingCart size={22} />
          <span className="font-black text-lg">{itemCount} {c.itemUnit}</span>
        </div>
        <div className={`font-black px-4 py-1 rounded-full ${disabled ? 'bg-gray-300 text-gray-500' : 'bg-white text-red-600'}`}>
          {total} {c.currency}
        </div>
      </button>
    </div>
  );
}
