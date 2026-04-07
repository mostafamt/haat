import {
  collection, doc, getDocs, getDoc, query, where, limit,
  orderBy, onSnapshot, runTransaction, serverTimestamp,
  setDoc, updateDoc, increment,
} from 'firebase/firestore';
import { db } from '../firebase';

export const subscribeOrders = (callback) => {
  const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export async function hasCompletedOrder(phone) {
  const snap = await getDocs(
    query(collection(db, 'orders'), where('phone', '==', phone), where('status', '==', 'done'), limit(1))
  );
  return !snap.empty;
}

export async function createOrder({ phone, name, address, zone, items, subtotal, discount, promoCode, grandTotal, deliveryPrice, requiresPrepay }) {
  const counterRef  = doc(db, 'meta', 'counters');
  const newOrderRef = doc(collection(db, 'orders'));
  let orderNumber;

  await runTransaction(db, async (txn) => {
    const counterSnap = await txn.get(counterRef);
    orderNumber = (counterSnap.exists() ? counterSnap.data().orderCount : 1000) + 1;
    txn.set(counterRef, { orderCount: orderNumber }, { merge: true });
    txn.set(newOrderRef, {
      orderNumber,
      name,
      address,
      phone,
      zone,
      items,
      subtotal,
      discount,
      promoCode: promoCode || null,
      total: grandTotal,
      deliveryPrice,
      status: requiresPrepay ? 'pending_payment' : 'pending',
      timestamp: serverTimestamp(),
    });
  });

  return { orderId: newOrderRef.id, orderNumber };
}

export async function upsertUser({ phone, name, address, grandTotal }) {
  const userRef  = doc(db, 'users', phone);
  const userSnap = await getDoc(userRef);
  await setDoc(userRef, {
    name,
    phone,
    address,
    lastOrderAt: serverTimestamp(),
    orderCount: increment(1),
    totalSpent: increment(grandTotal),
    ...(!userSnap.exists() && { firstOrderAt: serverTimestamp() }),
  }, { merge: true });
}

export async function fetchOrdersByPhone(phone) {
  const snap = await getDocs(
    query(collection(db, 'orders'), where('phone', '==', phone), orderBy('timestamp', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export const updateOrderStatus = (id, status) =>
  updateDoc(doc(db, 'orders', id), { status });

export const updateOrderProof = (id, url) =>
  updateDoc(doc(db, 'orders', id), { paymentProofUrl: url });
