import { useState } from 'react';
import { X, Plus, Minus, Maximize2, ZoomIn, ZoomOut, Minimize2 } from 'lucide-react';
import content from '../data/content.json';

const { menu } = content;

const ZOOM_LEVELS = [1, 1.5, 2, 3];

function ImageViewer({ src, alt, onClose }) {
  const [zoomIndex, setZoomIndex] = useState(0);
  const scale = ZOOM_LEVELS[zoomIndex];

  const zoomIn  = (e) => { e.stopPropagation(); setZoomIndex(i => Math.min(i + 1, ZOOM_LEVELS.length - 1)); };
  const zoomOut = (e) => { e.stopPropagation(); setZoomIndex(i => Math.max(i - 1, 0)); };

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col" onClick={onClose}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 z-10" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
          <Minimize2 size={20} />
        </button>
        <div className="flex items-center gap-3">
          <button onClick={zoomOut} disabled={zoomIndex === 0} className="text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors disabled:opacity-30">
            <ZoomOut size={20} />
          </button>
          <span className="text-white text-sm font-bold w-10 text-center">{scale}x</span>
          <button onClick={zoomIn} disabled={zoomIndex === ZOOM_LEVELS.length - 1} className="text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors disabled:opacity-30">
            <ZoomIn size={20} />
          </button>
        </div>
      </div>

      {/* Scrollable image area */}
      <div className="flex-1 overflow-auto flex items-center justify-center" onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          style={{ transform: `scale(${scale})`, transformOrigin: 'center center', transition: 'transform 0.2s ease' }}
          className="max-w-none"
          draggable={false}
        />
      </div>
    </div>
  );
}

export default function ItemModal({ item, quantity, onAdd, onRemove, onClose, disabled }) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={onClose}>
        <div
          className="bg-white rounded-t-3xl w-full max-w-lg overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Image */}
          <div className="relative">
            {item.image
              ? <img src={item.image} alt={item.name} className="w-full h-72 object-cover" />
              : <div className="w-full h-72 flex items-center justify-center bg-gray-100 text-8xl">{item.emoji}</div>
            }
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>
            {/* Fullscreen — only for image items */}
            {item.image && (
              <button
                onClick={() => setFullscreen(true)}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
              >
                <Maximize2 size={20} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6" dir="rtl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-black text-gray-800">{item.name}</h2>
              <span className="text-red-600 font-black text-2xl">{item.price} {menu.currency}</span>
            </div>

            {item.includes && (
              <p className="text-gray-500 text-sm mb-6">
                {menu.includesLabel} {item.includes.join(' · ')}
              </p>
            )}

            {/* Quantity controls */}
            <div className={`flex items-center justify-between bg-gray-50 rounded-2xl px-6 py-4 ${disabled ? 'opacity-50 grayscale' : ''}`}>
              <button
                onClick={onRemove}
                disabled={!quantity || disabled}
                className="bg-white shadow text-red-600 rounded-full p-3 disabled:opacity-30 hover:scale-110 active:scale-90 transition-transform"
              >
                <Minus size={22} strokeWidth={2.5} />
              </button>
              <span className="font-black text-gray-800 text-3xl w-12 text-center">{quantity}</span>
              <button
                onClick={disabled ? undefined : onAdd}
                disabled={disabled}
                className="bg-red-600 text-white rounded-full p-3 disabled:cursor-not-allowed hover:scale-110 active:scale-90 transition-transform"
              >
                <Plus size={22} strokeWidth={2.5} />
              </button>
            </div>

            {quantity > 0 && (
              <p className="text-center text-amber-600 font-bold mt-3">
                الإجمالي: {item.price * quantity} {menu.currency}
              </p>
            )}
          </div>
        </div>
      </div>

      {fullscreen && (
        <ImageViewer src={item.image} alt={item.name} onClose={() => setFullscreen(false)} />
      )}
    </>
  );
}
