'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ExternalLink, KeyRound, Loader2, LogOut, Pencil, Plus, Save, Store, Trash2, UserRound } from 'lucide-react';
import type { Feature, Profile, Service, StoreEntry, Text, WorkHours } from '@/lib/types';
import { github, GitHubError, lockToken, unlockToken, type Lock } from '@/lib/admin';
import { dayName, hourText, WEEK, ZONES } from '@/lib/hours';
import { ICONS, iconOf } from '@/lib/icons';
import { Field, Lines, Rows, ThemesTab } from './ThemeEditor';

interface AdminFile {
  lock: Lock | null;
}

type Stage = 'loading' | 'offline' | 'setup' | 'login' | 'ready';
type Tab = 'themes' | 'stores' | 'profile' | 'password';

const MIN_PASSWORD = 10;

/** What a failed call to GitHub means, in words the owner can act on. */
function explain(error: unknown): string {
  if (error instanceof GitHubError) {
    if (error.status === 401) return 'مفتاح GitHub غير صالح أو انتهت مدته. أنشئي مفتاحاً جديداً ثم أعيدي الإعداد.';
    if (error.status === 403) return 'المفتاح لا يملك صلاحية الكتابة على هذا المستودع (Contents: Read and write).';
    if (error.status === 404) return 'لم أجد المستودع أو الملف. تأكدي أن المفتاح مخصّص لهذا المستودع.';
    if (error.status === 409 || error.status === 422) return 'الملف تغيّر من مكان آخر. حدّثي الصفحة ثم أعيدي التعديل.';
    return `GitHub: ${error.message}`;
  }
  return 'تعذّر الاتصال. تأكدي من الإنترنت ثم حاولي مرة أخرى.';
}

/**
 * The control panel. It runs entirely in the browser: the password opens the owner's GitHub
 * token (kept encrypted in the repository), and every save is a commit to the repository —
 * the site rebuilds itself from it within a couple of minutes.
 */
