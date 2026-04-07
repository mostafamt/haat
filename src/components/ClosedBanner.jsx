import { useEffect, useState } from 'react';
import content from '../data/content.json';
import { msUntilNextOpen, formatCountdown } from '../utils/workingHours';

const { storeStatus } = content;

export default function ClosedBanner({ closedReason, workingHours }) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (closedReason !== 'hours' || !workingHours) return;

    const tick = () => {
      const ms = msUntilNextOpen(workingHours);
      setCountdown(formatCountdown(ms));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [closedReason, workingHours]);

  if (closedReason === 'admin') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white text-center py-3 px-4 font-bold text-sm shadow-lg">
        {storeStatus.adminClosedBanner}
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white text-center py-3 px-4 shadow-lg">
      <p className="font-bold text-sm">{storeStatus.closedBanner}</p>
      {countdown && (
        <p className="text-xs text-gray-300 mt-1 font-mono tracking-widest">
          {storeStatus.countdownPrefix} {countdown}
        </p>
      )}
    </div>
  );
}
