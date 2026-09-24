import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  Heart,
  MessageSquare,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Flame,
  BookOpen,
  Pause,
  Play,
  Compass,
  Video,
} from 'lucide-react';
import { Destination, EditorialStory, Language } from '../types';

interface RecentShowcaseSliderProps {
  destinations: Destination[];
  stories: EditorialStory[];
  language: Language;
  onSelectDestination: (destination: Destination) => void;
  onSelectStory: (story: EditorialStory) => void;
  savedIds?: string[];
  onToggleSave?: (id: string) => void;
}

type SlideItem =
  | {
      id: string;
      type: 'post';
      item: Destination;
    }
  | {
      id: string;
      type: 'story';
      item: EditorialStory;
    };

export const RecentShowcaseSlider: React.FC<RecentShowcaseSliderProps> = ({
  destinations,
  stories,
  language,
  onSelectDestination,
  onSelectStory,
  savedIds = [],
  onToggleSave,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'posts' | 'stories'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pick top 4 recent destinations (posts) and top 4 recent editorial stories
  const recentPosts = (destinations || []).slice(0, 4);
  const recentStories = (stories || []).slice(0, 4);

  // Construct items list based on filter
  const allItems: SlideItem[] = [
    ...recentPosts.map((p) => ({ id: `post-${p.id}`, type: 'post' as const, item: p })),
    ...recentStories.map((s) => ({ id: `story-${s.id}`, type: 'story' as const, item: s })),
  ];

  const filteredItems: SlideItem[] =
    activeFilter === 'posts'
      ? recentPosts.map((p) => ({ id: `post-${p.id}`, type: 'post' as const, item: p }))
      : activeFilter === 'stories'
      ? recentStories.map((s) => ({ id: `story-${s.id}`, type: 'story' as const, item: s }))
      : allItems;

  // Responsive cards per view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, filteredItems.length - cardsPerView);

  // Reset index if out of bounds on filter change
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeFilter]);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying || isHovered || filteredItems.length <= cardsPerView) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4500);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovered, maxIndex, filteredItems.length, cardsPerView]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  return (
    <section
      id="recent-showcase-slider"
      className="w-full px-4 md:px-8 lg:px-12 py-12 md:py-16 bg-gradient-to-b from-[#F6F3EA] via-white to-[#F6F3EA] border-t border-[#D8D0BC] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#0F3B2E]/10 text-[#0F3B2E] rounded-full text-xs font-bold uppercase tracking-wider border border-[#0F3B2E]/15">
              <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E]" />
              <span>
                {language === 'en'
                  ? 'Recent Highlights & Stories'
                  : 'সাম্প্রতিক পোস্ট ও আখ্যান'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-[#0A2A21] tracking-tight">
              {language === 'en'
                ? 'Discover 4 Recent Posts & 4 Recent Stories'
                : 'সর্বশেষ ৪টি আকর্ষণীয় পোস্ট ও ৪টি বিশেষ আখ্যান'}
            </h2>

            <p className="text-[#4B554E] text-xs sm:text-sm max-w-2xl leading-relaxed">
              {language === 'en'
                ? 'Slide through recently published heritage destinations, traveler discoveries, and cultural stories across Bangladesh.'
                : 'বাংলাদেশের ঐতিহ্যবাহী দর্শনীয় স্থান ও সাংস্কৃতিক জীবনগাথার সর্বশেষ প্রকাশিত পোস্ট ও ভ্রমণ আখ্যানগুলোর মধ্য দিয়ে সহজে স্ক্রল বা স্লাইড করুন।'}
            </p>
          </div>

          {/* Filter Tabs & Slide Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Toggle */}
            <div className="flex items-center p-1 bg-[#EFEADC] rounded-2xl border border-[#D8D0BC]">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:text-[#0A2A21]'
                }`}
              >
                {language === 'en' ? 'All (8)' : 'সব (৮টি)'}
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('posts')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'posts'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:text-[#0A2A21]'
                }`}
              >
                <Compass className="w-3 h-3 text-[#DE9B2E]" />
                <span>{language === 'en' ? '4 Posts' : '৪টি পোস্ট'}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('stories')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'stories'
                    ? 'bg-[#0F3B2E] text-white shadow-xs'
                    : 'text-[#4B554E] hover:text-[#0A2A21]'
                }`}
              >
                <BookOpen className="w-3 h-3 text-[#DE9B2E]" />
                <span>{language === 'en' ? '4 Stories' : '৪টি আখ্যান'}</span>
              </button>
            </div>

            {/* Slider Navigation Arrows & Play/Pause */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                title={isAutoPlaying ? 'Pause Auto-slide' : 'Resume Auto-slide'}
                className="w-9 h-9 rounded-xl border border-[#D8D0BC] bg-white hover:bg-[#EFEADC] text-[#4B554E] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              >
                {isAutoPlaying ? (
                  <Pause className="w-3.5 h-3.5 text-[#0F3B2E]" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-[#DE9B2E]" />
                )}
              </button>

              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Slide"
                className="w-9 h-9 rounded-xl border border-[#D8D0BC] bg-white hover:bg-[#0F3B2E] hover:text-white text-[#0A2A21] flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Slide"
                className="w-9 h-9 rounded-xl border border-[#D8D0BC] bg-white hover:bg-[#0F3B2E] hover:text-white text-[#0A2A21] flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
              >
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Slider Window */}
        <div ref={containerRef} className="relative overflow-hidden pt-1 pb-2">
          <motion.div
            className="flex gap-6 transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(-${currentIndex * (100 / cardsPerView + (cardsPerView > 1 ? (cardsPerView === 2 ? 1.5 : 2) : 0))}%)`,
            }}
          >
            {filteredItems.map((slide) => {
              if (slide.type === 'post') {
                const dest = slide.item;
                const isSaved = savedIds.includes(dest.id);
                const title = language === 'bn' ? dest.titleBn || dest.title : dest.title;
                const summary = language === 'bn' ? dest.summaryBn || dest.summary : dest.summary;
                const locationText =
                  language === 'bn'
                    ? `${dest.districtBn || dest.district || ''}, ${dest.division}`
                    : `${dest.district || ''}, ${dest.division}`;

                return (
                  <div
                    key={slide.id}
                    className="shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                  >
                    <motion.article
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="h-full bg-white rounded-3xl border border-[#D8D0BC] overflow-hidden shadow-xs hover:shadow-xl hover:border-[#DE9B2E] transition-all flex flex-col justify-between group cursor-pointer"
                      onClick={() => onSelectDestination(dest)}
                    >
                      <div>
                        {/* Image Container */}
                        <div className="relative h-52 sm:h-56 overflow-hidden bg-neutral-100">
                          <img
                            src={dest.image || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=600&q=80'}
                            alt={
                              language === 'en'
                                ? `${dest.title} - Tourist attraction in ${dest.district}, Bangladesh`
                                : `${dest.titleBn || dest.title} - দর্শনীয় স্থান, বাংলাদেশ`
                            }
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                          {/* Post Type Badge */}
                          <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full bg-[#0F3B2E]/90 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs border border-white/20">
                              <Compass className="w-3 h-3 text-[#DE9B2E]" />
                              <span>{language === 'en' ? 'Recent Post' : 'সাম্প্রতিক পোস্ট'}</span>
                            </span>
                            {dest.videoUrl && (
                              <span className="px-2 py-0.5 rounded-full bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                                <Video className="w-2.5 h-2.5" />
                                <span>Video</span>
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-xs text-[#F6F3EA] text-[10px] font-bold">
                              {dest.tag}
                            </span>
                          </div>

                          {/* Save Bookmark Button */}
                          {onToggleSave && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleSave(dest.id);
                              }}
                              className={`absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer ${
                                isSaved
                                  ? 'bg-[#DE9B2E] text-[#0A2A21] shadow-md'
                                  : 'bg-black/40 text-white hover:bg-black/60'
                              }`}
                            >
                              {isSaved ? (
                                <BookmarkCheck className="w-4 h-4 fill-current" />
                              ) : (
                                <Bookmark className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Rating & Location on bottom of image */}
                          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs">
                            <div className="flex items-center gap-1 text-[#F6F3EA] drop-shadow-xs">
                              <MapPin className="w-3.5 h-3.5 text-[#DE9B2E] shrink-0" />
                              <span className="truncate max-w-[180px] font-medium text-[11px]">{locationText}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full text-[11px] font-bold text-[#DE9B2E]">
                              <span>★</span>
                              <span>{dest.rating || 4.9}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="p-5 space-y-2.5">
                          <h3 className="text-base sm:text-lg font-bold font-serif text-[#0A2A21] group-hover:text-[#0F3B2E] transition-colors line-clamp-1">
                            {title}
                          </h3>
                          <p className="text-xs text-[#4B554E] line-clamp-2 leading-relaxed">
                            {summary}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-[#EFEADC] text-xs font-bold text-[#0F3B2E]">
                        <span className="text-[11px] text-[#6B756E] font-medium">
                          {dest.bestSeason ? (language === 'en' ? `Season: ${dest.bestSeason}` : `মৌসুম: ${dest.bestSeasonBn || dest.bestSeason}`) : 'All Year'}
                        </span>
                        <span className="flex items-center gap-1 text-[#DE9B2E] group-hover:translate-x-1 transition-transform">
                          <span>{language === 'en' ? 'Explore' : 'বিস্তারিত'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </motion.article>
                  </div>
                );
              } else {
                // Story Card
                const story = slide.item;
                const title = language === 'bn' ? story.titleBn || story.title : story.title;
                const excerpt = language === 'bn' ? story.excerptBn || story.excerpt : story.excerpt;

                return (
                  <div
                    key={slide.id}
                    className="shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                  >
                    <motion.article
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="h-full bg-white rounded-3xl border border-[#D8D0BC] overflow-hidden shadow-xs hover:shadow-xl hover:border-[#DE9B2E] transition-all flex flex-col justify-between group cursor-pointer"
                      onClick={() => onSelectStory && onSelectStory(story)}
                    >
                      <div>
                        {/* Cover Image */}
                        <div className="relative h-52 sm:h-56 overflow-hidden bg-neutral-100">
                          <img
                            src={story.image || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80'}
                            alt={
                              language === 'en'
                                ? `${story.title} - Bangladesh Travel Story`
                                : `${story.titleBn || story.title} - বাংলাদেশ ভ্রমণ আখ্যান`
                            }
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                          {/* Story Type Badge */}
                          <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full bg-[#DE9B2E] text-[#0A2A21] text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                              <BookOpen className="w-3 h-3 text-[#0A2A21]" />
                              <span>{language === 'en' ? 'Recent Story' : 'সাম্প্রতিক আখ্যান'}</span>
                            </span>
                            {story.videoUrl && (
                              <span className="px-2 py-0.5 rounded-full bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                                <Video className="w-2.5 h-2.5" />
                                <span>Video</span>
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-xs text-[#F6F3EA] text-[10px] font-bold">
                              {story.category}
                            </span>
                          </div>

                          {/* Social Badge */}
                          <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-white text-[11px] font-medium">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                              <span>{story.likesCount || 42}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-[#DE9B2E]" />
                              <span>{story.commentsCount || 6}</span>
                            </span>
                          </div>

                          {/* Author & Read Time overlay */}
                          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs">
                            <span className="text-[11px] text-[#F6F3EA] font-medium truncate max-w-[180px]">
                              {story.author}
                            </span>
                            <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full text-[11px] text-[#D8D0BC]">
                              <Clock className="w-3 h-3 text-[#DE9B2E]" />
                              <span>{story.readTime}</span>
                            </div>
                          </div>
                        </div>

                        {/* Story Content */}
                        <div className="p-5 space-y-2.5">
                          <h3 className="text-base sm:text-lg font-bold font-serif text-[#0A2A21] group-hover:text-[#0F3B2E] transition-colors line-clamp-1">
                            {title}
                          </h3>
                          <p className="text-xs text-[#4B554E] line-clamp-2 leading-relaxed">
                            {excerpt}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-[#EFEADC] text-xs font-bold text-[#0F3B2E]">
                        <span className="text-[11px] text-[#6B756E]">
                          {story.date || 'Editorial Edition'}
                        </span>
                        <span className="flex items-center gap-1 text-[#0F3B2E] group-hover:translate-x-1 transition-transform">
                          <span>{language === 'en' ? 'Read Story' : 'আখ্যান পড়ুন'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#DE9B2E]" />
                        </span>
                      </div>
                    </motion.article>
                  </div>
                );
              }
            })}
          </motion.div>
        </div>

        {/* Bottom Indicator Dots & Quick Counter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#D8D0BC]/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#4B554E]">
              {language === 'en' ? 'Slide:' : 'স্লাইড:'}
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxIndex + 1 }).map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentIndex(dotIdx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentIndex === dotIdx
                      ? 'w-6 bg-[#0F3B2E]'
                      : 'w-2 bg-[#D8D0BC] hover:bg-[#8BA49B]'
                  }`}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Quick Counter Information */}
          <div className="flex items-center gap-3 text-xs text-[#6B756E] font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#D8D0BC] text-[#0A2A21] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {language === 'en'
                  ? `${currentIndex + 1} - ${Math.min(currentIndex + cardsPerView, filteredItems.length)} of ${filteredItems.length} items`
                  : `${filteredItems.length}টির মধ্যে ${currentIndex + 1} - ${Math.min(currentIndex + cardsPerView, filteredItems.length)}টি প্রদর্শিত`}
              </span>
            </span>

            {isAutoPlaying && (
              <span className="text-[11px] text-[#8BA49B] hidden md:inline">
                {language === 'en' ? '(Auto-sliding active)' : '(অটো-স্লাইড চালু আছে)'}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
