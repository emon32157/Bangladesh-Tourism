import React from 'react';
import { motion } from 'motion/react';
import { Language, Destination } from '../types';
import { ArrowUpRight, Compass, Sparkles, Calendar, MapPin } from 'lucide-react';

interface HeroSectionProps {
  language: Language;
  onExploreClick: () => void;
  onPlanTripClick: () => void;
  onSelectDestination: (dest: Destination) => void;
  onSelectFestivalModal: () => void;
  coxsBazar: Destination;
  sylhet: Destination;
  paharpur: Destination;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  language,
  onExploreClick,
  onPlanTripClick,
  onSelectDestination,
  onSelectFestivalModal,
  coxsBazar,
  sylhet,
  paharpur,
}) => {
  return (
    <section id="hero-section" className="w-full px-4 md:px-8 lg:px-12 py-8 lg:py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-12">
        {/* Left Column: Editorial Headline & Actions */}
        <motion.div
          id="hero-left-column"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 flex flex-col gap-6 lg:gap-8 w-full"
        >
          <div className="space-y-4">
            {/* Pill Badge */}
            <motion.div
              id="hero-welcome-badge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#DE9B2E]/15 text-[#B87E20] rounded-full text-[11px] font-extrabold uppercase tracking-widest border border-[#DE9B2E]/30 w-fit"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E]" />
              {language === 'en' ? 'Welcome to Paradise' : 'স্বাগতম রূপসী বাংলায়'}
            </motion.div>

            {/* Editorial Serif Display Headline */}
            <motion.h1
              id="hero-main-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl lg:text-[66px] leading-[1.04] text-[#0A2A21] font-bold font-serif tracking-tight"
            >
              {language === 'en' ? (
                <>
                  Explore the <br className="hidden sm:inline" />
                  Land of Rivers <br className="hidden sm:inline" />
                  & Heritage
                </>
              ) : (
                <>
                  নদী ও ঐতিহ্যের <br className="hidden sm:inline" />
                  অনুপম সৌন্দর্যে <br className="hidden sm:inline" />
                  ভ্রমণ করুন
                </>
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              id="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="text-base sm:text-lg text-[#4B554E] max-w-xl leading-relaxed font-normal"
            >
              {language === 'en'
                ? "From the world's longest natural sea beach to the largest mangrove forest — discover a country brimming with serene nature, centuries of culture, and warmth."
                : "বিশ্বের দীর্ঘতম প্রাকৃতিক সমুদ্র সৈকত থেকে বৃহত্তম ম্যানগ্রোভ বন—অনুপম প্রকৃতি, সহস্রাব্দের সংস্কৃতি এবং রোমাঞ্চকর অভিজ্ঞতায় সমৃদ্ধ বাংলাদেশ।"}
            </motion.p>
          </div>

          {/* Primary Action Buttons */}
          <motion.div
            id="hero-cta-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-4 sm:gap-5"
          >
            <button
              id="hero-explore-btn"
              onClick={onExploreClick}
              className="bg-[#0F3B2E] text-white px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold shadow-xl hover:bg-[#0A2A21] transition-all transform hover:-translate-y-1 active:translate-y-0 text-sm sm:text-base cursor-pointer flex items-center gap-2.5"
            >
              <span>{language === 'en' ? 'Explore Destinations' : 'গন্তব্যসমূহ দেখুন'}</span>
              <ArrowUpRight className="w-4 h-4 text-[#DE9B2E]" />
            </button>

            <button
              id="hero-plan-btn"
              onClick={onPlanTripClick}
              className="border-2 border-[#0F3B2E] text-[#0F3B2E] px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold hover:bg-[#0F3B2E] hover:text-white transition-all text-sm sm:text-base cursor-pointer flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>{language === 'en' ? 'Plan Your Trip' : 'ভ্রমণ পরিকল্পনা'}</span>
            </button>
          </motion.div>

          {/* Upcoming Festival Widget */}
          <motion.div
            id="hero-upcoming-festival-widget"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            onClick={onSelectFestivalModal}
            className="flex items-center gap-5 p-4 sm:p-5 bg-white/70 backdrop-blur-sm border border-[#D8D0BC] rounded-2xl max-w-md shadow-xs hover:shadow-md hover:border-[#DE9B2E] transition-all cursor-pointer group"
          >
            <div
              id="festival-widget-icon"
              className="w-14 h-14 bg-[#DE9B2E] rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-105 transition-transform"
            >
              🐯
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#DE9B2E] uppercase tracking-wider">
                  {language === 'en' ? 'Upcoming Celebration' : 'আসন্ন উৎসব'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#DE9B2E] animate-pulse"></span>
              </div>
              <h4 className="font-bold text-[#0A2A21] text-base group-hover:text-[#8C3B2E] transition-colors truncate">
                {language === 'en' ? 'Pohela Boishakh 2025' : 'পহেলা বৈশাখ ১৪৩২'}
              </h4>
              <p className="text-xs text-[#4B554E] flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#8C3B2E]" />
                {language === 'en' ? 'April 14 · Dhaka, Ramna Park' : '১৪ এপ্রিল · ঢাকা, রমনা পার্ক'}
              </p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-[#4B554E] group-hover:text-[#0A2A21] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
          </motion.div>
        </motion.div>

        {/* Right Column: Visual Editorial Showcase (Cards) */}
        <motion.div
          id="hero-right-column"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full lg:w-[460px] xl:w-[490px] flex flex-col gap-6"
        >
          {/* Main Showcase Image Card (Cox's Bazar) */}
          <div
            id="hero-main-showcase-card"
            onClick={() => onSelectDestination(coxsBazar)}
            className="relative h-[340px] sm:h-[380px] rounded-[36px] sm:rounded-[40px] overflow-hidden shadow-2xl group cursor-pointer border border-[#D8D0BC]"
          >
            <img
              src={coxsBazar.image}
              alt={
                language === 'en'
                  ? "Cox's Bazar Sea Beach - The world's longest natural sandy beach in Bangladesh"
                  : "কক্সবাজার সমুদ্র সৈকত - বিশ্বের দীর্ঘতম প্রাকৃতিক সমুদ্র সৈকত, বাংলাদেশ"
              }
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A2A21] via-[#0A2A21]/30 to-transparent opacity-90 transition-opacity group-hover:opacity-95"></div>

            {/* Card Content Overlay */}
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="bg-[#DE9B2E] text-[#0A2A21] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest mb-2.5 inline-block shadow-xs">
                {language === 'en' ? coxsBazar.tag : coxsBazar.tagBn}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold mb-1.5 font-serif leading-tight">
                {language === 'en' ? coxsBazar.title : coxsBazar.titleBn}
              </h3>
              <p className="text-xs sm:text-sm text-[#EDE8D6] line-clamp-2 leading-relaxed opacity-90">
                {language === 'en' ? coxsBazar.summary : coxsBazar.summaryBn}
              </p>
            </div>
          </div>

          {/* 2-Column Split Cards */}
          <div id="hero-subcards-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Card 1: Sylhet Tea Gardens (Forest Green Tile) */}
            <div
              id="hero-subcard-sylhet"
              onClick={() => onSelectDestination(sylhet)}
              className="bg-[#0F3B2E] rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 text-[#EDE8D6] flex flex-col justify-between shadow-lg relative overflow-hidden group cursor-pointer hover:bg-[#0A2A21] transition-all transform hover:-translate-y-1 min-h-[140px]"
            >
              <div className="text-3xl relative z-10 flex justify-between items-start">
                <span>🛶</span>
                <span className="text-xs font-bold text-[#DE9B2E] bg-white/10 px-2 py-0.5 rounded-full">
                  ★ {sylhet.rating}
                </span>
              </div>
              <div className="relative z-10 mt-3">
                <h4 className="text-base sm:text-lg font-bold text-white font-serif leading-snug">
                  {language === 'en' ? 'Sylhet Tea Gardens' : 'সিলেট চা বাগান'}
                </h4>
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#DE9B2E] mt-0.5">
                  {language === 'en' ? 'Nature & Highlands' : 'প্রকৃতি ও পাহাড়'}
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
            </div>

            {/* Card 2: Paharpur Vihara (White Tile) */}
            <div
              id="hero-subcard-paharpur"
              onClick={() => onSelectDestination(paharpur)}
              className="bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 border border-[#D8D0BC] flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[#DE9B2E] transition-all transform hover:-translate-y-1 min-h-[140px] group cursor-pointer"
            >
              <div className="text-3xl flex justify-between items-start">
                <span>🏮</span>
                <span className="text-[10px] font-bold text-[#8C3B2E] bg-[#8C3B2E]/10 px-2 py-0.5 rounded-full uppercase">
                  UNESCO
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-base sm:text-lg font-bold text-[#0A2A21] font-serif leading-snug group-hover:text-[#8C3B2E] transition-colors">
                  {language === 'en' ? 'Paharpur Vihara' : 'পাহাড়পুর বৌদ্ধ বিহার'}
                </h4>
                <p className="text-[10px] uppercase font-bold tracking-widest text-[#4B554E] mt-0.5">
                  {language === 'en' ? 'Heritage Site' : 'প্রাচীন ঐতিহ্য'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
