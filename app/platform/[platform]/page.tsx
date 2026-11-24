import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfile, themesOf, toCard } from '@/lib/content';
import { absolute, isPlatform, PLATFORMS } from '@/lib/site';
import { PlatformView } from '../../components/PlatformView';

export const dynamicParams = false;

export const generateStaticParams = () => Object.keys(PLATFORMS).map((platform) => ({ platform }));

export async function generateMetadata({ params }: { params: Promise<{ platform: string }> }): Promise<Metadata> {
  const { platform } = await params;
  if (!isPlatform(platform)) return {};
  const name = PLATFORMS[platform].name.ar;
  return {
    title: `ثيمات ${name}`,
    description: `ثيمات ${name} من GT-THEMES: لكل ثيم شرح مصوّر لأقسامه وإعداداته ومعاينة حيّة.`,
    alternates: { canonical: absolute(`/platform/${platform}/`) },
  };
}

export default async function PlatformPage({ params }: { params: Promise<{ platform: string }> }) {
  const { platform } = await params;
  if (!isPlatform(platform)) notFound();
  return <PlatformView profile={getProfile()} platform={platform} themes={themesOf(platform).map(toCard)} />;
}
