export default function TabSwitcher({ tabs, active, onChange, cols }) {
  const layoutClass = cols ? `grid grid-cols-${cols}` : 'flex';
  return (
    <div className={`${layoutClass} bg-white rounded-2xl p-1 shadow-sm gap-1`}>
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors ${
            active === key ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
