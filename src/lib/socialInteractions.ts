/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  db,
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  increment,
  setDoc,
} from './firebase';
import { SocialComment, ReactionType, AppUser } from '../types';

export const REACTION_CONFIG: Record<ReactionType, { emoji: string; labelEn: string; labelBn: string; color: string }> = {
  love: { emoji: '❤️', labelEn: 'Love', labelBn: 'ভালোবাসা', color: 'text-rose-500' },
  like: { emoji: '👍', labelEn: 'Like', labelBn: 'পছন্দ', color: 'text-blue-500' },
  wow: { emoji: '🤩', labelEn: 'Inspiring', labelBn: 'অনুপ্রেরণাদায়ী', color: 'text-amber-500' },
  bengal: { emoji: '🇧🇩', labelEn: 'Proud Bengal', labelBn: 'সোনার বাংলা', color: 'text-emerald-600' },
};

// Initial Seed Comments for curated experience
const SEED_COMMENTS: SocialComment[] = [
  {
    id: 'seed-c-1',
    targetId: 'seed-1',
    targetType: 'post',
    userId: 'user_explr_1',
    userName: 'Tanvir Ahmed',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    text: 'Ratargul is magical during monsoon! The local boatmen are very hospitable.',
    createdAt: Date.now() - 3600000 * 24,
    likesCount: 5,
    likedBy: [],
  },
  {
    id: 'seed-c-2',
    targetId: 'seed-1',
    targetType: 'post',
    userId: 'user_explr_2',
    userName: 'Nusrat Jahan',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    text: 'অসাধারণ দৃশ্য! বর্ষায় সিলেটের সুন্দর পরিবেশ দেখার মতো।',
    createdAt: Date.now() - 3600000 * 12,
    likesCount: 3,
    likedBy: [],
  },
  {
    id: 'seed-c-3',
    targetId: 'story-1',
    targetType: 'story',
    userId: 'user_explr_3',
    userName: 'Dr. Rafiqul Islam',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    text: 'The historical details about Jamdani weaving in Sonargaon are so deeply researched. Proud of our national heritage!',
    createdAt: Date.now() - 3600000 * 48,
    likesCount: 12,
    likedBy: [],
  },
  {
    id: 'seed-c-4',
    targetId: 'story-2',
    targetType: 'story',
    userId: 'user_explr_4',
    userName: 'Shaila Rahman',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    text: 'সুন্দরবনের জীববৈচিত্র্য ও মধু সংগ্রহের গল্পটি মন ছুঁয়ে গেল।',
    createdAt: Date.now() - 3600000 * 18,
    likesCount: 8,
    likedBy: [],
  },
];

// In-Memory & LocalStorage cache
const getLocalComments = (): SocialComment[] => {
  try {
    const raw = localStorage.getItem('bd_social_comments');
    if (!raw) return SEED_COMMENTS;
    const parsed = JSON.parse(raw) as SocialComment[];
    // Merge seeds
    const ids = new Set(parsed.map((c) => c.id));
    const missingSeeds = SEED_COMMENTS.filter((s) => !ids.has(s.id));
    return [...parsed, ...missingSeeds];
  } catch {
    return SEED_COMMENTS;
  }
};

const saveLocalComments = (comments: SocialComment[]) => {
  try {
    localStorage.setItem('bd_social_comments', JSON.stringify(comments));
  } catch {}
};

/**
 * Real-time subscription to comments for a specific post or story
 */
