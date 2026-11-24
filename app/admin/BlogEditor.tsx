'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, ImagePlus, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import type { Post } from '@/lib/types';
import { github, GitHubError } from '@/lib/admin';
import { Prose } from '../components/Prose';
import { Field, shrink } from './ThemeEditor';

type Hub = ReturnType<typeof github>;

const fail = (error: unknown) =>
  error instanceof GitHubError
    ? error.status === 409 || error.status === 422
      ? 'الملف تغيّر من مكان آخر. حدّثي الصفحة ثم أعيدي التعديل.'
      : `GitHub: ${error.message}`
    : 'تعذّر الاتصال. حاولي مرة أخرى.';

const today = () => new Date().toISOString().slice(0, 10);

const blank = (): Post => ({ slug: '', title: { ar: '' }, summary: { ar: '' }, cover: '', date: today(), tags: [], body: { ar: '' }, published: false });

/* ------------------------------------------------------------------ the list of articles */

export function BlogTab({ hub, token }: { hub: Hub; token: string }) {
  const [slugs, setSlugs] = useState<string[] | null>(null);
  /** The article being written: its slug, or "" for a new one; null shows the list. */
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const load = () =>
    hub
      .list('content/blog', token)
      .then((names) => setSlugs(names.filter((name) => name.endsWith('.json')).map((name) => name.replace(/\.json$/, ''))))
      // no article has been written yet: the folder is not there
      .catch((error) => (error instanceof GitHubError && error.status === 404 ? setSlugs([]) : setNote(fail(error))));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void load(), [hub, token]);

  if (open !== null) {
    return (
      <PostEditor
        hub={hub}
        token={token}
        slug={open}
        taken={slugs ?? []}
        onClose={() => {
          setOpen(null);
          void load();
        }}
      />
    );
  }
  if (!slugs) return <p className="mt-10 text-center text-white/50">{note || 'جارٍ تحميل المقالات…'}</p>;

  return (
    <div className="mt-6 space-y-6">
      <button type="button" className="btn btn-primary" onClick={() => setOpen('')}>
        <Plus className="h-4 w-4" />
        مقال جديد
      </button>
      <div className="card divide-y divide-white/10">
        {slugs.length === 0 && <p className="p-6 text-center text-white/50">لا توجد مقالات بعد.</p>}
        {slugs.map((slug) => (
          <button key={slug} type="button" onClick={() => setOpen(slug)} className="flex w-full items-center justify-between gap-3 p-4 text-start transition hover:bg-white/5">
            <span dir="ltr" className="truncate font-mono text-white">
              {slug}
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 text-sm text-brand-300">
              <Pencil className="h-4 w-4" />
              تعديل
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-white/40">
        كل مقال منشور يظهر في صفحة المدونة وفي الصفحة الرئيسية، ويُضاف تلقائياً إلى الملف الذي تقرؤه محركات البحث (sitemap).
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ one article */

function PostEditor({ hub, token, slug, taken, onClose }: { hub: Hub; token: string; slug: string; taken: string[]; onClose: () => void }) {
  const fresh = slug === '';
  const [post, setPost] = useState<Post | null>(fresh ? blank() : null);
  const [sha, setSha] = useState<string | undefined>();
  const [saved, setSaved] = useState(!fresh);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState(false);
  const bodyBox = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (fresh) return;
    hub
      .read<Post>(`content/blog/${slug}.json`, token)
      .then(({ value, sha: id }) => {
        setPost(value);
        setSha(id);
      })
      .catch((error) => setNote(fail(error)));
  }, [hub, token, slug, fresh]);

  if (!post) return <p className="mt-10 text-center text-white/50">{note || 'جارٍ تحميل المقال…'}</p>;

  const change = (next: Post) => {
    setPost(next);
    setDirty(true);
  };
  const name = post.slug.trim().toLowerCase();
  const nameOk = /^[a-z0-9][a-z0-9-]{2,60}$/.test(name);
  const file = `content/blog/${name}.json`;
  /** A picture of the site as the repository has it now — the site itself shows it after it is rebuilt. */
  const shown = (picture: string | undefined) => (picture ? (picture.startsWith('/') ? hub.raw(`public${picture}`) : picture) : '');

  const save = async (publish?: boolean) => {
    if (!nameOk) return setNote('اسم المقال في الرابط: حروف إنجليزية صغيرة وأرقام وشرطات، ٣ أحرف على الأقل — مثل salla-image-sizes.');
    if (!saved && taken.includes(name)) return setNote('يوجد مقال بهذا الاسم في الرابط. اختاري اسماً آخر.');
    if (!post.title.ar.trim()) return setNote('اكتبي عنوان المقال.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date)) return setNote('التاريخ بهذا الشكل: 2026-11-24');
    setBusy(true);
    setNote('');
    try {
      const next: Post = { ...post, slug: name, published: publish ?? post.published, tags: (post.tags ?? []).map((tag) => tag.trim()).filter(Boolean) };
      setSha(await hub.write(file, next, sha, `Blog: ${saved ? 'update' : 'new'} ${name}`, token));
      setPost(next);
      setSaved(true);
      setDirty(false);
      setNote(next.published ? 'تم الحفظ. يظهر المقال على الموقع خلال دقيقتين تقريباً.' : 'حُفظ كمسودة — لا يظهر على الموقع حتى تنشريه.');
    } catch (error) {
      setNote(fail(error));
    } finally {
      setBusy(false);
    }
  };

  const upload = async (chosen: File, label: string, width: number): Promise<string> => {
    const bytes = await shrink(chosen, width);
    const path = `/blog/${name}/${label}-${Date.now().toString(36)}.webp`;
    await hub.upload(`public${path}`, bytes, `Blog pictures: ${name}`, token);
    return path;
  };

  const pick = (label: string, width: number, done: (path: string) => void) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen) return;
    if (!nameOk) return setNote('اكتبي اسم المقال في الرابط أولاً، ثم ارفعي الصور.');
    setBusy(true);
    setNote('');
    try {
      done(await upload(chosen, label, width));
    } catch (error) {
      setNote(error instanceof GitHubError ? fail(error) : 'تعذّر رفع الصورة.');
    } finally {
      setBusy(false);
    }
  };

  /** Puts a picture's line where the cursor is in the article. */
  const insert = (path: string) => {
    const box = bodyBox.current;
    const text = post.body.ar;
    const at = box ? box.selectionStart : text.length;
    const line = `\n\n![وصف الصورة](${path})\n\n`;
    change({ ...post, body: { ...post.body, ar: text.slice(0, at) + line + text.slice(at) } });
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="sticky top-20 z-30 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-bg/90 p-3 backdrop-blur-xl">
        <button type="button" className="btn btn-ghost px-4 py-2" onClick={() => (!dirty || window.confirm('توجد تعديلات لم تُحفظ. الخروج بدون حفظ؟')) && onClose()}>
          <X className="h-4 w-4" />
          كل المقالات
        </button>
        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${post.published ? 'bg-green-400/15 text-green-300' : 'bg-amber-400/15 text-amber-200'}`}>{post.published ? 'منشور' : 'مسودة'}</span>
        <span className="flex-1 text-sm text-white/60">{note || (dirty ? 'تعديلات لم تُحفظ' : '')}</span>
        <button type="button" className="btn btn-ghost px-4 py-2" disabled={busy} onClick={() => save(false)}>
          <EyeOff className="h-4 w-4" />
          حفظ كمسودة
        </button>
        <button type="button" className="btn btn-primary px-5 py-2" disabled={busy} onClick={() => save(true)}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ ونشر
        </button>
      </div>

      <div className="card space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="عنوان المقال" value={post.title.ar} onChange={(ar) => change({ ...post, title: { ...post.title, ar } })} />
          <div>
            <label className="label">اسم المقال في الرابط (إنجليزي — لا يتغيّر بعد أول حفظ)</label>
            <input
              className="field font-mono"
              dir="ltr"
              placeholder="salla-image-sizes"
              disabled={saved}
              value={post.slug}
              onChange={(event) => change({ ...post, slug: event.target.value.replace(/\s+/g, '-') })}
            />
          </div>
          <Field label="ملخّص من جملتين (يظهر في صفحة المدونة وفي جوجل)" area value={post.summary.ar} onChange={(ar) => change({ ...post, summary: { ...post.summary, ar } })} />
          <div className="space-y-4">
            <Field label="التاريخ (سنة-شهر-يوم)" ltr value={post.date} onChange={(date) => change({ ...post, date: date.trim() })} />
            <Field label="الوسوم (بينها فاصلة)" value={(post.tags ?? []).join('، ')} onChange={(tags) => change({ ...post, tags: tags.split(/[,،]/).map((tag) => tag.trimStart()) })} />
          </div>
        </div>

        <div>
          <label className="label">صورة المقال (عريضة — تظهر أعلى المقال وعند مشاركة رابطه)</label>
          <div className="flex flex-wrap items-center gap-3">
            {post.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shown(post.cover)} alt="" className="h-20 w-36 rounded-lg border border-white/10 object-cover" />
            )}
            <label className={`btn btn-ghost cursor-pointer px-4 py-2 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
              <ImagePlus className="h-4 w-4" />
              {post.cover ? 'تغيير الصورة' : 'رفع صورة'}
              <input type="file" accept="image/*" className="sr-only" onChange={pick('cover', 1200, (cover) => change({ ...post, cover }))} />
            </label>
            {post.cover && (
              <button type="button" className="btn btn-danger px-3 py-2" aria-label="إزالة الصورة" onClick={() => change({ ...post, cover: '' })}>
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-white">نص المقال</h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className={`btn btn-ghost cursor-pointer px-4 py-2 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
              <ImagePlus className="h-4 w-4" />
              إدراج صورة في النص
              <input type="file" accept="image/*" className="sr-only" onChange={pick('picture', 1200, insert)} />
            </label>
            <button type="button" className="btn btn-ghost px-4 py-2" onClick={() => setPreview(!preview)} aria-pressed={preview}>
              <Eye className="h-4 w-4" />
              {preview ? 'رجوع للكتابة' : 'معاينة'}
            </button>
          </div>
        </div>

        {preview ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-5 sm:p-7">
            <Prose text={post.body.ar} resolve={(picture) => (picture.startsWith('/') ? hub.raw(`public${picture}`) : picture)} />
          </div>
        ) : (
          <textarea ref={bodyBox} className="field min-h-[28rem] leading-loose" value={post.body.ar} onChange={(event) => change({ ...post, body: { ...post.body, ar: event.target.value } })} />
        )}

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-loose text-white/55">
          <p className="mb-1 font-bold text-white/75">علامات التنسيق (سطر فارغ يبدأ فقرة جديدة):</p>
          <p dir="rtl">
            <code dir="ltr">## عنوان</code> · <code dir="ltr">### عنوان فرعي</code> · <code dir="ltr">- نقطة</code> · <code dir="ltr">1. خطوة</code> · <code dir="ltr">&gt; اقتباس</code> ·{' '}
            <code dir="ltr">**كلمة بارزة**</code> · <code dir="ltr">[نص الرابط](https://…)</code> · <code dir="ltr">`اسم إعداد`</code>
          </p>
        </div>
      </div>

      {saved && (
        <button
          type="button"
          className="btn btn-danger"
          disabled={busy || !sha}
          onClick={async () => {
            if (!sha || !window.confirm(`حذف مقال «${post.title.ar}» نهائياً؟`)) return;
            setBusy(true);
            try {
              await hub.remove(file, sha, `Blog: remove ${name}`, token);
              onClose();
            } catch (error) {
              setNote(fail(error));
              setBusy(false);
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
          حذف المقال
        </button>
      )}
    </div>
  );
}
