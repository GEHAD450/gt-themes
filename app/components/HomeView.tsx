'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Briefcase, Check, Mail, Phone, Store } from 'lucide-react';
import type { ThemeCard } from '@/lib/content';
import type { Platform, Profile } from '@/lib/types';
import { hourText } from '@/lib/hours';
import { iconOf } from '@/lib/icons';
import { countOf, pick, PLATFORMS, THEMES, whatsappLink } from '@/lib/site';
import { useOpenNow, WorkingHours } from './Hours';
import { Shell, useLocale, WhatsAppIcon } from './Shell';
import { ThemeCardLink } from './ThemeCardLink';

function Counter({ target, label }: { target: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / 1400, 1);
          setValue(Math.round((1 - Math.pow(1 - progress, 3)) * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref}>
      <div className="gradient-text text-3xl font-black sm:text-4xl">{value}+</div>
      <div className="mt-1 text-xs text-white/50">{label}</div>
    </div>
  );
}

function SectionHeader({ tag, title, sub }: { tag: string; title: string; sub?: string }) {
  return (
    <div className="reveal mb-10 text-center">
      <span className="section-tag">{tag}</span>
      <h2 className="mt-4 text-3xl font-black sm:text-4xl">{title}</h2>
      {sub && <p className="mx-auto mt-3 max-w-xl text-white/50">{sub}</p>}
    </div>
  );
}

/** A line of text in which the words between two pairs of stars (**like this**) stand out. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((part, index) =>
        index % 2 ? (
          <strong key={index} className="font-black text-brand-200">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </>
  );
}

/** The home page: what GT-THEMES offers, the two platforms, the themes, who is behind it, how to get help. */
export function HomeView({ profile, themes }: { profile: Profile; themes: ThemeCard[] }) {
  return (
    <Shell profile={profile}>
      <HomeBody profile={profile} themes={themes} />
    </Shell>
  );
}

