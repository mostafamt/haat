import content from '../data/content.json';

const { brand, hero } = content;

export default function Hero({ onOrderClick }) {
  return (
    <div className="relative text-white py-16 px-4 text-center bg-cover bg-center" style={{ backgroundImage: "url('/hero.png')" }}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative max-w-lg mx-auto">
        <img src={brand.logo} alt={brand.name} className="w-48 h-48 object-contain mx-auto mb-4" />
        <p className="text-xl font-semibold mb-1" dir="rtl">{brand.tagline}</p>
        <p className="text-sm opacity-90 mb-8" dir="rtl">{brand.description}</p>
        <button
          onClick={onOrderClick}
          className="bg-white text-red-600 font-black text-lg px-10 py-4 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          {hero.ctaButton}
        </button>
      </div>
    </div>
  );
}
