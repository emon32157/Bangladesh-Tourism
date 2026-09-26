/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  db,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  where,
} from './firebase';
import { NewsPost, NewsComment } from '../types';
import { cleanDoc } from './firestoreSync';

const NEWS_COLLECTION = 'news_posts';
const COMMENTS_COLLECTION = 'news_comments';

// Initial Official Tourism Board News & Announcements Seed
export const INITIAL_NEWS_SEED: NewsPost[] = [
  {
    id: 'news_sundarbans_eco_initiative',
    title: 'New Eco-Tourism Guidelines and Zero-Plastic Policy for Sundarbans 2026',
    titleBn: 'সুন্দরবনে নতুন ইকোট্যুরিজম নির্দেশিকা ও প্লাস্টিক-মুক্ত পর্যটন নীতি ২০২৬',
    category: 'Preservation',
    categoryBn: 'সংরক্ষণ ও পরিবেশ',
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
    summary: 'The Ministry of Civil Aviation and Tourism along with the Forest Department has introduced new electric boat zones and strict waste management protocols across Kotka and Hiron Point.',
    summaryBn: 'বেসামরিক বিমান পরিবহন ও পর্যটন মন্ত্রণালয় এবং বন অধিদপ্তর যৌথভাবে কটকা ও হিরণ পয়েন্টে নতুন ইলেকট্রিক বোট জোন ও কঠোর বর্জ্য ব্যবস্থাপনা চালু করেছে।',
    content: `To preserve the world's largest mangrove forest and protect the habitat of the Royal Bengal Tiger, the Bangladesh Tourism Board has launched new eco-conscious travel standards for the 2026 season.

Key Updates:
1. Single-use plastics are strictly prohibited inside the wildlife sanctuary zones.
2. Silent solar-electric safari vessels have been licensed for guided deep-forest navigation.
3. Local community guides from Mongla and Dacope have received advanced eco-hospitality training.
4. Dedicated observation watchtowers at Katka and Jamtola Beach have been restored with sustainable timber materials.`,
    contentBn: `বিশ্বের বৃহত্তম ম্যানগ্রোভ বন সংরক্ষণ এবং রয়েল বেঙ্গল টাইগারের আবাসস্থল সুরক্ষায় বাংলাদেশ পর্যটন বোর্ড ২০২৬ মৌসুমের জন্য নতুন পরিবেশবান্ধব ভ্রমণ নির্দেশিকা জারি করেছে।

প্রধান নির্দেশনাসমূহ:
১. অভয়ারণ্য এলাকায় একবার ব্যবহারযোগ্য প্লাস্টিক সম্পূর্ণ নিষিদ্ধ।
২. গভীর বনাঞ্চলে শান্ত ও পরিচ্ছন্ন পরিবেশ বজায় রাখতে সৌরবিদ্যুৎ চালিত নৌযান চালু হয়েছে।
৩. মোংলা ও দাকোপের স্থানীয় তরুণ গাইডদের আন্তর্জাতিক মানসম্পন্ন প্রশিক্ষণ প্রদান করা হয়েছে।
৪. কটকা ও জামতলা সৈকতের ওয়াচটাওয়ারগুলো পরিবেশবান্ধব কাঠে পুনঃনির্মাণ করা হয়েছে।`,
    authorName: 'Admin Desk',
    authorRole: 'Chief Tourism Officer',
    createdAt: Date.now() - 36 * 3600 * 1000,
    likesCount: 24,
    likedBy: [],
    commentsCount: 3,
    pinned: true,
  },
  {
    id: 'news_coxsbazar_marine_drive_expansion',
    title: 'Cox’s Bazar to Teknaf Marine Drive Scenic Rest Stops and Night Lighting Project',
    titleBn: 'কক্সবাজার-টেকনাফ মেরিন ড্রাইভে দৃষ্টিনন্দন বিশ্রামাগার ও নিরাপদ আলো প্রকল্প',
    category: 'Tourism Update',
    categoryBn: 'পর্যটন উন্নয়ন',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    summary: 'The longest sea beach scenic corridor now features 12 designated traveler resting plazas with fresh drinking water, clean restroom facilities, and 24/7 tourist police checkpoints.',
    summaryBn: 'বিশ্বের দীর্ঘতম সমুদ্র সৈকত মেরিন ড্রাইভের পাশে ১২টি আধুনিক বিশ্রামাগার, সুপেয় পানি, ওয়াশরুম ও সার্বক্ষণিক ট্যুরিস্ট পুলিশ বুথ চালু হয়েছে।',
    content: `Travelers venturing from Cox's Bazar to Inani and Teknaf along the dramatic coastal route can now experience upgraded roadside convenience and safety installations.

Features:
- Dedicated viewpoints with panoramic sunset observation docks overlooking the Bay of Bengal.
- High-efficiency solar street lighting installed near Himchari and Shamlapur beach sections.
- Emergency vehicle breakdown assistance helpline connected to the Tourist Police control room.`,
    contentBn: `কক্সবাজার থেকে ইনানী ও টেকনাফ পর্যন্ত দীর্ঘ ৮০ কিলোমিটার মেরিন ড্রাইভে পর্যটকদের স্বাচ্ছন্দ্য নিশ্চিত করতে আধুনিক সুবিধা চালু করা হয়েছে।

সুবিধাসমূহ:
- বঙ্গোপসাগরের সূর্যাস্ত উপভোগের জন্য দৃষ্টিনন্দন ভিউপয়েন্ট।
- হিমছড়ি ও শামলাপুর অংশে পরিবেশবান্ধব সৌর সড়কবাতি স্থাপন।
- যেকোনো প্রয়োজনে পর্যটক সহায়তায় ট্যুরিস্ট পুলিশের সার্বক্ষণিক জরুরি হেল্পলাইন।`,
    authorName: 'Admin Desk',
    authorRole: 'Infrastructure Director',
    createdAt: Date.now() - 72 * 3600 * 1000,
    likesCount: 19,
    likedBy: [],
    commentsCount: 2,
    pinned: false,
  },
  {
    id: 'news_sajek_cloud_festival',
    title: 'Sajek Valley Cloud Festival & Indigenous Handloom Showcase Announced',
    titleBn: 'সাজেক ভ্যালি ক্লাউড ফেস্টিভ্যাল ও পাহাড়ি তাঁত বস্ত্র মেলা অনুষ্ঠিত হতে যাচ্ছে',
    category: 'Festival',
    categoryBn: 'উৎসব ও সংস্কৃতি',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
    summary: 'Experience traditional Chakma, Marma, and Lushei cultural dances, bamboo cooking demonstrations, and organic hill cuisine on the rooftop of Rangamati.',
    summaryBn: 'মেঘের রাজ্য সাজেকে চাকমা, মারমা ও লুসাই সম্প্রদায়ের ঐতিহ্যবাহী সাংস্কৃতিক পরিবেশনা ও পাহাড়ি খাবারের মহোৎসব।',
    content: `Nestled at 1,800 feet above sea level, Sajek Valley welcomes travelers to celebrate the seasonal transformation of the highlands.

Highlights include:
- Traditional tribal weave demonstrations and direct-from-artisan marketplace.
- Night stargazing camps with astronomical telescopes at Konglak Peak.
- Eco-friendly bamboo architecture workshops led by local craftsmen.`,
    contentBn: `সমুদ্রপৃষ্ঠ থেকে প্রায় ১৮০০ ফুট উঁচুতে অবস্থিত মেঘের রাজ্য সাজেকে এই মৌসুমে অনুষ্ঠিত হতে যাচ্ছে বিশেষ উৎসব।

আকর্ষণসমূহ:
- আদিবাসী তাঁতিদের সরাসরি তৈরি পোশাক ও কারুশিল্প প্রদর্শনী।
- কংলাক পাহাড়ে টেলিস্কোপের মাধ্যমে রাতের আকাশ ও তারামণ্ডল পর্যবেক্ষণ।
- স্থানীয় ঐতিহ্যবাহী বাঁশের কারুকাজ কর্মশালা ও পাহাড়ি গান।`,
    authorName: 'Admin Desk',
    authorRole: 'Cultural Heritage Lead',
    createdAt: Date.now() - 120 * 3600 * 1000,
    likesCount: 31,
    likedBy: [],
    commentsCount: 5,
    pinned: false,
  },
];

