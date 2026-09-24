/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, rtdb, collection, onSnapshot, query, orderBy, limit, doc, updateDoc, increment, ref, onValue, set, get } from '../lib/firebase';
import { CommunityPost, Language, AppUser } from '../types';
import { checkIsUserAdmin } from '../lib/userRoles';
import { Camera, Heart, MapPin, Sparkles, User, Tag, Plus, MessageSquare, Shield, Lock, X, Share2, Check, ArrowLeft, Bookmark, Video } from 'lucide-react';
import { SocialInteractionBox } from './SocialInteractionBox';
import { copyDirectLink } from '../lib/urlSync';

interface CommunityGallerySectionProps {
  language: Language;
  onOpenUploadModal: () => void;
  onOpenAuth: () => void;
  userId?: string;
  customPosts?: CommunityPost[];
  currentUser?: AppUser | null;
  onOpenAdmin?: () => void;
  selectedPostId?: string | null;
  onSelectPost?: (post: CommunityPost | null) => void;
  savedIds?: string[];
  onToggleSave?: (id: string, e?: React.MouseEvent) => void;
}

// Initial curated community showcase items if DB is empty
const SEED_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'seed-1',
    userId: 'traveler_1',
    userName: 'Rashidul Hasan',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    title: 'Morning mist over Ratargul Swamp Forest',
    caption: 'Navigating through the emerald green waters in a traditional wooden dinghy. Truly the Amazon of Bangladesh.',
    location: 'Ratargul, Sylhet',
    division: 'sylhet',
    imageUrl: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=1000&q=80',
    likesCount: 42,
    likedBy: [],
    createdAt: Date.now() - 86400000 * 2,
    tags: ['Sylhet', 'SwampForest', 'Kayaking'],
  },
  {
    id: 'seed-2',
    userId: 'traveler_2',
    userName: 'Farzana Chowdhury',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    title: 'Golden Hour at Saint Martin’s Coral Island',
    caption: 'Crystal clear azure waters and fresh green coconuts right at Chera Dwip point.',
    location: "Saint Martin's Island, Cox's Bazar",
    division: 'chittagong',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    likesCount: 89,
    likedBy: [],
    createdAt: Date.now() - 86400000 * 4,
    tags: ['Island', 'Coral', 'BeachSunset'],
  },
  {
    id: 'seed-3',
    userId: 'traveler_3',
    userName: 'Sabbir Hossain',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    title: 'Majestic Somapura Mahavihara Terracotta',
    caption: 'Ancient 8th-century Buddhist architecture standing with grand spiritual serenity in Naogaon.',
    location: 'Paharpur, Naogaon',
    division: 'rajshahi',
    imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80',
    likesCount: 35,
    likedBy: [],
    createdAt: Date.now() - 86400000 * 6,
    tags: ['UNESCO', 'History', 'Archaeology'],
  },
];

