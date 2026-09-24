import React from 'react';
import { BANGLADESH_FACTS } from '../data/bangladeshData';
import { Language } from '../types';
import { Flag, Facebook } from 'lucide-react';
import { NewsletterSubscription } from './NewsletterSubscription';

interface FooterProps {
  language: Language;
  onNavigate?: (sectionId: string) => void;
  onOpenReportModal?: () => void;
  onSelectDestinationById?: (id: string) => void;
  onOpenInfoPage?: (page: 'about' | 'contact' | 'privacy' | 'terms') => void;
}

export const Footer: React.FC<FooterProps> = ({
  language,
  onNavigate,
  onOpenReportModal,
  onSelectDestinationById,
  onOpenInfoPage,
}) => {
  const footerNavItems = [
    { id: 'hero', labelEn: 'Home', labelBn: 'মূলপাতা' },
    { id: 'destinations', labelEn: 'Destinations', labelBn: 'গন্তব্যসমূহ' },
    { id: 'gis-map', labelEn: 'GIS Map', labelBn: 'GIS ম্যাপ' },
    { id: 'districts', labelEn: '64 Districts', labelBn: '৬৪ জেলা' },
    { id: 'experiences', labelEn: 'Things to Do', labelBn: 'অভিজ্ঞতা' },
    { id: 'festivals', labelEn: 'Events', labelBn: 'উৎসব' },
    { id: 'news', labelEn: 'News & Bulletins', labelBn: 'সংবাদ ও বিজ্ঞপ্তি' },
    { id: 'stories', labelEn: 'Stories & Heritage', labelBn: 'গল্প ও ঐতিহ্য' },
  ];

  const topDestinations = [
    { id: 'spot-30', nameEn: "Cox's Bazar Sea Beach", nameBn: 'কক্সবাজার সমুদ্র সৈকত' },
    { id: 'spot-52', nameEn: 'Sundarbans Mangrove', nameBn: 'সুন্দরবন ম্যানগ্রোভ বন' },
    { id: 'spot-33', nameEn: 'Sajek Valley', nameBn: 'সাজেক ভ্যালি' },
    { id: 'spot-41', nameEn: 'Sreemangal Tea Estates', nameBn: 'শ্রীমঙ্গল চা বাগান' },
    { id: 'spot-45', nameEn: 'Paharpur Buddhist Vihara', nameBn: 'পাহাড়পুর বৌদ্ধ বিহার' },
    { id: 'spot-53', nameEn: 'Bagerhat Sixty Dome Mosque', nameBn: 'বাগেরহাট ষাট গম্বুজ মসজিদ' },
    { id: 'spot-63', nameEn: 'Kuakata Daughter of Ocean', nameBn: 'কুয়াকাটা সমুদ্র সৈকত' },
  ];

  return (
    <footer
      id="main-footer"
      className="border-t border-[#D8D0BC] bg-[#EFEADC]/70 px-4 md:px-8 lg:px-12 py-10 transition-all space-y-10"
    >
      {/* Newsletter Subscription Component */}
      <div className="max-w-7xl mx-auto">
        <NewsletterSubscription language={language} />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 pb-8 border-b border-[#D8D0BC]">
        {/* Brand & Mission */}
        <div className="space-y-3 col-span-1 md:col-span-1 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full bg-[#8C3B2E] ring-2 ring-[#DE9B2E]"></div>
            <span className="text-xl font-bold font-serif text-[#0A2A21]">
              {language === 'en' ? 'Bangladesh' : 'বাংলাদেশ'}
            </span>
          </div>
          <p className="text-xs text-[#4B554E] leading-relaxed">
            {language === 'en'
              ? 'Discover the rich historical landmarks, riverine natural beauty, eco-parks, and living heritage across all 64 districts of Bangladesh.'
              : 'বাংলাদেশের সকল ৬৪ জেলার ইতিহাস, প্রাকৃতিক রূপ সৌন্দর্য, নদীমাতৃক পরিবেশ ও স্থানসমূহের জাতীয় ইকো-ট্যুরিজম ডিরেক্টরি।'}
          </p>
          <div className="pt-1">
            <a
              id="footer-facebook-btn"
              href="https://www.facebook.com/share/19W7bYHQkb/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1877F2] text-white text-xs font-bold hover:bg-[#166fe5] shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Facebook className="w-3.5 h-3.5 fill-white" />
              <span>{language === 'en' ? 'Follow on Facebook' : 'ফেসবুক পেজ / গ্রুপ'}</span>
            </a>
          </div>
        </div>

        {/* Navigation Quick Links */}
        <div className="space-y-3 col-span-1">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0A2A21]">
            {language === 'en' ? 'Navigation Menu' : 'ওয়েবসাইট মেনু'}
          </h4>
          <ul className="space-y-2 text-xs font-bold text-[#4B554E]">
            {footerNavItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate(item.id)}
                  className="hover:text-[#0F3B2E] transition-colors cursor-pointer text-left"
                >
                  {language === 'en' ? item.labelEn : item.labelBn}
                </button>
              </li>
            ))}
            {onOpenReportModal && (
              <li>
                <button
                  type="button"
                  onClick={onOpenReportModal}
                  className="text-[#8C3B2E] hover:text-[#0A2A21] font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-left pt-1"
                >
                  <Flag className="w-3.5 h-3.5 text-[#8C3B2E]" />
                  <span>{language === 'en' ? 'Submit Report / Feedback' : 'রিপোর্ট / অভিযোগ দাখিল'}</span>
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Top Tourist Destinations - Internal Crawlable Links */}
        <div className="space-y-3 col-span-1">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0A2A21]">
            {language === 'en' ? 'Top Destinations' : 'জনপ্রিয় গন্তব্যসমূহ'}
          </h4>
          <ul className="space-y-2 text-xs font-bold text-[#4B554E]">
            {topDestinations.map((dest) => (
              <li key={dest.id}>
                <a
                  href={`/?destination=${dest.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (onSelectDestinationById) {
                      onSelectDestinationById(dest.id);
                    }
                  }}
                  className="hover:text-[#8C3B2E] transition-colors cursor-pointer block truncate"
                  title={language === 'en' ? dest.nameEn : dest.nameBn}
                >
                  {language === 'en' ? dest.nameEn : dest.nameBn}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Key National Facts */}
        <div className="space-y-3 col-span-1 md:col-span-1 lg:col-span-1">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0A2A21]">
            {language === 'en' ? 'Heritage Highlights' : 'জাতীয় ঐতিহ্য তথ্য'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            {BANGLADESH_FACTS.slice(0, 4).map((fact, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-white/60 border border-[#D8D0BC] flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#4B554E] uppercase tracking-wider">
                  {language === 'en' ? fact.label : fact.labelBn}
                </span>
                <span className="text-xs font-bold text-[#0A2A21] font-serif truncate">
                  {language === 'en' ? fact.value : fact.valueBn}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[#6B756E] font-medium">
          <span>
            {language === 'en'
              ? '© Bangladesh Tourism & Heritage Portal'
              : '© বাংলাদেশ জাতীয় ঐতিহ্য ও পর্যটন ডিরেক্টরি'}
          </span>
          <span className="hidden sm:inline">|</span>
          <a
            href="/about"
            onClick={(e) => {
              if (onOpenInfoPage) {
                e.preventDefault();
                onOpenInfoPage('about');
              }
            }}
            className="hover:text-[#0A2A21] underline-offset-2 hover:underline transition-colors"
          >
            {language === 'en' ? 'About Us' : 'আমাদের সম্পর্কে'}
          </a>
          <a
            href="/contact"
            onClick={(e) => {
              if (onOpenInfoPage) {
                e.preventDefault();
                onOpenInfoPage('contact');
              }
            }}
            className="hover:text-[#0A2A21] underline-offset-2 hover:underline transition-colors"
          >
            {language === 'en' ? 'Contact & Helpline' : 'যোগাযোগ ও হেল্পলাইন'}
          </a>
          <a
            href="/privacy"
            onClick={(e) => {
              if (onOpenInfoPage) {
                e.preventDefault();
                onOpenInfoPage('privacy');
              }
            }}
            className="hover:text-[#0A2A21] underline-offset-2 hover:underline transition-colors"
          >
            {language === 'en' ? 'Privacy Policy' : 'গোপনীয়তা নীতি'}
          </a>
          <a
            href="/terms"
            onClick={(e) => {
              if (onOpenInfoPage) {
                e.preventDefault();
                onOpenInfoPage('terms');
              }
            }}
            className="hover:text-[#0A2A21] underline-offset-2 hover:underline transition-colors"
          >
            {language === 'en' ? 'Terms of Service' : 'শর্তাবলী'}
          </a>
        </div>

        <div className="flex items-center gap-4">
          <a
            id="footer-bottom-facebook-link"
            href="https://www.facebook.com/share/19W7bYHQkb/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#1877F2] hover:text-[#166fe5] font-bold hover:underline transition-colors cursor-pointer"
          >
            <Facebook className="w-3.5 h-3.5 fill-[#1877F2]" />
            <span>Facebook</span>
          </a>

          {onOpenReportModal && (
            <button
              type="button"
              onClick={onOpenReportModal}
              className="flex items-center gap-1.5 text-xs text-[#8C3B2E] hover:underline font-bold cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Report an Issue / Suggestion' : 'সমস্যা বা পরামর্শ জানান'}</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};

