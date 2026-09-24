import React, { useState } from 'react';
import { CommunityPost, Language, AppUser } from '../types';
import { MapPin, X, Share2, Check, ArrowLeft, Bookmark, Video, Image as ImageIcon } from 'lucide-react';
import { SocialInteractionBox } from './SocialInteractionBox';
import { VideoPlayer } from './VideoPlayer';
import { copyDirectLink } from '../lib/urlSync';

interface PostModalProps {
  post: CommunityPost | null;
  language: Language;
  onClose: () => void;
  currentUser: AppUser | null;
  onOpenAuth: () => void;
  isSaved?: boolean;
  onToggleSave?: (id: string, e?: React.MouseEvent) => void;
}

export const PostModal: React.FC<PostModalProps> = ({
  post,
  language,
  onClose,
  currentUser,
  onOpenAuth,
  isSaved = false,
  onToggleSave,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'photo' | 'video'>(
    post?.videoUrl ? 'photo' : 'photo'
  );

  if (!post) return null;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (onToggleSave) {
      onToggleSave(post.id, e);
    }
  };

  const handleCopyPostLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyDirectLink('post', post.id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div
      id="post-fullscreen-modal"
      className="fixed inset-0 z-50 bg-[#FAF8F3] overflow-y-auto flex flex-col animate-in fade-in duration-200"
    >
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#FAF8F3]/95 backdrop-blur-md border-b border-[#D8D0BC] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] font-semibold text-xs sm:text-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0F3B2E]" />
          <span>{language === 'en' ? 'Back' : 'ফিরে যান'}</span>
        </button>

        {/* Author info preview */}
        <div className="hidden md:flex items-center gap-2.5">
          {post.userAvatar ? (
            <img
              src={post.userAvatar}
              alt={post.userName}
              className="w-7 h-7 rounded-full object-cover border border-[#DE9B2E]"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#0F3B2E] text-white flex items-center justify-center text-xs font-bold font-serif">
              {post.userName ? post.userName.charAt(0).toUpperCase() : 'T'}
            </div>
          )}
          <span className="font-serif font-bold text-sm text-[#0A2A21] truncate max-w-sm">
            {post.title}
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

          {/* Bookmark / Wishlist Button */}
          <button
            id="post-modal-bookmark-btn"
            onClick={handleBookmarkClick}
            title={language === 'en' ? (isSaved ? 'Remove from Wishlist' : 'Add to Wishlist') : (isSaved ? 'উইশলিস্ট থেকে বাদ দিন' : 'উইশলিস্টে যুক্ত করুন')}
            className={`px-3.5 py-2 rounded-full border transition-all cursor-pointer shadow-xs flex items-center gap-1.5 text-xs font-semibold ${
              isSaved
                ? 'bg-[#8C3B2E] text-white border-[#8C3B2E]'
                : 'bg-white text-[#0A2A21] border-[#D8D0BC] hover:bg-[#EFEADC]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">
              {isSaved
                ? language === 'en'
                  ? 'Saved'
                  : 'সংরক্ষিত'
                : language === 'en'
                ? 'Wishlist'
                : 'উইশলিস্ট'}
            </span>
          </button>

          <button
            onClick={onClose}
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
            {/* Media Showcase Column */}
            <div className="lg:col-span-7 space-y-3">
              {post.videoUrl && (
                <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-[#D8D0BC] shadow-2xs w-fit">
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('photo')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeMediaTab === 'photo'
                        ? 'bg-[#0F3B2E] text-white shadow-xs'
                        : 'text-[#4B554E] hover:bg-[#FAF8F3]'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Photo' : 'ছবি'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMediaTab('video')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeMediaTab === 'video'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'YouTube Video' : 'ইউটিউব ভিডিও'}</span>
                  </button>
                </div>
              )}

              {activeMediaTab === 'video' && post.videoUrl ? (
                <div className="rounded-3xl overflow-hidden shadow-xl border border-[#D8D0BC]">
                  <VideoPlayer
                    videoUrlOrEmbed={post.videoUrl}
                    title={post.title}
                    language={language}
                    autoPlay={true}
                  />
                </div>
              ) : (
                <div className="bg-[#0A1612] rounded-3xl overflow-hidden border border-[#D8D0BC] shadow-xl flex items-center justify-center min-h-[320px] max-h-[75vh]">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-contain max-h-[75vh]"
                  />
                </div>
              )}

              {/* Secondary video preview card if photo is currently selected */}
              {post.videoUrl && activeMediaTab === 'photo' && (
                <button
                  type="button"
                  onClick={() => setActiveMediaTab('video')}
                  className="w-full p-3 rounded-2xl bg-white border border-[#D8D0BC] hover:border-red-500 hover:bg-red-50/40 text-left transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                      <Video className="w-4 h-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-[#0A2A21] group-hover:text-red-700">
                        {language === 'en' ? 'Watch Attached YouTube Video' : 'সংযুক্ত ইউটিউব ভিডিও দেখুন'}
                      </p>
                      <p className="text-[11px] text-[#6B756E]">
                        {language === 'en' ? 'Click to play interactive video player' : 'প্লেয়ারে ভিডিওটি চালাতে ক্লিক করুন'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-600 underline decoration-red-300">
                    {language === 'en' ? 'Play' : 'চালান'}
                  </span>
                </button>
              )}
            </div>

            {/* Details & Social Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* Post Info Box */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D8D0BC] shadow-xs space-y-4">
                {/* User Profile */}
                <div className="flex items-center space-x-3 pb-4 border-b border-[#D8D0BC]">
                  {post.userAvatar ? (
                    <img
                      src={post.userAvatar}
                      alt={post.userName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#DE9B2E]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#0F3B2E] text-white flex items-center justify-center text-base font-bold font-serif">
                      {post.userName ? post.userName.charAt(0).toUpperCase() : 'T'}
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-[#0A2A21]">{post.userName}</h4>
                    <p className="text-xs text-[#6B756E]">
                      {new Date(post.createdAt).toLocaleDateString(
                        language === 'en' ? 'en-US' : 'bn-BD',
                        { month: 'short', day: 'numeric', year: 'numeric' }
                      )}
                    </p>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A2A21] leading-tight">
                  {post.title}
                </h1>

                <div className="flex items-center space-x-2 text-xs sm:text-sm text-[#0F3B2E] font-medium">
                  <MapPin className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{post.location}</span>
                </div>

                <p className="text-sm sm:text-base text-[#3A443E] leading-relaxed">
                  {post.caption}
                </p>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {post.tags.map((tag, idx) => (
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
                  targetId={post.id}
                  targetType="post"
                  targetTitle={post.title}
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
  );
};
