import {
  collection, doc, getDocs, getDoc, query, where, setDoc, updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export async function validatePromoCode(code, phone, subtotal) {
  const promoDoc = await getDoc(doc(db, 'promo_codes', code));
  if (!promoDoc.exists()) throw new Error('invalidCode');

  const data = promoDoc.data();
  if (!data.active) throw new Error('inactiveCode');
  if (data.expires_at && data.expires_at.toDate() < new Date()) throw new Error('expiredCode');

  const usageSnap = await getDocs(
    query(collection(db, 'orders'), where('promoCode', '==', code))
  );
  const usedPhones = [...new Set(usageSnap.docs.map(d => d.data().phone))];
  if (usedPhones.includes(phone)) throw new Error('alreadyUsed');
  if (data.max_uses !== null && usedPhones.length >= data.max_uses) throw new Error('limitReached');

  const discount = data.discount_type === 'percent'
    ? Math.round(subtotal * data.discount_value / 100)
    : Math.min(data.discount_value, subtotal);

  return {
    appliedPromo: { code, discount_type: data.discount_type, discount_value: data.discount_value },
    discount,
  };
}

export async function fetchAllPromosWithUsage() {
  const snap = await getDocs(collection(db, 'promo_codes'));
  const codes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return Promise.all(codes.map(async c => {
    const usageSnap = await getDocs(query(collection(db, 'orders'), where('promoCode', '==', c.id)));
    const usedCount = new Set(usageSnap.docs.map(d => d.data().phone)).size;
    return { ...c, usedCount };
  }));
}

export async function addPromoCode(code, data) {
  const existing = await getDoc(doc(db, 'promo_codes', code));
  if (existing.exists()) throw new Error('codeExists');
  await setDoc(doc(db, 'promo_codes', code), data);
}

export const togglePromoCode = (id, active) =>
  updateDoc(doc(db, 'promo_codes', id), { active });
