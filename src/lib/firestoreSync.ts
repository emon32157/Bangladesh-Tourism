/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  db,
  auth,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from './firebase';
import {
  Destination,
  Experience,
  Festival,
  EditorialStory,
  CommunityPost,
} from '../types';
import {
  DESTINATIONS,
  EXPERIENCES,
  FESTIVALS,
  EDITORIAL_STORIES,
  SEED_COMMUNITY_POSTS,
} from '../data/bangladeshData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.warn('Firestore Error Notice: ', JSON.stringify(errInfo));
}

/**
 * Strips undefined values to prevent Firestore unsupported field value errors
 */
export function cleanDoc<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = cleanDoc(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Ensures a valid authenticated user session exists before Firestore writes.
 * Note: Anonymous sign-in must only ever happen through the user's own deliberate action, never automatically.
 * This is intentionally a no-op that returns immediately without signing anyone in.
 * Calling code's try/catch handles unauthenticated writes gracefully (and security rules reject them).
 */
export async function ensureAuthSession(): Promise<void> {
  // Deliberate no-op: Anonymous sign-in must only ever happen through the user's own deliberate action, never automatically.
  return;
}

// -------------------------------------------------------------
// Direct Firestore Mutations for Community Posts
// -------------------------------------------------------------

export async function saveCommunityPostToFirebase(post: CommunityPost): Promise<void> {
  const path = `community_posts/${post.id}`;
  try {
    await ensureAuthSession();
    const postRef = doc(db, 'community_posts', post.id);
    await setDoc(postRef, cleanDoc(post), { merge: true });
    // Update local cache
    updateLocalCommunityPostCache(post);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    // Still update local storage
    updateLocalCommunityPostCache(post);
  }
}

export async function deleteCommunityPostFromFirebase(id: string): Promise<void> {
  const path = `community_posts/${id}`;
  try {
    await ensureAuthSession();
    const postRef = doc(db, 'community_posts', id);
    await deleteDoc(postRef);
    removeLocalCommunityPostCache(id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    removeLocalCommunityPostCache(id);
  }
}

// -------------------------------------------------------------
// Direct Firestore Mutations for Destinations
// -------------------------------------------------------------

export async function saveDestinationToFirebase(dest: Destination): Promise<void> {
  const path = `destinations/${dest.id}`;
  try {
    await ensureAuthSession();
    const destRef = doc(db, 'destinations', dest.id);
    await setDoc(destRef, cleanDoc(dest), { merge: true });
    updateLocalDestinationCache(dest);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    updateLocalDestinationCache(dest);
  }
}

export async function deleteDestinationFromFirebase(id: string): Promise<void> {
  const path = `destinations/${id}`;
  try {
    await ensureAuthSession();
    const destRef = doc(db, 'destinations', id);
    await deleteDoc(destRef);
    removeLocalDestinationCache(id);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    removeLocalDestinationCache(id);
  }
}

// -------------------------------------------------------------
// Direct Firestore Mutations for Experiences
// -------------------------------------------------------------

export async function saveExperienceToFirebase(exp: Experience): Promise<void> {
  const path = `experiences/${exp.id}`;
  try {
    await ensureAuthSession();
    const expRef = doc(db, 'experiences', exp.id);
    await setDoc(expRef, cleanDoc(exp), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteExperienceFromFirebase(id: string): Promise<void> {
  const path = `experiences/${id}`;
  try {
    await ensureAuthSession();
    const expRef = doc(db, 'experiences', id);
    await deleteDoc(expRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Direct Firestore Mutations for Festivals
// -------------------------------------------------------------

export async function saveFestivalToFirebase(fest: Festival): Promise<void> {
  const path = `festivals/${fest.id}`;
  try {
    await ensureAuthSession();
    const festRef = doc(db, 'festivals', fest.id);
    await setDoc(festRef, cleanDoc(fest), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteFestivalFromFirebase(id: string): Promise<void> {
  const path = `festivals/${id}`;
  try {
    await ensureAuthSession();
    const festRef = doc(db, 'festivals', id);
    await deleteDoc(festRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Direct Firestore Mutations for Stories
// -------------------------------------------------------------

export async function saveStoryToFirebase(story: EditorialStory): Promise<void> {
  const path = `editorial_stories/${story.id}`;
  try {
    await ensureAuthSession();
    const storyRef = doc(db, 'editorial_stories', story.id);
    await setDoc(storyRef, cleanDoc(story), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteStoryFromFirebase(id: string): Promise<void> {
  const path = `editorial_stories/${id}`;
  try {
    await ensureAuthSession();
    const storyRef = doc(db, 'editorial_stories', id);
    await deleteDoc(storyRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// -------------------------------------------------------------
// Safe Storage Helpers
// -------------------------------------------------------------

function safeGetStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {}
  return null;
}

function safeSetStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {}
}

function updateLocalCommunityPostCache(post: CommunityPost) {
  try {
    const stored = safeGetStorage('discover_bd_community_posts');
    const posts: CommunityPost[] = stored ? JSON.parse(stored) : [];
    const index = posts.findIndex((p) => p.id === post.id);
    if (index >= 0) {
      posts[index] = post;
    } else {
      posts.unshift(post);
    }
    safeSetStorage('discover_bd_community_posts', JSON.stringify(posts));
  } catch (e) {
    console.error(e);
  }
}

function removeLocalCommunityPostCache(id: string) {
  try {
    const stored = safeGetStorage('discover_bd_community_posts');
    if (stored) {
      const posts: CommunityPost[] = JSON.parse(stored);
      const filtered = posts.filter((p) => p.id !== id);
      safeSetStorage('discover_bd_community_posts', JSON.stringify(filtered));
    }
  } catch (e) {
    console.error(e);
  }
}

function updateLocalDestinationCache(dest: Destination) {
  try {
    const stored = safeGetStorage('discover_bd_destinations');
    const list: Destination[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex((d) => d.id === dest.id);
    if (index >= 0) {
      list[index] = dest;
    } else {
      list.unshift(dest);
    }
    safeSetStorage('discover_bd_destinations', JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}

function removeLocalDestinationCache(id: string) {
  try {
    const stored = safeGetStorage('discover_bd_destinations');
    if (stored) {
      const list: Destination[] = JSON.parse(stored);
      safeSetStorage('discover_bd_destinations', JSON.stringify(list.filter((d) => d.id !== id)));
    }
  } catch (e) {
    console.error(e);
  }
}

// -------------------------------------------------------------
// Real-time Subscriptions to Firestore Collections
// -------------------------------------------------------------

export interface FirestoreSubscriptionCallbacks {
  onDestinations: (items: Destination[]) => void;
  onExperiences: (items: Experience[]) => void;
  onFestivals: (items: Festival[]) => void;
  onStories: (items: EditorialStory[]) => void;
  onCommunityPosts: (items: CommunityPost[]) => void;
}

// -------------------------------------------------------------
// Document Normalizers (Protects against missing fields in Firestore)
// -------------------------------------------------------------

function normalizeDestination(raw: any, id: string): Destination {
  const targetId = id || raw.id;
  const match = DESTINATIONS.find(
    (d) =>
      (targetId && d.id === targetId) ||
      (raw.slug && d.id === raw.slug) ||
      (d.title.toLowerCase() === (raw.title || '').toLowerCase() &&
        (!raw.district || d.district === raw.district || d.districtBn === raw.district))
  );

  const rawHighlights = Array.isArray(raw.highlights) ? raw.highlights : [];
  const baseHighlights = match?.highlights || ['Historic Landmark', 'Scenic Wonder', 'Cultural Heritage'];

  return {
    ...(match || {}),
    ...raw,
    id: targetId || match?.id || 'dest-' + Math.random().toString(36).slice(2, 9),
    title: raw.title || raw.nameEn || match?.title || 'Destination',
    titleBn: raw.titleBn || raw.nameBn || match?.titleBn || raw.title || '',
    division: raw.division || match?.division || 'Dhaka',
    district: raw.district || match?.district,
    districtBn: raw.districtBn || match?.districtBn,
    upazila: raw.upazila || match?.upazila,
    address: raw.address || match?.address,
    googleMapsUrl: raw.googleMapsUrl || match?.googleMapsUrl,
    lat: typeof raw.lat === 'number' ? raw.lat : match?.lat,
    lng: typeof raw.lng === 'number' ? raw.lng : match?.lng,
    category: (raw.category || match?.category || 'heritage').toLowerCase(),
    image: raw.image || raw.imageUrl || match?.image || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80',
    heroFeatured: raw.heroFeatured ?? match?.heroFeatured ?? false,
    tag: raw.tag || match?.tag || 'Must Visit',
    tagBn: raw.tagBn || match?.tagBn || 'অবশ্যই দর্শনীয়',
    summary: raw.summary || (raw.description ? raw.description.slice(0, 150) : '') || match?.summary || '',
    summaryBn: raw.summaryBn || match?.summaryBn || raw.summary || '',
    description: raw.description || match?.description || '',
    descriptionBn: raw.descriptionBn || match?.descriptionBn || raw.description || '',
    highlights: rawHighlights.length > 0 ? rawHighlights : baseHighlights,
    bestSeason: raw.bestSeason || match?.bestSeason || 'October to March',
    bestSeasonBn: raw.bestSeasonBn || match?.bestSeasonBn || 'অক্টোবর থেকে মার্চ',
    rating: typeof raw.rating === 'number' ? raw.rating : (match?.rating || 4.8),
    reviewsCount: typeof raw.reviewsCount === 'number' ? raw.reviewsCount : (match?.reviewsCount || 100),
    duration: raw.duration || match?.duration || '1-2 Days',
    nearestAirport: raw.nearestAirport || match?.nearestAirport || 'Hazrat Shahjalal International Airport (DAC)',
    heritageType: raw.heritageType || match?.heritageType,
    unescoStatus: raw.unescoStatus ?? match?.unescoStatus ?? false,
    videoUrl: raw.videoUrl || raw.video_url || match?.videoUrl,
  };
}

function normalizeExperience(raw: any, id: string): Experience {
  const match = EXPERIENCES.find(
    (e) => e.id === id || e.title.toLowerCase() === (raw.title || '').toLowerCase()
  );
  return {
    ...(match || {}),
    ...raw,
    id: raw.id || id,
    title: raw.title || match?.title || 'Experience',
    titleBn: raw.titleBn || match?.titleBn || raw.title || '',
    category: raw.category || match?.category || 'Nature',
    duration: raw.duration || match?.duration || 'Half day',
    icon: raw.icon || match?.icon || 'Compass',
    description: raw.description || match?.description || '',
    descriptionBn: raw.descriptionBn || match?.descriptionBn || raw.description || '',
    location: raw.location || match?.location || 'Bangladesh',
    tag: raw.tag || match?.tag || 'Explore',
  };
}

function normalizeFestival(raw: any, id: string): Festival {
  const match = FESTIVALS.find(
    (f) => f.id === id || f.title.toLowerCase() === (raw.title || '').toLowerCase()
  );
  return {
    ...(match || {}),
    ...raw,
    id: raw.id || id,
    title: raw.title || match?.title || 'Festival',
    titleBn: raw.titleBn || match?.titleBn || raw.title || '',
    date: raw.date || match?.date || 'Annual',
    dateBn: raw.dateBn || match?.dateBn || 'প্রতি বছর',
    location: raw.location || match?.location || 'Nationwide',
    locationBn: raw.locationBn || match?.locationBn || 'সারা দেশব্যাপী',
    description: raw.description || match?.description || '',
    descriptionBn: raw.descriptionBn || match?.descriptionBn || raw.description || '',
    emoji: raw.emoji || match?.emoji || '🎉',
    badge: raw.badge || match?.badge || 'Cultural Event',
  };
}

function normalizeStory(raw: any, id: string): EditorialStory {
  const match = EDITORIAL_STORIES.find(
    (s) => s.id === id || s.title.toLowerCase() === (raw.title || '').toLowerCase()
  );

  const rawContent = Array.isArray(raw.content)
    ? raw.content
    : typeof raw.content === 'string'
    ? [raw.content]
    : match?.content || ['Explore the magnificent beauty and diverse heritage of Bangladesh.'];

  return {
    ...(match || {}),
    ...raw,
    id: raw.id || id,
    title: raw.title || match?.title || 'Bangladesh Travel Story',
    titleBn: raw.titleBn || match?.titleBn || raw.title || '',
    author: raw.author || raw.submittedBy || match?.author || 'Editorial Team',
    readTime: raw.readTime || match?.readTime || '5 min read',
    category: raw.category || match?.category || 'Heritage',
    date: raw.date || match?.date || 'Recent',
    image: raw.image || raw.imageUrl || match?.image || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80',
    videoUrl: raw.videoUrl || match?.videoUrl,
    excerpt: raw.excerpt || raw.summary || match?.excerpt || '',
    excerptBn: raw.excerptBn || raw.summaryBn || match?.excerptBn || raw.excerpt || '',
    content: rawContent,
    pullQuote: raw.pullQuote || match?.pullQuote || 'A land of rivers, heritage, and timeless hospitality.',
    likesCount: typeof raw.likesCount === 'number' ? raw.likesCount : (match?.likesCount || 0),
    likedBy: Array.isArray(raw.likedBy) ? raw.likedBy : (match?.likedBy || []),
    userReactions: raw.userReactions || match?.userReactions,
    reactions: raw.reactions || match?.reactions,
    commentsCount: typeof raw.commentsCount === 'number' ? raw.commentsCount : 0,
    status: raw.status || 'approved',
    userId: raw.userId || match?.userId,
    submittedBy: raw.submittedBy || match?.submittedBy,
    submittedByEmail: raw.submittedByEmail || match?.submittedByEmail,
    createdAt: raw.createdAt || Date.now(),
  };
}

function normalizeCommunityPost(raw: any, id: string): CommunityPost {
  return {
    id: raw.id || id,
    userId: raw.userId || 'community-user',
    userName: raw.userName || raw.authorName || 'Traveler',
    userAvatar: raw.userAvatar || raw.authorAvatar,
    userEmail: raw.userEmail,
    title: raw.title || 'Bangladesh Travel Moment',
    caption: raw.caption || raw.description || '',
    imageUrl: raw.imageUrl || raw.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    videoUrl: raw.videoUrl,
    location: raw.location || 'Bangladesh',
    division: raw.division || 'Dhaka',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    likesCount: typeof raw.likesCount === 'number' ? raw.likesCount : 0,
    likedBy: Array.isArray(raw.likedBy) ? raw.likedBy : [],
    reactions: raw.reactions || { love: 0, like: 0, wow: 0, bengal: 0 },
    userReactions: raw.userReactions || {},
    commentsCount: typeof raw.commentsCount === 'number' ? raw.commentsCount : 0,
    status: raw.status || 'approved',
    createdAt: raw.createdAt || Date.now(),
  };
}

export function subscribeToAllFirestoreData(callbacks: FirestoreSubscriptionCallbacks): () => void {
  const unsubscribes: (() => void)[] = [];

  // 1. Destinations Listener
  try {
    const destCol = collection(db, 'destinations');
    const unsub = onSnapshot(
      destCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteItems: Destination[] = [];
          snapshot.forEach((docSnap) => {
            remoteItems.push(normalizeDestination(docSnap.data(), docSnap.id));
          });

          // Merge with full DESTINATIONS catalog so catalog stays rich
          const remoteMapById = new Map<string, Destination>();
          remoteItems.forEach((item) => {
            if (item && item.id) {
              remoteMapById.set(item.id, item);
            }
          });

          // Build a safe deduplicated list ensuring absolutely unique IDs
          const seenIds = new Set<string>();
          const dedupedMerged: Destination[] = [];

          // 1. Populate base catalog with any remote modifications
          DESTINATIONS.forEach((base) => {
            const updated = remoteMapById.get(base.id) || base;
            if (!seenIds.has(updated.id)) {
              seenIds.add(updated.id);
              dedupedMerged.push(updated);
            }
          });

          // 2. Prepend any new user-created remote destinations
          remoteItems.forEach((item) => {
            if (item && item.id && !seenIds.has(item.id)) {
              seenIds.add(item.id);
              dedupedMerged.unshift(item);
            }
          });

          callbacks.onDestinations(dedupedMerged);
          safeSetStorage('discover_bd_destinations', JSON.stringify(dedupedMerged));
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'destinations')
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.warn('Destinations subscription error:', e);
  }

  // 2. Experiences Listener
  try {
    const expCol = collection(db, 'experiences');
    const unsub = onSnapshot(
      expCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteItems: Experience[] = [];
          snapshot.forEach((docSnap) => {
            remoteItems.push(normalizeExperience(docSnap.data(), docSnap.id));
          });
          const merged: Experience[] = [...EXPERIENCES];
          remoteItems.forEach((rem) => {
            const idx = merged.findIndex((m) => m.id === rem.id || m.title.toLowerCase() === rem.title.toLowerCase());
            if (idx >= 0) merged[idx] = rem;
            else merged.unshift(rem);
          });
          callbacks.onExperiences(merged);
          safeSetStorage('discover_bd_experiences', JSON.stringify(merged));
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'experiences')
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.warn('Experiences subscription error:', e);
  }

  // 3. Festivals Listener
  try {
    const festCol = collection(db, 'festivals');
    const unsub = onSnapshot(
      festCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteItems: Festival[] = [];
          snapshot.forEach((docSnap) => {
            remoteItems.push(normalizeFestival(docSnap.data(), docSnap.id));
          });
          const merged: Festival[] = [...FESTIVALS];
          remoteItems.forEach((rem) => {
            const idx = merged.findIndex((m) => m.id === rem.id || m.title.toLowerCase() === rem.title.toLowerCase());
            if (idx >= 0) merged[idx] = rem;
            else merged.unshift(rem);
          });
          callbacks.onFestivals(merged);
          safeSetStorage('discover_bd_festivals', JSON.stringify(merged));
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'festivals')
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.warn('Festivals subscription error:', e);
  }

  // 4. Editorial Stories Listener
  try {
    const storiesCol = collection(db, 'editorial_stories');
    const unsub = onSnapshot(
      storiesCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteItems: EditorialStory[] = [];
          snapshot.forEach((docSnap) => {
            remoteItems.push(normalizeStory(docSnap.data(), docSnap.id));
          });
          const merged: EditorialStory[] = [...EDITORIAL_STORIES];
          remoteItems.forEach((rem) => {
            const idx = merged.findIndex((m) => m.id === rem.id || m.title.toLowerCase() === rem.title.toLowerCase());
            if (idx >= 0) merged[idx] = rem;
            else merged.unshift(rem);
          });
          callbacks.onStories(merged);
          safeSetStorage('discover_bd_stories', JSON.stringify(merged));
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'editorial_stories')
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.warn('Stories subscription error:', e);
  }

  // 5. Community Posts Listener (Live Real-Time Sync)
  try {
    const postsCol = collection(db, 'community_posts');
    const unsub = onSnapshot(
      postsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: CommunityPost[] = [];
          snapshot.forEach((docSnap) => {
            items.push(normalizeCommunityPost(docSnap.data(), docSnap.id));
          });
          // Sort newest first
          items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          callbacks.onCommunityPosts(items);
          safeSetStorage('discover_bd_community_posts', JSON.stringify(items));
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'community_posts')
    );
    unsubscribes.push(unsub);
  } catch (e) {
    console.warn('Community posts subscription error:', e);
  }

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

// -------------------------------------------------------------
// Data Migration & Cloud Synchronization
// Uploads any updated posts and data from this browser into Firebase
// so ALL other browsers and users can see the updates!
// -------------------------------------------------------------

export async function bootstrapAndMigrateDataToFirestore(): Promise<{
  syncedPosts: number;
  syncedDestinations: number;
  syncedStories: number;
}> {
  let syncedPosts = 0;
  let syncedDestinations = 0;
  let syncedStories = 0;

  try {
    // Ensure authentication session exists so security rules permit writes
    await ensureAuthSession();

    // 1. Sync Community Posts
    const postsSnap = await getDocs(collection(db, 'community_posts')).catch(() => null);
    const existingPostIds = new Set<string>();
    if (postsSnap && !postsSnap.empty) {
      postsSnap.forEach((d) => existingPostIds.add(d.id));
    }

    // Check local storage for updated posts or fallback to seeds
    let localPosts: CommunityPost[] = [];
    try {
      const stored = safeGetStorage('discover_bd_community_posts');
      if (stored) localPosts = JSON.parse(stored);
    } catch {}

    const sourcePosts = localPosts.length > 0 ? localPosts : SEED_COMMUNITY_POSTS;

    // Upload every post that is either missing from Firestore or has updated local modifications
    for (const post of sourcePosts) {
      if (!existingPostIds.has(post.id) || localPosts.length > 0) {
        await setDoc(doc(db, 'community_posts', post.id), cleanDoc(post), { merge: true }).catch(() => {});
        syncedPosts++;
      }
    }

    // 2. Sync Destinations
    const destSnap = await getDocs(collection(db, 'destinations')).catch(() => null);
    const existingDestIds = new Set<string>();
    if (destSnap && !destSnap.empty) {
      destSnap.forEach((d) => existingDestIds.add(d.id));
    }

    let localDestinations: Destination[] = [];
    try {
      const stored = safeGetStorage('discover_bd_destinations');
      if (stored) localDestinations = JSON.parse(stored);
    } catch {}

    const sourceDestinations = localDestinations.length > 0 ? localDestinations : DESTINATIONS;
    for (const dest of sourceDestinations) {
      if (!existingDestIds.has(dest.id) || localDestinations.length > 0) {
        await setDoc(doc(db, 'destinations', dest.id), cleanDoc(dest), { merge: true }).catch(() => {});
        syncedDestinations++;
      }
    }

    // 3. Sync Experiences
    const expSnap = await getDocs(collection(db, 'experiences')).catch(() => null);
    if (!expSnap || expSnap.empty) {
      let localExp: Experience[] = [];
      try {
        const stored = safeGetStorage('discover_bd_experiences');
        if (stored) localExp = JSON.parse(stored);
      } catch {}
      const sourceExp = localExp.length > 0 ? localExp : EXPERIENCES;
      for (const exp of sourceExp) {
        await setDoc(doc(db, 'experiences', exp.id), cleanDoc(exp), { merge: true }).catch(() => {});
      }
    }

    // 4. Sync Festivals
    const festSnap = await getDocs(collection(db, 'festivals')).catch(() => null);
    if (!festSnap || festSnap.empty) {
      let localFest: Festival[] = [];
      try {
        const stored = safeGetStorage('discover_bd_festivals');
        if (stored) localFest = JSON.parse(stored);
      } catch {}
      const sourceFest = localFest.length > 0 ? localFest : FESTIVALS;
      for (const fest of sourceFest) {
        await setDoc(doc(db, 'festivals', fest.id), cleanDoc(fest), { merge: true }).catch(() => {});
      }
    }

    // 5. Sync Editorial Stories
    const storiesSnap = await getDocs(collection(db, 'editorial_stories')).catch(() => null);
    const existingStoryIds = new Set<string>();
    if (storiesSnap && !storiesSnap.empty) {
      storiesSnap.forEach((d) => existingStoryIds.add(d.id));
    }

    let localStories: EditorialStory[] = [];
    try {
      const stored = safeGetStorage('discover_bd_stories');
      if (stored) localStories = JSON.parse(stored);
    } catch {}

    const sourceStories = localStories.length > 0 ? localStories : EDITORIAL_STORIES;
    for (const story of sourceStories) {
      if (!existingStoryIds.has(story.id) || localStories.length > 0) {
        await setDoc(doc(db, 'editorial_stories', story.id), cleanDoc(story), { merge: true }).catch(() => {});
        syncedStories++;
      }
    }
  } catch (err) {
    console.warn('Bootstrap and migration to Firestore completed with notice:', err);
  }

  return { syncedPosts, syncedDestinations, syncedStories };
}
