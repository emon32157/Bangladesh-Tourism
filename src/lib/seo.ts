/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Destination, EditorialStory, Experience, Festival, Language } from '../types';

export const SITE_URL = 'https://bdtourismboard.netlify.app';
export const SITE_NAME = 'Bangladesh Tourism Board';
export const DEFAULT_TITLE = 'Bangladesh Tourism | Explore Beautiful Bangladesh';
export const DEFAULT_DESCRIPTION =
  'Explore Bangladesh Tourism and discover beautiful destinations, beaches, rivers, hills, forests, historical places, cultural heritage, tourist attractions and travel guides across Bangladesh.';
export const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?auto=format&fit=crop&w=1200&h=630&q=80';

/**
 * Safely updates or creates a meta tag in document head
 */
function setMetaTag(selector: string, attrName: string, attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * Safely updates or creates canonical link tag
 */
function setCanonical(url: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

/**
 * Injects or updates dynamic JSON-LD schema tag
 */
function setDynamicSchema(schemaObj: Record<string, unknown> | null) {
  if (typeof document === 'undefined') return;
  const scriptId = 'dynamic-seo-jsonld';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!schemaObj) {
    if (script) script.remove();
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.text = JSON.stringify(schemaObj);
}

/**
 * Resets all metadata to default Homepage SEO
 */
export function resetSeoToDefault(language: Language = 'en') {
  if (typeof document === 'undefined') return;

  const title =
    language === 'en'
      ? DEFAULT_TITLE
      : 'বাংলাদেশ পর্যটন | অপরূপ বাংলাদেশ ভ্রমণ গাইড';
  const description =
    language === 'en'
      ? DEFAULT_DESCRIPTION
      : 'বাংলাদেশ পর্যটন বোর্ডের অফিসিয়াল পোর্টালে আবিষ্কার করুন বিশ্বের দীর্ঘতম সমুদ্র সৈকত, ম্যানগ্রোভ সুন্দরবন, পাহাড়, নদী, প্রত্নতাত্ত্বিক নিদর্শন এবং সাংস্কৃতিক ঐতিহ্যের ভ্রমণ গাইড।';

  document.title = title;
  document.documentElement.lang = language;

  setMetaTag("meta[name='description']", 'name', 'description', description);
  setMetaTag("meta[property='og:title']", 'property', 'og:title', title);
  setMetaTag("meta[property='og:description']", 'property', 'og:description', description);
  setMetaTag("meta[property='og:url']", 'property', 'og:url', SITE_URL);
  setMetaTag("meta[property='og:image']", 'property', 'og:image', DEFAULT_IMAGE);
  setMetaTag("meta[name='twitter:title']", 'name', 'twitter:title', title);
  setMetaTag("meta[name='twitter:description']", 'name', 'twitter:description', description);
  setMetaTag("meta[name='twitter:image']", 'name', 'twitter:image', DEFAULT_IMAGE);

  setCanonical(SITE_URL + '/');
  setDynamicSchema(null);
}

/**
 * Updates SEO metadata for a Destination Modal or Deep Link
 */
export function updateDestinationSeo(destination: Destination, language: Language = 'en') {
  if (typeof document === 'undefined' || !destination) return;

  const destTitle = language === 'en' ? destination.title : (destination.titleBn || destination.title);
  const districtName = language === 'en' ? destination.district : (destination.districtBn || destination.district);
  const divisionName = destination.division;
  const pageTitle = `${destTitle}, ${districtName} - Bangladesh Tourism Guide | ${SITE_NAME}`;
  const summaryText = language === 'en'
    ? (destination.summary || destination.description || `${destTitle} is a premier tourist attraction in ${districtName}, ${divisionName}, Bangladesh.`)
    : (destination.summaryBn || destination.descriptionBn || `${destTitle} বাংলাদেশের ${districtName} জেলার একটি আকর্ষণীয় পর্যটন কেন্দ্র।`);

  const canonicalUrl = `${SITE_URL}/?destination=${destination.id}`;
  const imageUrl = destination.image || DEFAULT_IMAGE;

  document.title = pageTitle;
  document.documentElement.lang = language;

  setMetaTag("meta[name='description']", 'name', 'description', summaryText);
  setMetaTag("meta[property='og:title']", 'property', 'og:title', pageTitle);
  setMetaTag("meta[property='og:description']", 'property', 'og:description', summaryText);
  setMetaTag("meta[property='og:url']", 'property', 'og:url', canonicalUrl);
  setMetaTag("meta[property='og:image']", 'property', 'og:image', imageUrl);
  setMetaTag("meta[name='twitter:title']", 'name', 'twitter:title', pageTitle);
  setMetaTag("meta[name='twitter:description']", 'name', 'twitter:description', summaryText);
  setMetaTag("meta[name='twitter:image']", 'name', 'twitter:image', imageUrl);

  setCanonical(canonicalUrl);

  // Dynamic TouristDestination Schema
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: destTitle,
    alternateName: destination.titleBn || destination.title,
    description: summaryText,
    url: canonicalUrl,
    image: imageUrl,
    touristType: destination.tag ? [destination.tag, 'Travelers', 'Eco-Tourism'] : ['Tourist Sight'],
    address: {
      '@type': 'PostalAddress',
      streetAddress: destination.address || `${destTitle}, ${districtName}`,
      addressLocality: districtName,
      addressRegion: divisionName,
      addressCountry: 'BD',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: destination.lat || 23.685,
      longitude: destination.lng || 90.3563,
    },
    aggregateRating: destination.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: destination.rating,
          reviewCount: destination.reviewsCount || 120,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  };

  setDynamicSchema(schema);
}

/**
 * Updates SEO metadata for an Editorial Story (Article Schema)
 */
export function updateStorySeo(story: EditorialStory, language: Language = 'en') {
  if (typeof document === 'undefined' || !story) return;

  const storyTitle = language === 'en' ? story.title : (story.titleBn || story.title);
  const pageTitle = `${storyTitle} | Bangladesh Tourism Stories`;
  const excerptText = language === 'en' ? (story.excerpt || storyTitle) : (story.excerptBn || story.excerpt || storyTitle);
  const canonicalUrl = `${SITE_URL}/?story=${story.id}`;
  const imageUrl = story.image || DEFAULT_IMAGE;

  document.title = pageTitle;
  document.documentElement.lang = language;

  setMetaTag("meta[name='description']", 'name', 'description', excerptText);
  setMetaTag("meta[property='og:title']", 'property', 'og:title', pageTitle);
  setMetaTag("meta[property='og:description']", 'property', 'og:description', excerptText);
  setMetaTag("meta[property='og:url']", 'property', 'og:url', canonicalUrl);
  setMetaTag("meta[property='og:image']", 'property', 'og:image', imageUrl);
  setMetaTag("meta[name='twitter:title']", 'name', 'twitter:title', pageTitle);
  setMetaTag("meta[name='twitter:description']", 'name', 'twitter:description', excerptText);
  setMetaTag("meta[name='twitter:image']", 'name', 'twitter:image', imageUrl);

  setCanonical(canonicalUrl);

  // Dynamic Article Schema
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: storyTitle,
    description: excerptText,
    image: [imageUrl],
    author: {
      '@type': 'Person',
      name: story.author || 'Bangladesh Tourism Board Contributor',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: DEFAULT_IMAGE,
      },
    },
    datePublished: story.createdAt ? new Date(story.createdAt).toISOString() : '2024-10-01T08:00:00+06:00',
    dateModified: story.approvedAt ? new Date(story.approvedAt).toISOString() : '2025-01-15T12:00:00+06:00',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  setDynamicSchema(schema);
}

