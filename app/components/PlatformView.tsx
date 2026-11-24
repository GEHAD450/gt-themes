'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ThemeCard } from '@/lib/content';
import type { Platform, Profile } from '@/lib/types';
import { pick, PLATFORMS } from '@/lib/site';
import { Shell, useEnglishTitle, useLocale } from './Shell';
import { ThemeCardLink } from './ThemeCardLink';

/** A platform's page: its themes, each a door to its guide. */
export function PlatformView({ profile, platform, themes }: { profile: Profile; platform: Platform; themes: ThemeCard[] }) {
  return (
    <Shell profile={profile}>
      <Body platform={platform} themes={themes} />
    </Shell>
  );
}

function Body({ platform, themes }: { platform: Platform; themes: ThemeCard[] }) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const info = PLATFORMS[platform];
  useEnglishTitle(`${pick(info.name, 'en')} themes`);
  const Chevron = isAr ? ChevronLeft : ChevronRight;

  return (
    <div className="container-px pb-10 pt-12">
      <nav aria-label={isAr ? 'مسار الصفحة' : 'Breadcrumb'} className="flex items-center gap-1.5 text-sm text-white/50">
        <Link href="/" className="hover:text-white">
          {isAr ? 'الرئيسية' : 'Home'}
        </Link>
        <Chevron className="h-4 w-4" />
        <span className="text-white">{pick(info.name, locale)}</span>
      </nav>

      <header className="mt-6 text-center">
        <span className="section-tag" style={{ color: info.color, borderColor: `${info.color}55`, background: `${info.color}18` }}>
          {isAr ? 'منصة' : 'Platform'}
        </span>
        <h1 className="mt-4 text-4xl font-black sm:text-5xl">
          {isAr ? 'ثيمات ' : ''}
          <span style={{ color: info.color }}>{pick(info.name, locale)}</span>
          {isAr ? '' : ' themes'}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-white/55">
          {isAr
            ? 'اختر الثيم لتفتح شرحه: صورة لكل قسم، ما يفعله، وطريقة إعداده.'
            : 'Open a theme to read its guide: a picture of every section, what it does and how to set it up.'}
        </p>
      </header>

      {themes.length === 0 ? (
        <p className="mt-14 text-center text-white/40">{isAr ? 'لا توجد ثيمات هنا بعد.' : 'No themes here yet.'}</p>
      ) : (
        <div className={`mx-auto mt-12 grid gap-6 sm:grid-cols-2 ${themes.length >= 3 ? 'lg:grid-cols-3' : 'max-w-3xl'} ${themes.length === 1 ? 'max-w-md sm:grid-cols-1' : ''}`}>
          {themes.map((theme) => (
            <ThemeCardLink key={theme.slug} theme={theme} />
          ))}
        </div>
      )}
    </div>
  );
}
