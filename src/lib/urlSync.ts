/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * URL Synchronization and Deep-Linking Helper
 * Allows sharing and opening direct links to any destination, story, post, festival, experience, or view modal.
 */

export interface AppUrlState {
  destinationId?: string | null;
  storyId?: string | null;
  postId?: string | null;
  festivalId?: string | null;
  experienceId?: string | null;
  view?: 'planner' | 'wishlist' | 'search' | 'auth' | 'upload' | 'admin' | 'report' | 'story-submit' | 'write-story' | null;
  section?: string | null;
  lang?: string | null;
}

export const parseUrlState = (): AppUrlState => {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.replace('#', '');

  return {
    destinationId: params.get('destination') || (hash.startsWith('destination=') ? hash.split('=')[1] : null),
    storyId: params.get('story') || (hash.startsWith('story=') ? hash.split('=')[1] : null),
    postId: params.get('post') || (hash.startsWith('post=') ? hash.split('=')[1] : null),
    festivalId: params.get('festival') || (hash.startsWith('festival=') ? hash.split('=')[1] : null),
    experienceId: params.get('experience') || (hash.startsWith('experience=') ? hash.split('=')[1] : null),
    view: (params.get('view') as AppUrlState['view']) || null,
    section: params.get('section') || (hash && !hash.includes('=') ? hash : null),
    lang: params.get('lang') || null,
  };
};

export const setUrlState = (state: Partial<AppUrlState>, replace = false) => {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  const params = url.searchParams;

  // Clear modal-specific params
  const modalKeys = ['destination', 'story', 'post', 'festival', 'experience', 'view'];
  
  // If we are setting a new modal param, clear other modal params to prevent conflicting URLs
  const hasNewModal = Boolean(
    state.destinationId || state.storyId || state.postId || state.festivalId || state.experienceId || state.view
  );

  if (hasNewModal) {
    modalKeys.forEach((key) => params.delete(key));
  }

  if (state.destinationId !== undefined) {
    if (state.destinationId) params.set('destination', state.destinationId);
    else params.delete('destination');
  }

  if (state.storyId !== undefined) {
    if (state.storyId) params.set('story', state.storyId);
    else params.delete('story');
  }

  if (state.postId !== undefined) {
    if (state.postId) params.set('post', state.postId);
    else params.delete('post');
  }

  if (state.festivalId !== undefined) {
    if (state.festivalId) params.set('festival', state.festivalId);
    else params.delete('festival');
  }

  if (state.experienceId !== undefined) {
    if (state.experienceId) params.set('experience', state.experienceId);
    else params.delete('experience');
  }

  if (state.view !== undefined) {
    if (state.view) params.set('view', state.view);
    else params.delete('view');
  }

  if (state.section !== undefined) {
    if (state.section && state.section !== 'hero') params.set('section', state.section);
    else params.delete('section');
  }

  if (state.lang !== undefined) {
    if (state.lang) params.set('lang', state.lang);
    else params.delete('lang');
  }

  const newSearch = params.toString();
  const newUrl = `${url.pathname}${newSearch ? `?${newSearch}` : ''}${url.hash ? url.hash : ''}`;

  if (replace) {
    window.history.replaceState({ ...state }, '', newUrl);
  } else {
    window.history.pushState({ ...state }, '', newUrl);
  }
};

/**
 * Generates and copies a direct link with fallback
 */
export const copyDirectLink = async (paramKey: string, id: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set(paramKey, id);

  const fullUrl = url.toString();

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
