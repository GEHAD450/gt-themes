'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import type { Locale, WorkHours } from '@/lib/types';
import { hoursText, isOpen, ZONES } from '@/lib/hours';
import { pick } from '@/lib/site';

/**
 * Whether support is answering right now. Unknown (null) until the page runs in the reader's
 * browser — the built page cannot know what time it will be read at — then checked every minute.
 */
export function useOpenNow(hours: WorkHours | undefined): boolean | null {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    if (!hours) return;
    const check = () => setOpen(isOpen(hours));
    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
  }, [hours]);

  return open;
}

/** The working hours in one line, with a word on whether support is answering now. */
export function WorkingHours({ hours, locale, className }: { hours: WorkHours | undefined; locale: Locale; className?: string }) {
  const open = useOpenNow(hours);
  if (!hours) return null;
  const zone = pick(ZONES[hours.timezone], locale);

  return (
    <span className={`inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 ${className ?? ''}`}>
      <Clock className="h-4 w-4 shrink-0" />
      <span>
        {locale === 'ar' ? 'مواعيد العمل: ' : 'Working hours: '}
        {hoursText(hours, locale)}
        {zone && <span className="opacity-70"> ({zone})</span>}
      </span>
      {open !== null && (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${open ? 'bg-green-400/10 text-green-300' : 'bg-amber-400/10 text-amber-200'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-green-400' : 'bg-amber-400'}`} />
          {open ? (locale === 'ar' ? 'متاحون الآن' : 'Open now') : locale === 'ar' ? 'مغلق الآن' : 'Closed now'}
        </span>
      )}
    </span>
  );
}
