/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, doc, getDoc, setDoc, deleteDoc, collection, onSnapshot } from './firebase';
import { AdSlotConfig, AdSlotId, AllAdsConfig } from '../types';

export const ADS_CACHE_KEY = 'discover_bd_dynamic_ads_config';

export const DEFAULT_ADS_CONFIG: AllAdsConfig = {
  header: {
    id: 'header',
    nameEn: 'Header Ad',
    nameBn: 'হেডার বিজ্ঞাপন',
    descriptionEn: 'Displays right beneath the website navigation header.',
    descriptionBn: 'ওয়েবসাইটের হেডার ও নেভিগেশনের ঠিক নিচে প্রদর্শিত হয়।',
    enabled: false,
    adType: 'adsense',
    code: '',
    affiliateImage: '',
    affiliateLink: '',
    affiliateAlt: 'Discover Bangladesh Sponsored Partner',
    affiliateNewTab: true,
    targetDevice: 'all',
    position: 'default',
  },
  hero_bottom: {
    id: 'hero_bottom',
    nameEn: 'Hero Bottom Ad',
    nameBn: 'হিরো বটম বিজ্ঞাপন',
    descriptionEn: 'Displays directly below the hero banner showcase.',
    descriptionBn: 'হিরো/ব্যানার সেকশনের ঠিক নিচে প্রদর্শিত হয়।',
    enabled: false,
    adType: 'adsense',
    code: '',
    affiliateImage: '',
    affiliateLink: '',
    affiliateAlt: 'Travel Partner Offer',
    affiliateNewTab: true,
    targetDevice: 'all',
    position: 'default',
  },
  destination_infeed: {
    id: 'destination_infeed',
    nameEn: 'Destination In-Feed Ad',
    nameBn: 'গন্তব্য ইন-ফিড বিজ্ঞাপন',
    descriptionEn: 'Displays organically between destinations in the main exploration grid.',
    descriptionBn: 'ট্যুরিস্ট প্লেস গ্রিডের মাঝে স্পনসরড বা অ্যাড হিসেবে প্রদর্শিত হয়।',
    enabled: false,
    adType: 'affiliate',
    code: '',
    affiliateImage: '',
    affiliateLink: '',
    affiliateAlt: 'Featured Tourism Partner',
    affiliateNewTab: true,
    targetDevice: 'all',
    position: 'default',
  },
  news: {
    id: 'news',
    nameEn: 'News Section Ad',
    nameBn: 'নিউজ সেকশন বিজ্ঞাপন',
    descriptionEn: 'Displays prominently in the tourism news & bulletins area.',
    descriptionBn: 'পর্যটন সংবাদ ও বুলেটিন সেকশনে প্রদর্শিত হয়।',
    enabled: false,
    adType: 'adsense',
    code: '',
    affiliateImage: '',
    affiliateLink: '',
    affiliateAlt: 'Tourism Update Sponsor',
    affiliateNewTab: true,
    targetDevice: 'all',
    position: 'default',
  },
  article: {
    id: 'article',
    nameEn: 'Article / Post Ad',
    nameBn: 'আর্টিকেল ও পোস্ট ডিটেইল বিজ্ঞাপন',
    descriptionEn: 'Displays inside modal detail views (Destinations, Stories, News).',
    descriptionBn: 'গন্তব্য, গল্প ও নিউজ ডিটেইল মোডালের কন্টেন্টের মাঝে প্রদর্শিত হয়।',
    enabled: false,
    adType: 'adsense',
    code: '',
    affiliateImage: '',
    affiliateLink: '',
    affiliateAlt: 'Featured Travel Service',
    affiliateNewTab: true,
    targetDevice: 'all',
    position: 'middle',
  },
  mobile_sticky: {
    id: 'mobile_sticky',
    nameEn: 'Mobile Sticky Bottom Ad',
    nameBn: 'মোবাইল স্টিকি বটম বিজ্ঞাপন',
    descriptionEn: 'Fixed at the bottom on mobile devices only with an interactive dismiss button.',
    descriptionBn: 'শুধুমাত্র মোবাইল ডিভাইসে স্ক্রিনের নিচে স্টিকি থাকে এবং ক্লোজ বাটন থাকে।',
    enabled: false,
    adType: 'affiliate',
    code: '',
    affiliateImage: '',
    affiliateLink: '',
    affiliateAlt: 'Exclusive Mobile Travel Deal',
    affiliateNewTab: true,
    targetDevice: 'mobile',
    position: 'bottom',
  },
};

