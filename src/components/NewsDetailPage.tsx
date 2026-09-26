/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NewsPost, NewsComment, Language, AppUser, AdSlotConfig } from '../types';
import {
  toggleNewsLike,
  subscribeToNewsComments,
  addNewsComment,
  deleteNewsComment,
} from '../lib/newsService';
import { checkIsUserAdmin } from '../lib/userRoles';
import { updateNewsSeo } from '../lib/seo';
import { getNewsSlug } from '../lib/slugs';
import { AdRenderer } from './AdRenderer';
import {
  Newspaper,
  Heart,
  MessageSquare,
  Share2,
  Calendar,
  User,
  ArrowLeft,
  Send,
  Trash2,
  Check,
  ChevronRight,
  Pin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface NewsDetailPageProps {
  news: NewsPost;
  allNews?: NewsPost[];
  language: Language;
  currentUser: AppUser | null;
  onOpenAuthModal?: () => void;
  onNavigateBack: () => void;
  onSelectNews: (post: NewsPost) => void;
  articleAdConfig?: AdSlotConfig | null;
}

export const NewsDetailPage: React.FC<NewsDetailPageProps> = ({
  news,
  allNews = [],
  language,
  currentUser,
  onOpenAuthModal,
  onNavigateBack,
  onSelectNews,
  articleAdConfig,
}) => {
  const [currentNews, setCurrentNews] = useState<NewsPost>(news);
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Sync internal state when prop changes
  useEffect(() => {
    setCurrentNews(news);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateNewsSeo(news, language);
  }, [news, language]);

  // Subscribe to comments for this post
  useEffect(() => {
    if (!currentNews?.id) return;
    const unsub = subscribeToNewsComments(currentNews.id, (loaded) => {
      setComments(loaded);
    });
    return unsub;
  }, [currentNews.id]);

  const currentUserId = currentUser?.uid || 'guest_visitor';
  const isAdmin = checkIsUserAdmin(currentUser);
  const isLiked = Boolean(currentNews.likedBy?.includes(currentUserId));

  // Date formatting
  const formatNewsDate = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Like handler
  const handleLike = async () => {
    try {
      // Optimistic update
      const newLikedBy = isLiked
        ? (currentNews.likedBy || []).filter((id) => id !== currentUserId)
        : [...(currentNews.likedBy || []), currentUserId];
      const newCount = Math.max(0, (currentNews.likesCount || 0) + (isLiked ? -1 : 1));

      setCurrentNews((prev) => ({
        ...prev,
        likedBy: newLikedBy,
        likesCount: newCount,
      }));

      await toggleNewsLike(currentNews.id, currentUserId);
    } catch (err) {
      console.warn('News like sync notice:', err);
    }
  };

  // Comment submission handler
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    setIsSubmittingComment(true);
    try {
      const authorName =
        currentUser?.displayName ||
        guestName.trim() ||
        (language === 'en' ? 'Traveler' : 'ভ্রমণকারী');

      await addNewsComment(currentNews.id, {
        userId: currentUserId,
        userName: authorName,
        userAvatar: currentUser?.photoURL || undefined,
        text,
      });

      setCommentText('');
    } catch (err) {
      console.error('Error posting news comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete comment handler
  const handleDeleteComment = async (commentId: string) => {
    if (
      !window.confirm(
        language === 'en'
          ? 'Are you sure you want to delete this comment?'
          : 'আপনি কি এই মন্তব্যটি মুছে ফেলতে চান?'
      )
    ) {
      return;
    }

    try {
      await deleteNewsComment(currentNews.id, commentId);
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Web Share or Clipboard Copy handler
  const handleShare = async () => {
    const actualUrl = window.location.href;
    const shareTitle = language === 'en' ? currentNews.title : (currentNews.titleBn || currentNews.title);
    const shareText = language === 'en' ? currentNews.summary : (currentNews.summaryBn || currentNews.summary);

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: actualUrl,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Navigator share error, falling back to clipboard:', err);
        } else {
          return;
        }
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(actualUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error('Failed to copy URL:', e);
    }
  };

  // Related news recommendations
  const relatedNews = allNews
    .filter((n) => n.id !== currentNews.id)
    .slice(0, 3);

  return (
    <article className="min-h-screen bg-[#FAF8F3] pt-6 pb-20 font-sans selection:bg-[#DE9B2E]/30 selection:text-[#0A2A21]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb / Back Button */}
        <div className="flex items-center justify-between py-4 border-b border-[#E5E0D0] mb-8">
          <button
            type="button"
            onClick={onNavigateBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#D8D0BC] text-xs font-bold text-[#0F3B2E] hover:bg-[#FAF8F3] hover:border-[#0F3B2E] transition-all shadow-2xs cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-[#DE9B2E] group-hover:-translate-x-0.5 transition-transform" />
            <span>{language === 'en' ? 'Back to News & Bulletins' : 'সকল সংবাদে ফিরে যান'}</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-[#6B756E]">
            <span className="hidden sm:inline">{language === 'en' ? 'Tourism Bulletin' : 'পর্যটন বুলেটিন'}</span>
            <span className="hidden sm:inline">•</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#0F3B2E]/10 text-[#0F3B2E] border border-[#0F3B2E]/20">
              {language === 'en' ? currentNews.category : currentNews.categoryBn || currentNews.category}
            </span>
          </div>
        </div>

        {/* Header & Meta */}
        <header className="space-y-4 mb-8">
          {/* Category & Pinned Tag */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0F3B2E] text-white">
              {language === 'en' ? currentNews.category : currentNews.categoryBn || currentNews.category}
            </span>
            {currentNews.pinned && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DE9B2E] text-[#0A2A21] shadow-2xs">
                <Pin className="w-3.5 h-3.5 fill-current" />
                <span>{language === 'en' ? 'Official Notice' : 'প্রধান বিজ্ঞপ্তি'}</span>
              </span>
            )}
          </div>

          {/* Primary Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold font-serif text-[#0A2A21] leading-tight">
            {language === 'en' ? currentNews.title : currentNews.titleBn || currentNews.title}
          </h1>

          {/* Secondary Title (Opposite Language for Dual Context) */}
          {language === 'en' && currentNews.titleBn && currentNews.titleBn !== currentNews.title && (
            <h2 className="text-lg sm:text-xl font-medium text-[#4B554E] font-serif">
              {currentNews.titleBn}
            </h2>
          )}
          {language === 'bn' && currentNews.title && currentNews.title !== currentNews.titleBn && (
            <h2 className="text-base sm:text-lg font-medium text-[#4B554E]">
              {currentNews.title}
            </h2>
          )}

          {/* Metadata Row: Date, Author, Reading Time, Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-b border-[#E5E0D0] py-3 text-xs text-[#6B756E]">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#0A2A21]">
                <Calendar className="w-4 h-4 text-[#DE9B2E]" />
                <time dateTime={new Date(currentNews.createdAt).toISOString()}>
                  {formatNewsDate(currentNews.createdAt)}
                </time>
              </span>

              <span>•</span>

              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#DE9B2E]" />
                <span className="font-semibold text-[#0A2A21]">{currentNews.authorName}</span>
                <span className="text-[#6B756E]">({currentNews.authorRole})</span>
              </span>
            </div>

            {/* Quick Share & Like toolbar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLike}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isLiked
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-white border border-[#D8D0BC] text-[#4B554E] hover:text-rose-600 hover:border-rose-300'
                }`}
                title={language === 'en' ? 'Like this article' : 'লাইক দিন'}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
                <span>{currentNews.likesCount || 0}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-[#D8D0BC] text-[#4B554E] hover:border-[#0F3B2E] hover:text-[#0F3B2E] transition-all cursor-pointer"
                title={language === 'en' ? 'Share this article' : 'শেয়ার করুন'}
              >
                {copiedLink || shareSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">{language === 'en' ? 'Link Copied!' : 'লিঙ্ক কপি হয়েছে!'}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-[#DE9B2E]" />
                    <span>{language === 'en' ? 'Share' : 'শেয়ার'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="w-full mb-8 rounded-3xl overflow-hidden shadow-lg border border-[#D8D0BC]/80 bg-neutral-100">
          <img
            src={currentNews.image}
            alt={currentNews.title}
            className="w-full h-auto max-h-[500px] object-cover"
          />
        </div>

        {/* Lead / Executive Summary Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border-l-4 border-[#0F3B2E] border-y border-r border-[#E5E0D0] shadow-2xs mb-8">
          <div className="text-xs uppercase font-extrabold tracking-wider text-[#0F3B2E] mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E]" />
            <span>{language === 'en' ? 'Executive Summary' : 'সংক্ষেপ ও মূল বার্তা'}</span>
          </div>
          <p className="text-base sm:text-lg font-medium text-[#1B211D] leading-relaxed">
            {language === 'en' ? currentNews.summary : currentNews.summaryBn || currentNews.summary}
          </p>
        </div>

        {/* Dynamic Ad Placement: Article / Post Ad (Ad Slot 5) */}
        {articleAdConfig && (
          <div className="my-6">
            <AdRenderer
              slotConfig={articleAdConfig}
              slotId="article"
              language={language}
            />
          </div>
        )}

        {/* Full Article Content */}
        <div className="prose prose-lg max-w-none text-[#2C3531] font-sans leading-relaxed space-y-5 text-base sm:text-lg mb-12">
          {(language === 'en' ? currentNews.content : currentNews.contentBn || currentNews.content)
            .split('\n\n')
            .map((paragraph, idx) => (
              <p key={idx} className="whitespace-pre-line leading-relaxed text-[#2C3531]">
                {paragraph}
              </p>
            ))}
        </div>

        {/* Engagement Footer: Like & Share Bar */}
        <div className="p-6 rounded-2xl bg-white border border-[#D8D0BC] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
          <div className="space-y-0.5 text-center sm:text-left">
            <h4 className="font-bold font-serif text-[#0A2A21] text-sm sm:text-base">
              {language === 'en'
                ? 'Did you find this update helpful?'
                : 'এই খবরটি কি আপনার উপকারে এসেছে?'}
            </h4>
            <p className="text-xs text-[#6B756E]">
              {language === 'en'
                ? 'Support travel journalism in Bangladesh by liking and sharing.'
                : 'লাইক দিয়ে এবং সহযাত্রীদের সাথে শেয়ার করে পর্যটন উন্নয়নে যুক্ত থাকুন।'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95 ${
                isLiked
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#FAF8F3] border border-[#D8D0BC] text-[#0A2A21] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{isLiked ? (language === 'en' ? 'Liked' : 'লাইক দেওয়া হয়েছে') : (language === 'en' ? 'Like' : 'লাইক দিন')}</span>
              <span className="opacity-80">({currentNews.likesCount || 0})</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F3B2E] text-white hover:bg-[#154E3E] font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {copiedLink || shareSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{language === 'en' ? 'Link Copied!' : 'লিঙ্ক কপি হয়েছে!'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Share Article' : 'শেয়ার করুন'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ===================== Comments Section ===================== */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D8D0BC] shadow-xs space-y-6 mb-12">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D0]">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-[#DE9B2E]" />
              <h3 className="text-lg font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'Comments & Discussion' : 'মন্তব্য ও প্রতিক্রিয়া'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF8F3] border border-[#D8D0BC] text-[#0F3B2E]">
                {comments.length}
              </span>
            </div>

            {!currentUser && onOpenAuthModal && (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="text-xs text-[#0F3B2E] hover:underline font-semibold cursor-pointer"
              >
                {language === 'en' ? 'Sign in to comment' : 'লগইন করে মন্তব্য করুন'}
              </button>
            )}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="space-y-3">
            {!currentUser && (
              <div>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={language === 'en' ? 'Your Name (Guest)' : 'আপনার নাম (গেস্ট)'}
                  className="w-full sm:w-72 px-3 py-2 text-xs bg-[#FAF8F3] border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E]"
                />
              </div>
            )}

            <div className="flex gap-2">
              <textarea
                rows={3}
                required
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'Write your comment or question regarding this update...'
                    : 'এই সংবাদ বা বিজ্ঞপ্তি সম্পর্কে আপনার মতামত বা প্রশ্ন লিখুন...'
                }
                className="flex-1 p-3 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8D0BC] rounded-xl focus:outline-hidden focus:border-[#0F3B2E] text-neutral-800"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0F3B2E] text-white hover:bg-[#154E3E] text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-[#DE9B2E]" />
                <span>
                  {isSubmittingComment
                    ? (language === 'en' ? 'Posting...' : 'পোস্ট হচ্ছে...')
                    : (language === 'en' ? 'Post Comment' : 'মন্তব্য প্রকাশ করুন')}
                </span>
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3 pt-2">
            {comments.map((c) => {
              const canDelete = isAdmin || c.userId === currentUserId;
              return (
                <div
                  key={c.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F3] border border-[#E5E0D0] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    {c.userAvatar ? (
                      <img
                        src={c.userAvatar}
                        alt={c.userName}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#0F3B2E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {c.userName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#0A2A21]">{c.userName}</span>
                        <span className="text-[10px] text-[#6B756E]">
                          {new Date(c.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'bn-BD', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-neutral-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                        {c.text}
                      </p>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      title={language === 'en' ? 'Delete comment' : 'মন্তব্য মুছুন'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}

            {comments.length === 0 && (
              <p className="text-center py-6 text-xs text-[#6B756E]">
                {language === 'en'
                  ? 'No comments yet. Be the first to share your thoughts!'
                  : 'এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন!'}
              </p>
            )}
          </div>
        </section>

        {/* Related News Announcements */}
        {relatedNews.length > 0 && (
          <section className="space-y-5 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'More Tourism Bulletins' : 'অন্যান্য পর্যটন সংবাদ ও বিজ্ঞপ্তি'}
              </h3>
              <button
                type="button"
                onClick={onNavigateBack}
                className="text-xs font-bold text-[#0F3B2E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{language === 'en' ? 'View All' : 'সবগুলো দেখুন'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedNews.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectNews(rel)}
                  className="group p-3.5 rounded-2xl bg-white border border-[#D8D0BC] hover:border-[#0F3B2E] shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-neutral-100">
                      <img
                        src={rel.image}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3B2E]">
                      {language === 'en' ? rel.category : rel.categoryBn || rel.category}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold font-serif text-[#0A2A21] line-clamp-2 group-hover:text-[#8C3B2E] transition-colors leading-snug">
                      {language === 'en' ? rel.title : rel.titleBn || rel.title}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E5E0D0] flex items-center justify-between text-[11px] text-[#6B756E]">
                    <span>{formatNewsDate(rel.createdAt)}</span>
                    <span className="font-bold text-[#0F3B2E] flex items-center gap-0.5">
                      <span>{language === 'en' ? 'Read' : 'পড়ুন'}</span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};
