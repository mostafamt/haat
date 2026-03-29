export default function Hero({ onOrderClick }) {
  return (
    <div className="bg-gradient-to-br from-red-600 to-amber-500 text-white py-16 px-4 text-center">
      <div className="max-w-lg mx-auto">
        <div className="text-6xl mb-4">🍗</div>
        <h1 className="text-4xl font-black mb-2" dir="rtl">هات</h1>
        <p className="text-xl font-semibold mb-1" dir="rtl">مطبخ القرية الرقمي</p>
        <p className="text-sm opacity-90 mb-8" dir="rtl">دجاج مشوي طازج — توصيل سريع لبابك</p>
        <button
          onClick={onOrderClick}
          className="bg-white text-red-600 font-black text-lg px-10 py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          اطلب الآن 🛒
        </button>
      </div>
    </div>
  );
}