// In-Memory cache for fast rendering
let inMemoryNews: NewsPost[] = [...INITIAL_NEWS_SEED];
const newsListeners = new Set<(news: NewsPost[]) => void>();

function notifyNewsListeners() {
  const sorted = [...inMemoryNews].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
  newsListeners.forEach((cb) => cb(sorted));
}

// Load cached news from localStorage initially
try {
  const cached = localStorage.getItem('discover_bd_news_posts');
  if (cached) {
    const parsed = JSON.parse(cached);
    if (Array.isArray(parsed) && parsed.length > 0) {
      inMemoryNews = parsed;
    }
  }
} catch {}

/**
 * Subscribe to real-time News Posts from Firestore
 * Firebase is the Primary Source of Truth!
 */
export function subscribeToNewsPosts(callback: (news: NewsPost[]) => void): () => void {
  newsListeners.add(callback);
  callback(inMemoryNews);

  let unsubscribeFirestore = () => {};

  try {
    const q = query(collection(db, NEWS_COLLECTION), orderBy('createdAt', 'desc'));
    unsubscribeFirestore = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: NewsPost[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as any;
            loaded.push({
              id: docSnap.id,
              title: data.title || 'Official Tourism Announcement',
              titleBn: data.titleBn || data.title,
              category: data.category || 'General',
              categoryBn: data.categoryBn || data.category,
              image: data.image || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=1200&auto=format&fit=crop',
              summary: data.summary || '',
              summaryBn: data.summaryBn || data.summary,
              content: data.content || '',
              contentBn: data.contentBn || data.content,
              authorName: data.authorName || 'Admin Desk',
              authorRole: data.authorRole || 'Official',
              createdAt: data.createdAt || Date.now(),
              updatedAt: data.updatedAt,
              likesCount: data.likesCount ?? 0,
              likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
              commentsCount: data.commentsCount ?? 0,
              pinned: Boolean(data.pinned),
            });
          });

          inMemoryNews = loaded;
          try {
            localStorage.setItem('discover_bd_news_posts', JSON.stringify(loaded));
          } catch {}
          notifyNewsListeners();
        } else {
          // Collection is empty, notify with initial seed
          callback(INITIAL_NEWS_SEED);
        }
      },
      (error) => {
        console.warn('Firestore news listener warning:', error);
      }
    );
  } catch (err) {
    console.warn('Could not initialize firestore news listener:', err);
  }

  return () => {
    newsListeners.delete(callback);
    unsubscribeFirestore();
  };
}

