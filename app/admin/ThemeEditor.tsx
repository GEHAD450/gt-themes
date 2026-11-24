'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, ImagePlus, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import type { DocGroup, DocSection, Marker, Platform, Text, Theme, ThemeDemo } from '@/lib/types';
import { github, GitHubError } from '@/lib/admin';
import { Annotated } from '../components/Annotated';

type Hub = ReturnType<typeof github>;

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

const fail = (error: unknown) =>
  error instanceof GitHubError
    ? error.status === 409 || error.status === 422
      ? 'الملف تغيّر من مكان آخر. حدّثي الصفحة ثم أعيدي التعديل.'
      : `GitHub: ${error.message}`
    : 'تعذّر الاتصال. حاولي مرة أخرى.';

/**
 * A picture chosen from the device, made ready for the site in the browser: scaled down to
 * `maxWidth` and saved as WebP, so a 5 MB screenshot becomes ~100 KB.
 */
export async function shrink(file: File, maxWidth: number): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
  if (!blob) throw new Error('could not read the picture');
  return new Uint8Array(await blob.arrayBuffer());
}

/* ------------------------------------------------------------------ the list of themes */

export function ThemesTab({ hub, token }: { hub: Hub; token: string }) {
  const [files, setFiles] = useState<string[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [fresh, setFresh] = useState({ slug: '', platform: 'salla' as Platform, ar: '', en: '' });
  const [busy, setBusy] = useState(false);

  const load = () =>
    hub
      .list('content/themes', token)
      .then((names) => setFiles(names.filter((name) => name.endsWith('.json')).map((name) => name.replace(/\.json$/, ''))))
      .catch((error) => setNote(fail(error)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void load(), [hub, token]);

  if (open) return <ThemeEditor hub={hub} token={token} slug={open} onClose={() => setOpen(null)} />;
  if (!files) return <p className="mt-10 text-center text-white/50">{note || 'جارٍ تحميل الثيمات…'}</p>;

  return (
    <div className="mt-6 space-y-6">
      <div className="card divide-y divide-white/10">
        {files.map((slug) => (
          <button key={slug} type="button" onClick={() => setOpen(slug)} className="flex w-full items-center justify-between gap-3 p-4 text-start transition hover:bg-white/5">
            <span dir="ltr" className="font-mono text-white">
              {slug}
            </span>
            <span className="text-sm text-brand-300">تعديل الشرح والصور</span>
          </button>
        ))}
      </div>

      <form
        className="card space-y-4 p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const slug = fresh.slug.trim().toLowerCase();
          if (!/^[a-z][a-z0-9-]{1,30}$/.test(slug)) return setNote('الاسم المختصر: حروف إنجليزية صغيرة وأرقام وشرطة فقط، مثل zaina.');
          if (files.includes(slug)) return setNote('يوجد ثيم بهذا الاسم المختصر.');
          setBusy(true);
          setNote('');
          const theme: Theme = {
            slug,
            platform: fresh.platform,
            name: { ar: fresh.ar.trim(), en: fresh.en.trim() || undefined },
            tagline: { ar: '' },
            summary: { ar: '' },
            cover: '',
            demos: [],
            highlights: [],
            groups: [{ id: 'home', title: { ar: 'أقسام الصفحة الرئيسية', en: 'Home sections' }, sections: [] }],
          };
          try {
            await hub.write(`content/themes/${slug}.json`, theme, undefined, `Themes: new ${slug}`, token);
            setFresh({ slug: '', platform: fresh.platform, ar: '', en: '' });
            setOpen(slug);
          } catch (error) {
            setNote(fail(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-bold text-white">ثيم جديد</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">الاسم بالعربية</label>
            <input className="field" required value={fresh.ar} onChange={(event) => setFresh({ ...fresh, ar: event.target.value })} />
          </div>
          <div>
            <label className="label">الاسم بالإنجليزية</label>
            <input className="field" dir="ltr" value={fresh.en} onChange={(event) => setFresh({ ...fresh, en: event.target.value })} />
          </div>
          <div>
            <label className="label">الاسم المختصر في الرابط (إنجليزي)</label>
            <input className="field font-mono" dir="ltr" required placeholder="zaina" value={fresh.slug} onChange={(event) => setFresh({ ...fresh, slug: event.target.value })} />
          </div>
          <div>
            <label className="label">المنصة</label>
            <select className="field" value={fresh.platform} onChange={(event) => setFresh({ ...fresh, platform: event.target.value as Platform })}>
              <option value="salla">سلة</option>
              <option value="zid">زد</option>
            </select>
          </div>
        </div>
        {note && <p className="text-sm text-red-300">{note}</p>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          إنشاء الثيم وفتح شرحه
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ one theme */

function ThemeEditor({ hub, token, slug, onClose }: { hub: Hub; token: string; slug: string; onClose: () => void }) {
  const file = `content/themes/${slug}.json`;
  const [theme, setTheme] = useState<Theme | null>(null);
  const [sha, setSha] = useState<string | undefined>();
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [openSection, setOpenSection] = useState('');
  /** Pictures uploaded in this visit: shown from GitHub until the site is rebuilt. */
  const [uploaded, setUploaded] = useState<Record<string, string>>({});

  useEffect(() => {
    hub
      .read<Theme>(file, token)
      .then(({ value, sha: id }) => {
        setTheme(value);
        setSha(id);
      })
      .catch((error) => setNote(fail(error)));
  }, [hub, token, file]);

  if (!theme) return <p className="mt-10 text-center text-white/50">{note || 'جارٍ تحميل الثيم…'}</p>;

  const change = (next: Theme) => {
    setTheme(next);
    setDirty(true);
  };
  const setGroup = (index: number, group: DocGroup) => change({ ...theme, groups: theme.groups.map((item, at) => (at === index ? group : item)) });
  const show = (path: string | undefined) => (path ? uploaded[path] || hub.raw(`public${path}`) : '');

  const save = async () => {
    setBusy(true);
    setNote('');
    try {
      setSha(await hub.write(file, theme, sha, `Themes: update ${slug}`, token));
      setDirty(false);
      setNote('تم الحفظ. يظهر على الموقع خلال دقيقتين تقريباً.');
    } catch (error) {
      setNote(fail(error));
    } finally {
      setBusy(false);
    }
  };

  /** Uploads a picture under a new name and returns its address for the content file. */
  const upload = async (chosen: File, name: string, maxWidth: number): Promise<string> => {
    const bytes = await shrink(chosen, maxWidth);
    const path = `/docs/${slug}/${name}-${Date.now().toString(36)}.webp`;
    await hub.upload(`public${path}`, bytes, `Pictures: ${slug}/${name}`, token);
    setUploaded((seen) => ({ ...seen, [path]: URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/webp' })) }));
    return path;
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="sticky top-20 z-30 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-bg/90 p-3 backdrop-blur-xl">
        <button type="button" className="btn btn-ghost px-4 py-2" onClick={() => (!dirty || window.confirm('توجد تعديلات لم تُحفظ. الخروج بدون حفظ؟')) && onClose()}>
          <X className="h-4 w-4" />
          كل الثيمات
        </button>
        <span dir="ltr" className="font-mono text-sm text-white/60">
          {slug}
        </span>
        <span className="flex-1 text-sm text-white/60">{note || (dirty ? 'تعديلات لم تُحفظ' : '')}</span>
        <button type="button" className="btn btn-primary px-5 py-2" disabled={busy || !dirty} onClick={save}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ الثيم
        </button>
      </div>

      {/* the theme itself */}
      <div className="card space-y-4 p-6">
        <h2 className="font-bold text-white">بيانات الثيم</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="الاسم (عربي)" value={theme.name.ar} onChange={(ar) => change({ ...theme, name: { ...theme.name, ar } })} />
          <Field label="الاسم (إنجليزي)" ltr value={theme.name.en ?? ''} onChange={(en) => change({ ...theme, name: { ...theme.name, en } })} />
          <Field label="سطر تعريفي (عربي)" value={theme.tagline?.ar ?? ''} onChange={(ar) => change({ ...theme, tagline: { ...theme.tagline, ar } })} />
          <Field label="سطر تعريفي (إنجليزي)" ltr value={theme.tagline?.en ?? ''} onChange={(en) => change({ ...theme, tagline: { ar: theme.tagline?.ar ?? '', en } })} />
          <Field label="نبذة (عربي)" area value={theme.summary?.ar ?? ''} onChange={(ar) => change({ ...theme, summary: { ...theme.summary, ar } })} />
          <Field label="نبذة (إنجليزي)" area ltr value={theme.summary?.en ?? ''} onChange={(en) => change({ ...theme, summary: { ar: theme.summary?.ar ?? '', en } })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">المنصة</label>
            <select className="field" value={theme.platform} onChange={(event) => change({ ...theme, platform: event.target.value as Platform })}>
              <option value="salla">سلة</option>
              <option value="zid">زد</option>
            </select>
          </div>
          <PictureField label="صورة الغلاف (عريضة)" src={show(theme.cover)} onPick={async (chosen) => change({ ...theme, cover: await upload(chosen, 'cover', 1400) })} onClear={() => change({ ...theme, cover: '' })} />
        </div>
        <Lines
          label="المميزات (سطر لكل ميزة — بالعربية | بالإنجليزية)"
          value={(theme.highlights ?? []).map((item) => (item.en ? `${item.ar} | ${item.en}` : item.ar))}
          onChange={(lines) => change({ ...theme, highlights: lines.map((line) => { const [ar, en] = line.split('|').map((part) => part.trim()); return en ? { ar, en } : { ar }; }) })}
        />
        <div>
          <label className="label">أشكال الثيم ومتاجره التجريبية — لكل واحد اسم وصورة، ورابط المعاينة الحيّة إن وُجد</label>
          <Rows<ThemeDemo>
            items={theme.demos ?? []}
            onChange={(demos) => change({ ...theme, demos })}
            blank={() => ({ label: { ar: '' }, url: '' })}
            addLabel="شكل / متجر تجريبي جديد"
            name={(demo) => demo.label.ar}
          >
            {(demo, set) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="الاسم (عربي)" value={demo.label.ar} onChange={(ar) => set({ ...demo, label: { ...demo.label, ar } })} />
                <Field label="الاسم (إنجليزي)" ltr value={demo.label.en ?? ''} onChange={(en) => set({ ...demo, label: { ...demo.label, en } })} />
                <Field label="رابط المعاينة الحيّة (اتركيه فارغاً إن لم يُنشر بعد)" ltr value={demo.url} onChange={(url) => set({ ...demo, url: url.trim() })} />
                <Field label="ملاحظة تظهر مكان زر المعاينة إن لم يوجد رابط (اختياري)" value={demo.note?.ar ?? ''} onChange={(ar) => set({ ...demo, note: ar ? { ...demo.note, ar } : undefined })} />
                <PictureField label="صورة هذا الشكل (عريضة)" src={show(demo.image)} onPick={async (chosen) => set({ ...demo, image: await upload(chosen, 'look', 1400) })} onClear={() => set({ ...demo, image: '' })} />
              </div>
            )}
          </Rows>
        </div>
      </div>

      {/* the guide */}
      {theme.groups.map((group, groupIndex) => (
        <div key={group.id} className="card space-y-4 p-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <Field label="عنوان المجموعة (عربي)" value={group.title.ar} onChange={(ar) => setGroup(groupIndex, { ...group, title: { ...group.title, ar } })} />
            </div>
            <div className="min-w-0 flex-1">
              <Field label="عنوان المجموعة (إنجليزي)" ltr value={group.title.en ?? ''} onChange={(en) => setGroup(groupIndex, { ...group, title: { ...group.title, en } })} />
            </div>
            <button
              type="button"
              className="btn btn-danger px-3"
              aria-label="حذف المجموعة"
              onClick={() => window.confirm(`حذف مجموعة «${group.title.ar}» بكل أقسامها؟`) && change({ ...theme, groups: theme.groups.filter((_, at) => at !== groupIndex) })}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-white/70">
            <input
              type="checkbox"
              className="h-4 w-4 accent-violet-500"
              checked={group.kind === 'faq'}
              onChange={(event) => setGroup(groupIndex, { ...group, kind: event.target.checked ? 'faq' : undefined })}
            />
            مجموعة أسئلة شائعة — تُعرض كأسئلة تُفتح عند الضغط، والصورة فيها اختيارية
          </label>

          <div className="space-y-3">
            {group.sections.map((section, sectionIndex) => {
              const setSection = (next: DocSection) => setGroup(groupIndex, { ...group, sections: group.sections.map((item, at) => (at === sectionIndex ? next : item)) });
              const move = (by: number) => {
                const sections = [...group.sections];
                const target = sectionIndex + by;
                if (target < 0 || target >= sections.length) return;
                [sections[sectionIndex], sections[target]] = [sections[target], sections[sectionIndex]];
                setGroup(groupIndex, { ...group, sections });
              };
              const isOpen = openSection === section.id;
              return (
                <div key={section.id} className="rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-2 p-3">
                    <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-start" onClick={() => setOpenSection(isOpen ? '' : section.id)} aria-expanded={isOpen}>
                      {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-brand-300" /> : <ChevronDown className="h-4 w-4 shrink-0 text-white/40" />}
                      <span className="truncate font-semibold text-white">{section.title.ar || 'قسم بدون عنوان'}</span>
                      {!section.image && group.kind !== 'faq' && <span className="shrink-0 rounded-md bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-200">بدون صورة</span>}
                      {section.image && (section.markers ?? []).length === 0 && <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/50">بدون أسهم</span>}
                    </button>
                    <button type="button" className="btn btn-ghost px-2.5 py-2" aria-label="تحريك لأعلى" onClick={() => move(-1)}>
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" className="btn btn-ghost px-2.5 py-2" aria-label="تحريك لأسفل" onClick={() => move(1)}>
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger px-2.5 py-2"
                      aria-label="حذف القسم"
                      onClick={() => window.confirm(`حذف قسم «${section.title.ar}»؟`) && setGroup(groupIndex, { ...group, sections: group.sections.filter((_, at) => at !== sectionIndex) })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {isOpen && <SectionForm section={section} onChange={setSection} show={show} upload={upload} />}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-ghost px-4 py-2"
            onClick={() => {
              const id = uid('s');
              setGroup(groupIndex, { ...group, sections: [...group.sections, { id, title: { ar: '' }, image: '', text: { ar: '' }, steps: { ar: [] }, settings: [] }] });
              setOpenSection(id);
            }}
          >
            <Plus className="h-4 w-4" />
            قسم جديد في هذه المجموعة
          </button>
        </div>
      ))}

      <button type="button" className="btn btn-ghost" onClick={() => change({ ...theme, groups: [...theme.groups, { id: uid('g'), title: { ar: 'مجموعة جديدة' }, sections: [] }] })}>
        <Plus className="h-4 w-4" />
        مجموعة جديدة
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ one section */

function SectionForm({
  section,
  onChange,
  show,
  upload,
}: {
  section: DocSection;
  onChange: (next: DocSection) => void;
  show: (path: string | undefined) => string;
  upload: (file: File, name: string, maxWidth: number) => Promise<string>;
}) {
  const markers = section.markers ?? [];
  const setMarkers = (next: Marker[]) => onChange({ ...section, markers: next });
  const text = (value: Text | undefined, part: Partial<Text>): Text => ({ ar: value?.ar ?? '', ...value, ...part });

  return (
    <div className="space-y-5 border-t border-white/10 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="عنوان القسم (عربي)" value={section.title.ar} onChange={(ar) => onChange({ ...section, title: { ...section.title, ar } })} />
        <Field label="عنوان القسم (إنجليزي)" ltr value={section.title.en ?? ''} onChange={(en) => onChange({ ...section, title: { ...section.title, en } })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <PictureField label="صورة القسم (سطح المكتب)" src={show(section.image)} onPick={async (chosen) => onChange({ ...section, image: await upload(chosen, section.id, 1400), markers: [] })} onClear={() => onChange({ ...section, image: '', markers: [] })} />
        <PictureField label="صورة الجوال (اختياري)" src={show(section.image_mobile)} onPick={async (chosen) => onChange({ ...section, image_mobile: await upload(chosen, `${section.id}-m`, 480) })} onClear={() => onChange({ ...section, image_mobile: '' })} />
      </div>

      {section.image && (
        <div>
          <label className="label">الأسهم على الصورة — اضغطي على المكان الذي تريدين الإشارة إليه، ثم اكتبي شرحه</label>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30 p-2 text-center">
            <Annotated src={show(section.image)} alt={section.title.ar} markers={markers} className="block max-h-[32rem] w-auto max-w-full" onPick={(x, y) => setMarkers([...markers, { x, y, text: { ar: '' } }])} />
          </div>
          {markers.length > 0 && (
            <div className="mt-3 space-y-2">
              {markers.map((marker, index) => (
                <div key={index} className="grid items-center gap-2 sm:grid-cols-[auto_1fr_1fr_auto]">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-400 text-xs font-black text-[#1a1203]">{index + 1}</span>
                  <input className="field" placeholder="شرح السهم بالعربية" value={marker.text.ar} onChange={(event) => setMarkers(markers.map((item, at) => (at === index ? { ...item, text: { ...item.text, ar: event.target.value } } : item)))} />
                  <input className="field" dir="ltr" placeholder="In English (optional)" value={marker.text.en ?? ''} onChange={(event) => setMarkers(markers.map((item, at) => (at === index ? { ...item, text: { ...item.text, en: event.target.value } } : item)))} />
                  <button type="button" className="btn btn-danger px-3" aria-label={`حذف السهم ${index + 1}`} onClick={() => setMarkers(markers.filter((_, at) => at !== index))}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الشرح (عربي)" area value={section.text?.ar ?? ''} onChange={(ar) => onChange({ ...section, text: text(section.text, { ar }) })} />
        <Field label="الشرح (إنجليزي)" area ltr value={section.text?.en ?? ''} onChange={(en) => onChange({ ...section, text: text(section.text, { en }) })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Lines label="خطوات الإعداد بالعربية (سطر لكل خطوة)" value={section.steps?.ar ?? []} onChange={(ar) => onChange({ ...section, steps: { ...section.steps, ar } })} />
        <Lines label="خطوات الإعداد بالإنجليزية" ltr value={section.steps?.en ?? []} onChange={(en) => onChange({ ...section, steps: { ar: section.steps?.ar ?? [], en } })} />
      </div>

      <div>
        <label className="label">أهم الإعدادات (اسم الإعداد كما يظهر في المحرر، وما الذي يفعله)</label>
        <div className="space-y-2">
          {(section.settings ?? []).map((setting, index) => {
            const setSetting = (next: typeof setting) => onChange({ ...section, settings: (section.settings ?? []).map((item, at) => (at === index ? next : item)) });
            return (
              <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,12rem)_1fr_1fr_auto]">
                <input className="field" placeholder="اسم الإعداد" value={setting.label} onChange={(event) => setSetting({ ...setting, label: event.target.value })} />
                <input className="field" placeholder="ما الذي يفعله" value={setting.note?.ar ?? ''} onChange={(event) => setSetting({ ...setting, note: text(setting.note, { ar: event.target.value }) })} />
                <input className="field" dir="ltr" placeholder="In English (optional)" value={setting.note?.en ?? ''} onChange={(event) => setSetting({ ...setting, note: text(setting.note, { en: event.target.value }) })} />
                <button type="button" className="btn btn-danger px-3" aria-label="حذف الإعداد" onClick={() => onChange({ ...section, settings: (section.settings ?? []).filter((_, at) => at !== index) })}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
        <button type="button" className="btn btn-ghost mt-2 px-4 py-2" onClick={() => onChange({ ...section, settings: [...(section.settings ?? []), { label: '', note: { ar: '' } }] })}>
          <Plus className="h-4 w-4" />
          إعداد جديد
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="نصيحة (عربي، اختياري)" value={section.tip?.ar ?? ''} onChange={(ar) => onChange({ ...section, tip: ar || section.tip?.en ? text(section.tip, { ar }) : undefined })} />
        <Field label="نصيحة (إنجليزي)" ltr value={section.tip?.en ?? ''} onChange={(en) => onChange({ ...section, tip: text(section.tip, { en }) })} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ small fields */

const rowId = () => Math.random().toString(36).slice(2, 9);

/**
 * A list of cards the owner adds to, reorders and deletes from. Each row keeps an identity
 * of its own, so what is typed in a row stays with it when the rows move.
 */
export function Rows<T>({
  items,
  onChange,
  blank,
  addLabel,
  name,
  children,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  blank: () => T;
  addLabel: string;
  name: (item: T) => string;
  children: (item: T, set: (next: T) => void) => React.ReactNode;
}) {
  const [ids, setIds] = useState<string[]>(() => items.map(rowId));
  const idOf = (index: number) => ids[index] ?? `row-${index}`;
  const apply = (nextItems: T[], nextIds: string[]) => {
    setIds(nextIds);
    onChange(nextItems);
  };
  const move = (index: number, by: number) => {
    const target = index + by;
    if (target < 0 || target >= items.length) return;
    const nextItems = [...items];
    const nextIds = items.map((_, at) => idOf(at));
    [nextItems[index], nextItems[target]] = [nextItems[target], nextItems[index]];
    [nextIds[index], nextIds[target]] = [nextIds[target], nextIds[index]];
    apply(nextItems, nextIds);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={idOf(index)} className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-semibold text-white">{name(item) || 'بدون عنوان'}</span>
            <button type="button" className="btn btn-ghost px-2.5 py-2" aria-label="تحريك لأعلى" onClick={() => move(index, -1)}>
              <ArrowUp className="h-4 w-4" />
            </button>
            <button type="button" className="btn btn-ghost px-2.5 py-2" aria-label="تحريك لأسفل" onClick={() => move(index, 1)}>
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn btn-danger px-2.5 py-2"
              aria-label="حذف"
              onClick={() =>
                window.confirm(`حذف «${name(item) || 'بدون عنوان'}»؟`) &&
                apply(
                  items.filter((_, at) => at !== index),
                  items.map((_, at) => idOf(at)).filter((_, at) => at !== index)
                )
              }
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {children(item, (next) => onChange(items.map((row, at) => (at === index ? next : row))))}
        </div>
      ))}
      <button type="button" className="btn btn-ghost px-4 py-2" onClick={() => apply([...items, blank()], [...items.map((_, at) => idOf(at)), rowId()])}>
        <Plus className="h-4 w-4" />
        {addLabel}
      </button>
    </div>
  );
}


export function Field({ label, value, onChange, ltr, area }: { label: string; value: string; onChange: (next: string) => void; ltr?: boolean; area?: boolean }) {
  return (
    <div>
      <label className="label">{label}</label>
      {area ? (
        <textarea className="field min-h-24" dir={ltr ? 'ltr' : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className="field" dir={ltr ? 'ltr' : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  );
}

/** A list edited as text: one item per line. */
export function Lines({ label, value, onChange, ltr }: { label: string; value: string[]; onChange: (next: string[]) => void; ltr?: boolean }) {
  const [draft, setDraft] = useState(value.join('\n'));
  return (
    <div>
      <label className="label">{label}</label>
      <textarea
        className="field min-h-28"
        dir={ltr ? 'ltr' : undefined}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          onChange(event.target.value.split('\n').map((line) => line.trim()).filter(Boolean));
        }}
      />
    </div>
  );
}

function PictureField({ label, src, onPick, onClear }: { label: string; src: string; onPick: (file: File) => Promise<void>; onClear: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="h-16 w-24 rounded-lg border border-white/10 object-cover object-top" />
        )}
        <label className={`btn btn-ghost cursor-pointer px-4 py-2 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {src ? 'تغيير الصورة' : 'رفع صورة'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (event) => {
              const chosen = event.target.files?.[0];
              event.target.value = '';
              if (!chosen) return;
              setBusy(true);
              setError('');
              try {
                await onPick(chosen);
              } catch (reason) {
                setError(reason instanceof GitHubError ? `GitHub: ${reason.message}` : 'تعذّر رفع الصورة.');
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {src && (
          <button type="button" className="btn btn-danger px-3 py-2" aria-label="إزالة الصورة" onClick={onClear}>
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}
