import fs from 'node:fs';
import path from 'node:path';
import { ltrSizesIn } from './site';
import type { Platform, Post, Profile, StoreEntry, Theme } from './types';

/**
 * The site's content, read from the `content/` folder when the site is built. Nothing is
 * fetched at run time: a change to one of these files (by hand, or from the control panel,
 * which commits to the repository) shows on the site after the next build.
 */
const CONTENT = path.join(process.cwd(), 'content');

const read = <T,>(file: string): T => ltrSizesIn(JSON.parse(fs.readFileSync(path.join(CONTENT, file), 'utf8')) as T);

export const getProfile = (): Profile => read<Profile>('profile.json');

export const getStores = (): StoreEntry[] => read<StoreEntry[]>('stores.json');

/**
 * A WebP picture's width and height, from the first bytes of the file. The pages give them to
 * the browser so a picture's place is kept before it loads: no jump while reading, and a link
 * to a section lands on that section.
 */
function sizeOf(file: string | undefined): [number, number] | undefined {
  if (!file || !file.startsWith('/')) return undefined;
  try {
    const handle = fs.openSync(path.join(process.cwd(), 'public', file), 'r');
    const head = Buffer.alloc(32);
    fs.readSync(handle, head, 0, 32, 0);
    fs.closeSync(handle);
    if (head.toString('ascii', 0, 4) !== 'RIFF' || head.toString('ascii', 8, 12) !== 'WEBP') return undefined;
    const kind = head.toString('ascii', 12, 16);
    if (kind === 'VP8 ') return [head.readUInt16LE(26) & 0x3fff, head.readUInt16LE(28) & 0x3fff];
    if (kind === 'VP8L') {
      const bits = head.readUInt32LE(21);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    }
    if (kind === 'VP8X') return [head.readUIntLE(24, 3) + 1, head.readUIntLE(27, 3) + 1];
  } catch {
    /* a picture named in the content but not in the folder: the page simply shows none */
  }
  return undefined;
}

const sized = (theme: Theme): Theme => ({
  ...theme,
  cover_size: sizeOf(theme.cover),
  demos: theme.demos?.map((demo) => ({ ...demo, image_size: sizeOf(demo.image) })),
  groups: theme.groups.map((group) => ({
    ...group,
    sections: group.sections.map((section) => ({
      ...section,
      image_size: sizeOf(section.image),
      image_mobile_size: sizeOf(section.image_mobile),
    })),
  })),
});

/** The order themes are listed in; a theme file not named here comes after, by name. */
const ORDER = ['marc', 'abaq', 'fuse', 'marco'];

export function getThemes(): Theme[] {
  const dir = path.join(CONTENT, 'themes');
  if (!fs.existsSync(dir)) return [];
  const themes = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => sized(read<Theme>(`themes/${name}`)));
  const rank = (slug: string) => (ORDER.includes(slug) ? ORDER.indexOf(slug) : ORDER.length);
  return themes.sort((a, b) => rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug));
}

export const getTheme = (slug: string): Theme | undefined => getThemes().find((theme) => theme.slug === slug);

export const themesOf = (platform: Platform): Theme[] => getThemes().filter((theme) => theme.platform === platform);

/** A theme as the cards and menus need it — without its documentation. */
export type ThemeCard = Omit<Theme, 'groups'> & { sections: number };

export const toCard = (theme: Theme): ThemeCard => {
  const { groups, ...rest } = theme;
  return { ...rest, sections: groups.reduce((total, group) => total + group.sections.length, 0) };
};

/** The published articles of the blog, newest first. */
export function getPosts(): Post[] {
  const dir = path.join(CONTENT, 'blog');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => read<Post>(`blog/${name}`))
    .filter((post) => post.published && post.slug && post.title?.ar)
    .map((post) => ({ ...post, cover_size: sizeOf(post.cover) }))
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

export const getPost = (slug: string): Post | undefined => getPosts().find((post) => post.slug === slug);

/** An article as the lists need it — without its text. */
export type PostCard = Omit<Post, 'body'>;

export const toPostCard = (post: Post): PostCard => {
  const { body: _body, ...rest } = post;
  return rest;
};
