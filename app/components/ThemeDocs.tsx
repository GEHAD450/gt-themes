'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Eye, Lightbulb, Link2, Monitor, Search, Smartphone, Store, X } from 'lucide-react';
import type { DocSection, Profile, StoreEntry, Theme } from '@/lib/types';
import { asset, countOf, pick, PLATFORMS, SECTIONS, whatsappLink } from '@/lib/site';
import { Annotated, MarkerLegend } from './Annotated';
import { WorkingHours } from './Hours';
import { Shell, useEnglishTitle, useLocale, WhatsAppIcon } from './Shell';

/** A theme's guide: every section with its picture, what it is for and how to set it up. */
export function ThemeDocs({ profile, theme, stores }: { profile: Profile; theme: Theme; stores: StoreEntry[] }) {
  return (
    <Shell profile={profile}>
      <Body profile={profile} theme={theme} stores={stores} />
    </Shell>
  );
}

const fold = (text: string) => text.toLowerCase().replace(/[ً-ْـ]/g, '');

const LOOKS = { one: 'شكل واحد', two: 'شكلين', few: 'أشكال', many: 'شكلاً', en: ['look', 'looks'] as [string, string] };

function Body({ profile, theme, stores }: { profile: Profile; theme: Theme; stores: StoreEntry[] }) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const platform = PLATFORMS[theme.platform];
  const name = pick(theme.name, locale);
  useEnglishTitle(`${pick(theme.name, 'en')} theme guide`);
  const Chevron = isAr ? ChevronLeft : ChevronRight;
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const [active, setActive] = useState('');

  // the search: a section stays when its title, text, steps or option names hold the words
  const groups = useMemo(() => {
    const words = fold(query.trim());
    if (!words) return theme.groups;
    const holds = (section: DocSection) =>
      fold(
        [
          pick(section.title, locale),
          pick(section.text, locale),
          ...((locale === 'en' ? section.steps?.en : section.steps?.ar) ?? section.steps?.ar ?? []),
          ...(section.settings ?? []).flatMap((setting) => [setting.label, setting.label_en ?? '', pick(setting.note, locale)]),
        ].join(' ')
      ).includes(words);
    return theme.groups.map((group) => ({ ...group, sections: group.sections.filter(holds) })).filter((group) => group.sections.length > 0);
  }, [query, theme.groups, locale]);

  // which section the reader is at, for the list of contents
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (seen) setActive(seen.target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' }
    );
    document.querySelectorAll('[data-doc-section]').forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [groups]);

  // the enlarged picture closes with Escape
  useEffect(() => {
    if (!zoom) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setZoom(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  const total = theme.groups.reduce((sum, group) => sum + group.sections.length, 0);
  const help = whatsappLink(profile.whatsapp, isAr ? `مرحباً، أحتاج مساعدة في ثيم ${pick(theme.name, 'ar')}` : `Hello, I need help with the ${pick(theme.name, 'en')} theme`);
  const demos = (theme.demos ?? []).filter((demo) => demo.url);
  /** The looks that have a picture: shown as a small gallery under the theme's name. */
  const looks = (theme.demos ?? []).filter((demo) => demo.image);

  return (
    <div className="container-px pb-10 pt-12">
      <nav aria-label={isAr ? 'مسار الصفحة' : 'Breadcrumb'} className="flex flex-wrap items-center gap-1.5 text-sm text-white/50">
        <Link href="/" className="hover:text-white">
          {isAr ? 'الرئيسية' : 'Home'}
        </Link>
        <Chevron className="h-4 w-4" />
        <Link href={`/platform/${theme.platform}/`} className="hover:text-white">
          {pick(platform.name, locale)}
        </Link>
        <Chevron className="h-4 w-4" />
        <span className="text-white">{name}</span>
      </nav>

      {/* the theme */}
      <header className="mt-6 grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <span className="section-tag" style={{ color: platform.color, borderColor: `${platform.color}55`, background: `${platform.color}18` }}>
            {isAr ? `ثيم ${pick(platform.name, locale)}` : `${pick(platform.name, locale)} theme`}
          </span>
          <h1 className="mt-4 text-4xl font-black sm:text-5xl">{name}</h1>
          {theme.tagline && <p className="mt-2 text-lg text-brand-300">{pick(theme.tagline, locale)}</p>}
          {theme.summary && <p className="mt-4 leading-relaxed text-white/65">{pick(theme.summary, locale)}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#guide" className="btn btn-primary">
              {isAr ? 'شرح الثيم' : 'The guide'} · {countOf(total, locale, SECTIONS)}
            </a>
            <a href="#stores" className="btn btn-ghost">
              <Store className="h-4 w-4" />
              {isAr ? 'متاجر فعّلت الثيم' : 'Stores using it'}
            </a>
            {demos.map((demo) => (
              <a key={demo.url} href={demo.url} target="_blank" rel="noreferrer" className="btn btn-ghost">
                <Eye className="h-4 w-4" />
                {isAr ? `معاينة حيّة · ${pick(demo.label, locale)}` : `Live preview · ${pick(demo.label, locale)}`}
              </a>
            ))}
          </div>
        </div>
        {theme.cover && (
          <button
            type="button"
            onClick={() => setZoom({ src: asset(theme.cover), alt: name })}
            className="card overflow-hidden transition hover:border-white/25"
            aria-label={isAr ? 'تكبير صورة الثيم' : 'Enlarge the theme picture'}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(theme.cover)} alt={name} width={theme.cover_size?.[0]} height={theme.cover_size?.[1]} className="max-h-[26rem] w-full object-cover object-top" />
          </button>
        )}
      </header>

      {/* the theme's looks / demo stores, each with its picture */}
      {looks.length > 0 && (
        <section id="previews" className="mt-12 scroll-mt-28">
          <h2 className="mb-5 flex items-center gap-3 text-2xl font-black">
            <span className="h-6 w-1.5 rounded-full" style={{ background: platform.color }} />
            {looks.length === 1 ? (isAr ? 'معاينة الثيم' : 'The theme at a glance') : isAr ? `الثيم في ${countOf(looks.length, 'ar', LOOKS)}` : `The theme in ${countOf(looks.length, 'en', LOOKS)}`}
          </h2>
          <ul className={`grid gap-5 ${looks.length >= 3 ? 'md:grid-cols-3' : looks.length === 2 ? 'md:grid-cols-2' : ''}`}>
            {looks.map((look, index) => {
              const label = pick(look.label, locale);
              return (
                <li key={index} className="card group flex flex-col overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setZoom({ src: asset(look.image), alt: label })}
                    className="block overflow-hidden"
                    aria-label={isAr ? `تكبير صورة ${label}` : `Enlarge the picture of ${label}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset(look.image)}
                      alt={label}
                      width={look.image_size?.[0]}
                      height={look.image_size?.[1]}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/10] w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                    />
                  </button>
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-3 p-4">
                    <h3 className="font-bold text-white">{label}</h3>
                    {look.url ? (
                      <a href={look.url} target="_blank" rel="noreferrer" className="btn btn-ghost px-4 py-2">
                        <Eye className="h-4 w-4" />
                        {isAr ? 'معاينة حيّة' : 'Live preview'}
                      </a>
                    ) : (
                      <span className="rounded-lg border border-dashed border-white/10 px-3 py-1.5 text-xs text-white/45">{pick(look.note, locale) || (isAr ? 'المعاينة قريباً' : 'Preview soon')}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {theme.highlights && theme.highlights.length > 0 && (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {theme.highlights.map((item, index) => (
            <li key={index} className="card flex items-start gap-3 p-4 text-sm text-white/75">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: platform.color }} />
              {pick(item, locale)}
            </li>
          ))}
        </ul>
      )}

      {/* the guide */}
      <div id="guide" className="mt-14 scroll-mt-28 lg:grid lg:grid-cols-[16rem_1fr] lg:gap-10">
        <aside className="mb-8 lg:mb-0">
          <div className="lg:sticky lg:top-28">
            <label className="relative block">
              <span className="sr-only">{isAr ? 'ابحث في الشرح' : 'Search the guide'}</span>
              <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-white/40 ltr:left-4 rtl:right-4" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={isAr ? 'ابحث عن قسم أو إعداد…' : 'Search a section or an option…'}
                className="field ltr:pl-11 rtl:pr-11"
              />
            </label>
            <nav aria-label={isAr ? 'محتويات الشرح' : 'Guide contents'} className="mt-4 max-h-[60vh] overflow-y-auto pe-1 max-lg:hidden">
              {groups.map((group) => (
                <div key={group.id} className="mb-4">
                  <div className="mb-1.5 text-xs font-bold text-white/40">{pick(group.title, locale)}</div>
                  <ul className="space-y-0.5 border-s border-white/10">
                    {group.sections.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className={`-ms-px block border-s py-1.5 ps-3 text-sm transition ${
                            active === section.id ? 'border-brand-400 font-semibold text-white' : 'border-transparent text-white/55 hover:text-white'
                          }`}
                        >
                          {pick(section.title, locale)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            {/* on a phone the list is a menu */}
            <select
              aria-label={isAr ? 'انتقل إلى قسم' : 'Jump to a section'}
              className="field mt-3 lg:hidden"
              value=""
              onChange={(event) => {
                const target = document.getElementById(event.target.value);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <option value="">{isAr ? 'انتقل إلى قسم…' : 'Jump to a section…'}</option>
              {groups.map((group) => (
                <optgroup key={group.id} label={pick(group.title, locale)}>
                  {group.sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {pick(section.title, locale)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </aside>

        <div className="min-w-0">
          {groups.length === 0 && <p className="card p-8 text-center text-white/50">{isAr ? 'لا يوجد قسم بهذا الاسم. جرّب كلمة أخرى.' : 'No section matches. Try another word.'}</p>}
          {groups.map((group) => (
            <section key={group.id} className="mb-12">
              <h2 className="mb-5 flex items-center gap-3 text-2xl font-black">
                <span className="h-6 w-1.5 rounded-full" style={{ background: platform.color }} />
                {pick(group.title, locale)}
              </h2>
              {group.kind === 'faq' ? (
                <div className="card divide-y divide-white/10 overflow-hidden">
                  {group.sections.map((section) => (
                    <QuestionRow key={section.id} section={section} onZoom={setZoom} unfolded={query.trim() !== ''} />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {group.sections.map((section) => (
                    <SectionCard key={section.id} section={section} onZoom={setZoom} />
                  ))}
                </div>
              )}
            </section>
          ))}

          {/* stores running the theme */}
          <section id="stores" className="scroll-mt-28">
            <h2 className="mb-5 flex items-center gap-3 text-2xl font-black">
              <span className="h-6 w-1.5 rounded-full" style={{ background: platform.color }} />
              {isAr ? 'متاجر فعّلت الثيم' : 'Stores using this theme'}
            </h2>
            {stores.length === 0 ? (
              <div className="card p-8 text-center">
                <Store className="mx-auto h-10 w-10 text-white/30" />
                <p className="mt-3 text-white/60">
                  {isAr ? 'تُضاف هنا المتاجر التي تعمل بالثيم. فعّلتَ الثيم على متجرك؟ أرسل رابطه ليظهر هنا.' : 'Stores running the theme are listed here. Running it on yours? Send its address to be listed.'}
                </p>
                <a href={help} target="_blank" rel="noreferrer" className="btn btn-ghost mt-5">
                  <WhatsAppIcon className="h-4 w-4 text-[#25d366]" />
                  {isAr ? 'أرسل رابط متجرك' : 'Send your store'}
                </a>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {stores.map((store) => (
                  <li key={store.id}>
                    <a href={store.url} target="_blank" rel="noreferrer" className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-white/25">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: `${platform.color}22`, color: platform.color }}>
                        <Store className="h-6 w-6" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-white">{store.name}</span>
                        {store.note && <span className="block truncate text-sm text-white/55">{store.note}</span>}
                        <span dir="ltr" className="block truncate text-xs text-white/40">
                          {store.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </span>
                      </span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-white/40" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="card mt-10 flex flex-col items-center gap-4 p-7 text-center sm:flex-row sm:text-start">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">{isAr ? 'لم تجد ما تبحث عنه؟' : 'Did not find what you need?'}</h3>
              <p className="mt-1 text-sm text-white/55">{isAr ? 'اسأل مباشرة على واتساب وسنساعدك في إعداد الثيم.' : 'Ask directly on WhatsApp and we will help you set the theme up.'}</p>
              {profile.hours && (
                <p className="mt-3 text-xs text-white/50">
                  <WorkingHours hours={profile.hours} locale={locale} className="sm:justify-start" />
                </p>
              )}
            </div>
            <a href={help} target="_blank" rel="noreferrer" className="btn bg-[#25d366] text-[#06270f] hover:bg-[#1fbe5c]">
              <WhatsAppIcon className="h-5 w-5" />
              {isAr ? 'اسأل على واتساب' : 'Ask on WhatsApp'}
            </a>
          </div>
        </div>
      </div>

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zoom.alt}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setZoom(null)}
        >
          <button
            type="button"
            autoFocus
            onClick={() => setZoom(null)}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="absolute top-4 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white ltr:right-4 rtl:left-4"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom.src} alt={zoom.alt} className="max-h-full max-w-full rounded-xl object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function SectionCard({ section, onZoom }: { section: DocSection; onZoom: (picture: { src: string; alt: string }) => void }) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const [phone, setPhone] = useState(false);
  const title = pick(section.title, locale);
  const picture = phone && section.image_mobile ? section.image_mobile : section.image || section.image_mobile;
  const showsPhone = Boolean(picture) && picture === section.image_mobile;
  // the arrows belong to the desktop picture
  const markers = !showsPhone ? (section.markers ?? []) : [];
  const [width, height] = (showsPhone ? section.image_mobile_size : section.image_size) ?? [];
  // The picture's place is kept before it loads: as wide as the card allows, never taller than
  // the limit (in rem), always in the picture's own proportions.
  const limit = markers.length > 0 ? 40 : 34;
  const room = width && height ? { aspectRatio: `${width} / ${height}`, width: `min(100%, ${((limit * width) / height).toFixed(2)}rem)` } : undefined;

  return (
    <article id={section.id} data-doc-section className="card scroll-mt-28 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <div className="flex items-center gap-2">
          {section.image && section.image_mobile && (
            <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setPhone(false)}
                aria-pressed={!phone}
                aria-label={isAr ? 'عرض سطح المكتب' : 'Desktop view'}
                className={`grid h-7 w-7 place-items-center rounded-full transition ${!phone ? 'bg-brand-500 text-white' : 'text-white/50 hover:text-white'}`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPhone(true)}
                aria-pressed={phone}
                aria-label={isAr ? 'عرض الجوال' : 'Phone view'}
                className={`grid h-7 w-7 place-items-center rounded-full transition ${phone ? 'bg-brand-500 text-white' : 'text-white/50 hover:text-white'}`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>
          )}
          <a href={`#${section.id}`} aria-label={isAr ? `رابط قسم ${title}` : `Link to ${title}`} className="grid h-8 w-8 place-items-center rounded-full text-white/35 hover:bg-white/5 hover:text-white">
            <Link2 className="h-4 w-4" />
          </a>
        </div>
      </header>

      {picture && (
        <button
          type="button"
          onClick={() => onZoom({ src: asset(picture), alt: title })}
          className="block w-full border-b border-white/10 bg-black/30 text-center"
          aria-label={isAr ? `تكبير صورة ${title}` : `Enlarge the picture of ${title}`}
        >
          {markers.length > 0 ? (
            <Annotated src={asset(picture)} alt={title} markers={markers} width={width} height={height} style={room} className={room ? 'block h-auto max-w-full' : 'block h-auto max-h-[40rem] w-auto max-w-full'} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset(picture)}
              alt={title}
              width={width}
              height={height}
              loading="lazy"
              decoding="async"
              style={room}
              className={`mx-auto block h-auto max-w-full ${room ? '' : 'max-h-[34rem] w-auto'} ${showsPhone ? 'my-4' : ''}`}
            />
          )}
        </button>
      )}

      <div className="space-y-6 p-5 sm:p-6">
        {markers.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-bold text-brand-300">{isAr ? 'على الصورة' : 'On the picture'}</h4>
            <MarkerLegend markers={markers} locale={locale} />
          </div>
        )}
        <SectionNotes section={section} />
      </div>
    </article>
  );
}

/** What a section's card says under its picture: the explanation, the steps, the options, the tip. */
function SectionNotes({ section }: { section: DocSection }) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const steps = (locale === 'en' ? section.steps?.en : undefined) ?? section.steps?.ar ?? [];
  const settings = section.settings ?? [];

  return (
    <>
      {section.text && <p className="leading-relaxed text-white/75">{pick(section.text, locale)}</p>}

      {steps.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-bold text-brand-300">{isAr ? 'طريقة الإعداد' : 'How to set it up'}</h4>
          <ol className="space-y-2.5">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm leading-relaxed text-white/75">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-200">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {settings.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-bold text-brand-300">{isAr ? 'أهم الإعدادات' : 'The options that matter'}</h4>
          <dl className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
            {settings.map((setting, index) => (
              <div key={index} className="grid gap-1 bg-white/[0.02] px-4 py-3 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-4">
                <dt className="text-sm font-semibold text-white">
                  {locale === 'en' && setting.label_en ? (
                    <>
                      {setting.label_en}
                      {/* the name as the Arabic editor shows it, to find the option on screen */}
                      <span lang="ar" dir="rtl" className="mt-0.5 block text-left text-xs font-normal text-white/40">
                        {setting.label}
                      </span>
                    </>
                  ) : (
                    setting.label
                  )}
                </dt>
                <dd className="text-sm leading-relaxed text-white/60">{pick(setting.note, locale)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {section.tip && (
        <p className="flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm leading-relaxed text-amber-100/85">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <span>{pick(section.tip, locale)}</span>
        </p>
      )}
    </>
  );
}

/** A common question: the question is a button, the answer unfolds under it. */
function QuestionRow({ section, onZoom, unfolded }: { section: DocSection; onZoom: (picture: { src: string; alt: string }) => void; unfolded: boolean }) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const title = pick(section.title, locale);
  const shown = open || unfolded;

  // a link to the question — from the list of contents or from outside — opens it
  useEffect(() => {
    const check = () => {
      if (window.location.hash === `#${section.id}`) setOpen(true);
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [section.id]);

  return (
    <div id={section.id} data-doc-section className="scroll-mt-28">
      <h3>
        <button
          type="button"
          aria-expanded={shown}
          aria-controls={`${section.id}-answer`}
          onClick={() => setOpen(!shown)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start font-bold text-white transition hover:bg-white/[0.03] sm:px-6"
        >
          <span>{title}</span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-brand-300 transition-transform ${shown ? 'rotate-180' : ''}`} />
        </button>
      </h3>
      {shown && (
        <div id={`${section.id}-answer`} className="space-y-6 px-5 pb-6 sm:px-6">
          {section.image && (
            <button type="button" onClick={() => onZoom({ src: asset(section.image), alt: title })} className="block overflow-hidden rounded-xl border border-white/10 bg-black/30" aria-label={locale === 'ar' ? `تكبير صورة ${title}` : `Enlarge the picture of ${title}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset(section.image)} alt={title} width={section.image_size?.[0]} height={section.image_size?.[1]} loading="lazy" decoding="async" className="block h-auto max-h-[26rem] w-auto max-w-full" />
            </button>
          )}
          <SectionNotes section={section} />
        </div>
      )}
    </div>
  );
}
