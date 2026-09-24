/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Destination, EditorialStory, Festival, Experience, CommunityPost } from '../types';

/**
 * Generates clean, lowercase, alphanumeric, hyphen-separated slug from title.
 * Removes special characters, handles accents, apostrophes, etc.
 */
export function generateSlug(title: string, fallbackId?: string): string {
  if (!title) return fallbackId ? String(fallbackId).toLowerCase() : 'item';

  let slug = title
    .toLowerCase()
    .trim()
    // Replace accented characters
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace apostrophes and quotation marks: e.g. Cox's -> coxs
    .replace(/['’"“”]/g, '')
    // Replace non-alphanumeric chars with hyphen
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    slug = fallbackId ? String(fallbackId).toLowerCase() : 'item';
  }

  return slug;
}

/**
 * Returns a unique SEO slug for a destination.
 * Appends ID suffix if duplicate title exists in list.
 */
export function getDestinationSlug(dest: Destination, allDestinations: Destination[] = []): string {
  if (!dest) return '';
  const baseSlug = generateSlug(dest.title || dest.titleBn || '', dest.id);
  if (allDestinations.length > 0) {
    const duplicates = allDestinations.filter(
      (d) => d.id !== dest.id && generateSlug(d.title || d.titleBn || '', d.id) === baseSlug
    );
    if (duplicates.length > 0) {
      return `${baseSlug}-${dest.id}`;
    }
  }
  return baseSlug;
}

/**
 * Finds destination by slug or ID with multi-level resilient fallback
 */
export function findDestinationBySlug(
  destinations: Destination[],
  slug: string | undefined
): Destination | null {
  if (!slug || !destinations || destinations.length === 0) return null;
  const normalizedSlug = slug.toLowerCase().trim();

  // 1. Direct ID match (supports legacy deep links /destination/spot-30)
  const byId = destinations.find((d) => d.id.toLowerCase() === normalizedSlug);
  if (byId) return byId;

  // 2. Exact match with computed slug (including duplicate ID suffix)
  const byComputedSlug = destinations.find(
    (d) => getDestinationSlug(d, destinations) === normalizedSlug
  );
  if (byComputedSlug) return byComputedSlug;

  // 3. Base slug match without duplicate suffix
  const byBaseSlug = destinations.find(
    (d) => generateSlug(d.title || d.titleBn || '', d.id) === normalizedSlug
  );
  if (byBaseSlug) return byBaseSlug;

  // 4. Suffix match if slug ends with -<id>
  const bySuffix = destinations.find((d) => normalizedSlug.endsWith(`-${d.id.toLowerCase()}`));
  if (bySuffix) return bySuffix;

  return null;
}

/**
 * Returns a unique SEO slug for an editorial story.
 */
export function getStorySlug(story: EditorialStory, allStories: EditorialStory[] = []): string {
  if (!story) return '';
  const baseSlug = generateSlug(story.title || story.titleBn || '', story.id);
  if (allStories.length > 0) {
    const duplicates = allStories.filter(
      (s) => s.id !== story.id && generateSlug(s.title || s.titleBn || '', s.id) === baseSlug
    );
    if (duplicates.length > 0) {
      return `${baseSlug}-${story.id}`;
    }
  }
  return baseSlug;
}

/**
 * Finds editorial story by slug or ID
 */
export function findStoryBySlug(
  stories: EditorialStory[],
  slug: string | undefined
): EditorialStory | null {
  if (!slug || !stories || stories.length === 0) return null;
  const normalizedSlug = slug.toLowerCase().trim();

  const byId = stories.find((s) => s.id.toLowerCase() === normalizedSlug);
  if (byId) return byId;

  const byComputedSlug = stories.find((s) => getStorySlug(s, stories) === normalizedSlug);
  if (byComputedSlug) return byComputedSlug;

  const byBaseSlug = stories.find(
    (s) => generateSlug(s.title || s.titleBn || '', s.id) === normalizedSlug
  );
  if (byBaseSlug) return byBaseSlug;

  const bySuffix = stories.find((s) => normalizedSlug.endsWith(`-${s.id.toLowerCase()}`));
  if (bySuffix) return bySuffix;

  return null;
}

/**
 * Returns a unique SEO slug for a festival.
 */
export function getFestivalSlug(fest: Festival, allFestivals: Festival[] = []): string {
  if (!fest) return '';
  const baseSlug = generateSlug(fest.title || fest.titleBn || '', fest.id);
  if (allFestivals.length > 0) {
    const duplicates = allFestivals.filter(
      (f) => f.id !== fest.id && generateSlug(f.title || f.titleBn || '', f.id) === baseSlug
    );
    if (duplicates.length > 0) {
      return `${baseSlug}-${fest.id}`;
    }
  }
  return baseSlug;
}

/**
 * Finds festival by slug or ID
 */
export function findFestivalBySlug(
  festivals: Festival[],
  slug: string | undefined
): Festival | null {
  if (!slug || !festivals || festivals.length === 0) return null;
  const normalizedSlug = slug.toLowerCase().trim();

  const byId = festivals.find((f) => f.id.toLowerCase() === normalizedSlug);
  if (byId) return byId;

  const byComputedSlug = festivals.find((f) => getFestivalSlug(f, festivals) === normalizedSlug);
  if (byComputedSlug) return byComputedSlug;

  const byBaseSlug = festivals.find(
    (f) => generateSlug(f.title || f.titleBn || '', f.id) === normalizedSlug
  );
  if (byBaseSlug) return byBaseSlug;

  const bySuffix = festivals.find((f) => normalizedSlug.endsWith(`-${f.id.toLowerCase()}`));
  if (bySuffix) return bySuffix;

  return null;
}

/**
 * Returns a unique SEO slug for an experience.
 */
export function getExperienceSlug(exp: Experience, allExperiences: Experience[] = []): string {
  if (!exp) return '';
  const baseSlug = generateSlug(exp.title || exp.titleBn || '', exp.id);
  if (allExperiences.length > 0) {
    const duplicates = allExperiences.filter(
      (e) => e.id !== exp.id && generateSlug(e.title || e.titleBn || '', e.id) === baseSlug
    );
    if (duplicates.length > 0) {
      return `${baseSlug}-${exp.id}`;
    }
  }
  return baseSlug;
}

/**
 * Finds experience by slug or ID
 */
export function findExperienceBySlug(
  experiences: Experience[],
  slug: string | undefined
): Experience | null {
  if (!slug || !experiences || experiences.length === 0) return null;
  const normalizedSlug = slug.toLowerCase().trim();

  const byId = experiences.find((e) => e.id.toLowerCase() === normalizedSlug);
  if (byId) return byId;

  const byComputedSlug = experiences.find(
    (e) => getExperienceSlug(e, experiences) === normalizedSlug
  );
  if (byComputedSlug) return byComputedSlug;

  const byBaseSlug = experiences.find(
    (e) => generateSlug(e.title || e.titleBn || '', e.id) === normalizedSlug
  );
  if (byBaseSlug) return byBaseSlug;

  const bySuffix = experiences.find((e) => normalizedSlug.endsWith(`-${e.id.toLowerCase()}`));
  if (bySuffix) return bySuffix;

  return null;
}

/**
 * Returns a unique SEO slug for a community photo post.
 */
export function getPostSlug(post: CommunityPost, allPosts: CommunityPost[] = []): string {
  if (!post) return '';
  const baseSlug = generateSlug(post.title || post.caption || '', post.id);
  if (allPosts.length > 0) {
    const duplicates = allPosts.filter(
      (p) => p.id !== post.id && generateSlug(p.title || p.caption || '', p.id) === baseSlug
    );
    if (duplicates.length > 0) {
      return `${baseSlug}-${post.id}`;
    }
  }
  return baseSlug;
}

/**
 * Finds community post by slug or ID
 */
export function findPostBySlug(
  posts: CommunityPost[],
  slug: string | undefined
): CommunityPost | null {
  if (!slug || !posts || posts.length === 0) return null;
  const normalizedSlug = slug.toLowerCase().trim();

  const byId = posts.find((p) => p.id.toLowerCase() === normalizedSlug);
  if (byId) return byId;

  const byComputedSlug = posts.find((p) => getPostSlug(p, posts) === normalizedSlug);
  if (byComputedSlug) return byComputedSlug;

  const byBaseSlug = posts.find(
    (p) => generateSlug(p.title || p.caption || '', p.id) === normalizedSlug
  );
  if (byBaseSlug) return byBaseSlug;

  const bySuffix = posts.find((p) => normalizedSlug.endsWith(`-${p.id.toLowerCase()}`));
  if (bySuffix) return bySuffix;

  return null;
}

/**
 * Converts district name (e.g. "Cox's Bazar", "Dhaka") to URL slug (e.g. "coxs-bazar", "dhaka")
 */
export function getDistrictSlug(districtName: string): string {
  return generateSlug(districtName);
}

/**
 * Matches district slug to canonical district name in 64 districts list
 */
export function findDistrictBySlug(
  slug: string | undefined,
  allDistricts: string[]
): string | null {
  if (!slug || !allDistricts || allDistricts.length === 0) return null;
  const normalizedSlug = slug.toLowerCase().trim();

  // 1. Direct case-insensitive match
  const direct = allDistricts.find((d) => d.toLowerCase() === normalizedSlug);
  if (direct) return direct;

  // 2. Slug match
  const bySlug = allDistricts.find((d) => getDistrictSlug(d) === normalizedSlug);
  if (bySlug) return bySlug;

  return null;
}
