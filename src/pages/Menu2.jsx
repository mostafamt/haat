import { useEffect, useState } from 'react';
import { MapPin, MessageCircle, Bike } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { subscribeMenuItems, subscribeExtras } from '../services/menuService';

export default function Menu2() {
  const [mainMeals, setMainMeals] = useState([]);
  const [sideItems, setSideItems] = useState([]);

  useEffect(() => {
    const unsubMeals = subscribeMenuItems(setMainMeals);
    const unsubExtras = subscribeExtras(setSideItems);
    return () => { unsubMeals(); unsubExtras(); };
  }, []);
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        .menu2 * { font-family: 'Cairo', sans-serif; }
        .red-texture {
          background-color: #dc2626;
          background-image:
            repeating-linear-gradient(
              45deg,
              rgba(0,0,0,0.04) 0px,
              rgba(0,0,0,0.04) 1px,
              transparent 1px,
              transparent 8px
            );
        }
      `}</style>

      <div className="menu2 min-h-screen bg-gray-100 flex flex-col" dir="rtl">

        {/* ── HEADER ── */}
        <header className="bg-gradient-to-l from-red-700 to-red-500 shadow-xl">
          <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col items-center gap-1">
            <img
              src="/option-a-2.png"
              alt="هات"
              className="h-24 md:h-32 object-contain drop-shadow-xl"
            />
            <p className="text-white/90 text-base md:text-lg font-semibold tracking-widest mt-1">
              أصل المشويات
            </p>
          </div>
        </header>

        {/* ── MAIN GRID ── */}
        <main className="flex-1 grid md:grid-cols-2">

          {/* ── RIGHT — MAIN MEALS ── */}
          <section className="bg-white px-6 py-10 md:px-10">
            <h2 className="text-3xl md:text-4xl font-black text-red-600 text-center mb-8 tracking-wide">
              الوجبات الرئيسية
            </h2>

            <div className="space-y-6 max-w-lg mx-auto">
              {mainMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="relative bg-white rounded-2xl shadow-md border border-red-100 overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300"
                  style={{ borderRightWidth: '4px', borderRightColor: '#dc2626' }}
                >
                  {/* popular badge — second meal in list */}
                  {mainMeals.indexOf(meal) === 1 && (
                    <span className="absolute top-3 left-3 z-10 bg-yellow-400 text-red-700 text-xs font-black px-3 py-1 rounded-full shadow-md">
                      🔥 الأكثر طلباً
                    </span>
                  )}

                  {/* image — tall cover */}
                  <div className="w-full h-44 md:h-52 overflow-hidden bg-gray-50">
                    <ImageWithFallback
                      src={meal.image}
                      alt={meal.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>

                  {/* info row */}
                  <div className="flex items-center justify-between px-5 py-4 gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-gray-900 mb-1">{meal.name}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{meal.description}</p>
                    </div>
                    <div className="flex-shrink-0 bg-yellow-400 text-red-700 rounded-2xl px-4 py-2 shadow-lg text-center">
                      <span className="block text-xl font-black">{meal.price}</span>
                      <span className="block text-xs font-bold">ج.م.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── LEFT — EXTRAS ── */}
          <section className="red-texture text-white px-6 py-10 md:px-10">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-2 tracking-wide">
              الإضافات
            </h2>
            <p className="text-white/70 text-sm text-center mb-8 font-semibold">
              تُضاف لأي وجبة
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              {sideItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-white/20 transition-colors duration-300 shadow-lg"
                >
                  <div className="w-full h-28 overflow-hidden bg-white/10">
                    {item.image ? (
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">
                        {item.emoji || '✨'}
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-3 flex items-center justify-between gap-2">
                    <span className="font-bold text-sm leading-tight">{item.name}</span>
                    <span className="flex-shrink-0 bg-yellow-400 text-red-700 text-xs font-black rounded-full px-2 py-0.5">
                      {item.price} ج
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>

        {/* ── FOOTER ── */}
        <footer className="bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-2xl" dir="rtl">
          <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col items-center gap-5">

            {/* phone — hero element */}
            <a
              href="tel:01038373998"
              className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl px-8 py-4 shadow-xl transition-colors duration-200 w-full max-w-sm justify-center"
            >
              <MessageCircle className="w-7 h-7 fill-current flex-shrink-0" />
              <span className="text-2xl md:text-3xl font-black tracking-wider">01038373998</span>
            </a>

            {/* whatsapp */}
            <a
              href="https://wa.me/201038373998"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl px-8 py-3 shadow-lg transition-colors duration-200 w-full max-w-sm justify-center"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 flex-shrink-0">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.122 1.524 5.855L.057 23.617a.75.75 0 0 0 .921.921l5.763-1.467A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.717 9.717 0 0 1-4.953-1.355l-.355-.214-3.678.937.953-3.595-.232-.371A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
              </svg>
              <span className="text-lg font-bold">واتساب</span>
            </a>

            {/* divider */}
            <div className="w-full max-w-sm border-t border-red-400/30" />

            {/* address + delivery */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-red-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 fill-current flex-shrink-0" />
                <span className="text-sm font-semibold">مساكن البيضا، كفر الدوار</span>
              </div>
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
                <span className="text-sm font-semibold">دليفري فقط</span>
              </div>
            </div>

            {/* website */}
            <p className="text-red-700 text-sm font-semibold">
              اطلب أونلاين:{' '}
              <span className="font-black underline underline-offset-2">haat-menu.vercel.app</span>
            </p>

          </div>
        </footer>

      </div>
    </>
  );
}