export function AdminApp({ repo, branch, themes }: { repo: string; branch: string; themes: { slug: string; name: string }[] }) {
  const hub = useMemo(() => github(repo, branch), [repo, branch]);
  const [stage, setStage] = useState<Stage>('loading');
  const [lock, setLock] = useState<Lock | null>(null);
  const [lockSha, setLockSha] = useState<string | undefined>();
  const [token, setToken] = useState('');
  const [tab, setTab] = useState<Tab>('themes');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!repo) {
      setStage('offline');
      return;
    }
    hub
      .read<AdminFile>('content/admin.json')
      .then(({ value, sha }) => {
        setLock(value.lock);
        setLockSha(sha);
        setStage(value.lock ? 'login' : 'setup');
      })
      .catch((reason) => {
        setError(explain(reason));
        setStage('setup');
      });
  }, [hub, repo]);

  const saveLock = async (next: Lock, withToken: string) => {
    const sha = await hub.write('content/admin.json', { lock: next }, lockSha, 'Control panel: password', withToken);
    setLock(next);
    setLockSha(sha);
  };

  return (
    <div className="container-px max-w-5xl pb-16 pt-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black sm:text-3xl">لوحة التحكم</h1>
          <p className="mt-1 text-sm text-white/50">GT-THEMES — تعديل بيانات الموقع</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="btn btn-ghost px-4 py-2">
            <ExternalLink className="h-4 w-4" />
            الموقع
          </Link>
          {stage === 'ready' && (
            <button
              type="button"
              className="btn btn-ghost px-4 py-2"
              onClick={() => {
                setToken('');
                setStage('login');
              }}
            >
              <LogOut className="h-4 w-4" />
              خروج
            </button>
          )}
        </div>
      </div>

      {error && stage !== 'ready' && <p className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}

      {stage === 'loading' && (
        <p className="mt-16 flex items-center justify-center gap-3 text-white/60">
          <Loader2 className="h-5 w-5 animate-spin" />
          جارٍ التحميل…
        </p>
      )}

      {stage === 'offline' && (
        <div className="card mt-8 p-7 leading-relaxed text-white/70">
          <h2 className="text-lg font-bold text-white">اللوحة تعمل بعد رفع الموقع على GitHub</h2>
          <p className="mt-2">هذه نسخة محلية من الموقع. بعد رفعه، افتحي هذه الصفحة من عنوان الموقع نفسه لتجهيز كلمة المرور وتعديل البيانات.</p>
        </div>
      )}

      {stage === 'setup' && (
        <Setup
          repo={repo}
          onDone={async (newToken, password) => {
            if (!(await hub.canWrite(newToken))) throw new GitHubError(403, 'no push');
            await saveLock(await lockToken(newToken, password), newToken);
            setToken(newToken);
            setError('');
            setStage('ready');
          }}
        />
      )}

      {stage === 'login' && lock && (
        <Login
          onReset={() => setStage('setup')}
          onLogin={async (password) => {
            const opened = await unlockToken(lock, password);
            if (!opened) return 'كلمة المرور غير صحيحة.';
            try {
              if (!(await hub.canWrite(opened))) return 'المفتاح المحفوظ لم يعد يملك صلاحية الكتابة. أعيدي الإعداد بمفتاح جديد.';
            } catch (reason) {
              return explain(reason);
            }
            setToken(opened);
            setError('');
            setStage('ready');
            return '';
          }}
        />
      )}

      {stage === 'ready' && (
        <>
          <div role="tablist" className="mt-8 flex flex-wrap gap-2">
            {(
              [
                ['themes', 'الثيمات والشروح', BookOpen],
                ['stores', 'متاجر فعّلت الثيمات', Store],
                ['profile', 'الصفحة الرئيسية وبياناتي', UserRound],
                ['password', 'كلمة المرور', KeyRound],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`btn px-4 py-2.5 ${tab === key ? 'btn-primary' : 'btn-ghost'}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/40">كل حفظ يُسجَّل في GitHub، ويظهر على الموقع خلال دقيقتين تقريباً.</p>

          {tab === 'themes' && <ThemesTab hub={hub} token={token} />}
          {tab === 'stores' && <StoresTab hub={hub} token={token} themes={themes} />}
          {tab === 'profile' && <ProfileTab hub={hub} token={token} />}
          {tab === 'password' && <PasswordTab onChange={async (password) => saveLock(await lockToken(token, password), token)} />}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ first time */

function Setup({ repo, onDone }: { repo: string; onDone: (token: string, password: string) => Promise<void> }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <form
      className="card mt-8 space-y-5 p-6 sm:p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        if (password.length < MIN_PASSWORD) return setError(`كلمة المرور ${MIN_PASSWORD} أحرف على الأقل.`);
        if (password !== again) return setError('كلمتا المرور غير متطابقتين.');
        setBusy(true);
        setError('');
        try {
          await onDone(token.trim(), password);
        } catch (reason) {
          setError(explain(reason));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <h2 className="text-lg font-bold text-white">الإعداد لأول مرة</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          اللوحة تحفظ تعديلاتك في GitHub مباشرة، فتحتاج مرة واحدة إلى «مفتاح» من حسابك. يُحفظ المفتاح مشفّراً بكلمة المرور التي تختارينها، وبعدها تدخلين بكلمة المرور فقط.
        </p>
      </div>

      <ol className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-white/70">
        <li>١. افتحي GitHub ← صورتك أعلى الصفحة ← Settings ← Developer settings ← Personal access tokens ← Fine-grained tokens ← Generate new token.</li>
        <li>
          ٢. Repository access: اختاري «Only select repositories» ثم المستودع{' '}
          <span dir="ltr" className="font-mono text-brand-200">
            {repo}
          </span>
          .
        </li>
        <li>٣. Permissions ← Repository permissions ← Contents: اختاري «Read and write».</li>
        <li>٤. Expiration: اختاري مدة طويلة (سنة)، ثم Generate token وانسخي المفتاح.</li>
      </ol>

      <div>
        <label className="label" htmlFor="admin-token">
          مفتاح GitHub
        </label>
        <input id="admin-token" dir="ltr" className="field font-mono" required autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder="github_pat_…" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="admin-password">
            كلمة مرور اللوحة ({MIN_PASSWORD} أحرف على الأقل)
          </label>
          <input id="admin-password" type="password" dir="ltr" className="field" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="admin-password-again">
            أعيدي كتابتها
          </label>
          <input id="admin-password-again" type="password" dir="ltr" className="field" required autoComplete="new-password" value={again} onChange={(event) => setAgain(event.target.value)} />
        </div>
      </div>
      <p className="text-xs leading-relaxed text-white/40">اختاري كلمة مرور طويلة لا تستخدمينها في مكان آخر: الملف المشفّر نفسه ظاهر في المستودع، وقوّته من قوّة كلمتك.</p>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        حفظ والدخول
      </button>
    </form>
  );
}

function Login({ onLogin, onReset }: { onLogin: (password: string) => Promise<string>; onReset: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <form
      className="card mx-auto mt-10 max-w-md space-y-5 p-6 sm:p-8"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError(await onLogin(password));
        setBusy(false);
      }}
    >
      <h2 className="text-lg font-bold text-white">الدخول</h2>
      <div>
        <label className="label" htmlFor="admin-login">
          كلمة المرور
        </label>
        <input id="admin-login" type="password" dir="ltr" className="field" required autoFocus autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        دخول
      </button>
      <button type="button" onClick={onReset} className="block w-full text-center text-xs text-white/40 hover:text-white/70">
        نسيتِ كلمة المرور؟ أعيدي الإعداد بمفتاح GitHub جديد
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ stores */

type Hub = ReturnType<typeof github>;

const blankStore = (theme: string): StoreEntry => ({ id: '', name: '', url: '', theme, note: '', added: '' });

function StoresTab({ hub, token, themes }: { hub: Hub; token: string; themes: { slug: string; name: string }[] }) {
  const [stores, setStores] = useState<StoreEntry[] | null>(null);
  const [sha, setSha] = useState<string | undefined>();
  const [draft, setDraft] = useState<StoreEntry>(blankStore(themes[0]?.slug ?? ''));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    hub
      .read<StoreEntry[]>('content/stores.json', token)
      .then(({ value, sha: id }) => {
        setStores(value);
        setSha(id);
      })
      .catch((reason) => setNote(explain(reason)));
  }, [hub, token]);

  const commit = async (next: StoreEntry[], message: string) => {
    setBusy(true);
    setNote('');
    try {
      setSha(await hub.write('content/stores.json', next, sha, message, token));
      setStores(next);
      setNote('تم الحفظ. يظهر على الموقع خلال دقيقتين تقريباً.');
    } catch (reason) {
      setNote(explain(reason));
    } finally {
      setBusy(false);
    }
  };

  if (!stores) return <p className="mt-10 text-center text-white/50">{note || 'جارٍ تحميل المتاجر…'}</p>;
  const themeName = (slug: string) => themes.find((theme) => theme.slug === slug)?.name ?? slug;

  return (
    <div className="mt-6 space-y-6">
      <form
        className="card space-y-4 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const url = /^https?:\/\//i.test(draft.url.trim()) ? draft.url.trim() : `https://${draft.url.trim()}`;
          const entry: StoreEntry = {
            ...draft,
            name: draft.name.trim(),
            url,
            note: draft.note?.trim() || undefined,
            id: draft.id || `s${Date.now().toString(36)}`,
            added: draft.added || new Date().toISOString().slice(0, 10),
          };
          const next = draft.id ? stores.map((store) => (store.id === draft.id ? entry : store)) : [...stores, entry];
          void commit(next, `Stores: ${draft.id ? 'edit' : 'add'} ${entry.name}`).then(() => setDraft(blankStore(draft.theme)));
        }}
      >
        <h2 className="font-bold text-white">{draft.id ? 'تعديل متجر' : 'إضافة متجر'}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="store-name">
              اسم المتجر
            </label>
            <input id="store-name" className="field" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="store-url">
              رابط المتجر
            </label>
            <input id="store-url" dir="ltr" className="field" required placeholder="https://" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="store-theme">
              الثيم
            </label>
            <select id="store-theme" className="field" value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value })}>
              {themes.map((theme) => (
                <option key={theme.slug} value={theme.slug}>
                  {theme.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="store-note">
              وصف قصير (اختياري)
            </label>
            <input id="store-note" className="field" placeholder="مثال: عطور — الرياض" value={draft.note ?? ''} onChange={(event) => setDraft({ ...draft, note: event.target.value })} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : draft.id ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {draft.id ? 'حفظ التعديل' : 'إضافة'}
          </button>
          {draft.id && (
            <button type="button" className="btn btn-ghost" onClick={() => setDraft(blankStore(draft.theme))}>
              إلغاء
            </button>
          )}
        </div>
        {note && <p className="text-sm text-white/60">{note}</p>}
      </form>

      <div className="card divide-y divide-white/10">
        {stores.length === 0 && <p className="p-6 text-center text-white/50">لا توجد متاجر بعد.</p>}
        {stores.map((store) => (
          <div key={store.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white">{store.name}</div>
              <div className="text-xs text-white/50">
                {themeName(store.theme)}
                {store.note ? ` · ${store.note}` : ''}
              </div>
              <a href={store.url} target="_blank" rel="noreferrer" dir="ltr" className="block truncate text-xs text-brand-300 hover:underline">
                {store.url}
              </a>
            </div>
            <button type="button" className="btn btn-ghost px-3 py-2" onClick={() => setDraft({ ...store, note: store.note ?? '' })} aria-label={`تعديل ${store.name}`}>
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn btn-danger px-3 py-2"
              disabled={busy}
              aria-label={`حذف ${store.name}`}
              onClick={() => {
                if (window.confirm(`حذف «${store.name}» من القائمة؟`)) void commit(stores.filter((item) => item.id !== store.id), `Stores: remove ${store.name}`);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ profile */

const DEFAULT_HOURS: WorkHours = { days: [6, 0, 1, 2, 3, 4], from: 12, to: 20, timezone: 'Africa/Cairo' };

/** Texts in two languages, edited as lines: «بالعربية | In English». */
const toLines = (items: Text[] | undefined): string[] => (items ?? []).map((item) => (item.en ? `${item.ar} | ${item.en}` : item.ar));
const fromLines = (lines: string[]): Text[] =>
  lines.map((line) => {
    const [ar, en] = line.split('|').map((part) => part.trim());
    return en ? { ar, en } : { ar };
  });

function IconField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const Icon = iconOf(value);
  return (
    <div>
      <label className="label">الأيقونة</label>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-300">
          <Icon className="h-5 w-5" />
        </span>
        <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
          {Object.entries(ICONS).map(([key, entry]) => (
            <option key={key} value={key}>
              {entry.ar}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ProfileTab({ hub, token }: { hub: Hub; token: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sha, setSha] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  /** Counts the saves: the lists are drawn afresh after each one, from what was actually saved. */
  const [saves, setSaves] = useState(0);

  useEffect(() => {
    hub
      .read<Profile>('content/profile.json', token)
      .then(({ value, sha: id }) => {
        setProfile(value);
        setSha(id);
      })
      .catch((reason) => setNote(explain(reason)));
  }, [hub, token]);

  if (!profile) return <p className="mt-10 text-center text-white/50">{note || 'جارٍ تحميل البيانات…'}</p>;

  const text = (label: string, value: string, onChange: (next: string) => void, options: { ltr?: boolean; area?: boolean } = {}) => (
    <div>
      <label className="label">{label}</label>
      {options.area ? (
        <textarea className="field min-h-24" dir={options.ltr ? 'ltr' : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className="field" dir={options.ltr ? 'ltr' : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  );

  return (
    <form
      className="card mt-6 space-y-5 p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setNote('');
        try {
          if (profile.hours && profile.hours.from >= profile.hours.to) {
            setNote('مواعيد العمل: ساعة النهاية يجب أن تكون بعد ساعة البداية.');
            return;
          }
          const clean: Profile = {
            ...profile,
            whatsapp: profile.whatsapp.replace(/\D/g, ''),
            experience: profile.experience.filter((item) => item.ar.trim()),
            services: (profile.services ?? []).filter((item) => item.title.ar.trim()),
            features: (profile.features ?? []).filter((item) => item.title.ar.trim()),
          };
          setSha(await hub.write('content/profile.json', clean, sha, 'Profile: update', token));
          setProfile(clean);
          setSaves((count) => count + 1);
          setNote('تم الحفظ. يظهر على الموقع خلال دقيقتين تقريباً.');
        } catch (reason) {
          setNote(explain(reason));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-bold text-white">طرق التواصل</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {text('البريد الإلكتروني', profile.email, (email) => setProfile({ ...profile, email }), { ltr: true })}
        {text('رقم الهاتف', profile.phone, (phone) => setProfile({ ...profile, phone }), { ltr: true })}
        {text('رقم واتساب (أرقام فقط مع كود الدولة)', profile.whatsapp, (whatsapp) => setProfile({ ...profile, whatsapp }), { ltr: true })}
      </div>

      <h2 className="pt-2 font-bold text-white">التعريف</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {text('الاسم (عربي)', profile.name.ar, (ar) => setProfile({ ...profile, name: { ...profile.name, ar } }))}
        {text('الاسم (إنجليزي)', profile.name.en ?? '', (en) => setProfile({ ...profile, name: { ...profile.name, en } }), { ltr: true })}
        {text('المسمّى (عربي)', profile.role.ar, (ar) => setProfile({ ...profile, role: { ...profile.role, ar } }))}
        {text('المسمّى (إنجليزي)', profile.role.en ?? '', (en) => setProfile({ ...profile, role: { ...profile.role, en } }), { ltr: true })}
        {text('نبذة (عربي)', profile.bio.ar, (ar) => setProfile({ ...profile, bio: { ...profile.bio, ar } }), { area: true })}
        {text('نبذة (إنجليزي)', profile.bio.en ?? '', (en) => setProfile({ ...profile, bio: { ...profile.bio, en } }), { area: true, ltr: true })}
        {text('عنوان الصفحة الرئيسية (عربي)', profile.hero_title.ar, (ar) => setProfile({ ...profile, hero_title: { ...profile.hero_title, ar } }))}
        {text('عنوان الصفحة الرئيسية (إنجليزي)', profile.hero_title.en ?? '', (en) => setProfile({ ...profile, hero_title: { ...profile.hero_title, en } }), { ltr: true })}
        {text('السطر تحت العنوان (عربي)', profile.hero_subtitle.ar, (ar) => setProfile({ ...profile, hero_subtitle: { ...profile.hero_subtitle, ar } }), { area: true })}
        {text('السطر تحت العنوان (إنجليزي)', profile.hero_subtitle.en ?? '', (en) => setProfile({ ...profile, hero_subtitle: { ...profile.hero_subtitle, en } }), { area: true, ltr: true })}
      </div>
      <p className="text-xs leading-relaxed text-white/40">في النبذة: الكلمات بين نجمتين من كل جهة — مثل **٧ سنوات** — تظهر بارزة على الموقع.</p>
      <Lines
        key={`points-${saves}`}
        label="نقاط تحت النبذة (سطر لكل نقطة — بالعربية | بالإنجليزية)"
        value={toLines(profile.bio_points)}
        onChange={(lines) => setProfile({ ...profile, bio_points: fromLines(lines) })}
      />

      <h2 className="pt-2 font-bold text-white">مواعيد العمل</h2>
      {(() => {
        const hours = profile.hours ?? DEFAULT_HOURS;
        const setHours = (next: WorkHours) => setProfile({ ...profile, hours: next });
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {WEEK.map((day) => {
                const on = hours.days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    className={`btn px-4 py-2 ${on ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setHours({ ...hours, days: on ? hours.days.filter((item) => item !== day) : [...hours.days, day] })}
                  >
                    {dayName(day, 'ar')}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">من الساعة</label>
                <select className="field" value={hours.from} onChange={(event) => setHours({ ...hours, from: Number(event.target.value) })}>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <option key={hour} value={hour}>
                      {hourText(hour, 'ar')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">إلى الساعة</label>
                <select className="field" value={hours.to} onChange={(event) => setHours({ ...hours, to: Number(event.target.value) })}>
                  {Array.from({ length: 24 }, (_, index) => index + 1).map((hour) => (
                    <option key={hour} value={hour}>
                      {hourText(hour, 'ar')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">التوقيت</label>
                <select className="field" value={hours.timezone} onChange={(event) => setHours({ ...hours, timezone: event.target.value })}>
                  {Object.entries(ZONES).map(([zone, label]) => (
                    <option key={zone} value={zone}>
                      {label.ar}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-white/40">تظهر المواعيد بجانب زر واتساب، ومعها كلمة «متاحون الآن» أو «مغلق الآن» محسوبة على هذا التوقيت.</p>
          </div>
        );
      })()}

      <h2 className="pt-2 font-bold text-white">الخدمات</h2>
      <Rows<Service>
        key={`services-${saves}`}
        items={profile.services ?? []}
        onChange={(services) => setProfile({ ...profile, services })}
        blank={() => ({ icon: 'star', title: { ar: '' }, text: { ar: '' }, points: [], tags: [] })}
        addLabel="خدمة جديدة"
        name={(service) => service.title.ar}
      >
        {(service, set) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم الخدمة (عربي)" value={service.title.ar} onChange={(ar) => set({ ...service, title: { ...service.title, ar } })} />
            <Field label="اسم الخدمة (إنجليزي)" ltr value={service.title.en ?? ''} onChange={(en) => set({ ...service, title: { ...service.title, en } })} />
            <Field label="الوصف (عربي)" area value={service.text.ar} onChange={(ar) => set({ ...service, text: { ...service.text, ar } })} />
            <Field label="الوصف (إنجليزي)" area ltr value={service.text.en ?? ''} onChange={(en) => set({ ...service, text: { ...service.text, en } })} />
            <Lines label="ما تشمله الخدمة (سطر لكل نقطة — بالعربية | بالإنجليزية)" value={toLines(service.points)} onChange={(lines) => set({ ...service, points: fromLines(lines) })} />
            <Lines label="المنصات (سطر لكل منصة — بالعربية | بالإنجليزية)" value={toLines(service.tags)} onChange={(lines) => set({ ...service, tags: fromLines(lines) })} />
            <IconField value={service.icon} onChange={(icon) => set({ ...service, icon })} />
          </div>
        )}
      </Rows>

      <h2 className="pt-2 font-bold text-white">لماذا GT-THEMES (بطاقات المميزات)</h2>
      <Rows<Feature>
        key={`features-${saves}`}
        items={profile.features ?? []}
        onChange={(features) => setProfile({ ...profile, features })}
        blank={() => ({ icon: 'star', title: { ar: '' }, text: { ar: '' } })}
        addLabel="ميزة جديدة"
        name={(feature) => feature.title.ar}
      >
        {(feature, set) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="العنوان (عربي)" value={feature.title.ar} onChange={(ar) => set({ ...feature, title: { ...feature.title, ar } })} />
            <Field label="العنوان (إنجليزي)" ltr value={feature.title.en ?? ''} onChange={(en) => set({ ...feature, title: { ...feature.title, en } })} />
            <Field label="الوصف (عربي)" area value={feature.text.ar} onChange={(ar) => set({ ...feature, text: { ...feature.text, ar } })} />
            <Field label="الوصف (إنجليزي)" area ltr value={feature.text.en ?? ''} onChange={(en) => set({ ...feature, text: { ...feature.text, en } })} />
            <IconField value={feature.icon} onChange={(icon) => set({ ...feature, icon })} />
          </div>
        )}
      </Rows>

      <h2 className="pt-2 font-bold text-white">الخبرة</h2>
      <div className="space-y-3">
        {profile.experience.map((item, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input className="field" placeholder="بالعربية" value={item.ar} onChange={(event) => setProfile({ ...profile, experience: profile.experience.map((row, at) => (at === index ? { ...row, ar: event.target.value } : row)) })} />
            <input className="field" dir="ltr" placeholder="In English" value={item.en ?? ''} onChange={(event) => setProfile({ ...profile, experience: profile.experience.map((row, at) => (at === index ? { ...row, en: event.target.value } : row)) })} />
            <button type="button" className="btn btn-danger px-3" aria-label="حذف السطر" onClick={() => setProfile({ ...profile, experience: profile.experience.filter((_, at) => at !== index) })}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button type="button" className="btn btn-ghost px-4 py-2" onClick={() => setProfile({ ...profile, experience: [...profile.experience, { ar: '', en: '' }] })}>
          <Plus className="h-4 w-4" />
          سطر جديد
        </button>
      </div>

      <h2 className="pt-2 font-bold text-white">الأرقام في الصفحة الرئيسية</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {profile.stats.map((stat, index) => (
          <div key={index}>
            <label className="label">{stat.label.ar}</label>
            <input
              type="number"
              min={0}
              className="field"
              dir="ltr"
              value={stat.value}
              onChange={(event) => setProfile({ ...profile, stats: profile.stats.map((row, at) => (at === index ? { ...row, value: Number(event.target.value) || 0 } : row)) })}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ البيانات
        </button>
        {note && <p className="text-sm text-white/60">{note}</p>}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ password */

function PasswordTab({ onChange }: { onChange: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  return (
    <form
      className="card mt-6 max-w-md space-y-4 p-6"
      onSubmit={async (event) => {
        event.preventDefault();
        if (password.length < MIN_PASSWORD) return setNote(`كلمة المرور ${MIN_PASSWORD} أحرف على الأقل.`);
        if (password !== again) return setNote('كلمتا المرور غير متطابقتين.');
        setBusy(true);
        try {
          await onChange(password);
          setPassword('');
          setAgain('');
          setNote('تم تغيير كلمة المرور.');
        } catch (reason) {
          setNote(explain(reason));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-bold text-white">تغيير كلمة المرور</h2>
      <div>
        <label className="label" htmlFor="new-password">
          كلمة المرور الجديدة
        </label>
        <input id="new-password" type="password" dir="ltr" className="field" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="new-password-again">
          أعيدي كتابتها
        </label>
        <input id="new-password-again" type="password" dir="ltr" className="field" required autoComplete="new-password" value={again} onChange={(event) => setAgain(event.target.value)} />
      </div>
      {note && <p className="text-sm text-white/60">{note}</p>}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        تغيير
      </button>
    </form>
  );
}
