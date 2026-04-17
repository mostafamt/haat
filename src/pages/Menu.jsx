import { useEffect, useState } from 'react';
import { MapPin, MessageCircle, Bike, Link } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { subscribeMenuItems, subscribeExtras } from '../services/menuService';

export default function Menu() {
  const [mainMeals, setMainMeals] = useState([]);
  const [sideItems, setSideItems] = useState([]);

  useEffect(() => {
    const unsubMeals = subscribeMenuItems(setMainMeals);
    const unsubExtras = subscribeExtras(setSideItems);
    return () => { unsubMeals(); unsubExtras(); };
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">

      {/* Main Content Area */}
      <div className="flex-1 grid md:grid-cols-2">

        {/* Left Column — Side Items (Red Background) */}
        <div className="bg-red-600 text-white flex flex-col">
          <div className="flex-1 p-8 md:p-12">
            <div className="mb-8 flex justify-center">
              <img
                src="/option-a-2.png"
                alt="هات - أصل المشويات"
                className="w-40 md:w-48 drop-shadow-2xl"
                style={{ filter: 'brightness(0) saturate(100%) invert(1)' }}
              />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">الإضافات</h2>

            <div className="space-y-6 max-w-md mx-auto">
              {sideItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 flex items-center gap-6 hover:bg-white/20 transition-all duration-300 shadow-lg"
                >
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-xl shadow-md"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">{item.name}</h3>
                  </div>
                  <div className="bg-yellow-400 text-red-600 rounded-full w-20 h-20 flex items-center justify-center shadow-xl">
                    <span className="text-lg font-bold text-center leading-tight">{item.price} ج</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Left Footer */}
          <div className="bg-red-600 border-t border-white/20 p-6 md:p-8 space-y-3">
            <div className="flex items-center justify-center gap-3 text-white">
              <MessageCircle className="w-7 h-7 md:w-8 md:h-8 fill-current flex-shrink-0" />
              <span className="text-xl md:text-2xl font-bold">للطلب: 01038373998</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white">
              <MapPin className="w-5 h-5 md:w-6 md:h-6 fill-current flex-shrink-0" />
              <span className="text-base md:text-lg font-semibold">مساكن البيضا، كفر الدوار</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white">
              <Bike className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" strokeWidth={2.5} />
              <span className="text-base md:text-lg font-semibold">دليفري فقط 🛵</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-white pt-1">
              <Link className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" strokeWidth={2.5} />
              <span className="text-base md:text-lg font-semibold">
                <span className="font-bold underline decoration-2 underline-offset-2">
                  haat-menu.vercel.app
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column — Main Meals (White Background) */}
        <div className="bg-white flex flex-col">
          <div className="flex-1 p-8 md:p-12">
            <div className="mb-8 flex justify-center">
              <img
                src="/option-a-2.png"
                alt="هات - أصل المشويات"
                className="w-40 md:w-48 drop-shadow-lg"
              />
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-red-600">
              الوجبات الرئيسية
            </h2>

            <div className="space-y-8 max-w-2xl mx-auto">
              {mainMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-6 flex items-center gap-6 hover:shadow-2xl transition-all duration-300 border-2 border-red-100"
                >
                  <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                    <ImageWithFallback
                      src={meal.image}
                      alt={meal.name}
                      className="w-full h-full object-cover rounded-xl shadow-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold text-red-600 mb-2">{meal.name}</h3>
                    <p className="text-gray-700 text-base md:text-lg leading-relaxed">{meal.description}</p>
                  </div>
                  <div className="bg-yellow-400 text-red-600 rounded-full w-24 h-24 flex items-center justify-center shadow-2xl">
                    <span className="text-xl font-bold text-center leading-tight">{meal.price} ج</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Footer */}
          <div className="bg-white border-t border-red-100 p-6 md:p-8 space-y-3">
            <div className="flex items-center justify-center gap-3 text-red-600">
              <MessageCircle className="w-7 h-7 md:w-8 md:h-8 fill-current flex-shrink-0" />
              <span className="text-xl md:text-2xl font-bold">للطلب: 01038373998</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-red-600">
              <MapPin className="w-5 h-5 md:w-6 md:h-6 fill-current flex-shrink-0" />
              <span className="text-base md:text-lg font-semibold">مساكن البيضا، كفر الدوار</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-red-600">
              <Bike className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" strokeWidth={2.5} />
              <span className="text-base md:text-lg font-semibold">دليفري فقط 🛵</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-red-600 pt-1">
              <Link className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" strokeWidth={2.5} />
              <span className="text-base md:text-lg font-semibold">
                <span className="font-bold underline decoration-2 underline-offset-2">
                  haat-menu.vercel.app
                </span>
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
