/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AdSlotConfig,
  AdSlotId,
  AdType,
  AdDeviceTarget,
  AllAdsConfig,
  Language,
} from '../types';
import {
  saveAdSlotToFirebase,
  resetAdSlotInFirebase,
} from '../lib/adsService';
import { uploadImageToImgBB } from '../lib/imgbb';
import { AdRenderer } from './AdRenderer';
import {
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Eye,
  Save,
  Trash2,
  UploadCloud,
  Globe,
  Monitor,
  Smartphone,
  ExternalLink,
  Layers,
  Sparkles,
  Code,
  Image as ImageIcon,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';

interface AdminAdsSectionProps {
  language: Language;
  adsConfig: AllAdsConfig;
  onUpdateAdsConfig: (updated: AllAdsConfig) => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
  currentUserEmail?: string | null;
}

const SLOT_ORDER: AdSlotId[] = [
  'header',
  'hero_bottom',
  'destination_infeed',
  'news',
  'article',
  'mobile_sticky',
];

export const AdminAdsSection: React.FC<AdminAdsSectionProps> = ({
  language,
  adsConfig,
  onUpdateAdsConfig,
  showToast,
  currentUserEmail,
}) => {
  const [selectedSlotId, setSelectedSlotId] = useState<AdSlotId>('header');
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const [clearingSlotId, setClearingSlotId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Local draft state for the current editing slot
  const [draftConfig, setDraftConfig] = useState<AdSlotConfig>(() => ({
    ...adsConfig[selectedSlotId],
  }));

  // Update draft whenever selected slot changes
  const handleSelectSlot = (id: AdSlotId) => {
    setSelectedSlotId(id);
    setDraftConfig({ ...adsConfig[id] });
    setUploadError(null);
  };

  // Handle local state updates
  const updateDraft = <K extends keyof AdSlotConfig>(key: K, value: AdSlotConfig[K]) => {
    setDraftConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Image Upload handler for Affiliate Banner
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(
        language === 'en' ? 'Please select a valid image file' : 'একটি ছবি ফাইল সিলেক্ট করুন'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError(
        language === 'en' ? 'Image file must be under 10MB' : 'ছবি ফাইলের সাইজ ১০ মেগাবাইটের কম হতে হবে'
      );
      return;
    }

    setUploadingImage(true);
    setUploadError(null);
    try {
      const result = await uploadImageToImgBB(file);
      updateDraft('affiliateImage', result.displayUrl || result.url);
      showToast(
        language === 'en' ? 'Affiliate banner uploaded successfully!' : 'এফিলিয়েট ব্যানার আপলোড সম্পন্ন হয়েছে!'
      );
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Image upload failed');
      showToast(language === 'en' ? 'Failed to upload image' : 'ছবি আপলোড ব্যর্থ হয়েছে', 'error');
    } finally {
      setUploadingImage(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Save current slot to Firebase & local config
  const handleSaveSlot = async () => {
    setSavingSlotId(draftConfig.id);
    try {
      await saveAdSlotToFirebase(draftConfig, currentUserEmail || undefined);
      const updated = {
        ...adsConfig,
        [draftConfig.id]: { ...draftConfig },
      };
      onUpdateAdsConfig(updated);
      showToast(
        language === 'en'
          ? `Ad Slot "${draftConfig.nameEn}" updated successfully!`
          : `"${draftConfig.nameBn}" বিজ্ঞাপন স্লট সফলভাবে সংরক্ষণ করা হয়েছে!`
      );
    } catch (error: any) {
      console.error(error);
      showToast(
        language === 'en'
          ? `Failed to save ad slot: ${error.message}`
          : 'বিজ্ঞাপন সংরক্ষণ ব্যর্থ হয়েছে',
        'error'
      );
    } finally {
      setSavingSlotId(null);
    }
  };

  // Reset current slot
  const handleResetSlot = async () => {
    if (
      !window.confirm(
        language === 'en'
          ? `Are you sure you want to reset & clear "${draftConfig.nameEn}"?`
          : `আপনি কি "${draftConfig.nameBn}" স্লটটি রিসেট ও নিষ্ক্রিয় করতে চান?`
      )
    ) {
      return;
    }

    setClearingSlotId(draftConfig.id);
    try {
      await resetAdSlotInFirebase(draftConfig.id);
      const updated = {
        ...adsConfig,
        [draftConfig.id]: {
          ...adsConfig[draftConfig.id],
          enabled: false,
          code: '',
          affiliateImage: '',
          affiliateLink: '',
        },
      };
      setDraftConfig({ ...updated[draftConfig.id] });
      onUpdateAdsConfig(updated);
      showToast(
        language === 'en'
          ? `Ad slot "${draftConfig.nameEn}" cleared!`
          : `"${draftConfig.nameBn}" সফলভাবে রিসেট করা হয়েছে!`
      );
    } catch (err) {
      console.error(err);
      showToast(language === 'en' ? 'Failed to reset slot' : 'রিসেট ব্যর্থ হয়েছে', 'error');
    } finally {
      setClearingSlotId(null);
    }
  };

  // Sample templates for testing
  const insertSampleAdSense = () => {
    const sample = `<!-- Google AdSense Responsive Unit -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0000000000000000" crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-0000000000000000"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`;
    updateDraft('code', sample);
  };

  const insertSampleAdsterra = () => {
    const sample = `<!-- Adsterra Banner Script -->
<script type="text/javascript">
	atOptions = {
		'key' : 'sample_adsterra_key_12345678',
		'format' : 'iframe',
		'height' : 90,
		'width' : 728,
		'params' : {}
	};
</script>
<script type="text/javascript" src="//www.topcreativeformat.com/sample_adsterra_key_12345678/invoke.js"></script>`;
    updateDraft('code', sample);
  };

  // Count active ads
  const activeCount = (Object.values(adsConfig) as AdSlotConfig[]).filter((s) => s.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0F3B2E] to-[#1D5E4A] text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#DE9B2E]/20 text-[#DE9B2E]">
              <Megaphone className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold font-serif">
              {language === 'en' ? 'Dynamic Ads Management' : 'ডাইনামিক বিজ্ঞাপন নিয়ন্ত্রণ কেন্দ্র'}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#DE9B2E] text-[#0A2A21]">
              {activeCount} / 6 {language === 'en' ? 'Active' : 'সক্রিয়'}
            </span>
          </div>
          <p className="text-xs text-white/80 max-w-xl">
            {language === 'en'
              ? 'Control 6 advertising slots across Google AdSense, Adsterra, and Affiliate Banners with real-time Firebase sync and responsive device targeting.'
              : 'গুগল অ্যাডসেন্স, অ্যাডস্টেরা ও এফিলিয়েট ব্যানারসহ ৬টি অফিশিয়াল অ্যাড স্লট পরিচালনা করুন। ফায়ারবেসে রিয়েল-টাইম সেভ হয়।'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              showLivePreview
                ? 'bg-white text-[#0F3B2E] shadow-2xs'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showLivePreview ? (language === 'en' ? 'Hide Preview' : 'প্রিভিউ লুকান') : (language === 'en' ? 'Show Preview' : 'প্রিভিউ দেখুন')}</span>
          </button>
        </div>
      </div>

      {/* Slot Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {SLOT_ORDER.map((slotId) => {
          const slot = adsConfig[slotId];
          const isSelected = selectedSlotId === slotId;
          return (
            <button
              key={slotId}
              type="button"
              onClick={() => handleSelectSlot(slotId)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-[#0F3B2E] shadow-sm ring-2 ring-[#0F3B2E]/20'
                  : 'bg-white/60 border-[#D8D0BC] hover:bg-white hover:border-[#8E9B92]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    slot.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'
                  }`}
                  title={slot.enabled ? 'Active Ad' : 'Inactive'}
                />
                <span className="text-[10px] uppercase font-bold text-neutral-400">
                  {slot.adType}
                </span>
              </div>
              <h4 className="text-xs font-bold text-[#0A2A21] line-clamp-1">
                {language === 'en' ? slot.nameEn : slot.nameBn}
              </h4>
              <p className="text-[10px] text-[#6B756E] mt-0.5">
                {slot.enabled
                  ? language === 'en'
                    ? 'Enabled'
                    : 'সক্রিয়'
                  : language === 'en'
                  ? 'Disabled'
                  : 'নিষ্ক্রিয়'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Slot Editor Form */}
      <div className="p-5 rounded-2xl bg-white border border-[#D8D0BC] shadow-xs space-y-6">
        {/* Slot Title & Status Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBE6D8]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold font-serif text-[#0A2A21]">
                {language === 'en' ? draftConfig.nameEn : draftConfig.nameBn}
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#D8D0BC] font-mono text-[#4B554E]">
                Slot ID: {draftConfig.id}
              </span>
            </div>
            <p className="text-xs text-[#6B756E]">
              {language === 'en' ? draftConfig.descriptionEn : draftConfig.descriptionBn}
            </p>
          </div>

          {/* ON/OFF Switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#4B554E]">
              {language === 'en' ? 'Ad Status:' : 'বিজ্ঞাপন স্ট্যাটাস:'}
            </span>
            <button
              type="button"
              onClick={() => updateDraft('enabled', !draftConfig.enabled)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer ${
                draftConfig.enabled ? 'bg-emerald-600' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                  draftConfig.enabled ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`text-xs font-extrabold ${
                draftConfig.enabled ? 'text-emerald-700' : 'text-neutral-500'
              }`}
            >
              {draftConfig.enabled
                ? language === 'en'
                  ? 'ON (Active)'
                  : 'চালু (সক্রিয়)'
                : language === 'en'
                ? 'OFF (Disabled)'
                : 'বন্ধ (নিষ্ক্রিয়)'}
            </span>
          </div>
        </div>

        {/* Ad Type Selection: 3 Cards */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#0A2A21]">
            {language === 'en' ? 'Select Ad Type' : 'বিজ্ঞাপনের ধরন নির্বাচন করুন'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Google AdSense */}
            <button
              type="button"
              onClick={() => updateDraft('adType', 'adsense')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                draftConfig.adType === 'adsense'
                  ? 'bg-blue-50/50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-[#FAF8F3] border-[#D8D0BC] hover:bg-white'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  draftConfig.adType === 'adsense'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                <Globe className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-[#0A2A21]">1. Google AdSense</div>
                <div className="text-[11px] text-[#6B756E]">
                  {language === 'en' ? 'Auto ads & responsive units' : 'রেসপনসিভ অ্যাড কোড'}
                </div>
              </div>
            </button>

            {/* 2. Adsterra */}
            <button
              type="button"
              onClick={() => updateDraft('adType', 'adsterra')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                draftConfig.adType === 'adsterra'
                  ? 'bg-purple-50/50 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                  : 'bg-[#FAF8F3] border-[#D8D0BC] hover:bg-white'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  draftConfig.adType === 'adsterra'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-[#0A2A21]">2. Adsterra</div>
                <div className="text-[11px] text-[#6B756E]">
                  {language === 'en' ? 'Banner script & invoke code' : 'ইনভোক ব্যানার স্ক্রিপ্ট'}
                </div>
              </div>
            </button>

            {/* 3. Affiliate Banner */}
            <button
              type="button"
              onClick={() => updateDraft('adType', 'affiliate')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                draftConfig.adType === 'affiliate'
                  ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                  : 'bg-[#FAF8F3] border-[#D8D0BC] hover:bg-white'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  draftConfig.adType === 'affiliate'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-neutral-200 text-neutral-600'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-[#0A2A21]">3. Affiliate Banner</div>
                <div className="text-[11px] text-[#6B756E]">
                  {language === 'en' ? 'Image banner + affiliate link' : 'ব্যানার ইমেজ ও রেফারেল লিংক'}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Input Fields based on Ad Type */}
        {draftConfig.adType === 'affiliate' ? (
          /* ================= Affiliate Banner Fields ================= */
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#D8D0BC] space-y-4">
            <h5 className="text-xs font-bold text-[#0F3B2E] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" />
              <span>{language === 'en' ? 'Affiliate Banner Configuration' : 'এফিলিয়েট ব্যানার কনফিগারেশন'}</span>
            </h5>

            {/* Affiliate Image URL + ImgBB Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#4B554E]">
                {language === 'en' ? 'Affiliate Image (URL or Upload Image)' : 'এফিলিয়েট ছবি (URL বা আপলোড করুন)'}
                <span className="text-red-500 ml-1">*</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={draftConfig.affiliateImage}
                  onChange={(e) => updateDraft('affiliateImage', e.target.value)}
                  placeholder="https://i.ibb.co/... or https://example.com/banner.jpg"
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D0BC] focus:outline-none focus:border-[#0F3B2E]"
                />

                {/* Upload via ImgBB */}
                <label className="px-4 py-2 rounded-xl bg-[#0F3B2E] hover:bg-[#154E3E] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs whitespace-nowrap">
                  <UploadCloud className="w-4 h-4" />
                  <span>{uploadingImage ? (language === 'en' ? 'Uploading...' : 'আপলোড হচ্ছে...') : (language === 'en' ? 'Upload Image' : 'ছবি আপলোড')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadError && (
                <p className="text-[11px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{uploadError}</span>
                </p>
              )}
            </div>

            {/* Affiliate Destination Link */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#4B554E]">
                {language === 'en' ? 'Affiliate Link URL (Click destination)' : 'এফিলিয়েট লিংক URL (ক্লিক করলে যেখানে যাবে)'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="url"
                value={draftConfig.affiliateLink}
                onChange={(e) => updateDraft('affiliateLink', e.target.value)}
                placeholder="https://example.com/ref?source=discover-bangladesh"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D0BC] focus:outline-none focus:border-[#0F3B2E]"
              />
              <p className="text-[10px] text-[#6B756E]">
                {language === 'en'
                  ? 'Visitors clicking the banner image will open this link with rel="sponsored".'
                  : 'ইউজার ব্যানারে ক্লিক করলে এই লিংকে রিডাইরেক্ট হবে।'}
              </p>
            </div>

            {/* Optional Alt Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#4B554E]">
                  {language === 'en' ? 'Alt Text / Banner Description (Optional)' : 'অল্ট টেক্সট / বিবরণ (ঐচ্ছিক)'}
                </label>
                <input
                  type="text"
                  value={draftConfig.affiliateAlt || ''}
                  onChange={(e) => updateDraft('affiliateAlt', e.target.value)}
                  placeholder="Special Travel Package Discount"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#D8D0BC] focus:outline-none focus:border-[#0F3B2E]"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="affiliateNewTab"
                  checked={draftConfig.affiliateNewTab !== false}
                  onChange={(e) => updateDraft('affiliateNewTab', e.target.checked)}
                  className="w-4 h-4 rounded text-[#0F3B2E] focus:ring-[#0F3B2E] cursor-pointer"
                />
                <label htmlFor="affiliateNewTab" className="text-xs text-[#0A2A21] font-medium cursor-pointer">
                  {language === 'en' ? 'Open link in new tab (_blank)' : 'নতুন ট্যাবে লিংক ওপেন করুন'}
                </label>
              </div>
            </div>
          </div>
        ) : (
          /* ================= AdSense or Adsterra Code Field ================= */
          <div className="p-4 rounded-xl bg-[#FAF8F3] border border-[#D8D0BC] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#0A2A21] flex items-center gap-1.5">
                <Code className="w-4 h-4 text-[#0F3B2E]" />
                <span>
                  {draftConfig.adType === 'adsense'
                    ? language === 'en'
                      ? 'Paste Google AdSense Code'
                      : 'গুগল অ্যাডসেন্স কোড পেস্ট করুন'
                    : language === 'en'
                    ? 'Paste Adsterra Ad Code'
                    : 'অ্যাডস্টেরা অ্যাড কোড পেস্ট করুন'}
                </span>
                <span className="text-red-500">*</span>
              </label>

              {/* Template Helpers */}
              <button
                type="button"
                onClick={draftConfig.adType === 'adsense' ? insertSampleAdSense : insertSampleAdsterra}
                className="text-[11px] text-[#0F3B2E] hover:underline font-medium cursor-pointer flex items-center gap-1"
              >
                <span>{language === 'en' ? 'Load Sample Code' : 'নমুনা কোড বসান'}</span>
              </button>
            </div>

            <textarea
              rows={6}
              value={draftConfig.code}
              onChange={(e) => updateDraft('code', e.target.value)}
              placeholder={
                draftConfig.adType === 'adsense'
                  ? `<script async src="https://pagead2.googlesyndication.com/..."></script>\n<ins class="adsbygoogle" ...></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`
                  : `<script type="text/javascript">\natOptions = { 'key': '...', 'format': 'iframe', 'height': 90, 'width': 728 };\n</script>\n<script src="//.../invoke.js"></script>`
              }
              className="w-full p-3 font-mono text-xs rounded-xl bg-white border border-[#D8D0BC] text-neutral-800 focus:outline-none focus:border-[#0F3B2E] focus:ring-1 focus:ring-[#0F3B2E]"
            />

            <div className="flex items-center justify-between text-[11px] text-[#6B756E]">
              <span>
                {draftConfig.code.length}{' '}
                {language === 'en' ? 'characters entered' : 'অক্ষর ইনপুট করা হয়েছে'}
              </span>
              <span className="text-emerald-700 font-medium">
                {language === 'en'
                  ? '✓ Auto-rendered without code tampering'
                  : '✓ অ্যাড কোড অপরিবর্তিত রেখে রেন্ডার হবে'}
              </span>
            </div>
          </div>
        )}

        {/* Device Targeting & Layout Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Device Targeting */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0A2A21] flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'Device Targeting' : 'ডিভাইস টার্গেটিং'}</span>
            </label>
            <select
              value={draftConfig.targetDevice}
              onChange={(e) => updateDraft('targetDevice', e.target.value as AdDeviceTarget)}
              disabled={draftConfig.id === 'mobile_sticky'}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F3] border border-[#D8D0BC] focus:outline-none focus:border-[#0F3B2E] disabled:opacity-60 cursor-pointer"
            >
              <option value="all">
                {language === 'en' ? '📱+💻 All Devices (Desktop, Tablet, Mobile)' : '📱+💻 সব ডিভাইস (ডেস্কটপ, ট্যাবলেট, মোবাইল)'}
              </option>
              <option value="desktop">
                {language === 'en' ? '💻 Desktop Only' : '💻 শুধুমাত্র ডেস্কটপ'}
              </option>
              <option value="mobile">
                {language === 'en' ? '📱 Mobile Only' : '📱 শুধুমাত্র মোবাইল'}
              </option>
            </select>
            {draftConfig.id === 'mobile_sticky' && (
              <p className="text-[10px] text-amber-700">
                {language === 'en'
                  ? '* Mobile Sticky Ad is strictly restricted to mobile viewports only.'
                  : '* মোবাইল স্টিকি অ্যাড নীতিমালা অনুযায়ী শুধুমাত্র মোবাইল স্ক্রিনে প্রদর্শিত হবে।'}
              </p>
            )}
          </div>

          {/* Position Control */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0A2A21] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#DE9B2E]" />
              <span>{language === 'en' ? 'Position Control' : 'পজিশন কন্ট্রোল'}</span>
            </label>
            <select
              value={draftConfig.position || 'default'}
              onChange={(e) => updateDraft('position', e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F3] border border-[#D8D0BC] focus:outline-none focus:border-[#0F3B2E] cursor-pointer"
            >
              <option value="default">{language === 'en' ? 'Default Placement' : 'ডিফল্ট প্লেসমেন্ট'}</option>
              <option value="top">{language === 'en' ? 'Top of Section' : 'সেকশনের শুরুতে'}</option>
              <option value="middle">{language === 'en' ? 'Middle of Section / Content' : 'কন্টেন্টের মাঝে'}</option>
              <option value="bottom">{language === 'en' ? 'Bottom of Section' : 'সেকশনের শেষে'}</option>
            </select>
          </div>
        </div>

        {/* Live Preview Box */}
        {showLivePreview && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0A2A21] flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#0F3B2E]" />
                <span>{language === 'en' ? 'Live Interactive Preview' : 'লাইভ ইন্টারেক্টিভ প্রিভিউ'}</span>
              </label>
              <span className="text-[10px] text-[#6B756E]">
                {language === 'en' ? 'Simulates live placement' : 'ওয়েবসাইটে যেভাবে দেখা যাবে'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#F4F1EA] border border-dashed border-[#D8D0BC]">
              <AdRenderer
                slotConfig={draftConfig}
                slotId={draftConfig.id}
                language={language}
                previewMode={true}
              />
            </div>
          </div>
        )}

        {/* Action Buttons: Save & Reset */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#EBE6D8]">
          <button
            type="button"
            onClick={handleResetSlot}
            disabled={clearingSlotId === draftConfig.id || savingSlotId === draftConfig.id}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {clearingSlotId === draftConfig.id
                ? language === 'en'
                  ? 'Clearing...'
                  : 'মুছে ফেলা হচ্ছে...'
                : language === 'en'
                ? 'Clear / Reset Ad Slot'
                : 'বিজ্ঞাপন স্লট রিসেট করুন'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSaveSlot}
            disabled={savingSlotId === draftConfig.id || clearingSlotId === draftConfig.id}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0F3B2E] hover:bg-[#165643] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {savingSlotId === draftConfig.id ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#DE9B2E]" />
            ) : (
              <Save className="w-4 h-4 text-[#DE9B2E]" />
            )}
            <span>
              {savingSlotId === draftConfig.id
                ? language === 'en'
                  ? 'Saving to Firebase...'
                  : 'সংরক্ষণ করা হচ্ছে...'
                : language === 'en'
                ? 'Save & Apply Ad Changes'
                : 'পরিবর্তন সংরক্ষণ ও প্রয়োগ করুন'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
