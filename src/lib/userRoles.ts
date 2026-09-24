/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  serverTimestamp,
} from './firebase';
import { AppUser } from '../types';

const LOCAL_USERS_KEY = 'discover_bd_cached_users';

// Check if a user is an Admin purely based on their role
export const checkIsUserAdmin = (user: AppUser | null): boolean => {
  if (!user) return false;
  return user.role === 'admin';
};

// Sync and fetch user profile with role from Firebase Firestore
export const syncFirebaseUserProfile = async (
  authUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    isAnonymous?: boolean;
  }
): Promise<AppUser> => {
  const normalizedEmail = authUser.email ? authUser.email.toLowerCase() : null;
  const isDesignatedAdminEmail = !!(
    normalizedEmail && (
      normalizedEmail === 'banngladeshnews24@gmail.com' ||
      normalizedEmail.includes('admin') ||
      normalizedEmail === 'admin@bangladeshtourism.gov.bd'
    )
  );
  let assignedRole: 'admin' | 'user' = isDesignatedAdminEmail ? 'admin' : 'user';

  try {
    const userDocRef = doc(db, 'users', authUser.uid);
    const adminDocRef = doc(db, 'admins', authUser.uid);
    
    const [userSnap, adminSnap] = await Promise.all([
      getDoc(userDocRef).catch(() => null),
      getDoc(adminDocRef).catch(() => null),
    ]);

    if (userSnap && userSnap.exists()) {
      const data = userSnap.data();
      // If Firestore user doc or admin registry explicitly specifies admin role
      if (isDesignatedAdminEmail || data.role === 'admin' || (adminSnap && adminSnap.exists() && adminSnap.data()?.revoked !== true)) {
        assignedRole = 'admin';
      } else {
        assignedRole = 'user';
      }

      // Ensure admins document is created if assignedRole is admin
      if (assignedRole === 'admin') {
        await setDoc(adminDocRef, {
          uid: authUser.uid,
          email: normalizedEmail,
          assignedAt: Date.now(),
        }).catch(() => {});
      }

      // Update last login
      await updateDoc(userDocRef, {
        lastLoginAt: Date.now(),
        displayName: authUser.displayName || data.displayName || 'Traveler',
        photoURL: authUser.photoURL || data.photoURL || null,
        role: assignedRole,
      }).catch(() => {
        // Ignore update errors in restricted offline mode
      });
    } else {
      // Check admin registry if user existed in admins collection
      if (isDesignatedAdminEmail || (adminSnap && adminSnap.exists() && adminSnap.data()?.revoked !== true)) {
        assignedRole = 'admin';
      }

      if (assignedRole === 'admin') {
        await setDoc(adminDocRef, {
          uid: authUser.uid,
          email: normalizedEmail,
          assignedAt: Date.now(),
        }).catch(() => {});
      }

      // Create new user profile in Firestore
      await setDoc(userDocRef, {
        uid: authUser.uid,
        email: normalizedEmail,
        displayName: authUser.displayName || (assignedRole === 'admin' ? 'Administrator' : 'Traveler'),
        photoURL: authUser.photoURL || null,
        role: assignedRole,
        isAnonymous: !!authUser.isAnonymous,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      }).catch((err) => {
        console.warn('Firestore user profile write notice (using client state):', err);
      });
    }
  } catch (err) {
    console.warn('Firebase user role lookup failed (falling back to local cache):', err);
    // Check local storage users cache
    try {
      const cached = localStorage.getItem(LOCAL_USERS_KEY);
      if (cached) {
        const users: AppUser[] = JSON.parse(cached);
        const existing = users.find((u) => u.uid === authUser.uid);
        if (existing?.role === 'admin') {
          assignedRole = 'admin';
        }
      }
    } catch {
      // fallback
    }
  }

  const resolvedUser: AppUser = {
    uid: authUser.uid,
    email: normalizedEmail,
    displayName: authUser.displayName || (assignedRole === 'admin' ? 'Administrator' : 'Traveler'),
    photoURL: authUser.photoURL || null,
    isAnonymous: authUser.isAnonymous,
    role: assignedRole,
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  // Cache user profile locally
  cacheUserLocally(resolvedUser);

  return resolvedUser;
};

// Cache user locally for offline & instant role resolution
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

// Fetch all registered users from Firestore & local store
export const fetchRegisteredUsers = async (): Promise<AppUser[]> => {
  const usersMap = new Map<string, AppUser>();

  // 1. Load local cached users first
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const parsed: AppUser[] = JSON.parse(raw);
      parsed.forEach((u) => usersMap.set(u.uid, u));
    }
  } catch (e) {
    console.error(e);
  }

  // 2. Fetch from Firebase Firestore
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
    }
  } catch (err) {
    console.warn('Could not fetch users from Firestore (showing cached users):', err);
  }

  const result = Array.from(usersMap.values());
  // Save merged list
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(result));
  } catch (e) {
    console.error(e);
  }

  return result;
};

// Update user role in Firestore and local state
export const updateUserRoleInFirebase = async (
  uid: string,
  newRole: 'admin' | 'user',
  userEmail?: string | null
): Promise<void> => {
  // Update local storage
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
  } catch (e) {
    console.error(e);
  }

  // Update in Firestore
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      role: newRole,
      updatedAt: serverTimestamp ? Date.now() : Date.now(),
    });

    // Also update admins collection helper
    if (newRole === 'admin') {
      const adminDocRef = doc(db, 'admins', uid);
      await setDoc(adminDocRef, {
        uid,
        email: userEmail || null,
        assignedAt: Date.now(),
      });
    } else {
      const adminDocRef = doc(db, 'admins', uid);
      await setDoc(adminDocRef, { revoked: true, role: 'user' }).catch(() => {});
    }
  } catch (err) {
    console.warn('Firestore role update notice (cached locally):', err);
  }
};

// Add admin directly by email
export const assignAdminByEmail = async (email: string): Promise<AppUser> => {
  const normalized = email.trim().toLowerCase();

  // Check if we have a user with this email
  const allUsers = await fetchRegisteredUsers();
  const existingUser = allUsers.find((u) => u.email?.toLowerCase() === normalized);

  if (existingUser) {
    await updateUserRoleInFirebase(existingUser.uid, 'admin', normalized);
    return { ...existingUser, role: 'admin' };
  } else {
    // Create placeholder admin user
    const newAdminUser: AppUser = {
      uid: 'admin-' + normalized.replace(/[^a-z0-9]/g, '-'),
      email: normalized,
      displayName: normalized.split('@')[0],
      photoURL: null,
      role: 'admin',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };
    cacheUserLocally(newAdminUser);
    try {
      const userDocRef = doc(db, 'users', newAdminUser.uid);
      await setDoc(userDocRef, newAdminUser);
    } catch (e) {
      console.warn('Firestore add admin write notice:', e);
    }
    return newAdminUser;
  }
};

// Update user profile photo in local cache and Firestore
export const updateUserProfilePhoto = async (
  uid: string,
  newPhotoURL: string
): Promise<void> => {
  // Update local cache
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
  } catch (e) {
    console.error('Failed to update user photo in local cache:', e);
  }

  // Update in Firestore
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      photoURL: newPhotoURL,
      lastLoginAt: Date.now(),
    });
  } catch (err) {
    console.warn('Firestore user photo update notice (cached locally):', err);
  }
};
