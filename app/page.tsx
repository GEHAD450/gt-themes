import type { Metadata } from 'next';
import { getPosts, getProfile, getThemes, toCard, toPostCard } from '@/lib/content';
import { absolute } from '@/lib/site';
import { HomeView } from './components/HomeView';

export const metadata: Metadata = { alternates: { canonical: absolute('/') } };

export default function HomePage() {
  return <HomeView profile={getProfile()} themes={getThemes().map(toCard)} posts={getPosts().slice(0, 3).map(toPostCard)} />;
}
