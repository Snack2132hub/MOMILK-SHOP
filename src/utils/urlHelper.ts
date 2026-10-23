/**
 * Helper to ensure social contact links are valid, absolute URLs
 * that work cleanly with HTML anchor tags (target="_blank")
 */
export function resolveContactUrl(
  url: string | undefined | null,
  fallback: string | undefined | null,
  channel: 'line' | 'fb' | 'ig' | 'other'
): string {
  const raw = (url || fallback || '').trim();
  if (!raw) {
    if (channel === 'line') return 'https://line.me/ti/p/~@momilkshop';
    if (channel === 'fb') return 'https://facebook.com';
    if (channel === 'ig') return 'https://instagram.com';
    return '#';
  }

  // Already an absolute HTTP/HTTPS URL
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (channel === 'line') {
    if (raw.startsWith('@')) {
      return `https://line.me/ti/p/~${raw}`;
    }
    if (raw.includes('line.me') || raw.includes('lin.ee')) {
      return `https://${raw}`;
    }
    // If it's an ID like momilk_shop
    return `https://line.me/ti/p/~${raw}`;
  }

  if (channel === 'fb') {
    if (raw.includes('facebook.com') || raw.includes('fb.com')) {
      return `https://${raw}`;
    }
    return `https://facebook.com/${raw.replace(/^@/, '')}`;
  }

  if (channel === 'ig') {
    if (raw.includes('instagram.com')) {
      return `https://${raw}`;
    }
    return `https://instagram.com/${raw.replace(/^@/, '')}`;
  }

  // TikTok / other
  if (raw.startsWith('@')) {
    return `https://tiktok.com/${raw}`;
  }
  return `https://${raw}`;
}