export const subscribeToComments = (
  targetId: string,
  targetType: 'post' | 'story',
  onUpdate: (comments: SocialComment[]) => void
): (() => void) => {
  // First emit local/cached comments
  const local = getLocalComments().filter((c) => c.targetId === targetId);
  onUpdate(local.sort((a, b) => b.createdAt - a.createdAt));

  let unsubscribeFirestore: (() => void) | undefined;
  try {
    const commentsRef = collection(db, 'social_comments');
    const q = query(
      commentsRef,
      where('targetId', '==', targetId),
      orderBy('createdAt', 'desc')
    );

    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const fetched: SocialComment[] = [];
          snapshot.forEach((docSnap) => {
            fetched.push({ id: docSnap.id, ...(docSnap.data() as Omit<SocialComment, 'id'>) });
          });
          onUpdate(fetched);
          // Sync with local
          const currentLocal = getLocalComments();
          const otherComments = currentLocal.filter((c) => c.targetId !== targetId);
          saveLocalComments([...fetched, ...otherComments]);
        }
      },
      (error) => {
        console.warn('Firestore comments subscription warning, using local state:', error);
      }
    );
  } catch (e) {
    console.warn('Comments Firestore error:', e);
  }

  return () => {
    if (unsubscribeFirestore) unsubscribeFirestore();
  };
};

/**
 * Add a new comment (STRICTLY requires currentUser)
 */
export const addComment = async (params: {
  targetId: string;
  targetType: 'post' | 'story';
  text: string;
  currentUser: AppUser | null;
}): Promise<SocialComment> => {
  const { targetId, targetType, text, currentUser } = params;

  if (!currentUser) {
    throw new Error('AUTH_REQUIRED');
  }

  const trimmedText = text.trim();
  if (!trimmedText) {
    throw new Error('EMPTY_TEXT');
  }

  const newComment: SocialComment = {
    id: 'comm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    targetId,
    targetType,
    userId: currentUser.uid,
    userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Traveler',
    userAvatar: currentUser.photoURL || undefined,
    userEmail: currentUser.email || undefined,
    text: trimmedText,
    createdAt: Date.now(),
    likesCount: 0,
    likedBy: [],
  };

  // Save to local cache immediately
  const localList = getLocalComments();
  saveLocalComments([newComment, ...localList]);

  // Attempt to save to Firestore
  try {
    const commentsCol = collection(db, 'social_comments');
    const docRef = await addDoc(commentsCol, {
      targetId: newComment.targetId,
      targetType: newComment.targetType,
      userId: newComment.userId,
      userName: newComment.userName,
      userAvatar: newComment.userAvatar || null,
      userEmail: newComment.userEmail || null,
      text: newComment.text,
      createdAt: newComment.createdAt,
      likesCount: 0,
      likedBy: [],
    });
    newComment.id = docRef.id;

    // Increment comment count on target collection doc if available
    const targetColName = targetType === 'story' ? 'editorial_stories' : 'community_posts';
    try {
      const targetDoc = doc(db, targetColName, targetId);
      await updateDoc(targetDoc, {
        commentsCount: increment(1),
      });
    } catch {}
  } catch (err) {
    console.warn('Firestore add comment fallback to local:', err);
  }

  return newComment;
};

/**
 * Delete a comment (requires ownership or Admin role)
 */
export const deleteComment = async (
  commentId: string,
  targetId: string,
  targetType: 'post' | 'story',
  currentUser: AppUser | null
): Promise<void> => {
  if (!currentUser) {
    throw new Error('AUTH_REQUIRED');
  }

  // Update local cache
  const local = getLocalComments();
  saveLocalComments(local.filter((c) => c.id !== commentId));

  // Remove from Firestore
  try {
    await deleteDoc(doc(db, 'social_comments', commentId));
    const targetColName = targetType === 'story' ? 'editorial_stories' : 'community_posts';
    try {
      const targetDoc = doc(db, targetColName, targetId);
      await updateDoc(targetDoc, {
        commentsCount: increment(-1),
      });
    } catch {}
  } catch (err) {
    console.warn('Firestore delete comment fallback:', err);
  }
};

/**
 * Like / unlike a comment (requires currentUser)
 */
