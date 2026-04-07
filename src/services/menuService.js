import {
  collection, doc, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export const subscribeMenuItems = (callback) => {
  const q = query(collection(db, 'menuItems'), orderBy('order', 'asc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const subscribeExtras = (callback) => {
  const q = query(collection(db, 'extras'), orderBy('order', 'asc'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const saveMenuItem = (data, id) =>
  id ? updateDoc(doc(db, 'menuItems', id), data) : addDoc(collection(db, 'menuItems'), data);

export const deleteMenuItem = (id) => deleteDoc(doc(db, 'menuItems', id));

export const saveExtra = (data, id) =>
  id ? updateDoc(doc(db, 'extras', id), data) : addDoc(collection(db, 'extras'), data);

export const deleteExtra = (id) => deleteDoc(doc(db, 'extras', id));
