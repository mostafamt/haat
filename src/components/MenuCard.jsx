import { Plus, Minus } from 'lucide-react';

export default function MenuCard({ item, quantity, onAdd, onRemove }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-3 border border-gray-100" dir="rtl">
      <div className="flex items-center gap-3">
        <span className="text-4xl">{item.emoji}</span>
        <div className="flex-1">
          <h3 className="font-black text-gray-800 text-lg">{item.name}</h3>
          <p className="text-red-600 font-bold text-xl">{item.price} جنيه</p>
        </div>
      </div>
      {item.includes && (
        <p className="text-xs text-gray-500">
          يشمل: {item.includes.join(' · ')}
        </p>
      )}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-3 bg-gray-100 rounded-full px-3 py-1">
          <button
            onClick={onRemove}
            disabled={!quantity}
            className="text-red-600 disabled:opacity-30 hover:scale-110 active:scale-90 transition-transform"
          >
            <Minus size={20} strokeWidth={2.5} />
          </button>
          <span className="font-black text-gray-800 text-lg w-6 text-center">{quantity}</span>
          <button
            onClick={onAdd}
            className="text-red-600 hover:scale-110 active:scale-90 transition-transform"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
        {quantity > 0 && (
          <span className="text-amber-600 font-bold text-sm">
            {item.price * quantity} جنيه
          </span>
        )}
      </div>
    </div>
  );
}
