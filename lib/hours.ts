import type { Locale, Text, WorkHours } from './types';

const DAYS: Record<Locale, string[]> = {
  ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

/** The week as the region reads it: it starts on Saturday. Values are JavaScript's day numbers. */
export const WEEK = [6, 0, 1, 2, 3, 4, 5];

export const dayName = (day: number, locale: Locale): string => DAYS[locale][day] ?? '';

/** The clocks support can run on, with the words shown next to the hours. */
export const ZONES: Record<string, Text> = {
  'Africa/Cairo': { ar: 'بتوقيت القاهرة', en: 'Cairo time' },
  'Asia/Riyadh': { ar: 'بتوقيت السعودية', en: 'Saudi time' },
};

/** An hour of the 24-hour clock as people say it: «١٢ ظهراً», "8 pm". */
export function hourText(hour: number, locale: Locale): string {
  const onDial = hour % 12 === 0 ? 12 : hour % 12;
  if (locale === 'en') return `${onDial} ${hour % 24 < 12 ? 'am' : 'pm'}`;
  const part = hour % 24 === 0 ? 'منتصف الليل' : hour < 12 ? 'صباحاً' : hour === 12 ? 'ظهراً' : 'مساءً';
  return `${onDial.toLocaleString('ar-EG')} ${part}`;
}

/** The working days in words: an unbroken run reads «السبت – الخميس», anything else is listed. */
export function daysText(days: number[], locale: Locale): string {
  const inWeek = WEEK.filter((day) => days.includes(day));
  if (inWeek.length === 7) return locale === 'ar' ? 'كل أيام الأسبوع' : 'Every day';
  const places = inWeek.map((day) => WEEK.indexOf(day));
  const unbroken = places.every((place, index) => index === 0 || place === places[index - 1] + 1);
  if (unbroken && inWeek.length >= 3) return `${dayName(inWeek[0], locale)} – ${dayName(inWeek[inWeek.length - 1], locale)}`;
  return inWeek.map((day) => dayName(day, locale)).join(locale === 'ar' ? '، ' : ', ');
}

/** «السبت – الخميس · ١٢ ظهراً – ٨ مساءً» */
export const hoursText = (hours: WorkHours, locale: Locale): string =>
  `${daysText(hours.days, locale)} · ${hourText(hours.from, locale)} – ${hourText(hours.to, locale)}`;

/** Whether support is answering at that moment, on the clock of the hours' time zone. */
export function isOpen(hours: WorkHours, now: Date = new Date()): boolean {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: hours.timezone, weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(now);
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.find((part) => part.type === 'weekday')?.value ?? '');
    const hour = Number(parts.find((part) => part.type === 'hour')?.value);
    return hours.days.includes(day) && hour >= hours.from && hour < hours.to;
  } catch {
    // a time zone the browser does not know: say nothing rather than something wrong
    return false;
  }
}
