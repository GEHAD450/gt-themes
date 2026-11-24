import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfile, themesOf, toCard } from '@/lib/content';
import { isPlatform, PLATFORMS } from '@/lib/site';
import { PlatformView } from '../../components/PlatformView';

export const dynamicParams = false;

export const generateStaticParams = () => Object.keys(PLATFORMS).map((platform) => ({ platform }));

export async function generateMetadata({ params }: { params: Promise<{ platform: string }> }): Promise<Metadata> {
  const { platform } = await params;
  return isPlatform(platform) ? { title: `ثيمات ${PLATFORMS[platform].name.ar}` } : {};
}

export default async function PlatformPage({ params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  if (!isPlatform(platform)) notFound();
  return <PlatformView profile={getProfile()} platform={platform} themes={themesOf(platform).map(toCard)} />;
}