export const CommunityGallerySection: React.FC<CommunityGallerySectionProps> = ({
  language,
  onOpenUploadModal,
  onOpenAuth,
  userId,
  customPosts = [],
  currentUser,
  onOpenAdmin,
  selectedPostId,
  onSelectPost,
  savedIds = [],
  onToggleSave,
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>(SEED_COMMUNITY_POSTS);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [internalSelectedPost, setInternalSelectedPost] = useState<CommunityPost | null>(null);
  const [showAdminNotice, setShowAdminNotice] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('bd_liked_posts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync selected post if controlled via prop
  const selectedPost = selectedPostId 
    ? (posts.find((p) => p.id === selectedPostId) || internalSelectedPost)
    : internalSelectedPost;

  const handleSelectPost = (post: CommunityPost | null) => {
    setInternalSelectedPost(post);
    if (onSelectPost) {
      onSelectPost(post);
    }
  };

  const handleCopyPostLink = async () => {
    if (!selectedPost) return;
    const success = await copyDirectLink('post', selectedPost.id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isAdmin = checkIsUserAdmin(currentUser || null);
  const isLoggedInWithEmail = !!currentUser && !currentUser.isAnonymous && !!currentUser.email;

  const handleUploadClick = () => {
    if (!isLoggedInWithEmail) {
      onOpenAuth();
    } else {
      onOpenUploadModal();
    }
  };

  // Listen to Firestore real-time updates
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | undefined;
    try {
      const q = query(collection(db, 'community_posts'), orderBy('createdAt', 'desc'), limit(20));
      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const fetched: CommunityPost[] = [];
            snapshot.forEach((docSnap) => {
              fetched.push({ id: docSnap.id, ...(docSnap.data() as Omit<CommunityPost, 'id'>) });
            });
            // Merge with seeds if needed
            setPosts([...fetched, ...SEED_COMMUNITY_POSTS.filter((s) => !fetched.some((f) => f.id === s.id))]);
          }
        },
        (error) => {
          console.warn('Firestore live listener warning, checking Realtime DB:', error);
        }
      );
    } catch (e) {
      console.warn('Firestore listen setup:', e);
    }

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Sync custom injected posts directly so updates to existing posts (content, images, titles) reflect immediately
  useEffect(() => {
    if (customPosts && customPosts.length > 0) {
      setPosts(customPosts);
    }
  }, [customPosts]);

  const handleLike = async (post: CommunityPost, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const isLiked = likedPostIds.includes(post.id);
    const newLikedIds = isLiked
      ? likedPostIds.filter((id) => id !== post.id)
      : [...likedPostIds, post.id];

    setLikedPostIds(newLikedIds);
    try {
      localStorage.setItem('bd_liked_posts', JSON.stringify(newLikedIds));
    } catch {}

    // Update state locally
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === post.id) {
          return {
            ...p,
            likesCount: isLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
          };
        }
        return p;
      })
    );

    // Update in Firestore
    try {
      const postDoc = doc(db, 'community_posts', post.id);
      await updateDoc(postDoc, {
        likesCount: increment(isLiked ? -1 : 1),
      });
    } catch (err) {
      console.warn('Like sync fallback:', err);
    }
  };

  const filteredPosts =
    selectedDivision === 'all'
      ? posts
      : posts.filter((p) => p.division.toLowerCase() === selectedDivision.toLowerCase());

  return (
    <section id="community-gallery" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full overflow-hidden">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-6 border-b border-[#D8D0BC] gap-6"
      >
        <div>
          <div className="flex items-center space-x-2 text-[#DE9B2E] text-xs font-semibold uppercase tracking-widest mb-2">
            <Camera className="w-4 h-4" />
            <span>{language === 'en' ? 'Community Photo Stream' : 'ভ্রমণকারী গ্যালারি ও ফটো স্ট্রিম'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#0A2A21] tracking-tight">
            {language === 'en' ? 'Through the Lens of Travelers' : 'ভ্রমণপিপাসুদের চোখে বাংলাদেশ'}
          </h2>
          <p className="mt-2 text-base text-[#4B554E] max-w-2xl font-sans">
            {language === 'en'
              ? 'Real travel photos and chronicles uploaded by our explorer community via ImgBB API & Firebase Realtime.'
              : 'ImgBB API এবং ফায়ারবেস ক্লাউডের মাধ্যমে ভ্রমণকারীদের আপলোডকৃত আসল ছবি ও ভ্রমণ অভিজ্ঞতা।'}
          </p>
        </div>

        {/* Upload Action Button */}
        <button
          onClick={handleUploadClick}
          className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-full bg-[#0F3B2E] hover:bg-[#0A2A21] text-white font-medium text-sm transition-all shadow-md hover:shadow-lg shrink-0 group cursor-pointer border border-[#DE9B2E]/30"
        >
          <Camera className="w-4 h-4 text-[#DE9B2E]" />
          <span>
            {language === 'en'
              ? 'Share Travel Photo'
              : 'ছবি শেয়ার করুন'}
          </span>
        </button>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 no-scrollbar"
      >
        {[
          { id: 'all', en: 'All Divisions', bn: 'সব বিভাগ' },
          { id: 'chittagong', en: 'Chattogram', bn: 'চট্টগ্রাম' },
          { id: 'sylhet', en: 'Sylhet', bn: 'সিলেট' },
          { id: 'khulna', en: 'Khulna & Sundarbans', bn: 'খুলনা' },
          { id: 'rajshahi', en: 'Rajshahi', bn: 'রাজশাহী' },
          { id: 'dhaka', en: 'Dhaka', bn: 'ঢাকা' },
          { id: 'barisal', en: 'Barishal', bn: 'বরিশাল' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedDivision(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDivision === tab.id
                ? 'bg-[#0F3B2E] text-white shadow-xs'
                : 'bg-white border border-[#D8D0BC] text-[#4B554E] hover:border-[#0F3B2E] hover:text-[#0F3B2E]'
            }`}
          >
            {language === 'en' ? tab.en : tab.bn}
          </button>
        ))}
      </motion.div>

      {/* Photo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.map((post, idx) => {
          const isLiked = likedPostIds.includes(post.id);
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.5,
                delay: (idx % 6) * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              onClick={() => handleSelectPost(post)}
              className="group bg-white rounded-2xl border border-[#D8D0BC]/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
            >
              {/* Image Banner */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-[#EFECE3]">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Location & Video Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 max-w-[70%]">
                  <div className="bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center space-x-1 truncate">
                    <MapPin className="w-3 h-3 text-[#DE9B2E] shrink-0" />
                    <span className="truncate">{post.location}</span>
                  </div>
                  {post.videoUrl && (
                    <div
                      className="bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-xs shrink-0"
                      title={language === 'en' ? 'Includes YouTube Video' : 'ইউটিউব ভিডিও অন্তর্ভুক্ত'}
                    >
                      <Video className="w-3 h-3" />
                      <span className="hidden sm:inline">Video</span>
                    </div>
                  )}
                </div>

                {/* Post Action Buttons (Bookmark & Like) */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <button
                    type="button"
                    id={`post-card-save-${post.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!currentUser) {
                        onOpenAuth();
                        return;
                      }
                      onToggleSave?.(post.id, e);
                    }}
                    aria-label={savedIds.includes(post.id) ? 'Remove from Wishlist' : 'Save to Wishlist'}
                    title={language === 'en' ? (savedIds.includes(post.id) ? 'Remove from Wishlist' : 'Save to Wishlist') : (savedIds.includes(post.id) ? 'উইশলিস্ট থেকে বাদ দিন' : 'উইশলিস্টে যুক্ত করুন')}
                    className={`p-2 rounded-full backdrop-blur-xs transition-all cursor-pointer shadow-xs ${
                      savedIds.includes(post.id)
                        ? 'bg-[#8C3B2E] text-white shadow-md'
                        : 'bg-black/50 text-white hover:bg-black/70 hover:text-[#DE9B2E]'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${savedIds.includes(post.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Like Button */}
                  <button
                    onClick={(e) => handleLike(post, e)}
                    aria-label="Like photo"
                    className={`p-2 rounded-full backdrop-blur-xs transition-all ${
                      isLiked
                        ? 'bg-rose-500 text-white shadow-md'
                        : 'bg-black/50 text-white hover:bg-black/70'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#0A2A21] group-hover:text-[#DE9B2E] transition-colors leading-snug line-clamp-1">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-xs text-[#4B554E] line-clamp-2 leading-relaxed">
                    {post.caption}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EFECE3] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {post.userAvatar ? (
                      <img
                        src={post.userAvatar}
                        alt={post.userName}
                        className="w-6 h-6 rounded-full object-cover border border-[#D8D0BC]"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#0F3B2E] text-white flex items-center justify-center text-[10px] font-bold">
                        {post.userName ? post.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-[#1B211D]">{post.userName}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-[#6B756E]">
                    <span className="flex items-center space-x-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      <span>{post.likesCount}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="w-3.5 h-3.5 text-[#DE9B2E]" />
                      <span>{post.commentsCount || 2}</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full-Screen View for Single Post */}
      {selectedPost && (
        <div
          id="post-fullscreen-modal"
          className="fixed inset-0 z-50 bg-[#FAF8F3] overflow-y-auto flex flex-col animate-in fade-in duration-200"
        >
          {/* Sticky Header */}
          <header className="sticky top-0 z-30 bg-[#FAF8F3]/95 backdrop-blur-md border-b border-[#D8D0BC] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
            <button
              onClick={() => handleSelectPost(null)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] font-semibold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#0F3B2E]" />
              <span>{language === 'en' ? 'Back to Gallery' : 'গ্যালারিতে ফিরুন'}</span>
            </button>

            {/* Author info preview */}
            <div className="hidden md:flex items-center gap-2.5">
              {selectedPost.userAvatar ? (
                <img
                  src={selectedPost.userAvatar}
                  alt={selectedPost.userName}
                  className="w-7 h-7 rounded-full object-cover border border-[#DE9B2E]"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#0F3B2E] text-white flex items-center justify-center text-xs font-bold font-serif">
                  {selectedPost.userName ? selectedPost.userName.charAt(0).toUpperCase() : 'T'}
                </div>
              )}
              <span className="font-serif font-bold text-sm text-[#0A2A21] truncate max-w-sm">
                {selectedPost.title}
              </span>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleCopyPostLink}
                title={language === 'en' ? 'Copy Post URL' : 'পোস্টের লিংক কপি করুন'}
                className="px-3.5 py-2 bg-white rounded-full border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">{language === 'en' ? 'Link Copied!' : 'লিংক কপি হয়েছে!'}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#0F3B2E]" />
                    <span className="hidden sm:inline">{language === 'en' ? 'Share URL' : 'শেয়ার লিংক'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleSelectPost(null)}
                className="p-2 bg-white rounded-full border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Full Screen Main Content */}
          <main className="flex-1 w-full">
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Image Showcase Column */}
                <div className="lg:col-span-7 bg-[#0A1612] rounded-3xl overflow-hidden border border-[#D8D0BC] shadow-xl flex items-center justify-center min-h-[320px] max-h-[75vh]">
                  <img
                    src={selectedPost.imageUrl}
                    alt={selectedPost.title}
                    className="w-full h-full object-contain max-h-[75vh]"
                  />
                </div>

                {/* Details & Social Column */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Post Info Box */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D8D0BC] shadow-xs space-y-4">
                    {/* User Profile */}
                    <div className="flex items-center space-x-3 pb-4 border-b border-[#D8D0BC]">
                      {selectedPost.userAvatar ? (
                        <img
                          src={selectedPost.userAvatar}
                          alt={selectedPost.userName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#DE9B2E]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#0F3B2E] text-white flex items-center justify-center text-base font-bold font-serif">
                          {selectedPost.userName ? selectedPost.userName.charAt(0).toUpperCase() : 'T'}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-[#0A2A21]">{selectedPost.userName}</h4>
                        <p className="text-xs text-[#6B756E]">
                          {new Date(selectedPost.createdAt).toLocaleDateString(
                            language === 'en' ? 'en-US' : 'bn-BD',
                            { month: 'short', day: 'numeric', year: 'numeric' }
                          )}
                        </p>
                      </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A2A21] leading-tight">
                      {selectedPost.title}
                    </h1>

                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-[#0F3B2E] font-medium">
                      <MapPin className="w-4 h-4 text-[#DE9B2E]" />
                      <span>{selectedPost.location}</span>
                    </div>

                    <p className="text-sm sm:text-base text-[#3A443E] leading-relaxed">
                      {selectedPost.caption}
                    </p>

                    {selectedPost.tags && selectedPost.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {selectedPost.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF8F3] border border-[#D8D0BC] text-[#4B554E]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Social Interactions & Live Comments (Auth required) */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D8D0BC] shadow-xs">
                    <SocialInteractionBox
                      targetId={selectedPost.id}
                      targetType="post"
                      targetTitle={selectedPost.title}
                      language={language}
                      currentUser={currentUser || null}
                      onRequireAuth={onOpenAuth}
                      accentTheme="rose"
                    />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Admin Only Posting Notice Modal */}
      {showAdminNotice && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAdminNotice(false)}
        >
          <div
            className="bg-[#F6F3EA] border border-[#D8D0BC] rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#0F3B2E] text-[#DE9B2E] flex items-center justify-center shadow-sm">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#0A2A21]">
                    {language === 'en' ? 'Administrator Only Feature' : 'শুধুমাত্র অ্যাডমিন পোস্ট করতে পারবেন'}
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    {language === 'en' ? 'Firebase Role-Based Security' : 'ফায়ারবেস রোল-ভিত্তিক অ্যাক্সেস কন্ট্রোল'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminNotice(false)}
                className="w-8 h-8 rounded-full bg-white border border-[#D8D0BC] flex items-center justify-center text-[#4B554E] hover:bg-[#EFECE3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#D8D0BC] mb-5 text-xs text-[#3A443E] leading-relaxed">
              <p className="font-medium text-[#0A2A21] mb-1.5">
                {language === 'en'
                  ? '🔒 General User Access: Read & Explorer Only'
                  : '🔒 সাধারণ ইউজার অধিকার: ব্রাউজিং ও সেভ'}
              </p>
              <p>
                {language === 'en'
                  ? 'Only verified accounts with the "Admin" role in Firebase can publish travel chronicles, upload photos, or modify tourism destinations. Regular users can bookmark places, like photos, and generate trip itineraries.'
                  : 'ওয়েবসাইটে নতুন ছবি বা কোনো কিছু পোস্ট করার অধিকার শুধুমাত্র ফায়ারবেস অ্যাডমিন রোলের জন্য সংরক্ষিত। সাধারণ ইউজার হিসেবে আপনি যেকোনো স্থান ঘুরে দেখতে, বুকমার্ক করতে ও লাইক দিতে পারবেন।'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {onOpenAdmin && (
                <button
                  onClick={() => {
                    setShowAdminNotice(false);
                    onOpenAdmin();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#0F3B2E] text-[#DE9B2E] font-bold text-xs hover:bg-[#0A2A21] transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Shield className="w-4 h-4" />
                  <span>{language === 'en' ? 'Log in as Admin' : 'অ্যাডমিন লগইন করুন'}</span>
                </button>
              )}
              <button
                onClick={() => setShowAdminNotice(false)}
                className="py-3 px-4 rounded-xl bg-white border border-[#D8D0BC] text-[#4B554E] font-bold text-xs hover:bg-[#EFECE3] transition-all text-center"
              >
                {language === 'en' ? 'I Understand' : 'ঠিক আছে'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
