/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  db,
  auth,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from './firebase';
import { AppUser } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';

const LOCAL_USERS_KEY = 'discover_bd_cached_users';

/**
 * Check if a user is an Admin purely based on their verified role
 * Never relies on client-side localStorage overrides or email patterns.
 */
export const checkIsUserAdmin = (user: AppUser | null): boolean => {
  if (!user) return false;
  return user.role === 'admin';
};

/**
 * Verifies if the currently authenticated Firebase user has the Admin Custom Claim
 * or verified record in the protected 'admins' Firestore collection.
 * 
 * Strict RBAC:
 * - Checks user.getIdTokenResult(true) for claims.role === "admin"
 * - Checks admins/{uid} document in Firestore
 * - NEVER uses email.includes("admin") or email matching
 */
export const verifyFirebaseAdminStatus = async (
  firebaseUser: FirebaseUser | null
): Promise<boolean> => {
  if (!firebaseUser) return false;

  // 1. Check verified Firebase Custom Claim in ID token
  try {
    const tokenResult = await firebaseUser.getIdTokenResult(true);
    if (tokenResult.claims && tokenResult.claims.role === 'admin') {
      return true;
    }
  } catch (err) {
    console.warn('Could not read ID token claims:', err);
  }

  // 2. Check verified 'admins' Firestore document
  try {
    const adminDocRef = doc(db, 'admins', firebaseUser.uid);
    const adminSnap = await getDoc(adminDocRef);
    if (
      adminSnap.exists() &&
      adminSnap.data()?.role === 'admin' &&
      adminSnap.data()?.revoked !== true
    ) {
      return true;
    }
  } catch (err) {
    // If permission denied or not exists, user is not an admin
  }

  return false;
};

/**
 * Sync and fetch user profile with verified role from Firebase
 * - Role is determined SOLELY by Firebase Custom Claims or verified 'admins' collection
 * - NO email pattern matching or email substring checks
 */
export const syncFirebaseUserProfile = async (
  authUser: FirebaseUser
): Promise<AppUser> => {
  const isVerifiedAdmin = await verifyFirebaseAdminStatus(authUser);
  const assignedRole: 'admin' | 'user' = isVerifiedAdmin ? 'admin' : 'user';

  const userDocRef = doc(db, 'users', authUser.uid);

  try {
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();

      // Update last login and profile
      await updateDoc(userDocRef, {
        lastLoginAt: Date.now(),
        displayName: authUser.displayName || data.displayName || 'Traveler',
        photoURL: authUser.photoURL || data.photoURL || null,
        role: assignedRole,
      }).catch((e) => {
        console.warn('Could not update user doc:', e);
      });
    } else {
      // First-time profile creation in Firestore
      await setDoc(userDocRef, {
        uid: authUser.uid,
        email: authUser.email || null,
        displayName: authUser.displayName || (assignedRole === 'admin' ? 'Administrator' : 'Traveler'),
        photoURL: authUser.photoURL || null,
        role: assignedRole,
        isAnonymous: !!authUser.isAnonymous,
        saved: ['coxs-bazar', 'sylhet-tea'],
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      }).catch((e) => {
        console.warn('Could not create initial user profile doc:', e);
      });
    }
  } catch (err) {
    console.warn('Firestore user profile sync noticed error:', err);
  }

  const resolvedUser: AppUser = {
    uid: authUser.uid,
    email: authUser.email || null,
    displayName: authUser.displayName || (assignedRole === 'admin' ? 'Administrator' : 'Traveler'),
    photoURL: authUser.photoURL || null,
    isAnonymous: authUser.isAnonymous,
    role: assignedRole,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  // Cache user profile locally as an optional cache only
  cacheUserLocally(resolvedUser);

  return resolvedUser;
};

/**
 * Cache user locally for read cache only
 */
export const cacheUserLocally = (user: AppUser) => {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    const users: AppUser[] = raw ? JSON.parse(raw) : [];
    const index = users.findIndex((u) => u.uid === user.uid);
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.unshift(user);
    }
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users.slice(0, 100)));
  } catch (e) {
    console.error('Failed to cache user locally:', e);
  }
};

/**
 * Fetch all registered users from Firestore (Admin only)
 */
export const fetchRegisteredUsers = async (): Promise<AppUser[]> => {
  const usersMap = new Map<string, AppUser>();

  // Fetch from Firebase Firestore as primary source of truth
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    if (!snapshot.empty) {
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as AppUser;
        const uid = data.uid || docSnap.id;
        usersMap.set(uid, {
          ...data,
          uid,
          role: data.role === 'admin' ? 'admin' : 'user',
        });
      });
      const result = Array.from(usersMap.values());
      // Optional read cache
      try {
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(result));
      } catch {}
      return result;
    }
  } catch (err) {
    console.warn('Could not fetch users from Firestore (using cached users):', err);
  }

  // Fallback to local cache if offline
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const parsed: AppUser[] = JSON.parse(raw);
      return parsed;
    }
  } catch {}

  return [];
};

/**
 * Update user role in Firebase (Admin only)
 * Firebase is the Primary Source of Truth.
 * If Firebase write fails, error is thrown and local state is NOT updated!
 */
export const updateUserRoleInFirebase = async (
  uid: string,
  newRole: 'admin' | 'user',
  userEmail?: string | null
): Promise<void> => {
  // 1. Primary write to Firestore users collection
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, {
    role: newRole,
    updatedAt: Date.now(),
  });

  // 2. Primary write to Firestore admins collection
  const adminDocRef = doc(db, 'admins', uid);
  if (newRole === 'admin') {
    await setDoc(adminDocRef, {
      uid,
      email: userEmail || null,
      role: 'admin',
      assignedAt: Date.now(),
    });
  } else {
    await setDoc(adminDocRef, {
      uid,
      role: 'user',
      revoked: true,
      revokedAt: Date.now(),
    });
  }

  // 3. Optional local storage update ONLY after successful Firebase operation
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const users: AppUser[] = JSON.parse(raw);
      const target = users.find((u) => u.uid === uid);
      if (target) {
        target.role = newRole;
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      }
    }
  } catch {}
};

/**
 * Assign admin role to a registered user by email (Admin only)
 */
export const assignAdminByEmail = async (email: string): Promise<AppUser> => {
  const normalized = email.trim().toLowerCase();

  const allUsers = await fetchRegisteredUsers();
  const existingUser = allUsers.find((u) => u.email?.toLowerCase() === normalized);

  if (!existingUser) {
    throw new Error(
      `No registered user found with email "${email}". The user must first create an account or sign in with this email.`
    );
  }

  // Update role in Firebase (will throw if permission denied or failed)
  await updateUserRoleInFirebase(existingUser.uid, 'admin', normalized);
  return { ...existingUser, role: 'admin' };
};

/**
 * Update user profile photo in Firestore and local cache
 */
export const updateUserProfilePhoto = async (
  uid: string,
  newPhotoURL: string
): Promise<void> => {
  // 1. Primary write to Firestore
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, {
    photoURL: newPhotoURL,
    lastLoginAt: Date.now(),
  });

  // 2. Update local cache ONLY after Firebase write succeeds
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const users: AppUser[] = JSON.parse(raw);
      const target = users.find((u) => u.uid === uid);
      if (target) {
        target.photoURL = newPhotoURL;
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
      }
    }
  } catch {}
};
