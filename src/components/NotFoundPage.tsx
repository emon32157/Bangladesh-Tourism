/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Compass, Home, MapPin, Newspaper, ArrowLeft, Search, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface NotFoundPageProps {
  language: Language;
  resourceType?: 'destination' | 'news' | 'post' | 'festival' | 'experience' | 'district' | 'page';
  slug?: string;
  onNavigateHome: () => void;
  onExploreDestinations: () => void;
  onExploreNews: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  language,
  resourceType = 'page',
  slug,
  onNavigateHome,
  onExploreDestinations,
  onExploreNews,
}) => {
  const navigate = useNavigate();

  const getResourceTitle = () => {
    switch (resourceType) {
      case 'destination':
        return language === 'en' ? 'Destination Not Found' : 'গন্তব্যটি খুঁজে পাওয়া যায়নি';
      case 'news':
        return language === 'en' ? 'News Article Not Found' : 'সংবাদটি খুঁজে পাওয়া যায়নি';
      case 'post':
        return language === 'en' ? 'Story or Post Not Found' : 'ভ্রমণ গল্প বা পোস্টটি পাওয়া যায়নি';
      case 'festival':
        return language === 'en' ? 'Festival Not Found' : 'উৎসবটি পাওয়া যায়নি';
      case 'experience':
        return language === 'en' ? 'Experience Not Found' : 'অভিজ্ঞতাটি পাওয়া যায়নি';
      case 'district':
        return language === 'en' ? 'District Not Found' : 'জেলাটি পাওয়া যায়নি';
      default:
        return language === 'en' ? 'Page Not Found' : 'পৃষ্ঠাটি খুঁজে পাওয়া যায়নি';
    }
  };

  const getResourceMessage = () => {
    if (slug) {
      if (resourceType === 'destination') {
        return language === 'en'
          ? `We couldn't find any destination matching "${slug}". It may have been renamed or does not exist in our catalog.`
          : `"${slug}" শিরোনামের কোনো পর্যটন গন্তব্য পাওয়া যায়নি। এটি হয়তো পরিবর্তিত হয়েছে অথবা ডাটাবেজে নেই।`;
      }
      if (resourceType === 'news') {
        return language === 'en'
          ? `The news bulletin or announcement "${slug}" does not exist or may have expired.`
          : `"${slug}" শিরোনামের সংবাদ বুলেটিনটি খুঁজে পাওয়া যায়নি।`;
      }
    }
    return language === 'en'
      ? 'The link you followed may be broken, or the page may have been removed or moved to a new address.'
      : 'আপনি যে লিংকটিতে প্রবেশ করেছেন তা হয়তো পরিবর্তিত হয়েছে অথবা পৃষ্ঠাটি সরিয়ে ফেলা হয়েছে।';
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-[#FAF8F3]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl w-full text-center space-y-8 bg-white p-8 sm:p-12 rounded-3xl border border-[#D8D0BC] shadow-sm relative overflow-hidden"
      >
        {/* Subtle decorative background watermarks */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#DE9B2E]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#0F3B2E]/10 rounded-full blur-2xl pointer-events-none" />

        {/* 404 Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8C3B2E]/10 text-[#8C3B2E] text-sm font-bold tracking-widest uppercase border border-[#8C3B2E]/20">
          <Compass className="w-4 h-4 animate-spin-slow text-[#DE9B2E]" />
          <span>Error 404</span>
        </div>

        {/* Main Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-black text-[#0A2A21] font-serif tracking-tight">
            {getResourceTitle()}
          </h1>
          <p className="text-base sm:text-lg text-[#5B655E] max-w-lg mx-auto leading-relaxed">
            {getResourceMessage()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0F3B2E] text-white font-semibold text-sm hover:bg-[#0A2A21] transition-all shadow-sm cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#DE9B2E]" />
            <span>{language === 'en' ? 'Back to Home' : 'প্রচ্ছদে ফিরে যান'}</span>
          </button>

          <button
            type="button"
            onClick={onExploreDestinations}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#F6F3EA] text-[#0A2A21] font-semibold text-sm hover:bg-[#EFEADB] border border-[#D8D0BC] transition-all cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-[#DE9B2E]" />
            <span>{language === 'en' ? 'Explore Destinations' : 'গন্তব্যসমূহ দেখুন'}</span>
          </button>

          <button
            type="button"
            onClick={onExploreNews}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#F6F3EA] text-[#0A2A21] font-semibold text-sm hover:bg-[#EFEADB] border border-[#D8D0BC] transition-all cursor-pointer"
          >
            <Newspaper className="w-4 h-4 text-[#DE9B2E]" />
            <span>{language === 'en' ? 'Latest News' : 'তাজা সংবাদ'}</span>
          </button>
        </div>

        {/* Additional Help Section */}
        <div className="pt-6 border-t border-[#D8D0BC]/60 flex items-center justify-center gap-2 text-xs text-[#7B857E]">
          <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E]" />
          <span>
            {language === 'en'
              ? 'Looking for a specific place in Bangladesh? Use the search bar in the header.'
              : 'নির্দিষ্ট কোনো স্থান খুঁজছেন? ওপরের সার্চ বাটন ব্যবহার করুন।'}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
