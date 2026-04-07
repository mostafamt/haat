import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const DEFAULT_WORKING_HOURS = [
  { day: 'الأحد',     open: '15:00', close: '00:00', off: false },
  { day: 'الاثنين',   open: '15:00', close: '00:00', off: false },
  { day: 'الثلاثاء',  open: '15:00', close: '00:00', off: false },
  { day: 'الأربعاء',  open: '15:00', close: '00:00', off: false },
  { day: 'الخميس',    open: '15:00', close: '00:00', off: false },
  { day: 'الجمعة',    open: '15:00', close: '00:00', off: false },
  { day: 'السبت',     open: '15:00', close: '00:00', off: false },
];

const REF = () => doc(db, 'meta', 'settings');

export const subscribeSettings = (callback) =>
  onSnapshot(REF(), snap => {
    const data = snap.exists() ? snap.data() : {};
    callback({
      isStoreOpen:  data.isStoreOpen  !== false,
      workingHours: data.workingHours || DEFAULT_WORKING_HOURS,
    });
  });

export const updateWorkingHours = (workingHours) =>
  setDoc(REF(), { workingHours }, { merge: true });

export const toggleStore = (isOpen) =>
  setDoc(REF(), { isStoreOpen: isOpen }, { merge: true });
