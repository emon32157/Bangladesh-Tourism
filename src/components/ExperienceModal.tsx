import React, { useState } from 'react';
import { Experience, Language } from '../types';
import { X, Clock, MapPin, Compass, Sparkles, CheckCircle, Share2, Check, ArrowLeft } from 'lucide-react';
import { copyDirectLink } from '../lib/urlSync';

interface ExperienceModalProps {
  experience: Experience | null;
  language: Language;
  onClose: () => void;
  onOpenTripPlanner: () => void;
}

export const ExperienceModal: React.FC<ExperienceModalProps> = ({
  experience,
  language,
  onClose,
  onOpenTripPlanner,
}) => {
  const [copied, setCopied] = useState(false);

  if (!experience) return null;

  const handleCopyLink = async () => {
    const success = await copyDirectLink('experience', experience.id, experience.title);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      id="experience-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#FAF8F3] overflow-y-auto flex flex-col animate-in fade-in duration-200"
    >
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-[#FAF8F3]/95 backdrop-blur-md border-b border-[#D8D0BC] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#D8D0BC] hover:bg-[#EFEADC] text-[#0A2A21] font-semibold text-xs sm:text-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#0F3B2E]" />
          <span>{language === 'en' ? 'Back to Experiences' : 'অভিজ্ঞতার তালিকায় ফিরুন'}</span>
        </button>

        <div className="hidden md:flex items-center gap-2.5">
          <span className="text-xl">{experience.icon}</span>
          <span className="font-serif font-bold text-sm text-[#0A2A21]">
            {language === 'en' ? experience.title : experience.titleBn}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleCopyLink}
            title={language === 'en' ? 'Copy Experience URL' : 'অভিজ্ঞতার লিংক কপি করুন'}
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

      {/* Main Full-Screen Body */}
      <main className="flex-1 w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-8">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#D8D0BC] shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[#DE9B2E]/20 text-4xl flex items-center justify-center shrink-0 shadow-inner">
              {experience.icon}
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0F3B2E] bg-[#0F3B2E]/10 px-3 py-1 rounded-full inline-block mb-2">
                {experience.tag}
              </span>
              <h1 className="text-3xl sm:text-5xl font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? experience.title : experience.titleBn}
              </h1>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-white rounded-3xl border border-[#D8D0BC] shadow-xs">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-[#DE9B2E]/15 text-[#B87E20]">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#4B554E] uppercase tracking-wider">
                  {language === 'en' ? 'Location & Region' : 'স্থান ও অঞ্চল'}
                </p>
                <p className="text-base font-bold text-[#0A2A21] mt-0.5">{experience.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-[#0F3B2E]/10 text-[#0F3B2E]">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#4B554E] uppercase tracking-wider">
                  {language === 'en' ? 'Estimated Duration' : 'আনুমানিক সময়কাল'}
                </p>
                <p className="text-base font-bold text-[#0A2A21] mt-0.5">{experience.duration}</p>
              </div>
            </div>
          </div>

          {/* Detailed Overview */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#D8D0BC] shadow-xs space-y-4">
            <h2 className="text-lg font-bold font-serif text-[#0A2A21] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'Activity Overview & Description' : 'অভিজ্ঞতার বিস্তারিত বিবরণ'}</span>
            </h2>
            <p className="text-[#3A443E] text-base sm:text-lg leading-relaxed font-normal">
              {language === 'en' ? experience.description : experience.descriptionBn}
            </p>
          </div>

          {/* What's Included */}
          <div className="p-6 sm:p-8 bg-white rounded-3xl border border-[#D8D0BC] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#0A2A21] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'What’s Included in this Experience' : 'অভিজ্ঞতার অন্তর্ভুক্ত সুবিধাসমূহ'}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#D8D0BC]/80 text-sm font-medium text-[#1B211D]">
                <CheckCircle className="w-5 h-5 text-[#0F3B2E] shrink-0" />
                <span>{language === 'en' ? 'Local English/Bengali speaking expert guide' : 'অভিজ্ঞ স্থানীয় গাইড ও সহায়তা'}</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#D8D0BC]/80 text-sm font-medium text-[#1B211D]">
                <CheckCircle className="w-5 h-5 text-[#0F3B2E] shrink-0" />
                <span>{language === 'en' ? 'Traditional local refreshments & tea' : 'ঐতিহ্যবাহী নাস্তা ও চা আপ্যায়ন'}</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#D8D0BC]/80 text-sm font-medium text-[#1B211D]">
                <CheckCircle className="w-5 h-5 text-[#0F3B2E] shrink-0" />
                <span>{language === 'en' ? 'Entry permits & cultural zone access' : 'প্রয়োজনীয় প্রবেশ অনুমতি ও পাস'}</span>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF8F3] border border-[#D8D0BC]/80 text-sm font-medium text-[#1B211D]">
                <CheckCircle className="w-5 h-5 text-[#0F3B2E] shrink-0" />
                <span>{language === 'en' ? 'Direct local artisan interaction & storytelling' : 'কারিগরদের সাথে প্রত্যক্ষ মতবিনিময়'}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 border-t border-[#D8D0BC] flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => {
                onClose();
                onOpenTripPlanner();
              }}
              className="px-8 py-4 bg-[#0F3B2E] text-white rounded-full font-bold text-sm uppercase tracking-wider hover:bg-[#0A2A21] transition-all flex items-center gap-2.5 shadow-lg hover:shadow-xl cursor-pointer"
            >
              <Compass className="w-5 h-5 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'Add to Trip Planner' : 'ভ্রমণ পরিকল্পনা তালিকায় রাখুন'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-7 py-4 border border-[#D8D0BC] bg-white text-[#4B554E] hover:text-[#0A2A21] rounded-full text-sm font-bold uppercase tracking-wider hover:bg-[#EFEADC] transition-all cursor-pointer shadow-xs"
            >
              {language === 'en' ? 'Back' : 'বন্ধ করুন'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
