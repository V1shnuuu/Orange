/**
 * Canonical origin this app is served from.
 *
 * Set NEXT_PUBLIC_SITE_URL per deployment so preview builds advertise
 * themselves rather than pointing crawlers at production.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://circlepact-mvp.vercel.app'
).replace(/\/+$/, '');

/**
 * Public routes worth indexing.
 *
 * Circle and split detail pages are left out on purpose: they are keyed by
 * an id that only exists for the wallet that created them, so there is
 * nothing stable for a crawler to fetch.
 */
export const INDEXABLE_ROUTES = [
  '/',
  '/circles',
  '/circles/new',
  '/explore',
  '/analytics',
  '/splits',
  '/splits/new',
] as const;
