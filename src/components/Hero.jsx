import content from '../data/content.json';

const { brand, hero, contact } = content;
const phone = import.meta.env.VITE_WHATSAPP_NUMBER;
const tel   = `tel:+${phone}`;
const wa    = `https://wa.me/${phone}`;

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
        <div className="flex justify-center gap-3 mt-5">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-full shadow transition-colors text-sm"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.122 1.524 5.855L.057 23.617a.75.75 0 0 0 .921.921l5.763-1.467A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.717 9.717 0 0 1-4.953-1.355l-.355-.214-3.678.937.953-3.595-.232-.371A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
            {contact.whatsappLabel}
          </a>
          <a
            href={tel}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-2.5 rounded-full shadow backdrop-blur-sm transition-colors text-sm"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0"><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2z"/></svg>
            {contact.callLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
