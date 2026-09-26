import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types';
import { Smartphone, Download, Check, X, Share2, PlusSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PWAInstallButtonProps {
  language: Language;
  variant?: 'navbar' | 'floating' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language,
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed in standalone mode, suppress
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      await install();
      setIsInstalling(false);
    } else {
      setShowGuideModal(true);
    }
  };

  // Render Navbar Button
  if (variant === 'navbar') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          title={language === 'en' ? 'Install App on Phone / Desktop' : 'অ্যাপ ইনস্টল করুন'}
          className="relative inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs font-bold bg-[#DE9B2E]/15 hover:bg-[#DE9B2E] text-[#0A2A21] hover:text-[#0A2A21] border border-[#DE9B2E]/40 hover:border-[#DE9B2E] transition-all cursor-pointer shadow-2xs group shrink-0"
        >
          <span className="w-2 h-2 rounded-full bg-[#DE9B2E] animate-ping group-hover:hidden" />
          <Smartphone className="w-3.5 h-3.5 text-[#0F3B2E] group-hover:scale-110 transition-transform" />
          <span className="whitespace-nowrap">
            {language === 'en' ? 'Install App' : 'অ্যাপ ইনস্টল'}
          </span>
        </button>

        {/* Guided Install Modal for iOS & Desktop Chrome */}
        <AnimatePresence>
          {showGuideModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#D8D0BC] text-[#0A2A21] space-y-5"
              >
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="absolute top-5 right-5 p-2 rounded-full bg-[#F6F3EA] text-[#6B756E] hover:text-[#0A2A21] hover:bg-[#EFEADC] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#0F3B2E] text-[#DE9B2E] flex items-center justify-center shadow-md p-2">
                    <img src="/icon.svg" alt="App Icon" className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-serif text-[#0A2A21]">
                      {language === 'en' ? 'Install BD Tourism App' : 'বাংলাদেশ ট্যুরিজম অ্যাপ'}
                    </h3>
                    <p className="text-xs text-[#4B554E]">
                      {language === 'en'
                        ? 'Fast, lightweight & works offline on Android, iOS & PC'
                        : 'মোবাইল ও পিসিতে দ্রুত ও ইন্টারনেট ছাড়া ব্যবহারের উপযোগী'}
                    </p>
                  </div>
                </div>

                {isIOS ? (
                  <div className="space-y-3 p-4 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC]">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0F3B2E]">
                      {language === 'en' ? 'How to install on iPhone & iPad:' : 'আইফোনে যেভাবে ইনস্টল করবেন:'}
                    </h4>
                    <ol className="text-xs sm:text-sm text-[#4B554E] space-y-2 list-decimal list-inside leading-relaxed">
                      <li>
                        {language === 'en' ? (
                          <span>Tap the <strong className="text-[#0A2A21]">Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> at bottom of Safari</span>
                        ) : (
                          <span>সাফারি ব্রাউজারের নিচে <strong className="text-[#0A2A21]">Share</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> আইকনে চাপুন</span>
                        )}
                      </li>
                      <li>
                        {language === 'en' ? (
                          <span>Scroll down and tap <strong className="text-[#0A2A21]">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-[#0F3B2E]" /></span>
                        ) : (
                          <span>মেনু স্ক্রোল করে <strong className="text-[#0A2A21]">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-[#0F3B2E]" /> সিলেক্ট করুন</span>
                        )}
                      </li>
                      <li>
                        {language === 'en' ? (
                          <span>Tap <strong className="text-[#0A2A21]">Add</strong> in the top-right corner to finish</span>
                        ) : (
                          <span>উপরের ডানপাশে <strong className="text-[#0A2A21]">Add</strong> বাটনে চাপ দিন</span>
                        )}
                      </li>
                    </ol>
                  </div>
                ) : (
                  <div className="space-y-3 p-4 rounded-2xl bg-[#F6F3EA] border border-[#D8D0BC]">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0F3B2E]">
                      {language === 'en' ? 'Android & Chrome Quick Install:' : 'অ্যান্ড্রয়েড ও ক্রোম ইনস্টল নির্দেশিকা:'}
                    </h4>
                    <ul className="text-xs sm:text-sm text-[#4B554E] space-y-2 leading-relaxed">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          {language === 'en'
                            ? 'Tap the 3-dots menu (⋮) in Chrome and select "Install App" or "Add to Home Screen".'
                            : 'ব্রাউজারের ৩-ডট মেনুতে (⋮) ক্লিক করে "Install App" বা "Add to Home screen" নির্বাচন করুন।'}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          {language === 'en'
                            ? 'The app will launch in standalone full-screen mode like a native Android APK.'
                            : 'এটি কোনো বড় সাইজ ছাড়াই ইনস্টল হয়ে সরাসরি পূর্ণ স্ক্রিনে অ্যাপের মতো চলবে।'}
                        </span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#4B554E]">
                  <div className="p-2.5 rounded-xl bg-white border border-[#D8D0BC] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E] shrink-0" />
                    <span>{language === 'en' ? 'Instant Launch' : 'তাত্ক্ষণিক লোড'}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#D8D0BC] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#DE9B2E] shrink-0" />
                    <span>{language === 'en' ? 'Offline Cache' : 'অফলাইন ক্যাশিং'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="w-full py-3 rounded-2xl bg-[#0F3B2E] hover:bg-[#0A2A21] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  {language === 'en' ? 'Got It, Close' : 'বুঝেছি, বন্ধ করুন'}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Floating button variant
  return null;
};
