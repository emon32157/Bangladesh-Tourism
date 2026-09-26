import React, { useState, useEffect } from 'react';
import { Destination, Language, AdSlotConfig } from '../types';
import {
  X,
  Bookmark,
  Star,
  MapPin,
  Calendar,
  Plane,
  CheckCircle2,
  Compass,
  Share2,
  Check,
  ArrowLeft,
  Copy,
  MessageCircle,
  Mail,
  Send,
  ExternalLink,
  Video,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Camera,
  Layers,
} from 'lucide-react';
import { copyDirectLink } from '../lib/urlSync';
import { getDestinationSlug } from '../lib/slugs';
import { VideoPlayer } from './VideoPlayer';
import { AdRenderer } from './AdRenderer';

interface DestinationModalProps {
  destination: Destination | null;
  language: Language;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onPlanTrip: (destination: Destination) => void;
  allDestinations?: Destination[];
  onSelectDestination?: (destination: Destination) => void;
  articleAdConfig?: AdSlotConfig | null;
}

export const DestinationModal: React.FC<DestinationModalProps> = ({
  destination,
  language,
  onClose,
  isSaved,
  onToggleSave,
  onPlanTrip,
  allDestinations,
  onSelectDestination,
  articleAdConfig,
}) => {
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // All photos for gallery view (cover photo first, then gallery photos)
  const allImages = destination
    ? [destination.image, ...(destination.gallery || [])].filter((url, idx, arr) => !!url && arr.indexOf(url) === idx)
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

  if (!destination) return null;

  // Find related destinations in the same division or category for internal linking & SEO
  const relatedDestinations = (() => {
    const seen = new Set<string>();
    return (allDestinations || [])
      .filter(
        (d) =>
          d &&
          d.id &&
          d.id !== destination.id &&
          !seen.has(d.id) &&
          (d.division === destination.division || d.category === destination.category) &&
          seen.add(d.id)
      )
      .slice(0, 3);
  })();

  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin && window.location.origin !== 'null'
      ? window.location.origin
      : 'https://bdtourismboard.netlify.app';
    const slug = getDestinationSlug(destination);
    return `${origin}/destination/${slug}`;
  };

  const getShareTitle = () => {
    return language === 'en'
      ? `${destination.title} | Discover Bangladesh`
      : `${destination.titleBn} | ডিসকভার বাংলাদেশ`;
  };

  const getShareText = () => {
    return language === 'en'
      ? `Explore ${destination.title} (${destination.division} Division, Bangladesh). Discover top attractions, travel tips, and seasonal guides!`
      : `বাংলাদেশের ${destination.titleBn} (${destination.division} বিভাগ) ঘুরে দেখুন! প্রধান আকর্ষণ ও ভ্রমণ গাইড জানুন।`;
  };

  const triggerToast = (msg: string) => {
    setShareToast(msg);
    setTimeout(() => setShareToast(null), 3500);
  };

  // Primary Web Share API handler
  const handleShare = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const shareUrl = getShareUrl();
    const shareTitle = getShareTitle();
    const shareText = getShareText();

    // Check if Web Share API is supported by the browser and container
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        triggerToast(language === 'en' ? 'Destination shared successfully!' : 'গন্তব্য সফলভাবে শেয়ার হয়েছে!');
        return;
      } catch (err: unknown) {
        // Ignore user cancellation (AbortError)
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.warn('Web Share failed, switching to modal fallback:', err);
      }
    }

    // Fallback: Copy link directly and open social sharing options
    const success = await copyDirectLink('destination', destination.id, destination.title);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      triggerToast(language === 'en' ? 'Link copied to clipboard!' : 'লিংক ক্লিপবোর্ডে কপি হয়েছে!');
    }
    setShowShareModal(true);
  };

  const handleDirectCopy = async () => {
    const success = await copyDirectLink('destination', destination.id, destination.title);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      triggerToast(language === 'en' ? 'Link copied to clipboard!' : 'লিংক ক্লিপবোর্ডে কপি হয়েছে!');
    }
  };

  const shareUrl = getShareUrl();
  const shareText = getShareText();

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366] text-white hover:bg-[#20ba59]',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
    },
    {
      name: 'Facebook',
      icon: Send,
      color: 'bg-[#1877F2] text-white hover:bg-[#166fe5]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'X (Twitter)',
      icon: Share2,
      color: 'bg-black text-white hover:bg-neutral-800',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-[#229ED9] text-white hover:bg-[#1f8ec3]',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-[#0F3B2E] text-white hover:bg-[#0A2A21]',
      url: `mailto:?subject=${encodeURIComponent(getShareTitle())}&body=${encodeURIComponent(`${shareText}\n\nExplore here: ${shareUrl}`)}`,
    },
  ];

  return (
    <div
      id="destination-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#FAF8F3] overflow-y-auto flex flex-col animate-in fade-in duration-200"
    >
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-60 bg-[#0F3B2E] text-[#DE9B2E] border border-[#DE9B2E]/50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF8F3]/95 backdrop-blur-md border-b border-[#D8D0BC] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] font-semibold text-xs sm:text-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0F3B2E]" />
          <span>{language === 'en' ? 'Back to Destinations' : 'গন্তব্যের তালিকায় ফিরুন'}</span>
        </button>

        {/* Center Title Badge */}
        <div className="hidden md:flex items-center gap-2">
          <span className="bg-[#DE9B2E] text-[#0A2A21] text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
            {language === 'en' ? destination.tag : destination.tagBn}
          </span>
          <span className="font-serif font-bold text-sm text-[#0A2A21] truncate max-w-xs">
            {language === 'en' ? destination.title : destination.titleBn}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Share Button (Web Share API + Social Fallback) */}
          <button
            id="modal-share-btn"
            onClick={handleShare}
            title={language === 'en' ? 'Share this destination' : 'এই গন্তব্য শেয়ার করুন'}
            className="px-3.5 py-2 bg-white rounded-full border border-[#D8D0BC] hover:border-[#DE9B2E] hover:bg-[#EFEADC] text-[#0A2A21] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">{language === 'en' ? 'Copied!' : 'কপি হয়েছে!'}</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#DE9B2E]" />
                <span className="font-bold">{language === 'en' ? 'Share' : 'শেয়ার'}</span>
              </>
            )}
          </button>

          <button
            id="modal-bookmark-btn"
            onClick={(e) => onToggleSave(destination.id, e)}
            className={`p-2 sm:px-3.5 sm:py-2 rounded-full border transition-all shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              isSaved
                ? 'bg-[#8C3B2E] text-white border-[#8C3B2E]'
                : 'bg-white text-[#0A2A21] border-[#D8D0BC] hover:bg-[#EFEADC]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">
              {isSaved
                ? language === 'en'
                  ? 'Saved'
                  : 'সংরক্ষিত'
                : language === 'en'
                ? 'Save'
                : 'সংরক্ষণ'}
            </span>
          </button>

          <button
            id="modal-close-btn"
            onClick={onClose}
            className="p-2 bg-white rounded-full border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Full-Screen Body */}
      <main className="flex-1 w-full">
        {/* Full-width Immersive Hero Banner */}
        <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[56vh] min-h-[280px] max-h-[560px]">
          <img
            src={destination.image}
            alt={
              language === 'en'
                ? `${destination.title} - Tourist attraction in ${destination.district}, ${destination.division}, Bangladesh`
                : `${destination.titleBn || destination.title} - দর্শনীয় স্থান, ${destination.districtBn || destination.district}, বাংলাদেশ`
            }
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A2A21] via-[#0A2A21]/40 to-transparent"></div>

          {/* Title & Stats overlay */}
          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10 md:p-12 text-white">
            <div className="max-w-5xl mx-auto w-full">
              <span className="bg-[#DE9B2E] text-[#0A2A21] text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider mb-3 inline-block shadow-sm">
                {language === 'en' ? destination.tag : destination.tagBn}
              </span>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-serif leading-tight">
                {language === 'en' ? destination.title : destination.titleBn}
              </h1>
              <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm sm:text-base text-[#EDE8D6]">
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 text-[#DE9B2E]" />
                    {destination.division}
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-[#DE9B2E]">
                    <Star className="w-4 h-4 fill-current" />
                    {destination.rating} ({destination.reviewsCount} reviews)
                  </span>
                </div>

                {destination.gallery && destination.gallery.length > 0 && (
                  <button
                    onClick={() => setLightboxIndex(0)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/30 text-white text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-105"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#DE9B2E]" />
                    <span>
                      {language === 'en'
                        ? `View Gallery (${allImages.length})`
                        : `ছবি দেখুন (${allImages.length})`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-12 space-y-10">
          {/* Photo Gallery Row (Horizontal scroll / Grid preview with Lightbox) */}
          {destination.gallery && destination.gallery.length > 0 && (
            <div id="destination-gallery-section" className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-serif text-[#0A2A21] flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#DE9B2E]" />
                  <span>{language === 'en' ? 'Photo Gallery' : 'ফটোগ্রাফি ও অ্যালবাম'}</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFEADC] text-[#0F3B2E]">
                    {allImages.length} {language === 'en' ? 'Photos' : 'টি ছবি'}
                  </span>
                </h2>
                <span className="text-xs text-[#6B756E] font-medium hidden sm:inline">
                  {language === 'en' ? 'Click any photo to enlarge in full view' : 'বড় করে দেখতে ছবিতে ক্লিক করুন'}
                </span>
              </div>

              {/* Responsive Thumbnails Track */}
              <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar sm:grid sm:grid-cols-4 md:grid-cols-5 sm:overflow-visible">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className="group relative shrink-0 w-44 sm:w-auto aspect-4/3 rounded-2xl overflow-hidden border border-[#D8D0BC] bg-[#EFEADC] hover:border-[#DE9B2E] transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F3B2E]"
                  >
                    <img
                      src={imgUrl}
                      alt={`${destination.title} photo ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5 text-white">
                      <span className="text-[10px] font-bold bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded">
                        {idx === 0 ? (language === 'en' ? 'Cover' : 'মূল ছবি') : `#${idx + 1}`}
                      </span>
                      <Maximize2 className="w-4 h-4 text-[#DE9B2E]" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Key Logistics Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-white rounded-3xl border border-[#D8D0BC] shadow-xs">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-[#DE9B2E]/15 text-[#B87E20] shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#4B554E] uppercase tracking-wider">
                  {language === 'en' ? 'Optimal Travel Season' : 'উপযুক্ত ভ্রমণ সময়'}
                </p>
                <p className="text-sm sm:text-base font-bold text-[#0A2A21] mt-1">
                  {language === 'en' ? destination.bestSeason : destination.bestSeasonBn}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-[#0F3B2E]/10 text-[#0F3B2E] shrink-0">
                <Plane className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#4B554E] uppercase tracking-wider">
                  {language === 'en' ? 'Nearest Transport Hub' : 'নিকটবর্তী বিমানবন্দর / হাব'}
                </p>
                <p className="text-sm sm:text-base font-bold text-[#0A2A21] mt-1">
                  {destination.nearestAirport}
                </p>
              </div>
            </div>
          </div>

          {/* Destination Description */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#D8D0BC] shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#D8D0BC]/60 pb-3.5">
              <h2 className="text-lg font-bold font-serif text-[#0A2A21] flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#DE9B2E]" />
                <span>{language === 'en' ? 'About this Destination' : 'গন্তব্য পরিচিতি ও ইতিহাস'}</span>
              </h2>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF8F3] hover:bg-[#EFEADC] border border-[#D8D0BC] text-xs font-bold text-[#0F3B2E] transition-all cursor-pointer shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5 text-[#DE9B2E]" />
                <span>{language === 'en' ? 'Share Destination' : 'গন্তব্য শেয়ার করুন'}</span>
              </button>
            </div>

            <p className="text-[#3A443E] text-base sm:text-lg leading-relaxed font-normal">
              {language === 'en' ? destination.description : destination.descriptionBn}
            </p>
          </div>

          {/* Dynamic Article / Post Ad Placement (Slot 5) */}
          {articleAdConfig && (
            <div className="my-4">
              <AdRenderer
                slotConfig={articleAdConfig}
                slotId="article"
                language={language}
              />
            </div>
          )}

          {/* YouTube Video Tour / Documentary Player */}
          {destination.videoUrl && (
            <div id="destination-video-tour" className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-bold font-serif text-[#0A2A21] flex items-center gap-2">
                  <Video className="w-5 h-5 text-red-600" />
                  <span>{language === 'en' ? 'Video Tour & Documentary' : 'ভিডিও ভ্রমণ ও প্রামাণ্যচিত্র'}</span>
                </h2>
                <span className="text-xs text-[#6B756E] font-medium bg-[#EFEADC] px-2.5 py-1 rounded-full">
                  {language === 'en' ? 'YouTube HD Player' : 'ইউটিউব এইচডি প্লেয়ার'}
                </span>
              </div>
              <VideoPlayer
                videoUrlOrEmbed={destination.videoUrl}
                title={language === 'en' ? `${destination.title} - Video Tour` : `${destination.titleBn || destination.title} - ভিডিও ভ্রমণ`}
                language={language}
              />
            </div>
          )}

          {/* Highlights Grid */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold font-serif text-[#0A2A21] flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#0F3B2E]" />
              <span>{language === 'en' ? 'Key Highlights & Excursions' : 'প্রধান আকর্ষণ ও দর্শনীয় বিষয়সমূহ'}</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(destination.highlights || []).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-white border border-[#D8D0BC] text-sm sm:text-base text-[#1B211D] shadow-xs"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#0F3B2E] shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related / Nearby Regional Attractions for Internal Linking & SEO */}
          {relatedDestinations.length > 0 && (
            <div id="related-destinations-section" className="space-y-4 pt-4 border-t border-[#D8D0BC]">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-[#0A2A21]">
                  {language === 'en'
                    ? `More Attractions in ${destination.division} & Nearby`
                    : `${destination.division} বিভাগ ও আশেপাশের দর্শনীয় স্থান`}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B756E] mt-0.5">
                  {language === 'en'
                    ? 'Explore complementary travel destinations, beaches, and heritage spots nearby.'
                    : 'আশেপাশের আরও চমৎকার দর্শনীয় স্থান ও আকর্ষণ ঘুরে দেখুন।'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedDestinations.map((rel) => (
                  <a
                    key={rel.id}
                    href={`/?destination=${rel.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (onSelectDestination) {
                        onSelectDestination(rel);
                      }
                    }}
                    className="group bg-white rounded-2xl border border-[#D8D0BC] overflow-hidden shadow-xs hover:shadow-md hover:border-[#DE9B2E] transition-all flex flex-col cursor-pointer"
                  >
                    <div className="relative h-32 overflow-hidden bg-neutral-100">
                      <img
                        src={rel.image}
                        alt={
                          language === 'en'
                            ? `${rel.title} - Tourist attraction in ${rel.district}, Bangladesh`
                            : `${rel.titleBn || rel.title} - দর্শনীয় স্থান, বাংলাদেশ`
                        }
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                        {rel.district}
                      </span>
                    </div>
                    <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#0A2A21] group-hover:text-[#8C3B2E] transition-colors line-clamp-1">
                          {language === 'en' ? rel.title : (rel.titleBn || rel.title)}
                        </h4>
                        <p className="text-[11px] text-[#6B756E] line-clamp-2 mt-1">
                          {language === 'en' ? rel.summary : (rel.summaryBn || rel.summary)}
                        </p>
                      </div>
                      <div className="text-[11px] font-bold text-[#0F3B2E] group-hover:text-[#DE9B2E] transition-colors flex items-center gap-1">
                        <span>{language === 'en' ? 'View Guide' : 'বিস্তারিত দেখুন'}</span>
                        <span>→</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Social Share Callout Box */}
          <div className="p-6 bg-gradient-to-br from-[#0F3B2E] to-[#0A2A21] rounded-3xl text-white border border-[#DE9B2E]/40 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[#DE9B2E] text-xs font-bold uppercase tracking-wider block mb-1">
                  {language === 'en' ? 'Spread the Beauty of Bangladesh' : 'বাংলাদেশকে বিশ্বজুড়ে ছড়িয়ে দিন'}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif">
                  {language === 'en' ? 'Share this destination with friends & family' : 'বন্ধু ও পরিবারে এই চমৎকার গন্তব্য শেয়ার করুন'}
                </h3>
              </div>
              <button
                onClick={handleShare}
                className="self-start sm:self-center px-5 py-2.5 rounded-full bg-[#DE9B2E] hover:bg-[#E5AA45] text-[#0A2A21] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Share2 className="w-4 h-4 text-[#0A2A21]" />
                <span>{language === 'en' ? 'Share Now' : 'এখনই শেয়ার করুন'}</span>
              </button>
            </div>

            {/* Quick Social Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/15">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-2xs ${item.color}`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </a>
              ))}
              <button
                onClick={handleDirectCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (language === 'en' ? 'Copied' : 'কপি হয়েছে') : (language === 'en' ? 'Copy Link' : 'লিংক কপি')}</span>
              </button>
            </div>
          </div>

          {/* Action Footer Ribbon */}
          <div className="pt-8 border-t border-[#D8D0BC] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => onPlanTrip(destination)}
                className="px-8 py-4 bg-[#0F3B2E] text-white rounded-full font-bold text-sm uppercase tracking-wider hover:bg-[#0A2A21] transition-all flex items-center gap-2.5 shadow-lg hover:shadow-xl cursor-pointer"
              >
                <Compass className="w-5 h-5 text-[#DE9B2E]" />
                <span>{language === 'en' ? 'Add to Trip Itinerary' : 'ভ্রমণ পরিকল্পনা তালিকায় যুক্ত করুন'}</span>
              </button>

              <button
                onClick={handleShare}
                className="px-6 py-4 bg-white border border-[#D8D0BC] text-[#0A2A21] hover:border-[#DE9B2E] hover:bg-[#EFEADC] rounded-full font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Share2 className="w-4 h-4 text-[#DE9B2E]" />
                <span>{language === 'en' ? 'Share Destination' : 'শেয়ার করুন'}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-7 py-4 border border-[#D8D0BC] bg-white text-[#4B554E] hover:text-[#0A2A21] rounded-full font-bold text-sm uppercase tracking-wider hover:bg-[#EFEADC] transition-all cursor-pointer shadow-xs"
            >
              {language === 'en' ? 'Back to Explorer' : 'বন্ধ করুন'}
            </button>
          </div>
        </div>
      </main>

      {/* Social Share Modal Popup (when triggered directly or fallback) */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#D8D0BC] shadow-2xl space-y-6 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D8D0BC] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#0F3B2E]/10 rounded-xl text-[#0F3B2E]">
                  <Share2 className="w-5 h-5 text-[#DE9B2E]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#0A2A21]">
                    {language === 'en' ? 'Share Destination' : 'গন্তব্য শেয়ার করুন'}
                  </h3>
                  <p className="text-xs text-[#6B756E] truncate max-w-[240px]">
                    {language === 'en' ? destination.title : destination.titleBn}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-full hover:bg-[#EFEADC] text-[#4B554E] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Link Copy Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4B554E] uppercase tracking-wider">
                {language === 'en' ? 'Direct Destination Link' : 'সরাসরি গন্তব্য লিংক'}
              </label>
              <div className="flex items-center gap-2 p-2 bg-[#FAF8F3] rounded-2xl border border-[#D8D0BC]">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-xs font-mono text-[#0A2A21] px-2 outline-none select-all truncate"
                />
                <button
                  onClick={handleDirectCopy}
                  className="px-4 py-2 bg-[#0F3B2E] text-white rounded-xl text-xs font-bold hover:bg-[#0A2A21] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{language === 'en' ? 'Copied' : 'কপি হয়েছে'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Copy' : 'কপি করুন'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Apps Grid */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-[#4B554E] uppercase tracking-wider">
                {language === 'en' ? 'Share via Social Apps' : 'সোশ্যাল অ্যাপে শেয়ার করুন'}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {socialLinks.map((item) => (
                  <a
                    key={item.name}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-bold transition-all shadow-xs ${item.color}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                  </a>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2.5 rounded-xl border border-[#D8D0BC] text-xs font-bold text-[#6B756E] hover:bg-[#FAF8F3] transition-colors"
            >
              {language === 'en' ? 'Close' : 'বন্ধ করুন'}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {lightboxIndex !== null && allImages[lightboxIndex] && (
        <div
          id="destination-lightbox"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar */}
          <div
            className="flex items-center justify-between text-white max-w-6xl w-full mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold bg-[#DE9B2E] text-[#0A2A21] px-3 py-1 rounded-full uppercase tracking-wider">
                {language === 'en' ? 'Photo Gallery' : 'গ্যালারি'}
              </span>
              <span className="text-xs sm:text-sm text-neutral-300 font-medium">
                {language === 'en'
                  ? `${destination.title} • Photo ${lightboxIndex + 1} of ${allImages.length}`
                  : `${destination.titleBn || destination.title} • ছবি ${lightboxIndex + 1} / ${allImages.length}`}
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
            className="relative flex-1 flex items-center justify-center max-w-6xl w-full mx-auto my-4 overflow-hidden"
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
              alt={`${destination.title} gallery photo ${lightboxIndex + 1}`}
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

