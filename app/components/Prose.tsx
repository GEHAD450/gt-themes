import type { ReactNode } from 'react';
import { asset, ltrSizes } from '@/lib/site';

/**
 * An article's text. It is written with a few plain marks — no HTML, so nothing typed in the
 * control panel can run as code:
 *
 *   ## a heading            ### a smaller heading
 *   - a point               1. a numbered step
 *   > a quote               ![what the picture shows](/blog/…/picture.webp)
 *   **strong words**        [a link](https://…)        `a setting's name`
 *
 * A blank line starts a new paragraph.
 */

/** Only addresses that cannot run code: web pages, mail, phone, and places in this site. */
const safeLink = (href: string): string | null => (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(href.trim()) ? href.trim() : null);

function inline(text: string, at: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const marks = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let count = 0;
  for (let match = marks.exec(text); match; match = marks.exec(text)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const key = `${at}-${count++}`;
    if (match[1] !== undefined) {
      parts.push(
        <strong key={key} className="font-bold text-white">
          {match[1]}
        </strong>
      );
    } else if (match[2] !== undefined) {
      parts.push(
        <code key={key} dir="ltr" className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em] text-brand-200">
          {match[2]}
        </code>
      );
    } else {
      const href = safeLink(match[4]);
      const inside = Boolean(href && (href.startsWith('/') || href.startsWith('#')));
      parts.push(
        href ? (
          <a
            key={key}
            href={href.startsWith('/') ? asset(href) : href}
            {...(inside ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
            className="font-semibold text-brand-300 underline decoration-brand-400/40 underline-offset-4 hover:text-brand-200"
          >
            {match[3]}
          </a>
        ) : (
          match[3]
        )
      );
    }
    last = marks.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

const strip = (line: string, mark: RegExp) => line.replace(mark, '');

export function Prose({ text, resolve }: { text: string; resolve?: (picture: string) => string }) {
  const blocks = ltrSizes(text)
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  // a picture of this site is shown from its folder; the control panel shows it from the repository before the site is rebuilt
  const pictureAt = (src: string) => (resolve ? resolve(src) : asset(src));

  return (
    <div className="space-y-6 text-[1.05rem] leading-loose text-white/80">
      {blocks.map((block, index) => {
        const key = `b${index}`;
        const lines = block.split('\n').map((line) => line.trim());

        if (/^###\s+/.test(block)) {
          return (
            <h3 key={key} className="pt-2 text-xl font-bold text-white">
              {inline(strip(block, /^###\s+/), key)}
            </h3>
          );
        }
        if (/^##\s+/.test(block)) {
          return (
            <h2 key={key} className="pt-4 text-2xl font-black text-white sm:text-3xl">
              {inline(strip(block, /^##\s+/), key)}
            </h2>
          );
        }

        const picture = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(block);
        if (picture) {
          const src = safeLink(picture[2]);
          if (!src || src.startsWith('#')) return null;
          return (
            <figure key={key} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pictureAt(src)} alt={picture[1]} loading="lazy" decoding="async" className="mx-auto block h-auto max-w-full" />
              {picture[1] && <figcaption className="border-t border-white/10 px-4 py-2.5 text-center text-sm text-white/50">{picture[1]}</figcaption>}
            </figure>
          );
        }

        if (lines.every((line) => /^[-•]\s+/.test(line))) {
          return (
            <ul key={key} className="space-y-2.5">
              {lines.map((line, item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-[0.85em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                  <span>{inline(strip(line, /^[-•]\s+/), `${key}-${item}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (lines.every((line) => /^\d+[.)]\s+/.test(line))) {
          return (
            <ol key={key} className="space-y-3">
              {lines.map((line, item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-500/20 text-sm font-bold text-brand-200">{item + 1}</span>
                  <span>{inline(strip(line, /^\d+[.)]\s+/), `${key}-${item}`)}</span>
                </li>
              ))}
            </ol>
          );
        }
        if (lines.every((line) => /^>\s?/.test(line))) {
          return (
            <blockquote key={key} className="rounded-xl border border-brand-400/25 bg-brand-500/10 px-5 py-4 text-white/85">
              {lines.map((line, item) => (
                <p key={item}>{inline(strip(line, /^>\s?/), `${key}-${item}`)}</p>
              ))}
            </blockquote>
          );
        }

        return (
          <p key={key}>
            {lines.map((line, item) => (
              <span key={item}>
                {inline(line, `${key}-${item}`)}
                {item < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

/** About how many minutes the article takes to read. */
export const readingMinutes = (text: string): number => Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 180));
