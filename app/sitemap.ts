import type { MetadataRoute } from 'next';
import { getPosts, getThemes } from '@/lib/content';
import { absolute } from '@/lib/site';

export const dynamic = 'force-static';

/** The list of pages given to search engines: `sitemap.xml`. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['/', '/platform/salla/', '/platform/zid/', '/blog/', ...getThemes().map((theme) => `/theme/${theme.slug}/`)];
  return [
    ...pages.map((page) => ({ url: absolute(page), changeFrequency: 'weekly' as const, priority: page === '/' ? 1 : 0.8 })),
    ...getPosts().map((post) => ({ url: absolute(`/blog/${post.slug}/`), lastModified: post.date, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
