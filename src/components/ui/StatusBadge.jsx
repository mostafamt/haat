const STYLES = {
  done:            'bg-green-100 text-green-700',
  pending_payment: 'bg-red-100 text-red-700',
  pending:         'bg-amber-100 text-amber-700',
};

export default function StatusBadge({ status, labels }) {
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels?.[status] || status}
    </span>
  );
}
