/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AdSlotConfig, AdSlotId, Language } from '../types';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

interface AdRendererProps {
  slotConfig?: AdSlotConfig | null;
  slotId: AdSlotId;
  language: Language;
  className?: string;
  previewMode?: boolean; // In admin preview, shows even if disabled or placeholders
}

/**
 * Isolated dynamic container for executing Google AdSense, Adsterra, or custom HTML/Script code
 */
export const AdCodeFrame: React.FC<{
  code: string;
  slotId: AdSlotId;
  previewMode?: boolean;
}> = ({ code, slotId, previewMode }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameHeight, setFrameHeight] = useState<number>(() => {
    switch (slotId) {
      case 'header':
      case 'hero_bottom':
        return 90;
      case 'destination_infeed':
      case 'news':
        return 160;
      case 'article':
        return 200;
      case 'mobile_sticky':
        return 55;
      default:
        return 100;
    }
  });

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !code.trim()) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <base target="_blank" />
          <style>
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              min-height: 100%;
              background: transparent;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              overflow-x: hidden;
              font-family: system-ui, -apple-system, sans-serif;
            }
            img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
            ins.adsbygoogle { display: block; margin: 0 auto; }
            iframe { max-width: 100%; border: none; }
          </style>
        </head>
        <body>
          ${code}
          <script>
            // Auto resize notifier
            function updateHeight() {
              try {
                var body = document.body;
                var html = document.documentElement;
                var h = Math.max(
                  body.scrollHeight, body.offsetHeight,
                  html.clientHeight, html.scrollHeight, html.offsetHeight
                );
                if (h > 20) {
                  window.parent.postMessage({ type: 'DISCOVER_BD_AD_RESIZE', slotId: '${slotId}', height: h }, '*');
                }
              } catch(e) {}
            }
            window.addEventListener('load', function() {
              setTimeout(updateHeight, 300);
              setTimeout(updateHeight, 1000);
              setTimeout(updateHeight, 2500);
            });
            setTimeout(updateHeight, 500);
          </script>
        </body>
        </html>
      `;

      doc.open();
      doc.write(htmlContent);
      doc.close();
    } catch (err) {
      console.warn('Ad iframe injection error:', err);
    }
  }, [code, slotId]);

  // Listen to height resize events
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'DISCOVER_BD_AD_RESIZE' && e.data.slotId === slotId) {
        if (typeof e.data.height === 'number' && e.data.height > 25 && e.data.height < 600) {
          setFrameHeight(e.data.height);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [slotId]);

  return (
    <div className="w-full flex justify-center items-center overflow-hidden">
      <iframe
        ref={iframeRef}
        title={`ad-${slotId}`}
        style={{
          width: '100%',
          height: `${frameHeight}px`,
          minHeight: slotId === 'mobile_sticky' ? '50px' : '60px',
          border: 'none',
          overflow: 'hidden',
          display: 'block',
        }}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        scrolling="no"
      />
    </div>
  );
};

export const AdRenderer: React.FC<AdRendererProps> = ({
  slotConfig,
  slotId,
  language,
  className = '',
  previewMode = false,
}) => {
  // Mobile sticky dismissal state (per browser session)
  const [isDismissed, setIsDismissed] = useState(false);

  // If not enabled and not in preview mode, don't render anything
  if (!previewMode && (!slotConfig || !slotConfig.enabled)) {
    return null;
  }

  // If mobile sticky is dismissed by user
  if (slotId === 'mobile_sticky' && isDismissed && !previewMode) {
    return null;
  }

  // Device targeting logic:
  // If targetDevice is 'desktop', hide on mobile.
  // If targetDevice is 'mobile', hide on desktop.
  // If slotId is 'mobile_sticky', always hide on desktop (md:hidden)!
  let deviceVisibilityClass = '';
  if (slotId === 'mobile_sticky') {
    deviceVisibilityClass = 'block md:hidden';
  } else if (slotConfig?.targetDevice === 'desktop') {
    deviceVisibilityClass = 'hidden md:block';
  } else if (slotConfig?.targetDevice === 'mobile') {
    deviceVisibilityClass = 'block md:hidden';
  }

  const isAffiliate = slotConfig?.adType === 'affiliate';
  const hasAffiliateData = Boolean(slotConfig?.affiliateImage && slotConfig?.affiliateLink);
  const hasCodeData = Boolean(slotConfig?.code && slotConfig.code.trim().length > 0);

  // If live mode (not preview) and there's no actual content configured, avoid rendering empty box
  if (!previewMode) {
    if (isAffiliate && !hasAffiliateData) return null;
    if (!isAffiliate && !hasCodeData) return null;
  }

  const labelText =
    language === 'en'
      ? slotConfig?.customLabelEn || 'Advertisement'
      : slotConfig?.customLabelBn || 'বিজ্ঞাপন';

  // -------------------------------------------------------------
  // Mobile Sticky Bottom Ad Layout
  // -------------------------------------------------------------
  if (slotId === 'mobile_sticky') {
    return (
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F3]/95 backdrop-blur-md border-t border-[#D8D0BC] shadow-[0_-8px_20px_rgba(0,0,0,0.08)] px-3 py-1.5 transition-all duration-300 ${deviceVisibilityClass} ${className}`}
      >
        <div className="max-w-md mx-auto relative flex flex-col items-center">
          {/* Header Row: Subtle Ad Label + Close Button */}
          <div className="w-full flex items-center justify-between pb-1 text-[10px] text-[#717E77] font-medium tracking-wide">
            <span className="uppercase tracking-wider flex items-center gap-1 font-sans">
              <span>{labelText}</span>
              {isAffiliate && <span className="opacity-70">• Partner Deal</span>}
            </span>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              aria-label="Close Ad"
              className="p-1 rounded-full hover:bg-black/5 active:bg-black/10 text-neutral-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ad Content */}
          <div className="w-full flex items-center justify-center min-h-[50px] overflow-hidden">
            {isAffiliate ? (
              hasAffiliateData ? (
                <a
                  href={slotConfig?.affiliateLink || '#'}
                  target={slotConfig?.affiliateNewTab !== false ? '_blank' : '_self'}
                  rel="noopener noreferrer sponsored"
                  className="block w-full text-center overflow-hidden rounded-md transition-transform active:scale-[0.98]"
                >
                  <img
                    src={slotConfig?.affiliateImage}
                    alt={slotConfig?.affiliateAlt || labelText}
                    className="max-h-[60px] w-auto max-w-full object-contain mx-auto rounded"
                    loading="lazy"
                  />
                </a>
              ) : (
                <div className="py-2 text-[11px] text-neutral-400 font-sans">
                  {language === 'en' ? 'Affiliate Banner Placeholder' : 'এফিলিয়েট ব্যানার প্লেসহোল্ডার'}
                </div>
              )
            ) : hasCodeData ? (
              <AdCodeFrame code={slotConfig?.code || ''} slotId="mobile_sticky" previewMode={previewMode} />
            ) : (
              <div className="py-2 text-[11px] text-neutral-400 font-sans">
                {language === 'en' ? 'Mobile Ad Code Placement' : 'মোবাইল অ্যাড কোড প্লেসমেন্ট'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Standard In-Page Ad Slots (Header, Hero Bottom, In-Feed, News, Article)
  // -------------------------------------------------------------
  return (
    <div
      className={`w-full my-3 transition-opacity duration-300 ${deviceVisibilityClass} ${className}`}
      data-ad-slot={slotId}
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/70 border border-[#E5E0D0] shadow-2xs hover:shadow-xs transition-shadow">
          {/* Subtle Google AdSense compliant label */}
          <div className="w-full flex items-center justify-center gap-1.5 pb-1 text-[10px] uppercase tracking-wider text-[#8A968E] font-medium select-none">
            <span>{labelText}</span>
            {isAffiliate && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#FAF8F3] border border-[#E5E0D0] text-[#0F3B2E] font-semibold lowercase">
                sponsored
              </span>
            )}
          </div>

          {/* Ad Content */}
          <div className="w-full flex items-center justify-center overflow-hidden">
            {isAffiliate ? (
              hasAffiliateData ? (
                <a
                  href={slotConfig?.affiliateLink || '#'}
                  target={slotConfig?.affiliateNewTab !== false ? '_blank' : '_self'}
                  rel="noopener noreferrer sponsored"
                  className="group block relative w-full text-center overflow-hidden rounded-xl transition-all duration-300 hover:opacity-95"
                >
                  <img
                    src={slotConfig?.affiliateImage}
                    alt={slotConfig?.affiliateAlt || labelText}
                    className="max-h-[140px] md:max-h-[190px] w-auto max-w-full object-contain mx-auto rounded-lg shadow-2xs group-hover:scale-[1.01] transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span>{language === 'en' ? 'Visit Partner' : 'ভিজিট করুন'}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                </a>
              ) : (
                <div className="py-6 text-center text-xs text-neutral-400 font-sans border border-dashed border-[#D8D0BC] rounded-xl w-full">
                  {language === 'en'
                    ? 'Affiliate Banner Slot (Please provide banner image & URL)'
                    : 'এফিলিয়েট ব্যানার স্লট (ব্যানার ছবি ও লিংক প্রদান করুন)'}
                </div>
              )
            ) : hasCodeData ? (
              <AdCodeFrame code={slotConfig?.code || ''} slotId={slotId} previewMode={previewMode} />
            ) : (
              <div className="py-6 text-center text-xs text-neutral-400 font-sans border border-dashed border-[#D8D0BC] rounded-xl w-full">
                {language === 'en'
                  ? `${slotConfig?.adType === 'adsense' ? 'Google AdSense' : 'Adsterra'} Script Code Placement`
                  : `${slotConfig?.adType === 'adsense' ? 'গুগল অ্যাডসেন্স' : 'অ্যাডস্টেরা'} স্ক্রিপ্ট কোড প্লেসমেন্ট`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
