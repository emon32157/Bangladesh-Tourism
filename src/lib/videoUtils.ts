/**
 * Utility functions for parsing and rendering YouTube video links and iframe embed codes
 */

/**
 * Extracts the 11-character YouTube video ID from various formats:
 * - Full <iframe> embed code (with double, single, or escaped quotes)
 * - Standard watch URLs (youtube.com/watch?v=...)
 * - Short URLs (youtu.be/...)
 * - Embed URLs (youtube.com/embed/...)
 * - Shorts URLs (youtube.com/shorts/...)
 * - Live URLs (youtube.com/live/...)
 * - Raw video ID
 */
export function extractYouTubeVideoId(input: string | undefined | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Unescape HTML entities if pasted as encoded text (&quot;, &#34;, etc.)
  const sanitized = trimmed
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

  // 1. Check if input contains an <iframe> tag and extract the src
  const iframeSrcMatch = sanitized.match(/<iframe\b[^>]*\bsrc=["']?([^"'>\s]+)["']?[^>]*>/i);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    const srcUrl = iframeSrcMatch[1];
    const idFromSrc = extractFromUrlOrString(srcUrl);
    if (idFromSrc) return idFromSrc;
  }

  // 2. Direct extraction from URL or string
  return extractFromUrlOrString(sanitized);
}

function extractFromUrlOrString(str: string): string | null {
  const trimmed = str.trim();
  if (!trimmed) return null;

  // Standard regex patterns for YouTube video IDs (11 alphanumeric, hyphen, underscore characters)
  const patterns = [
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i,
    /^[a-zA-Z0-9_-]{11}$/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fallback check for URL parameter "v"
  try {
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      const urlObj = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const v = urlObj.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) {
        return v;
      }
    }
  } catch {
    // Ignore URL parse error and continue
  }

  return null;
}

/**
 * Extracts optional start time from URL or embed code (in seconds)
 */
export function extractStartTimeSeconds(input: string | undefined | null): number | null {
  if (!input || typeof input !== 'string') return null;
  
  // Look for t=... or start=...
  const match = input.match(/[?&](?:t|start)=(\d+h)?(\d+m)?(\d+s)?(\d+)?/i);
  if (!match) return null;

  if (match[4] && !match[1] && !match[2] && !match[3]) {
    // Plain number like ?t=120 or ?start=120
    const sec = parseInt(match[4], 10);
    return isNaN(sec) ? null : sec;
  }

  let totalSeconds = 0;
  if (match[1]) totalSeconds += parseInt(match[1], 10) * 3600;
  if (match[2]) totalSeconds += parseInt(match[2], 10) * 60;
  if (match[3]) totalSeconds += parseInt(match[3], 10);

  return totalSeconds > 0 ? totalSeconds : null;
}

/**
 * Generates privacy-enhanced YouTube embed URL
 */
export function getYouTubeEmbedUrl(input: string | undefined | null): string | null {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;

  const startSeconds = extractStartTimeSeconds(input);
  const startParam = startSeconds ? `&start=${startSeconds}` : '';

  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1${startParam}`;
}

/**
 * Gets high quality YouTube thumbnail URL
 */
export function getYouTubeThumbnail(input: string | undefined | null): string | null {
  const videoId = extractYouTubeVideoId(input);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Checks whether an input string is a valid YouTube URL or embed code
 */
export function isValidYouTubeInput(input: string | undefined | null): boolean {
  return extractYouTubeVideoId(input) !== null;
}