/**
 * Create a new Admin News Post
 * Firebase FIRST -> only on success update local state and cache!
 */
export async function createNewsPost(
  post: Omit<NewsPost, 'id' | 'createdAt' | 'likesCount' | 'likedBy' | 'commentsCount'>
): Promise<NewsPost> {
  const newId = 'news_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newPost: NewsPost = {
    ...post,
    id: newId,
    createdAt: Date.now(),
    likesCount: 0,
    likedBy: [],
    commentsCount: 0,
  };

  // 1. Primary write to Firestore
  const docRef = doc(db, NEWS_COLLECTION, newId);
  await setDoc(docRef, cleanDoc(newPost));

  // 2. Update local state ONLY after Firebase operation succeeds
  inMemoryNews = [newPost, ...inMemoryNews];
  notifyNewsListeners();
  try {
    localStorage.setItem('discover_bd_news_posts', JSON.stringify(inMemoryNews));
  } catch {}

  return newPost;
}

/**
 * Edit/Update an existing News Post
 * Firebase FIRST -> only on success update local state and cache!
 */
export async function updateNewsPost(postId: string, updates: Partial<NewsPost>): Promise<void> {
  const updatedAt = Date.now();
  // 1. Primary write to Firestore
  const docRef = doc(db, NEWS_COLLECTION, postId);
  await setDoc(docRef, cleanDoc({ ...updates, updatedAt }), { merge: true });

  // 2. Update local state ONLY after Firebase operation succeeds
  inMemoryNews = inMemoryNews.map((item) => {
    if (item.id === postId) {
      return { ...item, ...updates, updatedAt };
    }
    return item;
  });
  notifyNewsListeners();
  try {
    localStorage.setItem('discover_bd_news_posts', JSON.stringify(inMemoryNews));
  } catch {}
}

/**
 * Delete a News Post
 * Firebase FIRST -> only on success update local state and cache!
 */
export async function deleteNewsPost(postId: string): Promise<void> {
  // 1. Primary delete in Firestore
  const docRef = doc(db, NEWS_COLLECTION, postId);
  await deleteDoc(docRef);

  // 2. Update local state ONLY after Firebase operation succeeds
  inMemoryNews = inMemoryNews.filter((item) => item.id !== postId);
  notifyNewsListeners();
  try {
    localStorage.setItem('discover_bd_news_posts', JSON.stringify(inMemoryNews));
  } catch {}
}

/**
 * Toggle user like on a news post (Like / Unlike)
 */
