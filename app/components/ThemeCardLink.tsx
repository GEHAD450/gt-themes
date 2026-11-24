'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, LayoutTemplate } from 'lucide-react';
import type { ThemeCard } from '@/lib/content';
import { asset, countOf, pick, PLATFORMS, SECTIONS } from '@/lib/site';
import { useLocale } from './Shell';

/** A theme as a card: its cover, its name, a way into its guide and — when it has one — its live preview. */
export function ThemeCardLink({ theme }: { theme: ThemeCard }) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const platform = PLATFORMS[theme.platform];
  const name = pick(theme.name, locale);
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const guide = `/theme/${theme.slug}/`;
  const preview = (theme.demos ?? []).find((demo) => demo.url)?.url;

  return (
    <article className="reveal card group flex flex-col overflow-hidden transition hover:-translate-y-1.5 hover:border-white/25">
      <Link
        href={guide}
        aria-label={isAr ? `شرح ثيم ${name}` : `The ${name} theme guide`}
        className="relative block aspect-[16/10] overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${platform.color}33, transparent)` }}
      >
        {theme.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset(theme.cover)}
            alt=""
            width={theme.cover_size?.[0]}
            height={theme.cover_size?.[1]}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center" style={{ color: platform.color }}>
            <LayoutTemplate className="h-12 w-12" />
          </div>
        )}
        <span
          className="absolute top-3 rounded-full px-3 py-1 text-[11px] font-bold text-[#0a0a0f] ltr:left-3 rtl:right-3"
          style={{ background: platform.color }}
        >
          {pick(platform.name, locale)}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-white">
          <Link href={guide} className="hover:text-brand-200">
            {name}
          </Link>
        </h3>
        {theme.tagline && <p className="mt-1 text-sm text-brand-300">{pick(theme.tagline, locale)}</p>}
        {theme.summary && <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-white/55">{pick(theme.summary, locale)}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
          <Link href={guide} className="btn btn-primary flex-1 whitespace-nowrap px-4 py-2.5">
            {isAr ? 'الشرح' : 'Guide'} · {countOf(theme.sections, locale, SECTIONS)}
            <Arrow className="h-4 w-4 transition group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
          </Link>
          {preview ? (
            <a href={preview} target="_blank" rel="noreferrer" className="btn btn-ghost flex-1 whitespace-nowrap px-4 py-2.5">
              <Eye className="h-4 w-4" />
              {isAr ? 'معاينة حيّة' : 'Live preview'}
            </a>
          ) : (
            <span className="flex-1 whitespace-nowrap rounded-xl border border-dashed border-white/10 px-4 py-2.5 text-center text-xs text-white/40">
              {isAr ? 'المعاينة قريباً' : 'Preview soon'}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
