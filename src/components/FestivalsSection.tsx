import React from 'react';
import { motion } from 'motion/react';
import { Festival, Language } from '../types';
import { Calendar, MapPin, Sparkles, ArrowUpRight } from 'lucide-react';

interface FestivalsSectionProps {
  festivals: Festival[];
  language: Language;
  onSelectFestival: (festival: Festival) => void;
}

export const FestivalsSection: React.FC<FestivalsSectionProps> = ({
  festivals,
  language,
  onSelectFestival,
}) => {
  return (
    <section id="festivals" className="w-full px-4 md:px-8 lg:px-12 py-16 bg-[#F6F3EA] border-t border-[#D8D0BC] overflow-hidden">
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#DE9B2E]/15 text-[#B87E20] rounded-full text-[11px] font-extrabold uppercase tracking-widest border border-[#DE9B2E]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E]" />
              {language === 'en' ? 'Living Heritage' : 'উৎসবের ঋতুবৈচিত্র্য'}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#0A2A21] tracking-tight">
              {language === 'en' ? 'Festivals & Cultural Gatherings' : 'বাংলার ঐতিহ্যবাহী বর্ণিল উৎসব'}
            </h2>
            <p className="text-[#4B554E] max-w-xl text-sm sm:text-base leading-relaxed">
              {language === 'en'
                ? 'From vibrant Bengali New Year carnivals to full-moon island gatherings and rhythmic river boat races.'
                : 'পহেলা বৈশাখের মঙ্গল শোভাযাত্রা থেকে শুরু করে নদীর বুকে উত্তাল নৌকা বাইচ ও পূর্ণিমার আলোয় রাস মেলা।'}
            </p>
          </div>
        </motion.div>

        {/* Festivals 2x2 Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {festivals.map((fest, idx) => (
            <motion.div
              key={fest.id}
              id={`festival-card-${fest.id}`}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.55,
                delay: idx * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              onClick={() => onSelectFestival(fest)}
              className="bg-white rounded-[32px] p-6 sm:p-8 border border-[#D8D0BC] shadow-xs hover:shadow-xl hover:border-[#DE9B2E] transition-all flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              <div className="space-y-5 relative z-10">
                {/* Header row with Emoji and Badge */}
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[#DE9B2E] flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">
                    {fest.emoji}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 bg-[#8C3B2E]/10 text-[#8C3B2E] rounded-full border border-[#8C3B2E]/20">
                    {fest.badge}
                  </span>
                </div>

                {/* Title & Info */}
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#0A2A21] group-hover:text-[#8C3B2E] transition-colors leading-tight">
                    {language === 'en' ? fest.title : fest.titleBn}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-[#4B554E]">
                    <span className="flex items-center gap-1.5 text-[#0F3B2E]">
                      <Calendar className="w-4 h-4 text-[#DE9B2E]" />
                      {language === 'en' ? fest.date : fest.dateBn}
                    </span>
                    <span className="flex items-center gap-1.5 text-[#4B554E]">
                      <MapPin className="w-4 h-4 text-[#8C3B2E]" />
                      {language === 'en' ? fest.location : fest.locationBn}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4B554E] leading-relaxed pt-2">
                    {language === 'en' ? fest.description : fest.descriptionBn}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-6 mt-4 border-t border-[#D8D0BC] flex items-center justify-between relative z-10">
                <span className="text-xs font-bold uppercase tracking-widest text-[#0F3B2E]">
                  {language === 'en' ? 'Cultural Heritage Insight' : 'সাংস্কৃতিক তাৎপর্য'}
                </span>
                <div className="p-2 rounded-full bg-[#F6F3EA] group-hover:bg-[#0F3B2E] group-hover:text-white transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              {/* Decorative faint background ring */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-[#DE9B2E]/5 rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
