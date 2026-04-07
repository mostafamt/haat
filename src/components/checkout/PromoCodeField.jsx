import { useState } from 'react';
import { Tag, X } from 'lucide-react';
import content from '../../data/content.json';
import { isValidPhone } from '../../utils/validators';
import { validatePromoCode } from '../../services/promoService';

const { checkout } = content;
const { promo } = checkout;

// Controlled promo field. Parent owns appliedPromo + discount state.
// On success calls onApply(appliedPromo, discount); on remove calls onRemove().
export default function PromoCodeField({ subtotal, phone, appliedPromo, discount, onApply, onRemove }) {
  const [promoInput, setPromoInput]     = useState('');
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError]     = useState('');

  const handleApply = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (!isValidPhone(phone)) { setPromoError(promo.errors.phoneRequired); return; }

    setPromoChecking(true);
    setPromoError('');
    try {
      const result = await validatePromoCode(code, phone.trim(), subtotal);
      onApply(result.appliedPromo, result.discount);
    } catch (err) {
      setPromoError(promo.errors[err.message] || promo.errors.networkError);
    } finally {
      setPromoChecking(false);
    }
  };

  const handleRemove = () => {
    setPromoInput('');
    setPromoError('');
    onRemove();
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-1">
        <Tag size={14} className="inline ml-1" />{promo.label}
      </label>
      {appliedPromo ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <span className="text-green-700 font-bold text-sm">
            ✓ {promo.successPrefix} {appliedPromo.code} — {promo.successSuffix} {discount} {checkout.currency}
          </span>
          <button type="button" onClick={handleRemove} className="text-gray-400 hover:text-red-500 mr-2">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={promoInput}
            onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
            placeholder={promo.placeholder}
            disabled={promoChecking}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            type="button"
            onClick={handleApply}
            disabled={promoChecking || !promoInput.trim()}
            className="bg-gray-800 text-white font-bold px-4 py-3 rounded-xl hover:bg-gray-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {promoChecking ? promo.checkingButton : promo.applyButton}
          </button>
        </div>
      )}
      {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
    </div>
  );
}
