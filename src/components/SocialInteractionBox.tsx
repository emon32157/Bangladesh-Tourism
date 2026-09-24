/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  SocialComment,
  ReactionType,
  Language,
  AppUser,
} from '../types';
import { checkIsUserAdmin } from '../lib/userRoles';
import {
  REACTION_CONFIG,
  subscribeToComments,
  addComment,
  deleteComment,
  toggleCommentLike,
  toggleItemReaction,
  getReactionsForTarget,
} from '../lib/socialInteractions';
import {
  Heart,
  MessageSquare,
  Send,
  Trash2,
  ThumbsUp,
  Sparkles,
  LogIn,
  UserPlus,
  Lock,
  Check,
} from 'lucide-react';

interface SocialInteractionBoxProps {
  targetId: string;
  targetType: 'post' | 'story';
  targetTitle: string;
  language: Language;
  currentUser: AppUser | null;
  onRequireAuth: () => void;
  accentTheme?: 'emerald' | 'amber' | 'rose';
}

export const SocialInteractionBox: React.FC<SocialInteractionBoxProps> = ({
  targetId,
  targetType,
  targetTitle,
  language,
  currentUser,
  onRequireAuth,
  accentTheme = 'emerald',
}) => {
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Reaction State
  const [reactionState, setReactionState] = useState(() => getReactionsForTarget(targetId));
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Subscribe to live comments
  useEffect(() => {
    const unsubscribe = subscribeToComments(targetId, targetType, (updatedComments) => {
      setComments(updatedComments);
    });
    setReactionState(getReactionsForTarget(targetId));
    return () => unsubscribe();
  }, [targetId, targetType]);

  const showTemporaryNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Handle Reaction Click
  const handleReactionClick = async (reaction: ReactionType) => {
    if (!currentUser) {
      setShowAuthWarning(true);
      showTemporaryNotice(
        language === 'en'
          ? 'Please sign in or create an account to react to this story!'
          : 'প্রতিক্রিয়া জানাতে সাইন ইন বা একটি অ্যাকাউন্ট তৈরি করুন!'
      );
      onRequireAuth();
      return;
    }

    try {
      const updated = await toggleItemReaction({
        targetId,
        targetType,
        reaction,
        currentUser,
      });
      setReactionState(updated);
      showTemporaryNotice(
        updated.userReaction
          ? language === 'en'
            ? `Reacted with ${REACTION_CONFIG[reaction].labelEn} ${REACTION_CONFIG[reaction].emoji}`
            : `${REACTION_CONFIG[reaction].emoji} প্রতিক্রিয়া সফল হয়েছে!`
          : language === 'en'
          ? 'Reaction removed'
          : 'প্রতিক্রিয়া মুছে ফেলা হয়েছে'
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Comment Submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthWarning(true);
      onRequireAuth();
      return;
    }

    if (!newCommentText.trim()) return;

    setIsSubmitting(true);
    setCommentError(null);

    try {
      const added = await addComment({
        targetId,
        targetType,
        text: newCommentText,
        currentUser,
      });
      setComments((prev) => [added, ...prev.filter((c) => c.id !== added.id)]);
      setNewCommentText('');
      showTemporaryNotice(
        language === 'en'
          ? 'Your comment has been posted!'
          : 'আপনার মন্তব্য সফলভাবে প্রকাশ করা হয়েছে!'
      );
    } catch (err) {
      console.error(err);
      setCommentError(
        language === 'en'
          ? 'Could not post comment. Please try again.'
          : 'মন্তব্য প্রকাশ করা যায়নি। পুনরায় চেষ্টা করুন।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Comment Delete
  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId, targetId, targetType, currentUser);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      showTemporaryNotice(
        language === 'en' ? 'Comment deleted' : 'মন্তব্য মুছে ফেলা হয়েছে'
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Comment Like
  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) {
      onRequireAuth();
      showTemporaryNotice(
        language === 'en'
          ? 'Please sign in to appreciate comments!'
          : 'মন্তব্যে লাইক দিতে সাইন ইন করুন!'
      );
      return;
    }

    try {
      const { likesCount, isLiked } = await toggleCommentLike(commentId, currentUser);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                likesCount,
                likedBy: isLiked
                  ? [...(c.likedBy || []), currentUser.uid]
                  : (c.likedBy || []).filter((uid) => uid !== currentUser.uid),
              }
            : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const totalReactionsCount = Object.values(reactionState.counts).reduce<number>(
    (sum, val) => sum + (typeof val === 'number' ? val : 0),
    0
  );

  return (
    <div className="w-full space-y-6 pt-6 border-t border-[#D8D0BC]/80">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3 bg-[#0F3B2E] text-[#DE9B2E] text-xs font-semibold rounded-2xl flex items-center justify-between shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#DE9B2E]" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-white/80 hover:text-white text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Reaction Section */}
      <div className="bg-white/80 backdrop-blur-xs p-4 sm:p-5 rounded-3xl border border-[#D8D0BC] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <h4 className="text-xs sm:text-sm font-bold font-serif text-[#0A2A21] uppercase tracking-wider">
              {language === 'en' ? 'Reader Reactions' : 'পাঠক ও ভ্রমণকারীদের প্রতিক্রিয়া'}
            </h4>
          </div>
          <span className="text-[11px] font-bold text-[#6B756E] px-2.5 py-0.5 rounded-full bg-[#EFEADC]">
            {totalReactionsCount} {language === 'en' ? 'Total Reactions' : 'মোট প্রতিক্রিয়া'}
          </span>
        </div>

        {/* Reaction Buttons Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {(Object.keys(REACTION_CONFIG) as ReactionType[]).map((key) => {
            const conf = REACTION_CONFIG[key];
            const isSelected = reactionState.userReaction === key;
            const count = reactionState.counts[key] || 0;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleReactionClick(key)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all transform active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0F3B2E] text-white border-[#0F3B2E] ring-2 ring-[#DE9B2E]/50 shadow-sm'
                    : 'bg-[#FDFBF7] text-[#1B211D] border-[#D8D0BC] hover:border-[#0F3B2E] hover:bg-white'
                }`}
                title={
                  currentUser
                    ? `Click to react with ${conf.labelEn}`
                    : 'Sign in to react / রিয়েক্ট করতে সাইন ইন করুন'
                }
              >
                <div className="flex items-center gap-2">
                  <span className="text-base select-none">{conf.emoji}</span>
                  <span className="truncate">
                    {language === 'en' ? conf.labelEn : conf.labelBn}
                  </span>
                </div>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#EFEADC] text-[#0A2A21]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {!currentUser && (
          <p className="text-[10px] text-[#6B756E] pt-1 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-[#DE9B2E]" />
            <span>
              {language === 'en'
                ? 'Account required to react. Click any reaction to sign in or create an account.'
                : 'প্রতিক্রিয়া জানাতে অ্যাকাউন্টে সাইন ইন বা অ্যাকাউন্ট তৈরি করুন।'}
            </span>
          </p>
        )}
      </div>

      {/* 2. Comments Section */}
      <div className="bg-white/90 backdrop-blur-xs p-4 sm:p-6 rounded-3xl border border-[#D8D0BC] shadow-xs space-y-5">
        {/* Comments Section Header */}
        <div className="flex items-center justify-between border-b border-[#D8D0BC]/60 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#0F3B2E]" />
            <h4 className="text-sm sm:text-base font-bold font-serif text-[#0A2A21]">
              {language === 'en' ? 'Community Comments & Thoughts' : 'মন্তব্য ও মতামত'}
            </h4>
          </div>
          <span className="text-xs font-bold text-[#0F3B2E] px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
            {comments.length} {language === 'en' ? 'Comments' : 'টি মন্তব্য'}
          </span>
        </div>

        {/* Comment Input Box (or Login Gate Prompt) */}
        {currentUser ? (
          <form onSubmit={handleCommentSubmit} className="space-y-3">
            <div className="flex items-start gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-[#DE9B2E] shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0F3B2E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.displayName
                    ? currentUser.displayName.charAt(0).toUpperCase()
                    : 'U'}
                </div>
              )}
              <div className="flex-1 space-y-2">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Share your thoughts, travel tips, or feedback...'
                      : 'আপনার অভিজ্ঞতা বা মতামত লিখুন...'
                  }
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-[#F6F3EA] rounded-2xl text-xs sm:text-sm border border-[#D8D0BC] focus:outline-none focus:ring-2 focus:ring-[#0F3B2E] text-[#1B211D] resize-none"
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#6B756E]">
                    {500 - newCommentText.length} {language === 'en' ? 'chars left' : 'অক্ষর বাকি'}
                  </span>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newCommentText.trim()}
                    className="px-4 py-2 bg-[#0F3B2E] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#0A2A21] disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3 h-3 text-[#DE9B2E]" />
                    <span>
                      {isSubmitting
                        ? language === 'en'
                          ? 'Posting...'
                          : 'পোস্ট হচ্ছে...'
                        : language === 'en'
                        ? 'Post Comment'
                        : 'মন্তব্য করুন'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            {commentError && (
              <p className="text-xs text-red-600 pl-11">{commentError}</p>
            )}
          </form>
        ) : (
          /* Login/Register Prompt Box if user is not signed in */
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F6F3EA] border border-[#DE9B2E]/40 space-y-3 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-[#0A2A21]">
                <Lock className="w-4 h-4 text-[#DE9B2E]" />
                <span>
                  {language === 'en'
                    ? 'Account Login Required to Comment & React'
                    : 'মন্তব্য ও প্রতিক্রিয়া দিতে অ্যাকাউন্টে সাইন ইন বা নতুন অ্যাকাউন্ট তৈরি করুন'}
                </span>
              </div>
              <p className="text-[11px] text-[#6B756E]">
                {language === 'en'
                  ? 'Sign in with your email account to join the traveler discussion community.'
                  : 'ইমেইল দিয়ে সহজে লগইন করে ভ্রমণ আড্ডায় যুক্ত হোন। অ্যাকাউন্ট না থাকলে এক ক্লিকে তৈরি করুন।'}
              </p>
            </div>

            <button
              type="button"
              onClick={onRequireAuth}
              className="px-5 py-2.5 bg-[#0F3B2E] text-[#DE9B2E] hover:text-white hover:bg-[#0A2A21] rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 shadow-xs cursor-pointer border border-[#DE9B2E]/40"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Sign In / Register' : 'সাইন ইন / রেজিস্টার'}</span>
            </button>
          </div>
        )}

        {/* Comment List */}
        <div className="space-y-3 pt-2">
          {comments.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#6B756E]">
              {language === 'en'
                ? 'No comments yet. Be the first to share your experience!'
                : 'এখনও কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই করুন!'}
            </div>
          ) : (
            comments.map((comment) => {
              const isOwner = currentUser?.uid === comment.userId;
              const isAdmin = checkIsUserAdmin(currentUser);
              const isLiked = currentUser?.uid && comment.likedBy?.includes(currentUser.uid);

              return (
                <div
                  key={comment.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-[#FDFBF7] border border-[#D8D0BC]/80 space-y-2 transition-all hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {comment.userAvatar ? (
                        <img
                          src={comment.userAvatar}
                          alt={comment.userName}
                          className="w-7 h-7 rounded-full object-cover border border-[#D8D0BC]"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#0F3B2E] text-white flex items-center justify-center font-bold text-[11px]">
                          {comment.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-xs text-[#0A2A21]">
                          {comment.userName}
                        </span>
                        <p className="text-[10px] text-[#6B756E]">
                          {new Date(comment.createdAt).toLocaleDateString(
                            language === 'en' ? 'en-US' : 'bn-BD',
                            { month: 'short', day: 'numeric', year: 'numeric' }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Delete button if owner or admin */}
                    {(isOwner || isAdmin) && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 text-[#6B756E] hover:text-red-600 transition-colors rounded-md"
                        title={language === 'en' ? 'Delete comment' : 'মুছে ফেলুন'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-[#2C3530] leading-relaxed pl-9">
                    {comment.text}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleLikeComment(comment.id)}
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full transition-colors cursor-pointer ${
                        isLiked
                          ? 'bg-rose-100 text-rose-700'
                          : 'text-[#6B756E] hover:bg-[#EFEADC]'
                      }`}
                    >
                      <ThumbsUp
                        className={`w-3 h-3 ${isLiked ? 'text-rose-600 fill-rose-600' : ''}`}
                      />
                      <span>{comment.likesCount || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