/**
 * Updates SEO metadata for a Festival
 */
export function updateFestivalSeo(festival: Festival, language: Language = 'en') {
  if (typeof document === 'undefined' || !festival) return;

  const festTitle = language === 'en' ? festival.title : (festival.titleBn || festival.title);
  const pageTitle = `${festTitle} - Cultural Festival | ${SITE_NAME}`;
  const desc = language === 'en' ? festival.description : (festival.descriptionBn || festival.description);
  const canonicalUrl = `${SITE_URL}/?festival=${festival.id}`;

  document.title = pageTitle;
  document.documentElement.lang = language;

  setMetaTag("meta[name='description']", 'name', 'description', desc);
  setMetaTag("meta[property='og:title']", 'property', 'og:title', pageTitle);
  setMetaTag("meta[property='og:description']", 'property', 'og:description', desc);
  setMetaTag("meta[property='og:url']", 'property', 'og:url', canonicalUrl);
  setMetaTag("meta[name='twitter:title']", 'name', 'twitter:title', pageTitle);
  setMetaTag("meta[name='twitter:description']", 'name', 'twitter:description', desc);

  setCanonical(canonicalUrl);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Festival',
    name: festTitle,
    alternateName: festival.titleBn,
    description: desc,
    url: canonicalUrl,
    location: {
      '@type': 'Place',
      name: festival.location,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'BD',
      },
    },
  };

  setDynamicSchema(schema);
}

/**
 * Updates SEO metadata for an Experience
 */
export function updateExperienceSeo(experience: Experience, language: Language = 'en') {
  if (typeof document === 'undefined' || !experience) return;

  const expTitle = language === 'en' ? experience.title : (experience.titleBn || experience.title);
  const pageTitle = `${expTitle} - Travel Experience | ${SITE_NAME}`;
  const desc = language === 'en' ? experience.description : (experience.descriptionBn || experience.description);
  const canonicalUrl = `${SITE_URL}/?experience=${experience.id}`;

  document.title = pageTitle;
  document.documentElement.lang = language;

  setMetaTag("meta[name='description']", 'name', 'description', desc);
  setMetaTag("meta[property='og:title']", 'property', 'og:title', pageTitle);
  setMetaTag("meta[property='og:description']", 'property', 'og:description', desc);
  setMetaTag("meta[property='og:url']", 'property', 'og:url', canonicalUrl);

  setCanonical(canonicalUrl);
  setDynamicSchema(null);
}

