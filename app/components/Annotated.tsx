'use client';

import type { Locale, Marker } from '@/lib/types';
import { pick } from '@/lib/site';

/** The colour of the arrows: bright enough to read over any screenshot. */
const INK = '#fbbf24';

/**
 * One numbered arrow whose tip sits exactly on a point of the picture. The arrow comes from
 * the side with more room, so it never leaves the picture: from the left when the point is
 * on the right half, from below when the point is near the top.
 */
function Arrow({ marker, number }: { marker: Marker; number: number }) {
  const fromLeft = marker.x > 55;
  const fromBelow = marker.y < 24;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute h-0 w-0" style={{ left: `${marker.x}%`, top: `${marker.y}%` }}>
      <span
        className="absolute h-14 w-14"
        style={{ [fromLeft ? 'right' : 'left']: 0, [fromBelow ? 'top' : 'bottom']: 0 } as React.CSSProperties}
      >
        {/* drawn tail top-right → tip bottom-left, then mirrored to the side it comes from */}
        <svg
          viewBox="0 0 56 56"
          className="h-full w-full"
          style={{
            transform: `scale(${fromLeft ? -1 : 1}, ${fromBelow ? -1 : 1})`,
            filter: 'drop-shadow(0 1px 2px rgb(0 0 0 / 85%))',
          }}
        >
          <line x1="44" y1="12" x2="9" y2="47" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M3 53 L7 36 L20 49 Z" fill={INK} />
        </svg>
        <span
          className="absolute grid h-7 w-7 place-items-center rounded-full text-xs font-black text-[#1a1203] shadow-lg shadow-black/60 ring-2 ring-black/50"
          style={{ background: INK, [fromLeft ? 'left' : 'right']: -6, [fromBelow ? 'bottom' : 'top']: -6 } as React.CSSProperties}
        >
          {number}
        </span>
      </span>
    </span>
  );
}

/** A picture with its numbered arrows over it. `onPick` (the editor) reports where it was clicked. */
export function Annotated({
  src,
  alt,
  markers,
  className,
  width,
  height,
  style,
  onPick,
}: {
  src: string;
  alt: string;
  markers: Marker[];
  className?: string;
  width?: number;
  height?: number;
  /**
   * The size of the picture's box, when it is known before the picture loads (the guide keeps
   * the picture's place). It goes on the box around the picture — the arrows are placed
   * against that box — and the picture fills it. A percentage width set on the picture
   * itself would have nothing to measure against: the box takes its width from the picture.
   */
  style?: React.CSSProperties;
  onPick?: (x: number, y: number) => void;
}) {
  return (
    <span className="relative inline-block max-w-full align-top" style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={style ? 'block h-full w-full' : className}
        style={onPick ? { cursor: 'crosshair' } : undefined}
        onClick={
          onPick
            ? (event) => {
                const box = event.currentTarget.getBoundingClientRect();
                onPick(+(((event.clientX - box.left) / box.width) * 100).toFixed(1), +(((event.clientY - box.top) / box.height) * 100).toFixed(1));
              }
            : undefined
        }
      />
      {markers.map((marker, index) => (
        <Arrow key={index} marker={marker} number={index + 1} />
      ))}
    </span>
  );
}

/** What each arrow says, as a numbered list under the picture. */
export function MarkerLegend({ markers, locale }: { markers: Marker[]; locale: Locale }) {
  if (markers.length === 0) return null;
  return (
    <ol className="grid gap-2 sm:grid-cols-2">
      {markers.map((marker, index) => (
        <li key={index} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm leading-relaxed text-white/75">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black text-[#1a1203]" style={{ background: INK }}>
            {index + 1}
          </span>
          <span>{pick(marker.text, locale)}</span>
        </li>
      ))}
    </ol>
  );
}
