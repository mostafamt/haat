import { useEffect, useState } from 'react';
import { subscribeSettings } from '../services/settingsService';
import { isWithinWorkingHours } from '../utils/workingHours';

export function useStoreStatus() {
  const [adminIsOpen,   setAdminIsOpen]   = useState(true);
  const [workingHours,  setWorkingHours]  = useState(null);
  const [withinHours,   setWithinHours]   = useState(true);
  const [loading,       setLoading]       = useState(true);

  // Subscribe to Firestore settings
  useEffect(() => {
    const unsub = subscribeSettings(({ isStoreOpen, workingHours: wh }) => {
      setAdminIsOpen(isStoreOpen);
      setWorkingHours(wh);
      setWithinHours(isWithinWorkingHours(wh));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Re-evaluate working hours every minute
  useEffect(() => {
    if (!workingHours) return;
    const id = setInterval(() => {
      setWithinHours(isWithinWorkingHours(workingHours));
    }, 60_000);
    return () => clearInterval(id);
  }, [workingHours]);

  const isStoreOpen = adminIsOpen && withinHours;

  const closedReason = isStoreOpen
    ? null
    : !withinHours
      ? 'hours'
      : 'admin';

  return { isStoreOpen, adminIsOpen, closedReason, workingHours, loading };
}
