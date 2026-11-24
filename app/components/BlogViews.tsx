'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock, PenLine } from 'lucide-react';
import type { PostCard } from '@/lib/content';
import type { Locale, Post, Profile } from '@/lib/types';
import { asset, pick, tagText, whatsappLink } from '@/lib/site';
import { Prose, readingMinutes } from './Prose';
import { Shell, useEnglishTitle, useLocale, WhatsAppIcon } from './Shell';

/** «٢٤ نوفمبر ٢٠٢٦» — the same on the server and in the browser, whatever the reader's time zone. */
export const dayText = (date: string, locale: Locale): string => {
  const day = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(day.getTime())) return date;
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(day);
};

/** An article as a card: its picture, its day, its title and its two sentences. */
export function PostCardLink({ post }: { post: PostCard }) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const title = pick(post.title, locale);

  return (
    <Link href={`/blog/${post.slug}/`} className="reveal card group flex flex-col overflow-hidden transition hover:-translate-y-1.5 hover:border-white/25">
      <div className="aspect-[1200/630] overflow-hidden bg-gradient-to-br from-brand-600/30 to-cyan-500/10">
        {post.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset(post.cover)}
            alt=""
            width={post.cover_size?.[0]}
            height={post.cover_size?.[1]}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {dayText(post.date, locale)}
          </span>
          {(post.tags ?? []).slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-white/60">
              {tagText(tag, locale)}
            </span>
          ))}
        </div>
        <h3 className="mt-3 text-lg font-bold leading-snug text-white group-hover:text-brand-200">{title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-white/55">{pick(post.summary, locale)}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300">
          {isAr ? 'اقرأ المقال' : 'Read the article'}
          <Arrow className="h-4 w-4 transition group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

/** The blog's page: every published article, newest first. */
export function BlogIndex({ profile, posts }: { profile: Profile; posts: PostCard[] }) {
  return (
    <Shell profile={profile}>
      <IndexBody posts={posts} />
    </Shell>
  );
}

function IndexBody({ posts }: { posts: PostCard[] }) {
  const { locale } = useLocale();
  useEnglishTitle('Blog');
  const isAr = locale === 'ar';
  const Chevron = isAr ? ChevronLeft : ChevronRight;

  return (
    <div className="container-px pb-10 pt-12">
      <nav aria-label={isAr ? 'مسار الصفحة' : 'Breadcrumb'} className="flex items-center gap-1.5 text-sm text-white/50">
        <Link href="/" className="hover:text-white">
          {isAr ? 'الرئيسية' : 'Home'}
        </Link>
        <Chevron className="h-4 w-4" />
        <span className="text-white">{isAr ? 'المدونة' : 'Blog'}</span>
      </nav>

      <header className="mt-6 text-center">
        <span className="section-tag">{isAr ? 'المدونة' : 'Blog'}</span>
        <h1 className="mt-4 text-4xl font-black sm:text-5xl">{isAr ? 'مقالات لأصحاب متاجر سلة وزد' : 'Articles for Salla and Zid store owners'}</h1>
        <p className="mx-auto mt-3 max-w-xl text-white/55">
          {isAr ? 'شروح عملية من تجربتنا في بناء الثيمات وتجهيز المتاجر: الصور، الفيديو، السرعة، واختيار الثيم.' : 'Practical notes from building themes and setting up stores: pictures, video, speed and choosing a theme.'}
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="card mx-auto mt-12 max-w-xl p-10 text-center">
          <PenLine className="mx-auto h-10 w-10 text-white/30" />
          <p className="mt-3 text-white/60">{isAr ? 'المقالات في الطريق. عُد قريباً.' : 'Articles are on their way. Come back soon.'}</p>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCardLink key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

/** One article, with the articles to read after it. */
export function BlogPost({ profile, post, more }: { profile: Profile; post: Post; more: PostCard[] }) {
  return (
    <Shell profile={profile}>
      <PostBody profile={profile} post={post} more={more} />
    </Shell>
  );
}

function PostBody({ profile, post, more }: { profile: Profile; post: Post; more: PostCard[] }) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const Chevron = isAr ? ChevronLeft : ChevronRight;
  const title = pick(post.title, locale);
  useEnglishTitle(pick(post.title, 'en'));
  const body = pick(post.body, locale);
  const minutes = readingMinutes(body);
  const ask = whatsappLink(profile.whatsapp, isAr ? `مرحباً، قرأت مقال «${pick(post.title, 'ar')}» وعندي سؤال` : `Hello, I read "${title}" and I have a question`);

  return (
    <article className="container-px max-w-3xl pb-10 pt-12">
      <nav aria-label={isAr ? 'مسار الصفحة' : 'Breadcrumb'} className="flex flex-wrap items-center gap-1.5 text-sm text-white/50">
        <Link href="/" className="hover:text-white">
          {isAr ? 'الرئيسية' : 'Home'}
        </Link>
        <Chevron className="h-4 w-4" />
        <Link href="/blog/" className="hover:text-white">
          {isAr ? 'المدونة' : 'Blog'}
        </Link>
      </nav>

      <header className="mt-6">
        <h1 className="text-3xl font-black leading-[1.45] sm:text-4xl sm:leading-[1.45]">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-white/60">{pick(post.summary, locale)}</p>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/50">
          <span>{pick(profile.name, locale)}</span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            <time dateTime={post.date}>{dayText(post.date, locale)}</time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {isAr ? `${minutes.toLocaleString('ar-EG')} د قراءة` : `${minutes} min read`}
          </span>
        </div>
      </header>

      {post.cover && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset(post.cover)} alt="" width={post.cover_size?.[0]} height={post.cover_size?.[1]} className="block h-auto w-full" />
        </div>
      )}

      <div className="mt-10">
        <Prose text={body} />
      </div>

      <div className="card mt-12 flex flex-col items-center gap-4 p-7 text-center sm:flex-row sm:text-start">
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white">{isAr ? 'عندك سؤال عن متجرك؟' : 'A question about your store?'}</h2>
          <p className="mt-1 text-sm text-white/55">{isAr ? 'راسلنا على واتساب: ثيمات جاهزة وخاصة، وتجهيز كامل للمتجر.' : 'Message us on WhatsApp: ready and custom themes, and full store setup.'}</p>
        </div>
        <a href={ask} target="_blank" rel="noreferrer" className="btn bg-[#25d366] text-[#06270f] hover:bg-[#1fbe5c]">
          <WhatsAppIcon className="h-5 w-5" />
          {isAr ? 'اسأل على واتساب' : 'Ask on WhatsApp'}
        </a>
      </div>

      {more.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-2xl font-black">{isAr ? 'مقالات أخرى' : 'More articles'}</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {more.map((other) => (
              <PostCardLink key={other.slug} post={other} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
