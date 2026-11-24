import type { Locale, Platform, Text } from './types';

/** The folder the site is served from ("" on its own domain, "/gt-themes" on a project site). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** The site's full address, without a trailing slash: what search engines and shared links are given. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://gehad450.github.io/gt-themes').replace(/\/+$/, '');

/** A page or a file of the site as a full address ("/blog/" → "https://…/blog/"). */
export const absolute = (path: string): string => `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

/** A file of the `public` folder (a picture named in the content files), with the base path. */
export const asset = (file: string | undefined | null): string => {
  if (!file) return '';
  if (/^(https?:)?\/\//.test(file) || file.startsWith('data:')) return file;
  return `${BASE_PATH}${file.startsWith('/') ? '' : '/'}${file}`;
};

/** The text in the reader's language, Arabic when there is no translation. */
export const pick = (text: Text | undefined | null, locale: Locale): string =>
  !text ? '' : (locale === 'en' ? text.en : text.ar) || text.ar || text.en || '';

export const PLATFORMS: Record<Platform, { name: Text; color: string; desc: Text }> = {
  salla: {
    name: { ar: 'سلة', en: 'Salla' },
    color: '#1ec08b',
    desc: { ar: 'ثيمات سلة مع شرح كل قسم وطريقة إعداده', en: 'Salla themes, every section explained' },
  },
  zid: {
    name: { ar: 'زد', en: 'Zid' },
    color: '#a78bfa',
    desc: { ar: 'ثيمات زد مع شرح كل قسم وطريقة إعداده', en: 'Zid themes, every section explained' },
  },
};

export const isPlatform = (value: string): value is Platform => value === 'salla' || value === 'zid';

/** A count with its noun as Arabic grammar wants it: «قسمان», «٤ أقسام», «٣٩ قسماً» — "39 sections" in English. */
export function countOf(count: number, locale: Locale, noun: { one: string; two: string; few: string; many: string; en: [string, string] }): string {
  if (locale === 'en') return `${count} ${count === 1 ? noun.en[0] : noun.en[1]}`;
  if (count === 1) return noun.one;
  if (count === 2) return noun.two;
  const tail = count % 100;
  return `${count} ${tail >= 3 && tail <= 10 ? noun.few : noun.many}`;
}

export const SECTIONS = { one: 'قسم واحد', two: 'قسمان', few: 'أقسام', many: 'قسماً', en: ['section', 'sections'] as [string, string] };
export const THEMES = { one: 'ثيم واحد', two: 'ثيمان', few: 'ثيمات', many: 'ثيماً', en: ['theme', 'themes'] as [string, string] };

/** The address that opens a WhatsApp chat with the number, with a first message ready. */
export const whatsappLink = (number: string, message?: string): string =>
  `https://wa.me/${number.replace(/\D/g, '')}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
