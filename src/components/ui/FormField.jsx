export function FormField({ error, children }) {
  return (
    <div>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export const inputClass = (error, extra = '') =>
  `w-full border ${error ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400 ${extra}`.trim();
