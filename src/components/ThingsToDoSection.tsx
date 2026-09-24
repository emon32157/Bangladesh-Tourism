import React from 'react';
import { motion } from 'motion/react';
import { Experience, Language } from '../types';
import { Compass, Clock, MapPin, Sparkles, ArrowUpRight } from 'lucide-react';

interface ThingsToDoSectionProps {
  experiences: Experience[];
  language: Language;
  onSelectExperience: (exp: Experience) => void;
}

export const ThingsToDoSection: React.FC<ThingsToDoSectionProps> = ({
  experiences,
  language,
  onSelectExperience,
}) => {
  return (
    <section id="experiences" className="w-full px-4 md:px-8 lg:px-12 py-16 bg-[#EFEADC]/50 border-t border-[#D8D0BC] overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#8C3B2E]/10 text-[#8C3B2E] rounded-full text-[11px] font-extrabold uppercase tracking-widest border border-[#8C3B2E]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#8C3B2E]" />
            {language === 'en' ? 'Unforgettable Journeys' : 'অনবদ্য অভিজ্ঞতা'}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#0A2A21] tracking-tight">
            {language === 'en' ? 'Authentic Experiences of Bengal' : 'বাংলার অনন্য রোমাঞ্চ ও জীবনধারা'}
          </h2>
          <p className="text-[#4B554E] max-w-xl text-sm sm:text-base leading-relaxed">
            {language === 'en'
              ? 'Immerse yourself in centuries of living craft, quiet dawn river safaris, culinary rituals, and coastal journeys.'
              : 'ঐতিহ্যবাহী কারুশিল্পের সাথে পরিচিত হওয়া, ভোরবেলার শান্ত নদী সাফারি, বাংলার রন্ধনশিল্প ও রোমাঞ্চকর উপকূল ভ্রমণ।'}
          </p>
        </motion.div>

        {/* Experiences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiences.map((exp, idx) => (
            <motion.div
              key={exp.id}
              id={`experience-card-${exp.id}`}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.5,
                delay: (idx % 6) * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              onClick={() => onSelectExperience(exp)}
              className="bg-white rounded-[28px] p-6 border border-[#D8D0BC] shadow-xs hover:shadow-lg hover:border-[#DE9B2E] transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-4">
                {/* Icon & Category Pill */}
                <div className="flex items-center justify-between">
                  <div className="w-13 h-13 rounded-2xl bg-[#DE9B2E]/15 border border-[#DE9B2E]/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {exp.icon}
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 bg-[#0F3B2E]/10 text-[#0F3B2E] rounded-full">
                    {exp.tag}
                  </span>
                </div>

                {/* Title & Desc */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold font-serif text-[#0A2A21] group-hover:text-[#8C3B2E] transition-colors leading-snug">
                    {language === 'en' ? exp.title : exp.titleBn}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4B554E] leading-relaxed line-clamp-3">
                    {language === 'en' ? exp.description : exp.descriptionBn}
                  </p>
                </div>
              </div>

              {/* Card Footer info */}
              <div className="pt-5 mt-4 border-t border-[#D8D0BC]/60 flex items-center justify-between text-xs text-[#4B554E]">
                <div className="flex items-center gap-1.5 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-[#DE9B2E]" />
                  <span className="truncate max-w-[140px]">{exp.location}</span>
                </div>
                <div className="flex items-center gap-1 font-bold text-[#0F3B2E]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{exp.duration}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
