/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
  where,
  deleteDoc,
} from 'firebase/firestore';
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  onValue,
} from 'firebase/database';

const getEnv = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
      return import.meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process && process.env) {
      return process.env[key];
    }
  } catch {}
  return undefined;
};

export const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || "AIzaSyC8h4SdD1vhMc2CVWo_U_ap-mTJTxxWKVM",
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || "bangladesh-tourismbd.firebaseapp.com",
  databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL') || "https://bangladesh-tourismbd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || "bangladesh-tourismbd",
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || "bangladesh-tourismbd.firebasestorage.app",
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || "321753474197",
  appId: getEnv('VITE_FIREBASE_APP_ID') || "1:321753474197:web:7238265c663daff5d7279c",
};

// Initialize Firebase App instance safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  signInAnonymously,
  onAuthStateChanged,
  updateProfile,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  increment,
  where,
  deleteDoc,
  ref,
  set,
  get,
  push,
  onValue,
};

export type { User };
