/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Shield, FileText, Phone, Mail, MapPin, Building, Heart, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Language } from '../types';

export type InfoPageType = 'about' | 'contact' | 'privacy' | 'terms';

interface InfoPageModalProps {
  page: InfoPageType | null;
  language: Language;
  onClose: () => void;
  onOpenReportModal?: () => void;
}

export const InfoPageModal: React.FC<InfoPageModalProps> = ({
  page,
  language,
  onClose,
  onOpenReportModal,
}) => {
  if (!page) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-3xl border border-[#D8D0BC] shadow-2xl p-6 sm:p-8 space-y-6 my-auto max-h-[90vh] overflow-y-auto relative text-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#F6F3EA] hover:bg-[#EFEADC] text-neutral-700 transition-all cursor-pointer shadow-xs"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* --- ABOUT PAGE (/about) --- */}
        {page === 'about' && (
          <div className="space-y-6">
            <div className="border-b border-[#D8D0BC] pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF2ED] text-[#0F3B2E] text-xs font-bold mb-2">
                <Building className="w-3.5 h-3.5 text-[#DE9B2E]" />
                <span>{language === 'en' ? 'National Tourism Portal' : 'জাতীয় পর্যটন পোর্টাল'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'About Bangladesh Tourism' : 'আমাদের সম্পর্কে'}
              </h2>
              <p className="text-xs sm:text-sm text-[#4B554E] mt-1">
                {language === 'en'
                  ? 'Official Eco-Tourism & Cultural Heritage Directory across 64 Districts'
                  : '৬৪ জেলার প্রাকৃতিক সৌন্দর্য, প্রত্নতত্ত্ব ও সাংস্কৃতিক ঐতিহ্যের তথ্যকোষ'}
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#3A453F] leading-relaxed">
              <p>
                {language === 'en'
                  ? 'The Bangladesh Tourism portal is dedicated to celebrating the sublime natural wonders, rich historical tapestry, vibrant folk traditions, and living heritage across every corner of Bangladesh.'
                  : 'বাংলাদেশ পর্যটন পোর্টালটি দেশের প্রতিটি প্রান্তের অপরূপ প্রাকৃতিক দৃশ্য, সমৃদ্ধ ঐতিহাসিক ঐতিহ্য, লোকশিল্প এবং নদীমাতৃক সংস্কৃতিকে দেশি-বিদেশি ভ্রমণপিপাসুদের কাছে তুলে ধরার একটি প্ল্যাটফর্ম।'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 py-2">
                <div className="p-4 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC] space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-[#0F3B2E] text-white flex items-center justify-center font-bold text-sm">
                    64
                  </div>
                  <h4 className="font-bold text-[#0A2A21] font-serif">
                    {language === 'en' ? '64 Districts' : '৬৪টি জেলা'}
                  </h4>
                  <p className="text-xs text-[#6B756E]">
                    {language === 'en'
                      ? 'Comprehensive guides covering hill tracts to coastal islands.'
                      : 'পাহাড়, চা বাগান থেকে শুরু করে সমুদ্র উপকূল পর্যন্ত বিস্তৃত।'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC] space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-[#8C3B2E] text-white flex items-center justify-center font-bold text-sm">
                    480+
                  </div>
                  <h4 className="font-bold text-[#0A2A21] font-serif">
                    {language === 'en' ? 'Destinations' : '৪8০+ দর্শনীয় স্থান'}
                  </h4>
                  <p className="text-xs text-[#6B756E]">
                    {language === 'en'
                      ? 'Verified travel data with coordinates and weather.'
                      : 'সরাসরি জিপিএস লোকেশন ও লাইভ আবহাওয়া তথ্য সহ।'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC] space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-[#DE9B2E] text-[#0A2A21] flex items-center justify-center font-bold text-sm">
                    100%
                  </div>
                  <h4 className="font-bold text-[#0A2A21] font-serif">
                    {language === 'en' ? 'Eco-Tourism' : 'ইকো-ট্যুরিজম'}
                  </h4>
                  <p className="text-xs text-[#6B756E]">
                    {language === 'en'
                      ? 'Championing sustainable travel and local community empowerment.'
                      : 'পরিবেশবান্ধব ও প্লাস্টিকমুক্ত দায়িত্বশীল ভ্রমণ।'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#EAF2ED] border border-[#0F3B2E]/20 space-y-2">
                <h4 className="font-bold text-[#0F3B2E] flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#8C3B2E]" />
                  <span>{language === 'en' ? 'Our Guiding Mission' : 'আমাদের লক্ষ্য ও উদ্দেশ্য'}</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#27483B]">
                  {language === 'en'
                    ? 'To promote safe, inclusive, environmentally conscious tourism that honours indigenous tribes, protects our fragile mangrove ecosystems, and stimulates the regional economy throughout all divisions of Bangladesh.'
                    : 'পরিবেশ ও জীববৈচিত্র্য রক্ষা করে, স্থানীয় আদিবাসী সংস্কৃতির মর্যাদা সমুন্নত রেখে একটি নিরাপদ, দায়িত্বশীল ও সমৃদ্ধ জাতীয় পর্যটন ব্যবস্থা গড়ে তোলা।'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- CONTACT PAGE (/contact) --- */}
        {page === 'contact' && (
          <div className="space-y-6">
            <div className="border-b border-[#D8D0BC] pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCECE8] text-[#8C3B2E] text-xs font-bold mb-2">
                <Phone className="w-3.5 h-3.5 text-[#8C3B2E]" />
                <span>{language === 'en' ? 'Official Contacts & Helplines' : 'অফিসিয়াল যোগাযোগ ও হটলাইন'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'Contact Us & Emergency Desk' : 'যোগাযোগ ও পর্যটক সহায়তা'}
              </h2>
              <p className="text-xs sm:text-sm text-[#4B554E] mt-1">
                {language === 'en'
                  ? 'Get in touch with Bangladesh Tourism or reach Tourist Police emergency hotlines 24/7.'
                  : 'বাংলাদেশ পর্যটন তথ্য ও জরুরি ২৪ ঘণ্টা ট্যুরিস্ট পুলিশ সহায়তা পেতে যোগাযোগ করুন।'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC] space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-[#0A2A21]">
                  <MapPin className="w-4 h-4 text-[#8C3B2E]" />
                  <span>{language === 'en' ? 'Headquarters' : 'প্রধান কার্যালয়'}</span>
                </div>
                <p className="text-xs text-[#4B554E] leading-relaxed">
                  {language === 'en'
                    ? 'Parjatan Bhaban, Plot E-5 C/1, Agargaon Administrative Area, Sher-e-Bangla Nagar, Dhaka-1207, Bangladesh.'
                    : 'পর্যটন ভবন, প্লট ই-৫ সি/১, আগারগাঁও প্রশাসনিক এলাকা, শেরেবাংলা নগর, ঢাকা-১২০৭, বাংলাদেশ।'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC] space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-[#0A2A21]">
                  <Mail className="w-4 h-4 text-[#0F3B2E]" />
                  <span>{language === 'en' ? 'Email & Digital Inquiries' : 'ইমেইল ও যোগাযোগ'}</span>
                </div>
                <p className="text-xs text-[#4B554E] leading-relaxed">
                  <strong>Email:</strong> info@tourismboard.gov.bd<br />
                  <strong>Support:</strong> helpdesk@bdtourismboard.org<br />
                  <strong>Web:</strong> bdtourismboard.netlify.app
                </p>
              </div>
            </div>

            {/* Emergency Tourist Police Banner */}
            <div className="p-5 rounded-2xl bg-[#FFF6E5] border border-[#DE9B2E] space-y-3">
              <div className="flex items-center gap-2 text-[#8C3B2E] font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-[#DE9B2E]" />
                <span>{language === 'en' ? '24/7 Tourist Police Emergency Helpline' : '২৪ ঘণ্টা ট্যুরিস্ট পুলিশ জরুরি সেবা'}</span>
              </div>
              <p className="text-xs text-[#6B501B] leading-relaxed">
                {language === 'en'
                  ? 'If you encounter any safety issue, harassment, loss of documents, or require emergency medical assistance during travel anywhere in Bangladesh:'
                  : 'ভ্রমণকালে যেকোনো দুর্ঘটনা, নিরাপত্তা বা জরুরি সহায়তায় ট্যুরিস্ট পুলিশের এই নম্বরে কল করুন:'}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href="tel:999"
                  className="px-4 py-2 rounded-xl bg-[#8C3B2E] text-white font-bold text-xs hover:bg-[#722F24] flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>National Emergency: 999</span>
                </a>
                <a
                  href="tel:+8801320160160"
                  className="px-4 py-2 rounded-xl bg-[#0F3B2E] text-white font-bold text-xs hover:bg-[#0A2A21] flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Tourist Police: +880 1320-160160</span>
                </a>
              </div>
            </div>

            {onOpenReportModal && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenReportModal();
                  }}
                  className="px-5 py-2.5 rounded-xl border border-[#D8D0BC] bg-[#F6F3EA] text-[#0A2A21] font-bold text-xs hover:bg-[#EFEADC] transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Have Feedback or Complaint? Submit Report' : 'অভিযোগ বা মতামত থাকলে রিপোর্ট দাখিল করুন'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- PRIVACY POLICY (/privacy) --- */}
        {page === 'privacy' && (
          <div className="space-y-6">
            <div className="border-b border-[#D8D0BC] pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF2ED] text-[#0F3B2E] text-xs font-bold mb-2">
                <Shield className="w-3.5 h-3.5 text-[#0F3B2E]" />
                <span>{language === 'en' ? 'Data Protection & Security' : 'তথ্য সুরক্ষা ও গোপনীয়তা'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'Privacy Policy' : 'গোপনীয়তা নীতি'}
              </h2>
              <p className="text-xs text-[#6B756E] mt-1">
                {language === 'en' ? 'Last updated: January 2025' : 'সর্বশেষ হালনাগাদ: জানুয়ারি ২০২৫'}
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#3A453F] leading-relaxed">
              <p>
                {language === 'en'
                  ? 'Your privacy is paramount to the Bangladesh Tourism Board. This Privacy Policy details how we collect, safeguard, and utilize data when you browse our portal, bookmark destinations, or share community photo stories.'
                  : 'বাংলাদেশ পর্যটন বোর্ড আপনার তথ্যের সুরক্ষাকে সর্বোচ্চ অগ্রাধিকার দেয়। আমাদের ওয়েবসাইট ব্যবহারকালে আপনার তথ্য কীভাবে সংগৃহীত ও সংরক্ষিত হয় তা নিচে বর্ণিত হলো।'}
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#F6F3EA] border border-[#D8D0BC]">
                  <h4 className="font-bold text-[#0A2A21] flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-[#0F3B2E]" />
                    <span>{language === 'en' ? '1. Account Information' : '১. একাউন্ট ও ব্যক্তিগত তথ্য'}</span>
                  </h4>
                  <p className="text-xs text-[#55625B]">
                    {language === 'en'
                      ? 'When you register via Firebase Authentication, we store only your name, email, and preferred language. We do not sell or lease personal data to external advertisers.'
                      : 'ফায়ারবেস অথেন্টিকেশন দিয়ে রেজিস্ট্রেশন করলে শুধুমাত্র নাম, ইমেইল ও ভাষা সংরক্ষণ করা হয়। কোনো বিজ্ঞাপনদাতার কাছে তথ্য বিক্রি করা হয় না।'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F6F3EA] border border-[#D8D0BC]">
                  <h4 className="font-bold text-[#0A2A21] flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-[#0F3B2E]" />
                    <span>{language === 'en' ? '2. Travel Wishlist & Local Storage' : '২. পছন্দতালিকা ও ব্রাউজার স্টোরেজ'}</span>
                  </h4>
                  <p className="text-xs text-[#55625B]">
                    {language === 'en'
                      ? 'Your saved destinations and customized trip itineraries are synchronized via Cloud Firestore for authenticated users and kept locally for guests for seamless offline accessibility.'
                      : 'সংরক্ষিত স্থান ও ভ্রমণ পরিকল্পনা ফায়ারস্টোরে নিরাপদে সংরক্ষিত হয় যেন আপনি যেকোনো ডিভাইস থেকে অ্যাক্সেস করতে পারেন।'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F6F3EA] border border-[#D8D0BC]">
                  <h4 className="font-bold text-[#0A2A21] flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-[#0F3B2E]" />
                    <span>{language === 'en' ? '3. Photo Submissions & Moderation' : '৩. ছবি আপলোড ও নিরাপত্তা'}</span>
                  </h4>
                  <p className="text-xs text-[#55625B]">
                    {language === 'en'
                      ? 'Photos submitted to the Community Gallery undergo automated safety checks to eliminate explicit, abusive, or copyright-infringing content before public display.'
                      : 'কমিউনিটি গ্যালারিতে জমা দেওয়া ছবি স্বয়ংক্রিয়ভাবে ফিল্টার করা হয় যাতে কোনো অশোভন বা কপিরাইট লঙ্ঘিত কনটেন্ট প্রদর্শিত না হয়।'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TERMS OF SERVICE (/terms) --- */}
        {page === 'terms' && (
          <div className="space-y-6">
            <div className="border-b border-[#D8D0BC] pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF6E5] text-[#8C3B2E] text-xs font-bold mb-2">
                <FileText className="w-3.5 h-3.5 text-[#DE9B2E]" />
                <span>{language === 'en' ? 'User Agreement & Eco Guidelines' : 'শর্তাবলী ও ভ্রমণ নিয়মাবলী'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? 'Terms of Service' : 'ব্যবহারের নিয়মাবলী ও শর্তাবলী'}
              </h2>
              <p className="text-xs text-[#6B756E] mt-1">
                {language === 'en' ? 'Guidelines for respectful & sustainable travel in Bangladesh' : 'দায়িত্বশীল ও টেকসই ভ্রমণের জাতীয় নির্দেশিকা'}
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#3A453F] leading-relaxed">
              <p>
                {language === 'en'
                  ? 'By utilizing the Bangladesh Tourism portal, you agree to comply with standard ethical travel protocols, digital safety rules, and heritage preservation guidelines.'
                  : 'এই ওয়েবসাইট ব্যবহারের মাধ্যমে আপনি বাংলাদেশের পরিবেশ রক্ষা, ঐতিহ্য সংরক্ষণ এবং দায়িত্বশীল পর্যটনের নীতিমালা মেনে চলতে সম্মত হচ্ছেন।'}
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#F6F3EA] border border-[#D8D0BC]">
                  <h4 className="font-bold text-[#0A2A21] mb-1">
                    {language === 'en' ? '1. Environmental Preservation & Zero Plastic' : '১. পরিবেশ রক্ষা ও প্লাস্টিক বর্জন'}
                  </h4>
                  <p className="text-xs text-[#55625B]">
                    {language === 'en'
                      ? 'Visitors to Saint Martin’s Island, the Sundarbans, and forested hills are strictly prohibited from dumping single-use plastics. Always carry your waste back to designated disposal facilities.'
                      : 'সেন্টমার্টিন, সুন্দরবন বা পাহাড়ি অঞ্চলে একবার ব্যবহারযোগ্য প্লাস্টিক ফেলা কঠোরভাবে নিষিদ্ধ। নিজ দায়িত্বে বর্জ্য ফিরিয়ে আনুন।'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F6F3EA] border border-[#D8D0BC]">
                  <h4 className="font-bold text-[#0A2A21] mb-1">
                    {language === 'en' ? '2. Respect for Indigenous Cultures' : '২. স্থানীয় সংস্কৃতি ও আদিবাসীদের প্রতি সম্মান'}
                  </h4>
                  <p className="text-xs text-[#55625B]">
                    {language === 'en'
                      ? 'When visiting tribal communities in Bandarban, Rangamati, or Khagrachhari, always obtain verbal consent before taking portraits and honor local customs and spiritual beliefs.'
                      : 'পার্বত্য অঞ্চলের আদিবাসী জনগোষ্ঠী এবং গ্রামীণ ঐতিহ্যের প্রতি শ্রদ্ধাশীল থাকুন। ছবি তোলার পূর্বে অনুমতি গ্রহণ করুন।'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F6F3EA] border border-[#D8D0BC]">
                  <h4 className="font-bold text-[#0A2A21] mb-1">
                    {language === 'en' ? '3. User Contributions & Copyright' : '৩. ইউজার কনটেন্ট ও কপিরাইট'}
                  </h4>
                  <p className="text-xs text-[#55625B]">
                    {language === 'en'
                      ? 'All photos and stories uploaded remain your creative property, while granting Bangladesh Tourism a non-exclusive license to showcase them to promote sustainable travel.'
                      : 'আপনার আপলোডকৃত ছবি আপনারই থাকবে, তবে প্ল্যাটফর্মে প্রদর্শন এবং দেশের ইতিবাচক পর্যটন প্রচারে ব্যবহারের অনুমতি থাকবে।'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Close */}
        <div className="pt-3 border-t border-[#D8D0BC] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-[#0F3B2E] text-white font-bold text-xs hover:bg-[#0A2A21] transition-all cursor-pointer shadow-xs"
          >
            {language === 'en' ? 'Close Window' : 'বন্ধ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};
