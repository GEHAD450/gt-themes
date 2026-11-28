'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ThemeCard } from '@/lib/content';
import { ThemeCardLink } from './ThemeCardLink';

/**
 * The home page's row of themes as a slider: swipe on phones (native scrolling that snaps to a
 * card), drag with the mouse on computers, and two arrows on every screen. Works in both page
 * directions: "next" always moves toward the end of the reading direction.
 */
export function ThemesSlider({ themes, isAr }: { themes: ThemeCard[]; isAr: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  // how far the track has moved from its start (scrollLeft runs negative in right-to-left pages)
  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const travelled = Math.abs(el.scrollLeft);
    const room = el.scrollWidth - el.clientWidth;
    setEdges({ start: travelled <= 2, end: travelled >= room - 2 });
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  const step = (forward: boolean) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-slide]');
    const width = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    // forward = toward the end of the reading direction
    el.scrollBy({ left: (forward ? 1 : -1) * (isAr ? -width : width), behavior: 'smooth' });
  };

  // mouse drag (touch screens keep their own swipe)
  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse' || !track.current) return;
    drag.current = { x: event.clientX, left: track.current.scrollLeft, moved: false };
  };
  const onPointerMove = (event: React.PointerEvent) => {
    const el = track.current;
    if (!drag.current || !el) return;
    const dx = event.clientX - drag.current.x;
    if (Math.abs(dx) > 5 && !drag.current.moved) {
      drag.current.moved = true;
      el.style.scrollSnapType = 'none';
      el.style.scrollBehavior = 'auto';
    }
    if (drag.current.moved) el.scrollLeft = drag.current.left - dx;
  };
  const endDrag = () => {
    const el = track.current;
    if (el && drag.current?.moved) {
      el.style.scrollSnapType = '';
      el.style.scrollBehavior = '';
      // a drag is not a click on the card under the mouse
      const stop = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
      el.addEventListener('click', stop, { capture: true, once: true });
      setTimeout(() => el.removeEventListener('click', stop, { capture: true }), 0);
    }
    drag.current = null;
  };

  const Prev = isAr ? ChevronRight : ChevronLeft;
  const Next = isAr ? ChevronLeft : ChevronRight;
  const many = themes.length > 1;

  return (
    <div className="relative">
      <div
        ref={track}
        className="themes-track -mx-1 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-1 pb-2"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onDragStart={(e) => e.preventDefault()}
      >
        {themes.map((theme) => (
          <div key={theme.slug} data-slide className="w-[82%] shrink-0 snap-start [&>*]:h-full sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-4.5rem)/4)]">
            <ThemeCardLink theme={theme} />
          </div>
        ))}
      </div>
      {many && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => step(false)}
            disabled={edges.start}
            aria-label={isAr ? 'السابق' : 'Previous'}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white transition hover:border-white/40 hover:bg-white/5 disabled:opacity-30"
          >
            <Prev className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => step(true)}
            disabled={edges.end}
            aria-label={isAr ? 'التالي' : 'Next'}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white transition hover:border-white/40 hover:bg-white/5 disabled:opacity-30"
          >
            <Next className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
