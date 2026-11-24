'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Menu, Phone, X } from 'lucide-react';
import type { Locale, Profile } from '@/lib/types';
import { pick, whatsappLink } from '@/lib/site';
import { WorkingHours } from './Hours';
import { Logo } from './Logo';

/* --- the reader's language: Arabic first, English on request, remembered on the device --- */
const LocaleContext = createContext<{ locale: Locale; setLocale: (next: Locale) => void }>({
  locale: 'ar',
  setLocale: () => {},
});

export const useLocale = () => useContext(LocaleContext);

const STORAGE_KEY = 'gt-locale';

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === 'en') setLocaleState('en');
    } catch {
      /* private mode: stay on Arabic */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* not remembered, still switched */
    }
  };

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

/** WhatsApp's mark (lucide has no brand icons). */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42" />
    </svg>
  );
}

/**
 * The frame every page sits in: the floating menu, the page, the footer with the ways to
 * reach the developer, and a WhatsApp button that stays in the corner.
 */
export function Shell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const { locale, setLocale } = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAr = locale === 'ar';

  // parts marked `reveal` rise into place as they come on screen
  useEffect(() => {
    const parts = document.querySelectorAll('.reveal:not(.visible)');
    if (typeof IntersectionObserver === 'undefined') {
      parts.forEach((part) => part.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('visible')),
      { threshold: 0.08 }
    );
    parts.forEach((part) => observer.observe(part));
    return () => observer.disconnect();
  }, [pathname, locale]);

  useEffect(() => setMenuOpen(false), [pathname]);

  // the logo already leads home, so the wide menu leaves "Home" out; the phone menu lists it
  const links = [
    { href: '/', label: isAr ? 'الرئيسية' : 'Home', on: pathname === '/', phoneOnly: true },
    { href: '/#services', label: isAr ? 'خدماتنا' : 'Services', on: false },
    { href: '/platform/salla/', label: isAr ? 'ثيمات سلة' : 'Salla themes', on: pathname.startsWith('/platform/salla') },
    { href: '/platform/zid/', label: isAr ? 'ثيمات زد' : 'Zid themes', on: pathname.startsWith('/platform/zid') },
    { href: '/#contact', label: isAr ? 'تواصل' : 'Contact', on: false },
  ];
  const whatsapp = whatsappLink(profile.whatsapp, pick(profile.whatsapp_message, locale));

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div className="bg-grid" />
      <div className="pointer-events-none fixed -right-32 -top-32 -z-10 h-[34rem] w-[34rem] rounded-full bg-brand-600/20 blur-[100px]" />
      <div className="pointer-events-none fixed -bottom-32 -left-32 -z-10 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[100px]" />

      <div className="sticky top-0 z-40 px-4 pt-4">
        <nav
          aria-label={isAr ? 'القائمة الرئيسية' : 'Main menu'}
          className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full border border-white/10 bg-bg/80 px-4 py-2.5 shadow-lg shadow-black/30 backdrop-blur-xl sm:px-6"
        >
          <Link href="/" className="min-w-0 shrink overflow-hidden rounded-xl">
            <Logo brand={profile.brand} collapses />
          </Link>

          <div className="hidden items-center gap-6 md:flex lg:gap-7">
            {links
              .filter((link) => !link.phoneOnly)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={link.on ? 'page' : undefined}
                  className={`whitespace-nowrap text-sm transition-colors ${link.on ? 'font-semibold text-white' : 'text-white/60 hover:text-white'}`}
                >
                  {link.label}
                </Link>
              ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div dir="ltr" className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-1">
              {(['en', 'ar'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  aria-pressed={locale === code}
                  className={`rounded-full px-3 py-1 font-mono text-xs font-bold transition ${
                    locale === code ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow' : 'text-white/50 hover:text-white'
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={isAr ? 'القائمة' : 'Menu'}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="mx-auto mt-2 max-w-5xl rounded-2xl border border-white/10 bg-bg/95 p-3 shadow-xl backdrop-blur-xl md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-xl px-4 py-3 text-sm transition ${link.on ? 'bg-white/5 text-white' : 'text-white/70 hover:bg-white/5'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <main>{children}</main>

      <footer className="container-px mt-10 border-t border-white/5 py-10">
        <div className="flex flex-col items-center justify-between gap-5 text-sm text-white/55 md:flex-row">
          <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-start">
            <Logo brand={profile.brand} compact />
            <div>{pick(profile.name, locale)}</div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[#25d366]">
              <WhatsAppIcon className="h-4 w-4" />
              {isAr ? 'واتساب' : 'WhatsApp'}
            </a>
            <a href={`mailto:${profile.email}`} dir="ltr" className="inline-flex items-center gap-2 hover:text-brand-300">
              <Mail className="h-4 w-4" />
              {profile.email}
            </a>
            <a href={`tel:${profile.phone}`} dir="ltr" className="inline-flex items-center gap-2 hover:text-brand-300">
              <Phone className="h-4 w-4" />
              {profile.phone}
            </a>
          </div>
        </div>
        {profile.hours && (
          <div className="mt-6 text-center text-sm text-white/55">
            <WorkingHours hours={profile.hours} locale={locale} />
          </div>
        )}
        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-white/30">
          <span>
            © {new Date().getFullYear()} {profile.brand}
          </span>
          <span aria-hidden="true">·</span>
          <Link href="/admin/" className="hover:text-white/60">
            {isAr ? 'لوحة التحكم' : 'Control panel'}
          </Link>
        </div>
      </footer>

      <a
        href={whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label={isAr ? 'تواصل معنا على واتساب' : 'Chat with us on WhatsApp'}
        className="fixed bottom-5 left-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lg shadow-black/40 transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25d366]/40"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </a>
    </div>
  );
}