/**
 * Get initial cached ads config or default
 */
export const getCachedAdsConfig = (): AllAdsConfig => {
  try {
    const raw = localStorage.getItem(ADS_CACHE_KEY);
    if (!raw) return { ...DEFAULT_ADS_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AllAdsConfig>;
    return {
      ...DEFAULT_ADS_CONFIG,
      ...parsed,
      header: { ...DEFAULT_ADS_CONFIG.header, ...(parsed.header || {}) },
      hero_bottom: { ...DEFAULT_ADS_CONFIG.hero_bottom, ...(parsed.hero_bottom || {}) },
      destination_infeed: { ...DEFAULT_ADS_CONFIG.destination_infeed, ...(parsed.destination_infeed || {}) },
      news: { ...DEFAULT_ADS_CONFIG.news, ...(parsed.news || {}) },
      article: { ...DEFAULT_ADS_CONFIG.article, ...(parsed.article || {}) },
      mobile_sticky: { ...DEFAULT_ADS_CONFIG.mobile_sticky, ...(parsed.mobile_sticky || {}) },
    };
  } catch (err) {
    console.warn('Failed to parse cached ads config:', err);
    return { ...DEFAULT_ADS_CONFIG };
  }
};

/**
 * Save ads config to local cache
 */
export const saveCachedAdsConfig = (config: AllAdsConfig) => {
  try {
    localStorage.setItem(ADS_CACHE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save ads config to localStorage:', e);
  }
};

/**
 * Real-time subscription to ads configuration in Firebase Firestore
 */
export const subscribeToAdsConfig = (onUpdate: (config: AllAdsConfig) => void): (() => void) => {
  let unsub: (() => void) | null = null;
  try {
    const adsColRef = collection(db, 'ads_settings');
    unsub = onSnapshot(
      adsColRef,
      (snapshot) => {
        const current = getCachedAdsConfig();
        const merged: AllAdsConfig = { ...current };

        snapshot.forEach((docSnap) => {
          const docId = docSnap.id as AdSlotId;
          const data = docSnap.data();
          if (docId in DEFAULT_ADS_CONFIG) {
            merged[docId] = {
              ...DEFAULT_ADS_CONFIG[docId],
              ...merged[docId],
              ...(data as Partial<AdSlotConfig>),
              id: docId,
            };
          }
        });

        saveCachedAdsConfig(merged);
        onUpdate(merged);
      },
      (error) => {
        console.warn('Firestore ads_settings listener error (using cache):', error.message);
        onUpdate(getCachedAdsConfig());
      }
    );
  } catch (error) {
    console.warn('Failed to setup ads_settings listener:', error);
    onUpdate(getCachedAdsConfig());
  }

  return () => {
    if (unsub) unsub();
  };
};

/**
 * Save or update a single Ad Slot configuration in Firestore and LocalStorage
 */
export const saveAdSlotToFirebase = async (
  slotConfig: AdSlotConfig,
  userEmail?: string
): Promise<void> => {
  const prepared: AdSlotConfig = {
    ...slotConfig,
    updatedAt: Date.now(),
    updatedBy: userEmail || 'admin',
  };

  // 1. Update local cache immediately
  const current = getCachedAdsConfig();
  current[slotConfig.id] = prepared;
  saveCachedAdsConfig(current);

  // 2. Persist to Firestore
  try {
    const slotDocRef = doc(db, 'ads_settings', slotConfig.id);
    await setDoc(slotDocRef, prepared, { merge: true });
  } catch (error: any) {
    console.error(`Failed to save ad slot ${slotConfig.id} to Firestore:`, error);
    // Keep local cache so it still works even if offline
    throw error;
  }
};

/**
 * Clear or reset an Ad Slot configuration
 */
export const resetAdSlotInFirebase = async (slotId: AdSlotId): Promise<void> => {
  const defaultSlot = DEFAULT_ADS_CONFIG[slotId];
  
  // 1. Update local cache
  const current = getCachedAdsConfig();
  current[slotId] = { ...defaultSlot };
  saveCachedAdsConfig(current);

  // 2. Delete or reset in Firestore
  try {
    const slotDocRef = doc(db, 'ads_settings', slotId);
    await deleteDoc(slotDocRef);
  } catch (error: any) {
    console.error(`Failed to delete ad slot ${slotId} from Firestore:`, error);
    // Try saving default disabled instead
    try {
      const slotDocRef = doc(db, 'ads_settings', slotId);
      await setDoc(slotDocRef, defaultSlot);
    } catch {}
  }
};
