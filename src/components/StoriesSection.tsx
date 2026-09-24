import React from 'react';
import { motion } from 'motion/react';
import { EditorialStory, Language, AppUser } from '../types';
import { BookOpen, Clock, ArrowRight, Sparkles, Heart, MessageSquare, PenTool, Bookmark, Video } from 'lucide-react';

interface StoriesSectionProps {
  stories: EditorialStory[];
  language: Language;
  onSelectStory: (story: EditorialStory) => void;
  onOpenStorySubmit?: () => void;
  savedIds?: string[];
  onToggleSave?: (id: string, e?: React.MouseEvent) => void;
  currentUser?: AppUser | null;
  onOpenAuth?: () => void;
}

export const StoriesSection: React.FC<StoriesSectionProps> = ({
  stories,
  language,
  onSelectStory,
  onOpenStorySubmit,
  savedIds = [],
  onToggleSave,
  currentUser,
  onOpenAuth,
}) => {
  return (
    <section id="stories" className="w-full px-4 md:px-8 lg:px-12 py-16 bg-[#EFEADC]/40 border-t border-[#D8D0BC] overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#0F3B2E]/10 text-[#0F3B2E] rounded-full text-[11px] font-extrabold uppercase tracking-widest border border-[#0F3B2E]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E]" />
              {language === 'en' ? 'The Bengal Chronicle' : 'পত্রিকা ও আখ্যান'}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#0A2A21] tracking-tight">
              {language === 'en' ? 'Editorial Stories & Heritage Essays' : 'ঐতিহ্য ও সংস্কৃতির বিশেষ আখ্যান'}
            </h2>
            <p className="text-[#4B554E] max-w-xl text-sm sm:text-base leading-relaxed">
              {language === 'en'
                ? 'Deep essays exploring living traditions, imperial weaving, mangrove lore, and culinary heritage. Join the discussion, react, and comment!'
                : 'ঐতিহ্যবাহী জামদানি শিল্প, সুন্দরবনের জীবনগাথা এবং সমৃদ্ধ রন্ধনসংস্কৃতির আখ্যান। পড়ুন, প্রতিক্রিয়া দিন ও মন্তব্য করুন!'}
            </p>
          </div>

          {onOpenStorySubmit && (
            <button
              id="write-story-section-btn"
              onClick={onOpenStorySubmit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F3B2E] text-white hover:bg-[#0A2A21] text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0 border border-[#DE9B2E]/30"
            >
              <PenTool className="w-4 h-4 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'Submit Your Story' : 'ভ্রমণ আখ্যান লিখুন'}</span>
            </button>
          )}
        </motion.div>

        {/* Stories Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.map((story, idx) => (
            <motion.article
              key={story.id}
              id={`story-article-${story.id}`}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.5,
                delay: idx * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              onClick={() => onSelectStory(story)}
              className="bg-white rounded-[32px] border border-[#D8D0BC] overflow-hidden shadow-xs hover:shadow-xl hover:border-[#DE9B2E] transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                {/* Article Cover Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={story.image}
                    alt={
                      language === 'en'
                        ? `${story.title} - Bangladesh Tourism Editorial Story`
                        : `${story.titleBn || story.title} - বাংলাদেশ পর্যটন নিবন্ধ`
                    }
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 flex items-center gap-1.5">
                    <span className="bg-[#0F3B2E] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                      {story.category}
                    </span>
                    {story.videoUrl && (
                      <span
                        className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-xs border border-white/20"
                        title={language === 'en' ? 'Includes Video Documentary' : 'ভিডিও প্রামাণ্যচিত্র অন্তর্ভুক্ত'}
                      >
                        <Video className="w-3 h-3" />
                        <span>Video</span>
                      </span>
                    )}
                  </div>

                  {/* Social badge & Bookmark */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-white text-[11px] font-medium">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                        <span>{story.likesCount || 39}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-[#DE9B2E]" />
                        <span>{story.commentsCount || 4}</span>
                      </span>
                    </div>

                    <button
                      type="button"
                      id={`story-card-save-${story.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!currentUser) {
                          onOpenAuth?.();
                          return;
                        }
                        onToggleSave?.(story.id, e);
                      }}
                      title={language === 'en' ? (savedIds.includes(story.id) ? 'Remove from Wishlist' : 'Save to Wishlist') : (savedIds.includes(story.id) ? 'উইশলিস্ট থেকে বাদ দিন' : 'উইশলিস্টে যুক্ত করুন')}
                      className={`p-1.5 rounded-full backdrop-blur-xs transition-all cursor-pointer shadow-xs ${
                        savedIds.includes(story.id)
                          ? 'bg-[#8C3B2E] text-white shadow-md'
                          : 'bg-black/60 text-white hover:bg-black/80 hover:text-[#DE9B2E]'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${savedIds.includes(story.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Article Header & Body */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-[#6B756E] font-medium">
                    <span>{story.author}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#DE9B2E]" />
                      {story.readTime}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-serif text-[#0A2A21] group-hover:text-[#8C3B2E] transition-colors leading-snug">
                    {language === 'en' ? story.title : story.titleBn}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#4B554E] leading-relaxed line-clamp-3">
                    {language === 'en' ? story.excerpt : story.excerptBn}
                  </p>
                </div>
              </div>

              {/* Read Story CTA */}
              <div className="p-6 pt-0 mt-2 border-t border-[#D8D0BC]/50 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F3B2E] group-hover:text-[#8C3B2E] transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {language === 'en' ? 'Read & Discuss' : 'পড়ুন ও মন্তব্য করুন'}
                </span>
                <ArrowRight className="w-4 h-4 text-[#0F3B2E] group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