/**
 * Updates SEO metadata for navigation sections
 */
export function updateSectionSeo(section: string, language: Language = 'en') {
  if (typeof document === 'undefined') return;

  const sectionMap: Record<string, { titleEn: string; titleBn: string; descEn: string; descBn: string }> = {
    destinations: {
      titleEn: 'Tourist Destinations in Bangladesh - Beaches, Hills & Forests',
      titleBn: 'বাংলাদেশের পর্যটন কেন্দ্রসমূহ - সমুদ্র সৈকত, পাহাড় ও বন',
      descEn: 'Browse 480+ tourist places, historical landmarks, hills, and pristine beaches across all 64 districts of Bangladesh.',
      descBn: 'বাংলাদেশের ৬৪ জেলার ৪8০টিরও বেশি দর্শনীয় স্থান, প্রাকৃতিক সৌন্দর্য এবং ঐতিহাসিক নিদর্শনের সম্পূর্ণ তালিকা।',
    },
    heritage: {
      titleEn: 'Living Heritage & UNESCO Cultural Treasures of Bangladesh',
      titleBn: 'ঐতিহ্য ও ইউনেস্কো স্বীকৃত সাংস্কৃতিক নিদর্শন',
      descEn: 'Discover Jamdani weaving, Rickshaw art, Mangal Shobhajatra, and ancient archaeological treasures of Bangladesh.',
      descBn: 'বাংলার হাজার বছরের সমৃদ্ধ লোকশিল্প, জামদানি শাড়ি, রিকশা পেইন্টিং এবং ইউনেস্কো ঐতিহ্যের বিবরণ।',
    },
    stories: {
      titleEn: 'Editorial Travel Stories & Cultural Journal of Bangladesh',
      titleBn: 'ভ্রমণ আখ্যান ও সাংস্কৃতিক গল্পমালা',
      descEn: 'Read in-depth editorial stories from travellers exploring mangrove creeks, culinary cartography, and tribal lifestyles.',
      descBn: 'সুন্দরবনের বাঘ ও বনবিবি, পদ্মার ইলিশ, এবং পাহাড়ি জনপদের জীবনের মনোমুগ্ধকর ভ্রমণ গল্প।',
    },
    experiences: {
      titleEn: 'Things to Do & Curated Travel Experiences in Bangladesh',
      titleBn: 'ভ্রমণ অভিজ্ঞতা ও দর্শনীয় কার্যক্রম',
      descEn: 'Plan silent boat safaris in the Sundarbans, heritage rickshaw tours in Old Dhaka, and tea plucking in Sreemangal.',
      descBn: 'সুন্দরবনে শান্ত খালে নৌকা ভ্রমণ, পুরান ঢাকায় ঐতিহ্যবাহী পদযাত্রা এবং সিলেটে চা পাতা তোলার অভিজ্ঞতা।',
    },
    gallery: {
      titleEn: 'Community Travel Photo Gallery - Bangladesh Tourism',
      titleBn: 'কমিউনিটি ভ্রমণ ফটো গ্যালারি',
      descEn: 'Authentic photos shared by local and international travellers discovering the hidden beauty of Bangladesh.',
      descBn: 'দেশি-বিদেশি পর্যটকদের ক্যামেরায় ধারণ করা রূপসী বাংলার মনোমুগ্ধকর আলোকচিত্র সংগ্রহ।',
    },
    'gis-map': {
      titleEn: 'Interactive GIS Tourism Map of Bangladesh - All 64 Districts',
      titleBn: 'ইন্টারেক্টিভ জিআইএস পর্যটন মানচিত্র - ৬৪ জেলা',
      descEn: 'Explore an interactive tourist map locating historical sights, national parks, waterfalls, and beaches across Bangladesh.',
      descBn: 'মানচিত্রে সরাসরি দেখুন বাংলাদেশের ৬৪ জেলার দর্শনীয় স্থান, অক্ষাংশ-দ্রাঘিমাংশ এবং গুগল ম্যাপস লোকেশন।',
    },
  };

  const meta = sectionMap[section];
  if (!meta) {
    resetSeoToDefault(language);
    return;
  }

  const pageTitle = language === 'en' ? `${meta.titleEn} | ${SITE_NAME}` : `${meta.titleBn} | ${SITE_NAME}`;
  const desc = language === 'en' ? meta.descEn : meta.descBn;
  const canonicalUrl = `${SITE_URL}/?section=${section}`;

  document.title = pageTitle;
  document.documentElement.lang = language;

  setMetaTag("meta[name='description']", 'name', 'description', desc);
  setMetaTag("meta[property='og:title']", 'property', 'og:title', pageTitle);
  setMetaTag("meta[property='og:description']", 'property', 'og:description', desc);
  setMetaTag("meta[property='og:url']", 'property', 'og:url', canonicalUrl);
  setCanonical(canonicalUrl);
  setDynamicSchema(null);
}
