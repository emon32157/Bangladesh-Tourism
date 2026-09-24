/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NewsPost, NewsComment, Language, AppUser } from '../types';
import {
  subscribeToNewsPosts,
  toggleNewsLike,
  subscribeToNewsComments,
  addNewsComment,
  deleteNewsComment,
} from '../lib/newsService';
import { checkIsUserAdmin } from '../lib/userRoles';
import {
  Newspaper,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  User,
  Sparkles,
  Send,
  Trash2,
  X,
  Check,
  ChevronRight,
  ShieldCheck,
  Pin,
  Clock,
} from 'lucide-react';

interface NewsSectionProps {
  language: Language;
  currentUser: AppUser | null;
  onOpenAuthModal?: () => void;
  isStandalonePage?: boolean;
}

export const NewsSection: React.FC<NewsSectionProps> = ({
  language,
  currentUser,
  onOpenAuthModal,
  isStandalonePage = false,
}) => {
  const [newsList, setNewsList] = useState<NewsPost[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedNews, setSelectedNews] = useState<NewsPost | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active user identification
  const currentUserId = currentUser?.uid || 'guest_visitor';
  const isAdmin = checkIsUserAdmin(currentUser);

  // Subscribe to real-time news
  useEffect(() => {
    const unsub = subscribeToNewsPosts((posts) => {
      setNewsList(posts);
      // Sync selected news if open
      if (selectedNews) {
        const updated = posts.find((p) => p.id === selectedNews.id);
        if (updated) setSelectedNews(updated);
      }
    });
    return unsub;
  }, [selectedNews?.id]);

  const categories = [
    { id: 'all', en: 'All Announcements', bn: 'সকল সংবাদ ও বিজ্ঞপ্তি' },
    { id: 'Tourism Update', en: 'Tourism Update', bn: 'পর্যটন উন্নয়ন' },
    { id: 'Preservation', en: 'Preservation', bn: 'সংরক্ষণ ও পরিবেশ' },
    { id: 'Festival', en: 'Festivals & Events', bn: 'উৎসব ও সংস্কৃতি' },
    { id: 'Travel Alert', en: 'Travel Alert', bn: 'ভ্রমণ সতর্কতা' },
  ];

  const filteredNews = useMemo(() => {
    return newsList.filter((item) => {
      if (activeCategory === 'all') return true;
      return item.category?.toLowerCase() === activeCategory.toLowerCase();
    });
  }, [newsList, activeCategory]);

  const handleLike = async (post: NewsPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await toggleNewsLike(post.id, currentUserId);
  };

  const handleShare = (post: NewsPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/news?id=${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatNewsDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <section
      id="news"
      className={`relative w-full overflow-hidden transition-all duration-300 ${
        isStandalonePage ? 'min-h-[85vh] py-8 md:py-14 bg-[#F6F3EA]' : 'py-16 md:py-24 bg-[#FAF8F3] border-t border-[#D8D0BC]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold tracking-widest text-[#8C3B2E] uppercase mb-2">
              <Newspaper className="w-4 h-4 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'Official Bulletins' : 'অফিসিয়াল বুলেটিন ও সংবাদ'}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0A2A21] font-serif tracking-tight">
              {language === 'en' ? 'Tourism News & Announcements' : 'পর্যটন সংবাদ ও জরুরি নোটিশ'}
            </h2>
            <p className="mt-2 text-sm md:text-base text-[#4B554E] max-w-2xl">
              {language === 'en'
                ? 'Stay informed with real-time eco-policies, infrastructural milestones, cultural festivals, and traveler security updates.'
                : 'বাংলাদেশ পর্যটন বোর্ডের হালনাগাদ নোটিশ, পরিবেশ নীতি, নতুন সুযোগ-সুবিধা ও উৎসবের বিস্তারিত তথ্য।'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#0F3B2E] bg-white px-4 py-2 rounded-full border border-[#D8D0BC] shadow-2xs self-start md:self-end">
            <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E]" />
            <span>
              {newsList.length} {language === 'en' ? 'Articles Published' : 'টি সংবাদ প্রকাশিত'}
            </span>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
                  isActive
                    ? 'bg-[#0F3B2E] text-white shadow-xs ring-1 ring-[#DE9B2E]'
                    : 'bg-white text-[#4B554E] hover:bg-[#F6F3EA] border border-[#D8D0BC]'
                }`}
              >
                {language === 'en' ? cat.en : cat.bn}
              </button>
            );
          })}
        </div>

        {/* News Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredNews.map((post) => {
            const isLiked = post.likedBy?.includes(currentUserId);
            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-[#D8D0BC] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                onClick={() => setSelectedNews(post)}
              >
                {/* Image & Badge */}
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Category Pill */}
                  <div className="absolute top-3.5 left-3.5">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/90 text-[#0F3B2E] backdrop-blur-xs shadow-xs border border-white/40">
                      {language === 'en' ? post.category : post.categoryBn || post.category}
                    </span>
                  </div>

                  {post.pinned && (
                    <div className="absolute top-3.5 right-3.5 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#DE9B2E] text-[#0A2A21] shadow-xs">
                      <Pin className="w-3 h-3 fill-current" />
                      <span>{language === 'en' ? 'Featured' : 'প্রধান খবর'}</span>
                    </div>
                  )}

                  {/* Date & Author bar at bottom of image */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="flex items-center gap-1.5 font-medium drop-shadow-md">
                      <Calendar className="w-3.5 h-3.5 text-[#DE9B2E]" />
                      {formatNewsDate(post.createdAt)}
                    </span>
                    <span className="flex items-center gap-1 text-white/90 text-[11px] drop-shadow-md">
                      <User className="w-3 h-3 text-[#DE9B2E]" />
                      {post.authorName}
                    </span>
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold font-serif text-[#0A2A21] group-hover:text-[#8C3B2E] transition-colors leading-snug line-clamp-2">
                      {language === 'en' ? post.title : post.titleBn || post.title}
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#4B554E] leading-relaxed line-clamp-3">
                      {language === 'en' ? post.summary : post.summaryBn || post.summary}
                    </p>
                  </div>

                  {/* Interactive Footer (Likes, Comments, Read More) */}
                  <div className="mt-5 pt-4 border-t border-[#EAE5D8] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Like button */}
                      <button
                        type="button"
                        onClick={(e) => handleLike(post, e)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          isLiked
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-[#FAF7F0] text-[#6B756E] hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={language === 'en' ? 'Like this update' : 'লাইক দিন'}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-rose-500' : ''}`}
                        />
                        <span>{post.likesCount || 0}</span>
                      </button>

                      {/* Comment Count */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FAF7F0] text-[#6B756E]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.commentsCount || 0}</span>
                      </div>

                      {/* Share Button */}
                      <button
                        type="button"
                        onClick={(e) => handleShare(post, e)}
                        className="p-1.5 rounded-full text-[#6B756E] hover:text-[#0A2A21] hover:bg-[#FAF7F0] transition-colors cursor-pointer"
                        title={language === 'en' ? 'Copy link' : 'লিঙ্ক কপি করুন'}
                      >
                        {copiedId === post.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0F3B2E] group-hover:text-[#8C3B2E] transition-colors">
                      <span>{language === 'en' ? 'Read' : 'পড়ুন'}</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        {filteredNews.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#D8D0BC] p-8">
            <Newspaper className="w-10 h-10 text-[#6B756E] mx-auto mb-3" />
            <h4 className="text-lg font-bold text-[#0A2A21]">
              {language === 'en' ? 'No announcements in this category' : 'এই ক্যাটাগরিতে কোনো সংবাদ নেই'}
            </h4>
            <p className="text-xs text-[#6B756E] mt-1">
              {language === 'en' ? 'Please switch to another category or check back later.' : 'অন্য ক্যাটাগরি বেছে নিন অথবা পরবর্তীতে চেক করুন।'}
            </p>
          </div>
        )}
      </div>

      {/* Modal for Full Article & Interactive Comments */}
      <AnimatePresence>
        {selectedNews && (
          <NewsDetailModal
            post={selectedNews}
            onClose={() => setSelectedNews(null)}
            language={language}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onLike={() => handleLike(selectedNews)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

// -------------------------------------------------------------
// Detailed News Article Modal with User Comment System
// -------------------------------------------------------------

interface NewsDetailModalProps {
  post: NewsPost;
  onClose: () => void;
  language: Language;
  currentUser: AppUser | null;
  isAdmin: boolean;
  onLike: () => void;
}

const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  post,
  onClose,
  language,
  currentUser,
  isAdmin,
  onLike,
}) => {
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const currentUserId = currentUser?.uid || 'guest_visitor';
  const isLiked = post.likedBy?.includes(currentUserId);

  useEffect(() => {
    const unsub = subscribeToNewsComments(post.id, (loaded) => {
      setComments(loaded);
    });
    return unsub;
  }, [post.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    setSubmitting(true);
    try {
      const authorName = currentUser?.displayName || guestName.trim() || (language === 'en' ? 'Traveler' : 'ভ্রমণকারী');
      await addNewsComment(post.id, {
        userId: currentUserId,
        userName: authorName,
        userAvatar: currentUser?.photoURL || undefined,
        text,
      });
      setCommentText('');
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm(language === 'en' ? 'Delete this comment?' : 'মন্তব্যটি ডিলিট করতে চান?')) return;
    await deleteNewsComment(post.id, commentId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl bg-[#FAF8F3] rounded-3xl border border-[#D8D0BC] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0F3B2E] text-white shrink-0 border-b border-[#DE9B2E]/30">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[#DE9B2E]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#DE9B2E]">
              {language === 'en' ? post.category : post.categoryBn || post.category}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6">
          {/* Header & Meta */}
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-serif text-[#0A2A21] leading-tight">
              {language === 'en' ? post.title : post.titleBn || post.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[#6B756E]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#DE9B2E]" />
                {new Date(post.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#DE9B2E]" />
                <strong className="text-[#0A2A21]">{post.authorName}</strong> ({post.authorRole})
              </span>
            </div>
          </div>

          {/* Featured Image */}
          <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-md">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>

          {/* Summary Lead Box */}
          <div className="p-4 rounded-2xl bg-[#0F3B2E]/5 border border-[#0F3B2E]/15 text-sm sm:text-base font-medium text-[#0A2A21] leading-relaxed">
            {language === 'en' ? post.summary : post.summaryBn || post.summary}
          </div>

          {/* Detailed Body Content */}
          <div className="text-sm sm:text-base text-[#2C3531] leading-relaxed whitespace-pre-line space-y-4 font-sans">
            {language === 'en' ? post.content : post.contentBn || post.content}
          </div>

          {/* Like & Share Action Row */}
          <div className="pt-4 border-t border-[#D8D0BC] flex items-center justify-between">
            <button
              type="button"
              onClick={onLike}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all cursor-pointer shadow-xs ${
                isLiked
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-white text-[#4B554E] hover:text-rose-600 hover:bg-rose-50 border border-[#D8D0BC]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
              <span>{isLiked ? (language === 'en' ? 'Liked' : 'লাইক দেওয়া হয়েছে') : (language === 'en' ? 'Like' : 'লাইক দিন')} ({post.likesCount || 0})</span>
            </button>

            <span className="text-xs text-[#6B756E]">
              {comments.length} {language === 'en' ? 'Comments' : 'টি মন্তব্য'}
            </span>
          </div>

          {/* Comments Section */}
          <div className="pt-6 border-t border-[#D8D0BC] space-y-4">
            <h3 className="text-lg font-bold font-serif text-[#0A2A21] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'Traveler Discussions' : 'ভ্রমণকারী মন্তব্যসমূহ'}</span>
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="p-4 bg-white rounded-2xl border border-[#D8D0BC] space-y-3">
              {!currentUser && (
                <div>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder={language === 'en' ? 'Your Name (Guest)' : 'আপনার নাম (গেস্ট)'}
                    className="w-full px-3 py-2 text-xs bg-[#FAF7F0] border border-[#D8D0BC] rounded-xl focus:outline-none focus:border-[#0F3B2E]"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <textarea
                  rows={2}
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={language === 'en' ? 'Share your thoughts or feedback...' : 'আপনার মতামত বা অভিজ্ঞতা লিখুন...'}
                  className="flex-1 px-3 py-2 text-xs sm:text-sm bg-[#FAF7F0] border border-[#D8D0BC] rounded-xl focus:outline-none focus:border-[#0F3B2E] resize-none"
                />
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="px-4 rounded-xl bg-[#0F3B2E] text-white hover:bg-[#0A2A21] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4 text-[#DE9B2E]" />
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-xs text-[#6B756E] italic py-2 text-center">
                  {language === 'en' ? 'Be the first traveler to share your feedback.' : 'প্রথম ভ্রমণকারী হিসেবে আপনার মন্তব্য প্রকাশ করুন।'}
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-white rounded-xl border border-[#EAE5D8] flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#0F3B2E] text-[#DE9B2E] font-bold flex items-center justify-center shrink-0 overflow-hidden text-[11px]">
                        {c.userAvatar ? (
                          <img src={c.userAvatar} alt={c.userName} className="w-full h-full object-cover" />
                        ) : (
                          c.userName.slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0A2A21]">{c.userName}</span>
                          <span className="text-[10px] text-[#6B756E]">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[#3E4741] mt-1 leading-relaxed whitespace-pre-line">{c.text}</p>
                      </div>
                    </div>

                    {(isAdmin || c.userId === currentUserId) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-[#8C7E74] hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        title={language === 'en' ? 'Delete comment' : 'মন্তব্য মুছুন'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
