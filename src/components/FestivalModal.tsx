import React, { useState } from 'react';
import { Festival, Language } from '../types';
import { X, Calendar, MapPin, Sparkles, CheckCircle2, Share2, Check, ArrowLeft } from 'lucide-react';
import { copyDirectLink } from '../lib/urlSync';

interface FestivalModalProps {
  festival: Festival | null;
  language: Language;
  onClose: () => void;
}

export const FestivalModal: React.FC<FestivalModalProps> = ({ festival, language, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!festival) return null;

  const handleCopyLink = async () => {
    const success = await copyDirectLink('festival', festival.id, festival.title);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      id="festival-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#FAF8F3] overflow-y-auto flex flex-col animate-in fade-in duration-200"
    >
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#FAF8F3]/95 backdrop-blur-md border-b border-[#D8D0BC] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] font-semibold text-xs sm:text-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0F3B2E]" />
          <span>{language === 'en' ? 'Back to Festivals' : 'উৎসবের তালিকায় ফিরুন'}</span>
        </button>

        <div className="hidden md:flex items-center gap-2.5">
          <span className="text-xl">{festival.emoji}</span>
          <span className="font-serif font-bold text-sm text-[#0A2A21]">
            {language === 'en' ? festival.title : festival.titleBn}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleCopyLink}
            title={language === 'en' ? 'Copy Festival URL' : 'উৎসবের লিংক কপি করুন'}
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

          <button
            onClick={onClose}
            className="p-2 bg-white rounded-full border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Full-Screen Content */}
      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-8">
          {/* Header Banner */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#D8D0BC] shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[#DE9B2E] flex items-center justify-center text-4xl shadow-md shrink-0">
              {festival.emoji}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8C3B2E] bg-[#8C3B2E]/10 px-3 py-1 rounded-full inline-block mb-2">
                {festival.badge}
              </span>
              <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? festival.title : festival.titleBn}
              </h1>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-white rounded-3xl border border-[#D8D0BC] shadow-xs">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-[#DE9B2E]/15 text-[#B87E20]">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#4B554E] uppercase tracking-wider">
                  {language === 'en' ? 'Festival Period / Timing' : 'তারিখ / সময়কাল'}
                </p>
                <p className="text-base font-bold text-[#0A2A21] mt-0.5">
                  {language === 'en' ? festival.date : festival.dateBn}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-[#0F3B2E]/10 text-[#0F3B2E]">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#4B554E] uppercase tracking-wider">
                  {language === 'en' ? 'Venue / Major Regions' : 'প্রধান উৎসবস্থল / অঞ্চল'}
                </p>
                <p className="text-base font-bold text-[#0A2A21] mt-0.5">
                  {language === 'en' ? festival.location : festival.locationBn}
                </p>
              </div>
            </div>
          </div>

          {/* Cultural Significance Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#D8D0BC] shadow-xs space-y-4">
            <h2 className="text-lg font-bold font-serif text-[#0A2A21] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'Cultural Significance & Tradition' : 'সাংস্কৃতিক তাৎপর্য ও ঐতিহ্য'}</span>
            </h2>
            <p className="text-[#3A443E] text-base sm:text-lg leading-relaxed font-normal">
              {language === 'en' ? festival.description : festival.descriptionBn}
            </p>
          </div>

          {/* Tips for visitors */}
          <div className="p-6 sm:p-8 bg-[#0F3B2E]/5 rounded-3xl border border-[#0F3B2E]/15 space-y-4">
            <h3 className="text-sm font-bold text-[#0F3B2E] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'Visitor Recommendations & Traditions' : 'দর্শনার্থীদের জন্য প্রয়োজনীয় পরামর্শ'}</span>
            </h3>
            <ul className="text-sm sm:text-base text-[#3A443E] space-y-2.5 list-disc list-inside leading-relaxed">
              <li>{language === 'en' ? 'Arrive at sunrise for prime cultural performances, Mangal Shobhajatra processions, and festivities.' : 'ভোরবেলার প্রধান সাংস্কৃতিক পরিবেশনা ও ঐতিহ্যবাহী মঙ্গল শোভাযাত্রা দেখার জন্য সকাল সকাল পৌঁছান।'}</li>
              <li>{language === 'en' ? 'Wear traditional attire (e.g. red & white sarees/panjabis) or breathable cotton garments.' : 'ঐতিহ্যবাহী লাল-সাদা বা আরামদায়ক সুতি পোশাক পরিধান করুন।'}</li>
              <li>{language === 'en' ? 'Savor authentic seasonal delicacies like Panta Ilish, pithas, and handcrafted sweets.' : 'ঐতিহ্যবাহী পান্তা-ইলিশ, রকমারি পিঠা ও মিষ্টির স্বাদ উপভোগ করুন।'}</li>
            </ul>
          </div>

          {/* Footer Action */}
          <div className="pt-6 border-t border-[#D8D0BC] flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3.5 bg-[#0F3B2E] text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-[#0A2A21] transition-all cursor-pointer shadow-md"
            >
              {language === 'en' ? 'Back to Overview' : 'ফিরে যান'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
