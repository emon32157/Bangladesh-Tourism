/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  db,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from './firebase';
import { NewsletterSubscriber, SubscriberStatus, Language } from '../types';

const LOCAL_SUBSCRIBERS_KEY = 'discover_bd_cached_subscribers';

// Helper: Sanitize email to document ID
export const emailToDocId = (email: string): string => {
  return 'sub_' + email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
};

// Get locally cached subscribers (Optional read cache only)
export const getCachedSubscribers = (): NewsletterSubscriber[] => {
  try {
    const raw = localStorage.getItem(LOCAL_SUBSCRIBERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

// Save subscribers to local cache
export const setCachedSubscribers = (list: NewsletterSubscriber[]) => {
  try {
    localStorage.setItem(LOCAL_SUBSCRIBERS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to cache subscribers:', e);
  }
};

/**
 * Subscribe an email to the newsletter in Firestore
 * Firebase is the Primary Source of Truth!
 */
export const subscribeNewsletter = async (
  emailInput: string,
  language: Language = 'bn'
): Promise<{ success: boolean; messageEn: string; messageBn: string; alreadySubscribed?: boolean }> => {
  const email = emailInput.trim().toLowerCase();

  if (!isValidEmail(email)) {
    return {
      success: false,
      messageEn: 'Please enter a valid email address.',
      messageBn: 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা দিন।',
    };
  }

  const docId = emailToDocId(email);
  const subscriberData: NewsletterSubscriber = {
    id: docId,
    email,
    status: 'active',
    createdAt: Date.now(),
    source: 'footer_newsletter',
    language,
  };

  try {
    const subscriberRef = doc(db, 'subscribers', docId);

    // Primary write to Firestore
    await setDoc(subscriberRef, subscriberData, { merge: true });

    // Update local cache ONLY upon successful Firebase write
    const cached = getCachedSubscribers();
    const updated = [subscriberData, ...cached.filter((s) => s.id !== docId)];
    setCachedSubscribers(updated);

    return {
      success: true,
      messageEn: 'Thank you for subscribing! You will receive weekly travel guides and heritage highlights.',
      messageBn: 'নিউজলেটারে সাবস্ক্রাইব করার জন্য ধন্যবাদ! নিয়মিত ভ্রমণ গাইড ও ঐতিহাসিক তথ্য আপনার ইমেইলে পৌঁছে যাবে।',
    };
  } catch (error) {
    console.error('Firestore newsletter write error:', error);
    return {
      success: false,
      messageEn: 'Failed to subscribe. Please try again.',
      messageBn: 'সাবস্ক্রিপশন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    };
  }
};

/**
 * Fetch all subscribers (Admin only)
 */
export const fetchSubscribers = async (): Promise<NewsletterSubscriber[]> => {
  const map = new Map<string, NewsletterSubscriber>();

  try {
    const q = query(collection(db, 'subscribers'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as NewsletterSubscriber;
      const id = data.id || docSnap.id;
      map.set(id, {
        ...data,
        id,
      });
    });

    const list = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    setCachedSubscribers(list);
    return list;
  } catch (err) {
    console.warn('Could not fetch subscribers from Firestore (using cached):', err);
    return getCachedSubscribers();
  }
};

/**
 * Real-time listener for newsletter subscribers (Admin only)
 */
export const subscribeToSubscribersList = (
  onData: (subscribers: NewsletterSubscriber[]) => void,
  onError?: (err: unknown) => void
) => {
  try {
    const q = query(collection(db, 'subscribers'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: NewsletterSubscriber[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as NewsletterSubscriber;
          items.push({
            ...data,
            id: data.id || docSnap.id,
          });
        });
        setCachedSubscribers(items);
        onData(items);
      },
      (err) => {
        console.warn('Snapshot listener for subscribers notice:', err);
        if (onError) onError(err);
        onData(getCachedSubscribers());
      }
    );
  } catch (err) {
    console.error('Failed to init onSnapshot for subscribers:', err);
    onData(getCachedSubscribers());
    return () => {};
  }
};

/**
 * Delete a subscriber (Admin only)
 * Firebase FIRST -> only update cache on success!
 */
export const deleteSubscriber = async (id: string): Promise<void> => {
  // 1. Primary delete from Firestore
  await deleteDoc(doc(db, 'subscribers', id));

  // 2. Update local cache upon success
  const cached = getCachedSubscribers().filter((s) => s.id !== id);
  setCachedSubscribers(cached);
};

/**
 * Update subscriber status (Admin only)
 * Firebase FIRST -> only update cache on success!
 */
export const updateSubscriberStatus = async (
  id: string,
  status: SubscriberStatus
): Promise<void> => {
  // 1. Primary write to Firestore
  await updateDoc(doc(db, 'subscribers', id), { status });

  // 2. Update local cache upon success
  const cached = getCachedSubscribers().map((s) =>
    s.id === id ? { ...s, status } : s
  );
  setCachedSubscribers(cached);
};
