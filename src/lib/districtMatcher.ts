import { Destination } from '../types';
import { BANGLADESH_DISTRICTS, BangladeshDistrict } from '../data/bangladeshDistricts';
import { getDistrictSlug } from './slugs';

/**
 * Returns canonical BangladeshDistrict object by nameEn, nameBn, slug, or id
 */
export function getCanonicalDistrict(
  query: string | null | undefined
): BangladeshDistrict | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // 1. Direct match with id
  const byId = BANGLADESH_DISTRICTS.find((d) => d.id.toLowerCase() === q);
  if (byId) return byId;

  // 2. Direct match with nameEn
  const byNameEn = BANGLADESH_DISTRICTS.find((d) => d.nameEn.toLowerCase() === q);
  if (byNameEn) return byNameEn;

  // 3. Match with nameBn
  const byNameBn = BANGLADESH_DISTRICTS.find((d) => d.nameBn === query.trim());
  if (byNameBn) return byNameBn;

  // 4. Slug match
  const bySlug = BANGLADESH_DISTRICTS.find((d) => getDistrictSlug(d.nameEn) === q);
  if (bySlug) return bySlug;

  // 5. Partial / contains match
  const partial = BANGLADESH_DISTRICTS.find(
    (d) =>
      d.nameEn.toLowerCase().includes(q) ||
      q.includes(d.nameEn.toLowerCase()) ||
      (d.nameBn && query.includes(d.nameBn))
  );
  if (partial) return partial;

  return null;
}

/**
 * Checks whether a given Destination belongs to a specific district
 */
export function isDestinationInDistrict(
  dest: Destination,
  districtEn: string,
  districtBn?: string
): boolean {
  if (!dest || !districtEn) return false;

  const targetEn = districtEn.toLowerCase().trim();
  const targetBn = (districtBn || '').trim();

  const dEn = (dest.district || '').toLowerCase().trim();
  const dBn = (dest.districtBn || '').trim();
  const addr = (dest.address || '').toLowerCase();
  const title = (dest.title || '').toLowerCase();
  const titleBn = dest.titleBn || '';

  // Direct match on district field
  if (dEn && (dEn === targetEn || dEn.includes(targetEn) || targetEn.includes(dEn))) {
    return true;
  }
  if (dBn && targetBn && (dBn === targetBn || dBn.includes(targetBn) || targetBn.includes(dBn))) {
    return true;
  }
  if (dest.district && (dest.district === targetEn || dest.district === targetBn)) {
    return true;
  }

  // Address match
  if (addr) {
    if (addr.includes(targetEn)) return true;
    if (targetBn && addr.includes(targetBn)) return true;
  }

  // Title match
  if (title && title.includes(targetEn)) return true;
  if (titleBn && targetBn && titleBn.includes(targetBn)) return true;

  return false;
}
