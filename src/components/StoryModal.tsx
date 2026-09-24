import React, { useState, useEffect } from 'react';
import { EditorialStory, Language, AppUser } from '../types';
import {
  X,
  Clock,
  BookOpen,
  Share2,
  Check,
  ArrowLeft,
  Video,
  Film,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Layers,
  Camera,
} from 'lucide-react';
import { SocialInteractionBox } from './SocialInteractionBox';
import { VideoPlayer } from './VideoPlayer';
import { copyDirectLink } from '../lib/urlSync';

interface StoryModalProps {
  story: EditorialStory | null;
  language: Language;
  onClose: () => void;
  currentUser: AppUser | null;
  onOpenAuth: () => void;
  isSaved?: boolean;
  onToggleSave?: (id: string, e?: React.MouseEvent) => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({
  story,
  language,
  onClose,
  currentUser,
  onOpenAuth,
  isSaved = false,
  onToggleSave,
}) => {
  const [copied, setCopied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const allImages = story
    ? [story.image, ...(story.gallery || [])].filter((url, idx, arr) => !!url && arr.indexOf(url) === idx)
    : [];

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight' && allImages.length > 1) {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % allImages.length : null));
      }
      if (e.key === 'ArrowLeft' && allImages.length > 1) {
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + allImages.length) % allImages.length : null));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, allImages.length]);

  if (!story) return null;

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (onToggleSave) {
      onToggleSave(story.id, e);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyDirectLink('story', story.id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      id="story-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#FAF8F3] overflow-y-auto flex flex-col animate-in fade-in duration-200"
    >
      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF8F3]/95 backdrop-blur-md border-b border-[#D8D0BC] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] font-semibold text-xs sm:text-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0F3B2E]" />
          <span>{language === 'en' ? 'Back to Stories' : 'স্টোরি তালিকায় ফিরুন'}</span>
        </button>

        {/* Center Tag / Title */}
        <div className="hidden md:flex items-center gap-2.5">
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-[#0F3B2E] text-white rounded-full">
            {story.category}
          </span>
          <span className="font-serif font-bold text-sm text-[#0A2A21] truncate max-w-sm">
            {language === 'en' ? story.title : story.titleBn}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleCopyLink}
            title={language === 'en' ? 'Copy Story URL' : 'স্টোরির লিংক কপি করুন'}
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
                <span className="hidden sm:inline">{language === 'en' ? 'Share Story URL' : 'শেয়ার লিংক'}</span>
              </>
            )}
          </button>

          {/* Bookmark / Wishlist Button */}
          <button
            id="story-modal-bookmark-btn"
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

      {/* Main Full-Screen Article Body */}
      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-8">
          {/* Article Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest px-3.5 py-1 bg-[#0F3B2E] text-white rounded-full">
                {story.category}
              </span>
              <span className="text-xs text-[#6B756E] font-medium">{story.date}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-serif text-[#0A2A21] leading-tight tracking-tight">
              {language === 'en' ? story.title : story.titleBn}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-[#4B554E] font-medium pt-2 border-b border-[#D8D0BC] pb-4">
              <span className="font-semibold text-[#0A2A21]">By {story.author}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#DE9B2E]" />
                {story.readTime}
              </span>
            </div>
          </div>

          {/* Hero Image in Article */}
          <div className="relative rounded-3xl overflow-hidden border border-[#D8D0BC] shadow-md max-h-[500px] group">
            <img
              src={story.image}
              alt={
                language === 'en'
                  ? `${story.title} - Article illustration, Bangladesh Tourism`
                  : `${story.titleBn || story.title} - নিবন্ধের চিত্র, বাংলাদেশ পর্যটন`
              }
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover max-h-[500px]"
              referrerPolicy="no-referrer"
            />
            {story.gallery && story.gallery.length > 0 && (
              <button
                onClick={() => setLightboxIndex(0)}
                className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/30 text-white text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-105"
              >
                <Camera className="w-3.5 h-3.5 text-[#DE9B2E]" />
                <span>
                  {language === 'en'
                    ? `View Photos (${allImages.length})`
                    : `ছবি দেখুন (${allImages.length})`}
                </span>
              </button>
            )}
          </div>

          {/* Photo Gallery Row (Horizontal scroll / Grid preview with Lightbox) */}
          {story.gallery && story.gallery.length > 0 && (
            <div id="story-gallery-section" className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-base sm:text-lg font-bold font-serif text-[#0A2A21] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Story Photo Gallery' : 'গল্পের ফটো অ্যালবাম'}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EFEADC] text-[#0F3B2E]">
                    {allImages.length} {language === 'en' ? 'Photos' : 'টি ছবি'}
                  </span>
                </h2>
                <span className="text-xs text-[#6B756E] font-medium hidden sm:inline">
                  {language === 'en' ? 'Click any photo to view full size' : 'বড় করে দেখতে ছবিতে ক্লিক করুন'}
                </span>
              </div>

              {/* Responsive Thumbnails Track */}
              <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar sm:grid sm:grid-cols-4 md:grid-cols-5 sm:overflow-visible">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative shrink-0 w-36 sm:w-auto aspect-4/3 rounded-2xl overflow-hidden border border-[#D8D0BC] bg-[#EFEADC] hover:border-[#DE9B2E] transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F3B2E]"
                  >
                    <img
                      src={imgUrl}
                      alt={`${story.title} photo ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2 text-white">
                      <span className="text-[10px] font-bold bg-black/50 backdrop-blur-xs px-1.5 py-0.5 rounded">
                        {idx === 0 ? (language === 'en' ? 'Cover' : 'মূল ছবি') : `#${idx + 1}`}
                      </span>
                      <Maximize2 className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pull Quote */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border-l-4 border-[#DE9B2E] border-y border-r border-[#D8D0BC] shadow-xs">
            <p className="font-serif italic text-xl sm:text-2xl text-[#0A2A21] leading-relaxed">
              "{story.pullQuote}"
            </p>
          </div>

          {/* Related Video Documentary & Tour */}
          {story.videoUrl && (
            <div id="story-video-player-container" className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-bold font-serif text-[#0A2A21] flex items-center gap-2">
                  <Video className="w-5 h-5 text-red-600" />
                  <span>{language === 'en' ? 'Related Video Documentary' : 'সম্পর্কিত ভিডিও ও প্রামাণ্যচিত্র'}</span>
                </h2>
                <span className="text-xs text-[#6B756E] font-medium bg-[#EFEADC] px-2.5 py-1 rounded-full">
                  {language === 'en' ? 'YouTube HD Player' : 'ইউটিউব এইচডি প্লেয়ার'}
                </span>
              </div>
              <VideoPlayer
                videoUrlOrEmbed={story.videoUrl}
                title={language === 'en' ? `${story.title} - Video Story` : `${story.titleBn || story.title} - ভিডিও কাহিনী`}
                language={language}
              />
            </div>
          )}

          {/* Paragraphs */}
          <div className="space-y-6 text-lg text-[#1B211D] leading-relaxed font-normal bg-white p-6 sm:p-10 rounded-3xl border border-[#D8D0BC] shadow-xs">
            {story.content.map((para, idx) => (
              <p key={idx} className="leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* Reactions & Comments System (Auth required for actions) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#D8D0BC] shadow-xs">
            <SocialInteractionBox
              targetId={story.id}
              targetType="story"
              targetTitle={story.title}
              language={language}
              currentUser={currentUser}
              onRequireAuth={onOpenAuth}
              accentTheme="emerald"
            />
          </div>

          {/* Footer of modal */}
          <div className="pt-6 border-t border-[#D8D0BC] flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-8 py-3.5 bg-[#0F3B2E] text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-[#0A2A21] transition-all cursor-pointer shadow-md"
            >
              {language === 'en' ? 'Back to Stories' : 'ফিরে যান'}
            </button>
          </div>
        </div>
      </main>

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {lightboxIndex !== null && allImages[lightboxIndex] && (
        <div
          id="story-lightbox"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between text-white max-w-5xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold bg-[#DE9B2E] text-[#0A2A21] px-3 py-1 rounded-full uppercase tracking-wider">
                {language === 'en' ? 'Photo Gallery' : 'গ্যালারি'}
              </span>
              <span className="text-xs sm:text-sm text-neutral-300 font-medium">
                {language === 'en'
                  ? `${story.title} • Photo ${lightboxIndex + 1} of ${allImages.length}`
                  : `${story.titleBn || story.title} • ছবি ${lightboxIndex + 1} / ${allImages.length}`}
              </span>
            </div>

            <button
              onClick={() => setLightboxIndex(null)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={language === 'en' ? 'Close (Esc)' : 'বন্ধ করুন (Esc)'}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Central Image with Prev / Next Buttons */}
          <div
            className="relative flex-1 flex items-center justify-center max-w-5xl w-full mx-auto my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {allImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev !== null ? (prev - 1 + allImages.length) % allImages.length : null));
                }}
                className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer shadow-lg"
                title={language === 'en' ? 'Previous Photo (Left Arrow)' : 'পূর্ববর্তী ছবি'}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <img
              key={lightboxIndex}
              src={allImages[lightboxIndex]}
              alt={`${story.title} gallery photo ${lightboxIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
              referrerPolicy="no-referrer"
            />

            {allImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev !== null ? (prev + 1) % allImages.length : null));
                }}
                className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all cursor-pointer shadow-lg"
                title={language === 'en' ? 'Next Photo (Right Arrow)' : 'পরবর্তী ছবি'}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip for Fast Scrubbing */}
          {allImages.length > 1 && (
            <div
              className="flex justify-center items-center gap-2 overflow-x-auto py-2 max-w-3xl mx-auto w-full no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {allImages.map((thumbUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    lightboxIndex === idx ? 'border-[#DE9B2E] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={thumbUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
