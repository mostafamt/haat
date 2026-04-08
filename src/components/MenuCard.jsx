import { Plus, Minus, Clock } from 'lucide-react';
import content from '../data/content.json';

const { menu } = content;

export default function MenuCard({ item, quantity, onAdd, onRemove, onOpen, disabled }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-3 border border-gray-100 cursor-pointer" dir="rtl" onClick={onOpen}>
      {item.image && (
        <img src={item.image} alt={item.name} className="w-full h-36 object-contain rounded-xl" />
      )}
      <div className="flex items-center gap-3">
        {!item.image && item.emoji && <span className="text-4xl">{item.emoji}</span>}
        <div className="flex-1">
          <h3 className="font-black text-gray-800 text-lg">{item.name}</h3>
          <p className="text-red-600 font-bold text-xl">{item.price} {menu.currency}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        {item.includes && (
          <p className="text-xs text-gray-500">
            {menu.includesLabel} {item.includes.join(' · ')}
          </p>
        )}
        {item.prepTime && (
          <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full shrink-0">
            <Clock size={11} />
            {item.prepTime}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className={`flex items-center gap-3 rounded-full px-3 py-1 ${disabled ? 'bg-gray-100 opacity-50 grayscale' : 'bg-gray-100'}`} onClick={e => e.stopPropagation()}>
          <button
            onClick={onRemove}
            disabled={!quantity || disabled}
            className="text-red-600 disabled:opacity-30 hover:scale-110 active:scale-90 transition-transform"
          >
            <Minus size={20} strokeWidth={2.5} />
          </button>
          <span className="font-black text-gray-800 text-lg w-6 text-center">{quantity}</span>
          <button
            onClick={disabled ? undefined : onAdd}
            disabled={disabled}
            className="text-red-600 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-90 transition-transform"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
        {quantity > 0 && (
          <span className="text-amber-600 font-bold text-sm">
            {item.price * quantity} {menu.currency}
          </span>
        )}
      </div>
    </div>
  );
}
