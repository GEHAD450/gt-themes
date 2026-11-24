import { getProfile, getThemes, toCard } from '@/lib/content';
import { HomeView } from './components/HomeView';

export default function HomePage() {
  return <HomeView profile={getProfile()} themes={getThemes().map(toCard)} />;
}
