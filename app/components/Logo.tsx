'use client';

import { useId } from 'react';

/** The mark: the letters G and T drawn in one line weight, on the brand's violet. */
export function LogoMark({ className }: { className?: string }) {
  // each copy of the mark on a page needs its own gradient name
  const gradient = `gt-mark-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="0.55" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#4c1d95" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${gradient})`} />
      <g fill="none" stroke="#fff" strokeWidth="5.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M30 20.5H21.5a8.5 8.5 0 0 0-8.5 8.5v6a8.5 8.5 0 0 0 8.5 8.5H23a8 8 0 0 0 8-8v-3.2h-7.5" />
        <path d="M36.5 20.5H52M44.2 20.5v23" />
      </g>
    </svg>
  );
}

/**
 * The logo: the mark carries "GT", the word after it completes the name — GT-THEMES. Always
 * written left to right, whatever the page's direction.
 */
export function Logo({ brand, compact, collapses }: { brand: string; compact?: boolean; collapses?: boolean }) {
  const word = brand.replace(/^GT[\s-]*/i, '') || brand;
  return (
    <span dir="ltr" role="img" aria-label={brand} className="inline-flex items-center gap-2.5">
      <LogoMark className={`${compact ? 'h-8 w-8' : 'h-9 w-9'} shrink-0 drop-shadow-[0_6px_14px_rgba(124,58,237,0.45)]`} />
      {/* in the menu bar of a very narrow phone the mark stands alone */}
      <span aria-hidden="true" className={`${collapses ? 'hidden min-[360px]:flex' : 'flex'} items-center gap-2`} style={{ fontFamily: 'var(--font-inter)' }}>
        <span className="h-[3px] w-2.5 rounded-full bg-gradient-to-r from-brand-400 to-cyan-400" />
        <span className={`${compact ? 'text-[0.8rem]' : 'text-[0.9rem]'} font-bold uppercase tracking-[0.24em] text-white`}>{word}</span>
      </span>
    </span>
  );
}
