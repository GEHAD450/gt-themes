import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfile, getStores, getTheme, getThemes } from '@/lib/content';
import { ThemeDocs } from '../../components/ThemeDocs';

export const dynamicParams = false;

export const generateStaticParams = () => getThemes().map((theme) => ({ slug: theme.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const theme = getTheme(slug);
  return theme ? { title: `شرح ثيم ${theme.name.ar}`, description: theme.summary?.ar } : {};
}

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const theme = getTheme(slug);
  if (!theme) notFound();
  return <ThemeDocs profile={getProfile()} theme={theme} stores={getStores().filter((store) => store.theme === slug)} />;
}
