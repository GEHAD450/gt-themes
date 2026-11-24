import type { Metadata } from 'next';
import { getThemes } from '@/lib/content';
import { AdminApp } from './AdminApp';

export const metadata: Metadata = { title: 'لوحة التحكم', robots: { index: false, follow: false } };

/**
 * The control panel. Which repository it saves to comes from the build: the deploy workflow
 * passes the repository's own name and branch, so nothing is typed by hand.
 */
export default function AdminPage() {
  return (
    <main className="relative min-h-screen">
      <div className="bg-grid" />
      <AdminApp
        repo={process.env.NEXT_PUBLIC_REPO || ''}
        branch={process.env.NEXT_PUBLIC_BRANCH || 'main'}
        themes={getThemes().map((theme) => ({ slug: theme.slug, name: theme.name.ar }))}
      />
    </main>
  );
}
