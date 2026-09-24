/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModerationStatus } from '../types';
import { db, rtdb, collection, getDocs, deleteDoc, doc, ref, get, query, where } from './firebase';

// 30 Days Expiration Configuration
export const PENDING_EXPIRATION_DAYS = 30;
export const PENDING_EXPIRATION_MS = PENDING_EXPIRATION_DAYS * 24 * 60 * 60 * 1000; // 2,592,000,000 ms

export interface ModeratableItem {
  id: string;
  status?: ModerationStatus;
  createdAt?: number;
  userId?: string;
  approvedAt?: number;
  approvedBy?: string;
  rejectionReason?: string;
  expiresAt?: number;
}

/**
 * Checks if a pending item has passed its 30-day lifespan without admin approval.
 */
export function isPendingExpired(item: ModeratableItem): boolean {
  // Only pending items expire; approved items remain permanently
  if (item.status !== 'pending') {
    return false;
  }

  const createdTime = item.createdAt || Date.now();
  const ageMs = Date.now() - createdTime;
  return ageMs > PENDING_EXPIRATION_MS;
}

/**
 * Calculates how many days are remaining for a pending submission before 30-day auto-purge.
 */
export function getRemainingDays(createdAt?: number): number {
  if (!createdAt) return PENDING_EXPIRATION_DAYS;
  const elapsedMs = Date.now() - createdAt;
  const remainingMs = PENDING_EXPIRATION_MS - elapsedMs;
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
}

/**
 * Filters an array to ONLY include public approved items.
 * Seed items without an explicit status are treated as approved.
 */
export function getPublicApprovedItems<T extends ModeratableItem>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => {
    // If status is not set, it's default approved (seed data)
    if (!item.status) return true;
    return item.status === 'approved';
  });
}

/**
 * Filters an array to get all active pending items (excluding already expired ones).
 */
export function getActivePendingItems<T extends ModeratableItem>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => {
    return item.status === 'pending' && !isPendingExpired(item);
  });
}

/**
 * Filters an array to get rejected items.
 */
export function getRejectedItems<T extends ModeratableItem>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item.status === 'rejected');
}

/**
 * Purges all pending items that have exceeded the 30-day limit from a given array.
 */
export function purgeExpiredFromList<T extends ModeratableItem>(items: T[]): {
  cleaned: T[];
  removedCount: number;
} {
  if (!Array.isArray(items)) return { cleaned: [], removedCount: 0 };
  const cleaned = items.filter((item) => !isPendingExpired(item));
  const removedCount = items.length - cleaned.length;
  return { cleaned, removedCount };
}

/**
 * Background asynchronous cleaner to remove expired pending items from Firebase Firestore and RTDB.
 */
export async function autoPurgeExpiredFirebaseSubmissions(): Promise<{
  deletedPosts: number;
  deletedStories: number;
}> {
  let deletedPosts = 0;
  let deletedStories = 0;
  const thresholdTimestamp = Date.now() - PENDING_EXPIRATION_MS;

  try {
    // 1. Clean expired pending community posts in Firestore
    const postsCol = collection(db, 'community_posts');
    const qPosts = query(postsCol, where('status', '==', 'pending'));
    const postSnaps = await getDocs(qPosts);

    for (const docSnap of postSnaps.docs) {
      const data = docSnap.data();
      const createdAt = data.createdAt || 0;
      if (createdAt < thresholdTimestamp) {
        await deleteDoc(doc(db, 'community_posts', docSnap.id));
        deletedPosts++;
      }
    }
  } catch (err) {
    console.warn('Firestore community_posts cleanup note:', err);
  }

  try {
    // 2. Clean expired pending stories in Firestore
    const storiesCol = collection(db, 'stories');
    const qStories = query(storiesCol, where('status', '==', 'pending'));
    const storySnaps = await getDocs(qStories);

    for (const docSnap of storySnaps.docs) {
      const data = docSnap.data();
      const createdAt = data.createdAt || 0;
      if (createdAt < thresholdTimestamp) {
        await deleteDoc(doc(db, 'stories', docSnap.id));
        deletedStories++;
      }
    }
  } catch (err) {
    console.warn('Firestore stories cleanup note:', err);
  }

  return { deletedPosts, deletedStories };
}
