import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Destination, DestinationCategory, Language } from '../types';
import { Bookmark, Star, ArrowRight, Clock, MapPin, Sparkles, Eye, ChevronDown, ChevronUp, Video, X, Compass, Filter } from 'lucide-react';
import { getCanonicalDistrict, isDestinationInDistrict } from '../lib/districtMatcher';

interface DestinationsGridProps {
  destinations: Destination[];
  language: Language;
  onSelectDestination: (dest: Destination) => void;
  savedIds: string[];
  onToggleSave: (id: string, e: React.MouseEvent) => void;
  onPlanTrip?: (dest: Destination) => void;
  selectedDistrictFilter?: string | null;
  onClearDistrictFilter?: () => void;
}

export const DestinationsGrid: React.FC<DestinationsGridProps> = ({
  destinations,
  language,
  onSelectDestination,
  savedIds,
  onToggleSave,
  onPlanTrip,
  selectedDistrictFilter,
  onClearDistrictFilter,
}) => {
  const PAGE_SIZE = 6;
  const [activeCategory, setActiveCategory] = useState<DestinationCategory>('all');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Canonical district info for selectedDistrictFilter
  const canonicalDistrict = useMemo(() => {
    return getCanonicalDistrict(selectedDistrictFilter);
  }, [selectedDistrictFilter]);

  // When selected district filter changes, show all attractions for that district immediately and reset category
  useEffect(() => {
    if (selectedDistrictFilter) {
      setActiveCategory('all');
      setVisibleCount(24);
    } else {
      setVisibleCount(PAGE_SIZE);
    }
  }, [selectedDistrictFilter]);

  const categories: { id: DestinationCategory; labelEn: string; labelBn: string }[] = [
    { id: 'all', labelEn: 'All Wonders', labelBn: 'সকল দর্শনীয় স্থান' },
    { id: 'coastal', labelEn: 'Coastal & Beaches', labelBn: 'উপকূল ও সমুদ্রসৈকত' },
    { id: 'wildlife', labelEn: 'Mangroves & Wildlife', labelBn: 'ম্যানগ্রোভ ও বন্যপ্রাণী' },
    { id: 'hills_tea', labelEn: 'Hills & Tea Estates', labelBn: 'পাহাড় ও চা বাগান' },
    { id: 'heritage', labelEn: 'Ancient Heritage', labelBn: 'প্রাচীন ঐতিহ্য' },
    { id: 'river', labelEn: 'River Journeys', labelBn: 'নদীমাতৃক ভ্রমণ' },
  ];

  // 1. Filter by district if selected
  const districtFilteredDestinations = useMemo(() => {
    if (!selectedDistrictFilter) return destinations || [];
    const targetEn = canonicalDistrict ? canonicalDistrict.nameEn : selectedDistrictFilter;
    const targetBn = canonicalDistrict ? canonicalDistrict.nameBn : selectedDistrictFilter;

    return (destinations || []).filter((dest) =>
      isDestinationInDistrict(dest, targetEn, targetBn)
    );
  }, [destinations, selectedDistrictFilter, canonicalDistrict]);

  // 2. Filter by category
  const filteredDestinations = useMemo(() => {
    const seen = new Set<string>();
    return districtFilteredDestinations.filter((dest) => {
      if (!dest || !dest.id || seen.has(dest.id)) return false;
      seen.add(dest.id);
      if (activeCategory === 'all') return true;
      return dest.category === activeCategory;
    });
  }, [districtFilteredDestinations, activeCategory]);

  // Sliced items for display
  const displayedDestinations = useMemo(() => {
    return filteredDestinations.slice(0, visibleCount);
  }, [filteredDestinations, visibleCount]);

  const hasMore = visibleCount < filteredDestinations.length;
  const remainingCount = Math.max(0, filteredDestinations.length - visibleCount);

  // Reusable Animated LOAD MORE Button Component
  const LoadMoreButton = () => {
    if (!hasMore) {
      if (filteredDestinations.length > PAGE_SIZE) {
        return (
          <div className="flex justify-center items-center mt-8 text-center">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 border border-[#D8D0BC] text-xs font-bold text-[#6B756E] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E]" />
              {language === 'en'
                ? `All ${filteredDestinations.length} destinations displayed`
                : `সকল ${filteredDestinations.length}টি গন্তব্য প্রদর্শিত হয়েছে`}
            </span>
          </div>
        );
      }
      return null;
    }

    return (
      <motion.div
        id="load-more-container"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="flex justify-center items-center mt-8"
      >
        <motion.button
          id="load-more-btn"
          type="button"
          onClick={() => {
            setVisibleCount((prev) => prev + PAGE_SIZE);
          }}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          className="relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-extrabold text-sm sm:text-base uppercase tracking-wider text-white shadow-xl cursor-pointer overflow-hidden group bg-gradient-to-r from-[#0F3B2E] via-[#DE9B2E] to-[#8C3B2E] hover:from-[#DE9B2E] hover:via-[#8C3B2E] hover:to-[#0F3B2E] transition-all duration-500 border border-white/30"
        >
          {/* Shimmer light effect overlay */}
          <span className="absolute top-0 left-0 w-full h-full bg-white/20 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="p-1 bg-white/20 rounded-full"
          >
            <ChevronDown className="w-4 h-4 text-white" />
          </motion.span>

          <span className="drop-shadow-md">
            {language === 'en'
              ? `LOAD MORE (+${Math.min(PAGE_SIZE, remainingCount)})`
              : `আরও দেখুন (+${Math.min(PAGE_SIZE, remainingCount)}টি)`}
          </span>

          <span className="ml-1 px-2 py-0.5 rounded-full bg-black/20 text-xs font-mono font-normal text-white/90">
            {displayedDestinations.length} / {filteredDestinations.length}
          </span>
        </motion.button>
      </motion.div>
    );
  };

  const districtDisplayNameEn = canonicalDistrict?.nameEn || selectedDistrictFilter;
  const districtDisplayNameBn = canonicalDistrict?.nameBn || selectedDistrictFilter;

  return (
    <section id="destinations" className="w-full px-4 md:px-8 lg:px-12 py-16 border-t border-[#D8D0BC] bg-[#F6F3EA] overflow-hidden scroll-mt-20">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0F3B2E]/10 text-[#0F3B2E] rounded-full text-[11px] font-extrabold uppercase tracking-widest border border-[#0F3B2E]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E]" />
              {selectedDistrictFilter
                ? (language === 'en' ? `${districtDisplayNameEn} Explorer` : `${districtDisplayNameBn} জেলা গাইড`)
                : (language === 'en' ? 'Curated Catalog' : 'নির্বাচিত গন্তব্য')}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#0A2A21] tracking-tight">
              {selectedDistrictFilter
                ? (language === 'en'
                    ? `Tourist Attractions in ${districtDisplayNameEn}`
                    : `${districtDisplayNameBn} জেলার পর্যটন স্থানসমূহ`)
                : (language === 'en'
                    ? 'Iconic Destinations of Bengal'
                    : 'বাংলার প্রধান পর্যটন গন্তব্যসমূহ')}
            </h2>
            <p className="text-[#4B554E] max-w-xl text-sm sm:text-base leading-relaxed">
              {selectedDistrictFilter
                ? (language === 'en'
                    ? `Explore the iconic heritage landmarks, natural wonders, and attractions in ${districtDisplayNameEn} district.`
                    : `${districtDisplayNameBn} জেলার সকল ঐতিহাসিক নিদর্শন, নয়নাভিরাম প্রাকৃতিক সৌন্দর্য এবং দর্শনীয় স্থানসমূহ ঘুরে দেখুন।`)
                : (language === 'en'
                    ? 'From mist-veiled highland peaks and ancient Buddhist viharas to tidal rainforests and unending golden shorelines.'
                    : 'কুয়াশাঘেরা সবুজ পাহাড়ের চূড়া, প্রাচীন প্রত্নতাত্ত্বিক নিদর্শন থেকে শুরু করে রহস্যময় ম্যানগ্রোভ বন ও অবিরাম সোনালী সমুদ্রতট।')}
            </p>
          </div>

          {/* Destination Counter Badge */}
          <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-full border border-[#D8D0BC] shadow-xs w-fit">
            <span className="w-2 h-2 rounded-full bg-[#DE9B2E] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A2A21]">
              {displayedDestinations.length} / {filteredDestinations.length} {language === 'en' ? 'Destinations' : 'টি গন্তব্য'}
            </span>
          </div>
        </motion.div>

        {/* Active District Filter Highlight Banner */}
        {selectedDistrictFilter && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#0F3B2E] via-[#144738] to-[#0A2A21] text-white border border-[#DE9B2E]/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#DE9B2E]/20 border border-[#DE9B2E]/40 flex items-center justify-center shrink-0 shadow-inner">
                <MapPin className="w-6 h-6 text-[#DE9B2E]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#DE9B2E]">
                    {language === 'en' ? 'Filtered by District' : 'জেলা অনুযায়ী প্রদর্শিত'}
                  </span>
                  {canonicalDistrict && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15">
                      {language === 'en' ? canonicalDistrict.divisionEn : canonicalDistrict.divisionBn}
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight flex items-center gap-2 mt-0.5">
                  <span>{language === 'en' ? districtDisplayNameEn : districtDisplayNameBn}</span>
                  <span className="text-sm font-normal text-white/70">
                    ({language === 'en' ? districtDisplayNameBn : districtDisplayNameEn})
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                  {language === 'en'
                    ? `Found ${districtFilteredDestinations.length} tourist spots in this district`
                    : `এই জেলায় মোট ${districtFilteredDestinations.length}টি দর্শনীয় স্থান পাওয়া গেছে`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
              <button
                type="button"
                onClick={() => {
                  const mapEl = document.getElementById('gis-map');
                  if (mapEl) {
                    mapEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-4 py-2 rounded-full text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Compass className="w-3.5 h-3.5 text-[#DE9B2E]" />
                <span>{language === 'en' ? 'View on GIS Map' : 'ম্যাপে দেখুন'}</span>
              </button>

              {onClearDistrictFilter && (
                <button
                  type="button"
                  onClick={onClearDistrictFilter}
                  className="px-4 py-2 rounded-full text-xs font-bold text-[#0A2A21] bg-[#DE9B2E] hover:bg-[#c78822] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Show All Districts' : 'সকল জেলা দেখুন'}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Category Filters Pill Bar */}
        <motion.div
          id="destination-filters"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                id={`filter-${cat.id}`}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-xs ${
                  isActive
                    ? 'bg-[#0F3B2E] text-white shadow-md'
                    : 'bg-white/80 border border-[#D8D0BC] text-[#4B554E] hover:bg-[#EFEADC] hover:text-[#0A2A21]'
                }`}
              >
                {language === 'en' ? cat.labelEn : cat.labelBn}
              </button>
            );
          })}
        </motion.div>

        {/* Empty state when category in district has 0 spots */}
        {filteredDestinations.length === 0 && (
          <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-[#D8D0BC] space-y-4">
            <MapPin className="w-10 h-10 text-[#DE9B2E] mx-auto opacity-80" />
            <h4 className="text-lg font-bold text-[#0A2A21]">
              {language === 'en' ? 'No attractions found for this category' : 'এই ক্যাটাগরিতে কোনো স্থান পাওয়া যায়নি'}
            </h4>
            <p className="text-sm text-[#4B554E] max-w-md mx-auto">
              {language === 'en'
                ? `No ${activeCategory} attractions found in ${districtDisplayNameEn}. View all ${districtFilteredDestinations.length} spots in this district.`
                : `নির্বাচিত ক্যাটাগরিতে এই জেলায় কোনো স্থান নেই। এই জেলার সকল স্থান দেখতে নিচের বোতাম চাপুন।`}
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="px-5 py-2.5 rounded-full bg-[#0F3B2E] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0A2A21] transition-all cursor-pointer"
              >
                {language === 'en' ? 'View All District Spots' : 'জেলার সকল স্থান দেখুন'}
              </button>
              {onClearDistrictFilter && (
                <button
                  type="button"
                  onClick={onClearDistrictFilter}
                  className="px-5 py-2.5 rounded-full bg-white border border-[#D8D0BC] text-[#0A2A21] text-xs font-bold uppercase tracking-wider hover:bg-[#F6F3EA] transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Show All Districts' : 'সকল জেলা দেখুন'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Destinations Grid: 2 Columns Across All Breakpoints (Mobile, Tablet, Desktop) */}
        <div
          id="destinations-cards-grid"
          className="grid grid-cols-2 gap-3.5 sm:gap-6 lg:gap-8"
        >
          <AnimatePresence mode="popLayout">
            {displayedDestinations.map((dest, idx) => {
              const isSaved = savedIds.includes(dest.id);
              return (
                <motion.div
                  key={dest.id}
                  id={`destination-card-${dest.id}`}
                  initial={{ opacity: 0, y: 30, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.45,
                    delay: (idx % 4) * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  onClick={() => onSelectDestination(dest)}
                  className="bg-white rounded-2xl sm:rounded-[32px] border border-[#D8D0BC] overflow-hidden shadow-xs hover:shadow-xl hover:border-[#DE9B2E]/60 transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  {/* Image Container with Overlay */}
                  <div className="relative h-40 sm:h-56 md:h-64 lg:h-72 overflow-hidden bg-neutral-100">
                    <img
                      src={dest.image || 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80'}
                      alt={
                        language === 'en'
                          ? `${dest.title} - Tourist destination in ${dest.district}, ${dest.division}, Bangladesh`
                          : `${dest.titleBn || dest.title} - দর্শনীয় স্থান, ${dest.districtBn || dest.district}, বাংলাদেশ`
                      }
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                    {/* Top Badges */}
                    <div className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 flex justify-between items-center gap-1.5">
                      <div className="flex items-center gap-1.5 overflow-hidden max-w-[75%]">
                        <span className="bg-[#0F3B2E]/90 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider border border-white/20 truncate">
                          {language === 'en' ? dest.tag : dest.tagBn}
                        </span>
                        {dest.videoUrl && (
                          <span
                            className="bg-red-600/90 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 border border-white/20 shadow-xs"
                            title={language === 'en' ? 'Includes YouTube Video Tour' : 'ইউটিউব ভিডিও ট্যুর অন্তর্ভুক্ত'}
                          >
                            <Video className="w-2.5 h-2.5 shrink-0" />
                            <span className="hidden sm:inline">Video</span>
                          </span>
                        )}
                      </div>

                      {/* Bookmark toggle button */}
                      <button
                        id={`bookmark-btn-${dest.id}`}
                        onClick={(e) => onToggleSave(dest.id, e)}
                        aria-label="Save destination"
                        className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all shrink-0 ${
                          isSaved
                            ? 'bg-[#8C3B2E] text-white ring-2 ring-white'
                            : 'bg-black/40 text-white hover:bg-black/60'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Bottom Image Info */}
                    <div className="absolute bottom-2.5 sm:bottom-3.5 left-2.5 sm:left-4 right-2.5 sm:right-4 text-white flex justify-between items-end">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-[#EDE8D6] truncate">
                        <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#DE9B2E] shrink-0" />
                        <span className="truncate">{dest.division}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold bg-[#DE9B2E] text-[#0A2A21] px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs shrink-0">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                        <span>{dest.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 sm:p-6 flex-1 flex flex-col justify-between gap-3 sm:gap-4">
                    <div className="space-y-1 sm:space-y-2">
                      <h3 className="text-base sm:text-xl lg:text-2xl font-bold font-serif text-[#0A2A21] group-hover:text-[#8C3B2E] transition-colors line-clamp-1 sm:line-clamp-2">
                        {language === 'en' ? dest.title : dest.titleBn}
                      </h3>
                      <p className="text-[11px] sm:text-xs md:text-sm text-[#4B554E] line-clamp-2 sm:line-clamp-3 leading-relaxed">
                        {language === 'en' ? dest.summary : dest.summaryBn}
                      </p>
                    </div>

                    {/* Highlights Pill preview */}
                    <div className="pt-2 border-t border-[#D8D0BC]/60 flex flex-wrap gap-1 sm:gap-1.5">
                      {(dest.highlights || []).slice(0, 2).map((hl, i) => (
                        <span
                          key={i}
                          className="text-[9px] sm:text-[10px] font-bold text-[#0F3B2E] bg-[#0F3B2E]/5 px-2 py-0.5 rounded-full truncate max-w-full"
                        >
                          {hl.split('&')[0]}
                        </span>
                      ))}
                    </div>

                    {/* Footer & CTA link */}
                    <div className="pt-2.5 sm:pt-3 border-t border-[#D8D0BC] flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold text-[#4B554E]">
                        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#DE9B2E] shrink-0" />
                        <span className="truncate">{dest.duration}</span>
                      </div>

                      <div className="inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0F3B2E] group-hover:text-[#8C3B2E] transition-colors">
                        <span>{language === 'en' ? 'View Guide' : 'বিস্তারিত দেখুন'}</span>
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bottom LOAD MORE Action Button */}
        <LoadMoreButton />
      </div>
    </section>
  );
};

