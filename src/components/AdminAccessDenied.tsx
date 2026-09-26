/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Lock, Home, LogIn } from 'lucide-react';
import { Language, AppUser } from '../types';

interface AdminAccessDeniedProps {
  language: Language;
  currentUser: AppUser | null;
  onOpenAuth: () => void;
  onNavigateHome: () => void;
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  language,
  currentUser,
  onOpenAuth,
  onNavigateHome,
}) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-[#FAF8F3]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-xl w-full text-center space-y-6 bg-white p-8 sm:p-12 rounded-3xl border border-rose-200 shadow-md relative overflow-hidden"
      >
        {/* Decorative alert glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Shield Alert Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
            {language === 'en' ? 'Access Restricted' : 'অনুমোদনহীন প্রবেশাধিকার'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2A21] font-serif">
            {language === 'en' ? 'Administrator Privileges Required' : 'অ্যাডমিনিস্ট্রেটর পারমিশন আবশ্যক'}
          </h1>
          <p className="text-sm sm:text-base text-[#5B655E] max-w-md mx-auto leading-relaxed">
            {currentUser
              ? language === 'en'
                ? `You are signed in as (${currentUser.email || currentUser.displayName}), but this account does not have verified Firebase Admin role.`
                : `আপনি (${currentUser.email || currentUser.displayName}) হিসেবে লগইন করেছেন, কিন্তু এই অ্যাকাউন্টে ভেরিফাইড Firebase Admin role নেই।`
              : language === 'en'
              ? 'You must sign in with a verified Firebase administrator account to access the Admin Control Center.'
              : 'অ্যাডমিন প্যানেল ব্যবহারের জন্য Firebase-এ নিবন্ধিত অনুমোদিত অ্যাডমিন অ্যাকাউন্টে সাইন ইন করুন।'}
          </p>
        </div>

        {/* Policy notice */}
        <div className="p-4 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC] text-xs text-[#4B554E] leading-relaxed text-left flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-[#DE9B2E] shrink-0 mt-0.5" />
          <span>
            {language === 'en'
              ? 'Security Policy: Admin access is strictly enforced via Firebase Custom Claims and Security Rules. Email patterns or local storage tokens are never accepted.'
              : 'নিরাপত্তা নীতি: অ্যাডমিন অ্যাক্সেস শুধুমাত্র Firebase Custom Claims এবং সিকিউরিটি রুলসের মাধ্যমে নিশ্চিত করা হয়। কোনো প্রকার লোকাল টোকেন বা ইমেইল প্যাটার্ন গ্রহণযোগ্য নয়।'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {!currentUser ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#0F3B2E] text-white font-semibold text-sm hover:bg-[#0A2A21] transition-all shadow-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'Sign In as Admin' : 'অ্যাডমিন হিসেবে সাইন ইন'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#0F3B2E] text-white font-semibold text-sm hover:bg-[#0A2A21] transition-all shadow-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'Switch Account' : 'অন্য অ্যাকাউন্টে প্রবেশ'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-[#0A2A21] font-semibold text-sm hover:bg-[#F6F3EA] border border-[#D8D0BC] transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 text-[#DE9B2E]" />
            <span>{language === 'en' ? 'Return to Home' : 'প্রচ্ছদে ফিরে যান'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
