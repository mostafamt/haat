import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export function useStoreStatus() {
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'meta', 'settings'), snap => {
      if (snap.exists()) {
        setIsStoreOpen(snap.data().isStoreOpen !== false);
      } else {
        setIsStoreOpen(true); // doc missing → treat as open
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  return { isStoreOpen, loading };
}