function HomeBody({ profile, themes }: { profile: Profile; themes: ThemeCard[] }) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const whatsapp = whatsappLink(profile.whatsapp, pick(profile.whatsapp_message, locale));
  const count = (platform: Platform) => themes.filter((theme) => theme.platform === platform).length;
  const services = profile.services ?? [];
  const features = profile.features ?? [];
  const points = profile.bio_points ?? [];
  const open = useOpenNow(profile.hours);

  // the line over the title: says whether support is answering at this moment, once that is known
  const status =
    open === null || !profile.hours
      ? isAr
        ? 'الدعم متاح على واتساب'
        : 'Support is open on WhatsApp'
      : open
        ? isAr
          ? `متاحون الآن على واتساب · حتى ${hourText(profile.hours.to, 'ar')}`
          : `Open now on WhatsApp · until ${hourText(profile.hours.to, 'en')}`
        : isAr
          ? 'مغلق الآن · اترك رسالتك وسنرد عليك'
          : 'Closed now · leave us a message';

  return (
    <>
      {/* hero */}
      {/* both columns may shrink below their content (min-w-0): a long line scrolls inside its box, it never widens the page */}
      <header className="container-px relative grid items-center gap-12 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1.15fr_1fr]">
        <div className="min-w-0 text-center lg:text-start">
          <span className="anim-up inline-flex max-w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs leading-snug text-white/70">
            <span className="relative flex h-2 w-2 shrink-0">
              {open !== false && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />}
              <span className={`relative inline-flex h-2 w-2 rounded-full ${open === false ? 'bg-amber-400' : 'bg-green-400'}`} />
            </span>
            {status}
          </span>
          <h1 className="mt-6 text-4xl font-black leading-[1.35] sm:text-6xl">
            {pick(profile.hero_title, locale)
              .split(/[،,]/)
              .map((part, index) => (
                <span key={index} className={`anim-up block pb-1 ${index % 2 ? 'gradient-text' : ''}`} style={{ animationDelay: `${0.15 + index * 0.15}s` }}>
                  {part.trim()}
                </span>
              ))}
          </h1>
          <p className="anim-up mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg lg:mx-0" style={{ animationDelay: '0.5s' }}>
            {pick(profile.hero_subtitle, locale)}
          </p>
          {services.length > 0 && (
            <ul className="anim-up mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start" style={{ animationDelay: '0.58s' }}>
              {services.map((service, index) => {
                const Icon = iconOf(service.icon);
                return (
                  <li key={index}>
                    <a
                      href="#services"
                      className="inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-500/10 px-3.5 py-1.5 text-xs font-semibold text-brand-100 transition hover:border-brand-400/60 hover:bg-brand-500/20"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-brand-300" />
                      {pick(service.title, locale)}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="anim-up mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start" style={{ animationDelay: '0.65s' }}>
            <a href="#platforms" className="btn btn-primary">
              {isAr ? 'تصفّح الثيمات وشروحها' : 'Browse the themes and guides'}
            </a>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn-ghost">
              <WhatsAppIcon className="h-4 w-4 text-[#25d366]" />
              {isAr ? 'تواصل على واتساب' : 'Chat on WhatsApp'}
            </a>
          </div>
          <div className="anim-up mt-12 flex flex-wrap items-start justify-center gap-8 lg:justify-start" style={{ animationDelay: '0.8s' }}>
            {profile.stats.map((stat, index) => (
              <Counter key={index} target={stat.value} label={pick(stat.label, locale)} />
            ))}
          </div>
        </div>

        <div className="relative mx-auto flex w-full min-w-0 max-w-md items-center justify-center py-6">
          <div className="code-window relative w-full min-w-0 rounded-2xl border border-white/10 bg-[#0f0f19]/90">
            <div className="flex items-center gap-1.5 rounded-t-2xl border-b border-white/10 bg-white/5 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 font-mono text-xs text-white/40">gt-themes.ts</span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-white/85">
              <code>
                <span className="c-keyword">const</span> <span className="c-var">gtThemes</span> = {'{'}
                {'\n'}  <span className="c-prop">by</span>: <span className="c-string">&apos;Gehad Taha&apos;</span>,
                {'\n'}  <span className="c-prop">frontEnd</span>: <span className="c-string">&apos;7 years&apos;</span>,
                {'\n'}  <span className="c-prop">platforms</span>: [<span className="c-string">&apos;Salla&apos;</span>, <span className="c-string">&apos;Zid&apos;</span>],
                {'\n'}  <span className="c-prop">services</span>: <span className="c-bool">{services.length}</span>,
                {'\n'}  <span className="c-prop">themes</span>: <span className="c-bool">{themes.length}</span>,
                {'\n'}  <span className="c-prop">support</span>: <span className="c-string">&apos;WhatsApp&apos;</span>
                <span className="cursor-blink">|</span>
                {'\n'}{'}'};
              </code>
            </pre>
            <span className="floating-tag absolute -right-2 -top-3 rounded-full border border-brand-400/30 bg-[#0f0f19]/90 px-3.5 py-1.5 text-xs font-bold text-brand-200 backdrop-blur">
              سلة
            </span>
            <span
              className="floating-tag absolute -bottom-3 left-6 rounded-full border border-brand-400/30 bg-[#0f0f19]/90 px-3.5 py-1.5 text-xs font-bold text-brand-200 backdrop-blur"
              style={{ animationDelay: '-2s' }}
            >
              زد
            </span>
          </div>
        </div>
      </header>

      {/* services */}
      {services.length > 0 && (
        <section id="services" className="container-px scroll-mt-28 py-14">
          <SectionHeader
            tag={isAr ? 'خدماتنا' : 'Our services'}
            title={isAr ? 'ثلاث خدمات، ومتجر جاهز للبيع' : 'Three services, one store ready to sell'}
            sub={isAr ? 'اختر ما يحتاجه متجرك، وراسلنا على واتساب لنبدأ.' : 'Pick what your store needs and message us on WhatsApp to start.'}
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {services.map((service, index) => {
              const Icon = iconOf(service.icon);
              const title = pick(service.title, locale);
              const ask = whatsappLink(profile.whatsapp, isAr ? `مرحباً، أريد الاستفسار عن خدمة: ${pick(service.title, 'ar')}` : `Hello, I would like to ask about: ${title}`);
              return (
                <article key={index} className="reveal card group relative flex flex-col overflow-hidden p-7 transition hover:-translate-y-1.5 hover:border-brand-400/40">
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-400/70 to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-600/30">
                      <Icon className="h-7 w-7" />
                    </div>
                    <span dir="ltr" aria-hidden="true" className="font-mono text-3xl font-bold text-white/10">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  {/* room for a title of two lines, so the cards' rows line up side by side */}
                  <h3 className="mt-5 text-xl font-black leading-snug text-white lg:min-h-[3.45rem]">{title}</h3>
                  {service.tags && service.tags.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {service.tags.map((tag, at) => (
                        <li key={at} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white/70">
                          {pick(tag, locale)}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-4 text-sm leading-relaxed text-white/65">{pick(service.text, locale)}</p>
                  {service.points && service.points.length > 0 && (
                    <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5">
                      {service.points.map((point, at) => (
                        <li key={at} className="flex items-start gap-2.5 text-sm leading-relaxed text-white/80">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                          <span>{pick(point, locale)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-auto pt-7">
                    <a href={ask} target="_blank" rel="noreferrer" className="btn btn-ghost w-full">
                      <WhatsAppIcon className="h-4 w-4 text-[#25d366]" />
                      {isAr ? 'اطلب الخدمة على واتساب' : 'Ask for it on WhatsApp'}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* platforms */}
      <section id="platforms" className="container-px scroll-mt-28 py-14">
        <SectionHeader
          tag={isAr ? 'المنصات' : 'Platforms'}
          title={isAr ? 'اختر منصة متجرك' : 'Pick your store’s platform'}
          sub={isAr ? 'في كل منصة تجد ثيماتها، ولكل ثيم شرح مصوّر لأقسامه وإعداداته.' : 'Each platform lists its themes, and each theme has an illustrated guide.'}
        />
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
          {(Object.keys(PLATFORMS) as Platform[]).map((key) => {
            const platform = PLATFORMS[key];
            return (
              <Link
                key={key}
                href={`/platform/${key}/`}
                className="reveal card group flex flex-col items-center p-8 text-center transition hover:-translate-y-1 hover:border-white/25"
              >
                <div className="grid h-16 w-16 place-items-center rounded-2xl" style={{ background: `${platform.color}22`, color: platform.color }}>
                  <Store className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">{pick(platform.name, locale)}</h3>
                <p className="mt-1 text-sm text-white/55">{pick(platform.desc, locale)}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: platform.color }}>
                  {countOf(count(key), locale, THEMES)}
                  <Arrow className="h-4 w-4 transition group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* themes */}
      {themes.length > 0 && (
        <section id="themes" className="container-px scroll-mt-28 py-14">
          <SectionHeader tag={isAr ? 'الثيمات' : 'Themes'} title={isAr ? 'كل الثيمات وشروحها' : 'All themes and their guides'} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {themes.map((theme) => (
              <ThemeCardLink key={theme.slug} theme={theme} />
            ))}
          </div>
        </section>
      )}

      {/* about */}
      <section id="about" className="container-px scroll-mt-28 py-14">
        <SectionHeader tag={isAr ? 'من وراء GT-THEMES' : 'Behind GT-THEMES'} title={pick(profile.name, locale)} sub={pick(profile.role, locale)} />
        <div className="mx-auto grid max-w-4xl items-start gap-8 md:grid-cols-[1.4fr_1fr]">
          <div className="reveal">
            <p className="text-xl font-semibold leading-loose text-white/85 sm:text-2xl sm:leading-loose">
              <Rich text={pick(profile.bio, locale)} />
            </p>
            {points.length > 0 && (
              <ul className="mt-6 space-y-3">
                {points.map((point, index) => (
                  <li key={index} className="flex items-start gap-3 text-white/75">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/20 text-brand-200">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="leading-relaxed">{pick(point, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-7 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span key={skill} dir="ltr" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="reveal card relative overflow-hidden p-6">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-brand-400/60 to-transparent" />
            <h3 className="flex items-center gap-2 font-bold text-white">
              <Briefcase className="h-5 w-5 text-brand-300" />
              {isAr ? 'الخبرة' : 'Experience'}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              {profile.experience.map((item, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  <span>{pick(item, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* why */}
      {features.length > 0 && (
        <section className="container-px py-14">
          <SectionHeader tag={isAr ? 'لماذا GT-THEMES' : 'Why GT-THEMES'} title={isAr ? 'ثيم جاهز، وشرح لا يتركك وحدك' : 'A ready theme, and a guide that stays with you'} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = iconOf(feature.icon);
              return (
                <div key={index} className="reveal card p-6 transition hover:-translate-y-1 hover:border-brand-400/40">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-bold text-white">{pick(feature.title, locale)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{pick(feature.text, locale)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* contact */}
      <section id="contact" className="container-px scroll-mt-28 py-14">
        <div className="reveal card mx-auto max-w-2xl p-8 text-center sm:p-10">
          <span className="section-tag">{isAr ? 'الدعم' : 'Support'}</span>
          <h2 className="mt-4 text-3xl font-black sm:text-4xl">
            {isAr ? 'عندك سؤال أو طلب؟' : 'A question or a request?'} <span className="gradient-text">{isAr ? 'راسلنا مباشرة.' : 'Message us directly.'}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/55">
            {isAr ? 'أرسل اسم الثيم أو الخدمة، ورابط متجرك، ووصف ما تحتاجه — وسنرد عليك في أقرب وقت.' : 'Send the theme or the service, your store’s address and what you need — we will reply as soon as we can.'}
          </p>
          <a href={whatsapp} target="_blank" rel="noreferrer" className="btn mt-7 w-full bg-[#25d366] text-base text-[#06270f] hover:bg-[#1fbe5c] sm:w-auto sm:px-10">
            <WhatsAppIcon className="h-5 w-5" />
            {isAr ? 'افتح محادثة واتساب' : 'Open a WhatsApp chat'}
          </a>
          {profile.hours && (
            <div className="mt-6 text-sm text-white/65">
              <WorkingHours hours={profile.hours} locale={locale} />
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/55">
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
      </section>
    </>
  );
}
