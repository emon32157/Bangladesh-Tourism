import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Language } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface OfflineIndicatorProps {
  language: Language;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language }) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#0A2A21] text-white border border-[#DE9B2E]/60 shadow-2xl text-xs font-semibold backdrop-blur-md"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <WifiOff className="w-4 h-4 text-[#DE9B2E]" />
          <span>
            {language === 'en'
              ? 'Offline Mode — Showing cached destinations and guides'
              : 'অফলাইন মোড — সংরক্ষিত তথ্য প্রদর্শিত হচ্ছে'}
          </span>
        </motion.div>
      )}

      {isOnline && showRestored && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-5 left-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-800 text-white border border-emerald-400 shadow-2xl text-xs font-semibold"
        >
          <Wifi className="w-4 h-4 text-emerald-200" />
          <span>
            {language === 'en' ? 'Back Online' : 'পুনরায় ইন্টারনেট সংযোগ সক্রিয়'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