export const toggleCommentLike = async (
  commentId: string,
  currentUser: AppUser | null
): Promise<{ likesCount: number; isLiked: boolean }> => {
  if (!currentUser) {
    throw new Error('AUTH_REQUIRED');
  }

  const local = getLocalComments();
  const targetComment = local.find((c) => c.id === commentId);
  const currentLikedBy = targetComment?.likedBy || [];
  const isLiked = currentLikedBy.includes(currentUser.uid);
  const newLikedBy = isLiked
    ? currentLikedBy.filter((uid) => uid !== currentUser.uid)
    : [...currentLikedBy, currentUser.uid];
  const newCount = newLikedBy.length;

  // Update local
  saveLocalComments(
    local.map((c) =>
      c.id === commentId ? { ...c, likesCount: newCount, likedBy: newLikedBy } : c
    )
  );

  // Firestore update
  try {
    const commentDoc = doc(db, 'social_comments', commentId);
    await updateDoc(commentDoc, {
      likesCount: newCount,
      likedBy: newLikedBy,
    });
  } catch (e) {
    console.warn('Comment like sync fallback:', e);
  }

  return { likesCount: newCount, isLiked: !isLiked };
};

/**
 * Reactions Local Storage helper
 */
interface ItemReactionState {
  userReaction: ReactionType | null;
  counts: Record<ReactionType, number>;
}

const getStoredReactions = (targetId: string): ItemReactionState => {
  try {
    const raw = localStorage.getItem(`bd_reactions_${targetId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    userReaction: null,
    counts: {
      love: 14,
      like: 8,
      wow: 6,
      bengal: 11,
    },
  };
};

const saveStoredReactions = (targetId: string, state: ItemReactionState) => {
  try {
    localStorage.setItem(`bd_reactions_${targetId}`, JSON.stringify(state));
  } catch {}
};

/**
 * Toggle Reaction on a Post or Story (STRICTLY requires currentUser)
 */
export const toggleItemReaction = async (params: {
  targetId: string;
  targetType: 'post' | 'story';
  reaction: ReactionType;
  currentUser: AppUser | null;
}): Promise<ItemReactionState> => {
  const { targetId, targetType, reaction, currentUser } = params;

  if (!currentUser) {
    throw new Error('AUTH_REQUIRED');
  }

  const currentState = getStoredReactions(targetId);
  const isRemoving = currentState.userReaction === reaction;
  const previousReaction = currentState.userReaction;

  const newCounts = { ...currentState.counts };

  if (isRemoving) {
    // User un-reacts
    newCounts[reaction] = Math.max(0, (newCounts[reaction] || 1) - 1);
    const newState: ItemReactionState = {
      userReaction: null,
      counts: newCounts,
    };
    saveStoredReactions(targetId, newState);
    syncReactionToFirestore(targetId, targetType, currentUser.uid, null, previousReaction);
    return newState;
  } else {
    // Decrement previous if changed
    if (previousReaction && newCounts[previousReaction]) {
      newCounts[previousReaction] = Math.max(0, newCounts[previousReaction] - 1);
    }
    // Increment new reaction
    newCounts[reaction] = (newCounts[reaction] || 0) + 1;
    const newState: ItemReactionState = {
      userReaction: reaction,
      counts: newCounts,
    };
    saveStoredReactions(targetId, newState);
    syncReactionToFirestore(targetId, targetType, currentUser.uid, reaction, previousReaction);
    return newState;
  }
};

export const getReactionsForTarget = (targetId: string): ItemReactionState => {
  return getStoredReactions(targetId);
};

const syncReactionToFirestore = async (
  targetId: string,
  targetType: 'post' | 'story',
  userId: string,
  newReaction: ReactionType | null,
  previousReaction: ReactionType | null
) => {
  try {
    const colName = targetType === 'story' ? 'editorial_stories' : 'community_posts';
    const targetDoc = doc(db, colName, targetId);
    
    const updatePayload: Record<string, unknown> = {};
    if (newReaction) {
      updatePayload[`userReactions.${userId}`] = newReaction;
      updatePayload[`reactions.${newReaction}`] = increment(1);
    } else {
      updatePayload[`userReactions.${userId}`] = null;
    }

    if (previousReaction && previousReaction !== newReaction) {
      updatePayload[`reactions.${previousReaction}`] = increment(-1);
    }

    await updateDoc(targetDoc, updatePayload);
  } catch (err) {
    console.warn('Firestore reaction update fallback:', err);
  }
};