export async function toggleNewsLike(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  const targetPost = inMemoryNews.find((p) => p.id === postId);
  if (!targetPost) return { liked: false, count: 0 };

  const currentLikedBy = Array.isArray(targetPost.likedBy) ? targetPost.likedBy : [];
  const alreadyLiked = currentLikedBy.includes(userId);
  const updatedLikedBy = alreadyLiked
    ? currentLikedBy.filter((uid) => uid !== userId)
    : [...currentLikedBy, userId];
  const newCount = Math.max(0, alreadyLiked ? (targetPost.likesCount || 1) - 1 : (targetPost.likesCount || 0) + 1);

  // 1. Immediately update local in-memory state and notify listeners (Optimistic UI)
  inMemoryNews = inMemoryNews.map((item) => {
    if (item.id === postId) {
      return {
        ...item,
        likedBy: updatedLikedBy,
        likesCount: newCount,
      };
    }
    return item;
  });
  notifyNewsListeners();

  try {
    localStorage.setItem('discover_bd_news_posts', JSON.stringify(inMemoryNews));
  } catch {}

  // 2. Synchronize to Firestore
  try {
    const docRef = doc(db, NEWS_COLLECTION, postId);
    await setDoc(
      docRef,
      cleanDoc({
        likesCount: newCount,
        likedBy: updatedLikedBy,
      }),
      { merge: true }
    );
  } catch (err) {
    // If Firestore rules reject write (e.g. unseeded doc, visitor permissions),
    // we log a friendly notice while keeping the user experience completely intact.
    console.warn('News like cloud sync notice:', err);
  }

  return { liked: !alreadyLiked, count: newCount };
}

// -------------------------------------------------------------
// News Comments Implementation
// -------------------------------------------------------------

export function subscribeToNewsComments(newsId: string, callback: (comments: NewsComment[]) => void): () => void {
  const cacheKey = `discover_bd_comments_${newsId}`;
  let comments: NewsComment[] = [];
  try {
    const stored = localStorage.getItem(cacheKey);
    if (stored) comments = JSON.parse(stored);
  } catch {}
  callback(comments);

  let unsubscribe = () => {};

  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('newsId', '==', newsId),
      orderBy('createdAt', 'asc')
    );

    unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: NewsComment[] = [];
        snapshot.forEach((snap) => {
          const d = snap.data();
          loaded.push({
            id: snap.id,
            newsId: d.newsId,
            userId: d.userId,
            userName: d.userName || 'Traveler',
            userAvatar: d.userAvatar,
            text: d.text || '',
            createdAt: d.createdAt || Date.now(),
          });
        });
        try {
          localStorage.setItem(cacheKey, JSON.stringify(loaded));
        } catch {}
        callback(loaded);
      },
      (err) => {
        console.warn('Comments firestore listener notice:', err);
      }
    );
  } catch (e) {
    console.warn('Error querying comments:', e);
  }

  return unsubscribe;
}

export async function addNewsComment(
  newsId: string,
  comment: Omit<NewsComment, 'id' | 'createdAt' | 'newsId'>
): Promise<NewsComment> {
  const newId = 'comment_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const fullComment: NewsComment = {
    ...comment,
    id: newId,
    newsId,
    createdAt: Date.now(),
  };

  // 1. Immediately update local state and cache (Optimistic UI)
  const post = inMemoryNews.find((p) => p.id === newsId);
  const newCommentsCount = (post?.commentsCount || 0) + 1;
  inMemoryNews = inMemoryNews.map((p) => {
    if (p.id === newsId) {
      return { ...p, commentsCount: newCommentsCount };
    }
    return p;
  });
  notifyNewsListeners();

  const cacheKey = `discover_bd_comments_${newsId}`;
  try {
    const stored = localStorage.getItem(cacheKey);
    const list: NewsComment[] = stored ? JSON.parse(stored) : [];
    list.push(fullComment);
    localStorage.setItem(cacheKey, JSON.stringify(list));
  } catch {}

  // 2. Synchronize to Firestore
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, newId);
    await setDoc(commentRef, cleanDoc(fullComment));

    const postRef = doc(db, NEWS_COLLECTION, newsId);
    await setDoc(postRef, { commentsCount: newCommentsCount }, { merge: true }).catch(() => {});
  } catch (err) {
    console.warn('Comment cloud sync notice:', err);
  }

  return fullComment;
}

export async function deleteNewsComment(newsId: string, commentId: string): Promise<void> {
  // 1. Primary delete from Firestore
  const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
  await deleteDoc(commentRef);

  const post = inMemoryNews.find((p) => p.id === newsId);
  const newCommentsCount = Math.max(0, (post?.commentsCount || 1) - 1);
  const postRef = doc(db, NEWS_COLLECTION, newsId);
  await setDoc(postRef, { commentsCount: newCommentsCount }, { merge: true }).catch(() => {});

  // 2. Update local state
  inMemoryNews = inMemoryNews.map((p) => {
    if (p.id === newsId) {
      return { ...p, commentsCount: newCommentsCount };
    }
    return p;
  });
  notifyNewsListeners();

  const cacheKey = `discover_bd_comments_${newsId}`;
  try {
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const list: NewsComment[] = JSON.parse(stored);
      const filtered = list.filter((c) => c.id !== commentId);
      localStorage.setItem(cacheKey, JSON.stringify(filtered));
    }
  } catch {}
}
