import { describe, it, expect } from 'vitest';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { INDEXABLE_ROUTES, SITE_URL } from '@/lib/site';

describe('sitemap', () => {
  it('lists every indexable route once', () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toHaveLength(INDEXABLE_ROUTES.length);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('emits absolute urls with no double slash', () => {
    for (const entry of sitemap()) {
      expect(entry.url.startsWith(SITE_URL)).toBe(true);
      expect(entry.url.slice('https://'.length)).not.toContain('//');
    }
  });

  it('ranks the landing page above the rest', () => {
    const [home, ...others] = sitemap();

    expect(home.url).toBe(SITE_URL);
    expect(home.priority).toBe(1);
    for (const entry of others) {
      expect(entry.priority).toBeLessThan(1);
    }
  });
});

describe('robots', () => {
  it('points crawlers at the sitemap this app actually serves', () => {
    expect(robots().sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
