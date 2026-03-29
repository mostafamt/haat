import content from '../data/content.json';

const { brand, footer } = content;

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 px-4 text-center" dir="rtl">
      <img src={brand.logo} alt={brand.name} className="w-16 h-16 object-contain mx-auto mb-3 opacity-90" />
      <p className="text-gray-300 text-sm mb-1">{footer.tagline}</p>
      <p className="text-gray-500 text-xs">{footer.copyright} {new Date().getFullYear()}</p>
    </footer>
  );
}
