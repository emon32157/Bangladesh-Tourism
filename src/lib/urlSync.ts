/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateSlug } from './slugs';
import { SITE_URL } from './seo';

/**
 * Path-based Deep-Linking & URL Helper
 * Provides path generation and clipboard copy for path-based routes:
 * /destination/:slug, /post/:slug, /festival/:slug, /experience/:slug, /district/:districtName
 */

export interface AppUrlState {
  destinationSlug?: string | null;
  storySlug?: string | null;
  postSlug?: string | null;
  festivalSlug?: string | null;
  experienceSlug?: string | null;
  districtSlug?: string | null;
  view?: 'about' | 'contact' | 'privacy' | 'terms' | 'planner' | 'wishlist' | 'search' | 'auth' | 'upload' | 'admin' | 'report' | 'story-submit' | null;
  section?: string | null;
  lang?: string | null;
}

/**
 * Builds clean canonical path for any entity
 */
export function buildPath(
  type: 'destination' | 'story' | 'post' | 'festival' | 'experience' | 'district' | 'about' | 'contact' | 'privacy' | 'terms',
  slugOrId?: string,
  title?: string
): string {
  if (type === 'about') return '/about';
  if (type === 'contact') return '/contact';
  if (type === 'privacy') return '/privacy';
  if (type === 'terms') return '/terms';

  const cleanSlug = title ? generateSlug(title, slugOrId) : (slugOrId ? generateSlug(slugOrId) : '');

  switch (type) {
    case 'destination':
      return `/destination/${cleanSlug}`;
    case 'story':
    case 'post':
      return `/post/${cleanSlug}`;
    case 'festival':
      return `/festival/${cleanSlug}`;
    case 'experience':
      return `/experience/${cleanSlug}`;
    case 'district':
      return `/district/${cleanSlug}`;
    default:
      return '/';
  }
}

/**
 * Copies a path-based direct link to clipboard (e.g. https://domain.com/destination/sundarbans-mangrove)
 * Replaces query-string links with SEO-friendly path-based URLs.
 */
export const copyDirectLink = async (
  paramKey: string,
  idOrSlug: string,
  title?: string
): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  const origin = window.location.origin && window.location.origin !== 'null'
    ? window.location.origin
    : SITE_URL;

  let path = '/';
  const key = paramKey.toLowerCase();

  if (key === 'destination') {
    path = buildPath('destination', idOrSlug, title);
  } else if (key === 'story' || key === 'post') {
    path = buildPath('post', idOrSlug, title);
  } else if (key === 'festival') {
    path = buildPath('festival', idOrSlug, title);
  } else if (key === 'experience') {
    path = buildPath('experience', idOrSlug, title);
  } else if (key === 'district') {
    path = buildPath('district', idOrSlug, title);
  } else if (key === 'about' || key === 'contact' || key === 'privacy' || key === 'terms') {
    path = `/${key}`;
  } else {
    path = `/${key}/${idOrSlug}`;
  }

  const fullUrl = `${origin}${path}`;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(fullUrl);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard write failed, trying fallback input:', err);
  }

  // Fallback for iframe environments
  try {
    const textArea = document.createElement('textarea');
    textArea.value = fullUrl;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (e) {
    console.error('Copy fallback failed:', e);
    return false;
  }
};
