import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfile, getStores, getTheme, getThemes } from '@/lib/content';
import { absolute } from '@/lib/site';
import { ThemeDocs } from '../../components/ThemeDocs';

export const dynamicParams = false;

export const generateStaticParams = () => getThemes().map((theme) => ({ slug: theme.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const theme = getTheme(slug);
  if (!theme) return {};
  const title = `شرح ثيم ${theme.name.ar}`;
  const url = absolute(`/theme/${theme.slug}/`);
  const images = theme.cover ? [{ url: absolute(theme.cover), width: theme.cover_size?.[0], height: theme.cover_size?.[1] }] : undefined;
  return { title, description: theme.summary?.ar, alternates: { canonical: url }, openGraph: { title, description: theme.summary?.ar, url, images } };
}

export default async function ThemePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const theme = getTheme(slug);
  if (!theme) notFound();
  return <ThemeDocs profile={getProfile()} theme={theme} stores={getStores().filter((store) => store.theme === slug)} />;
}
