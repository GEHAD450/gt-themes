import type { Metadata } from 'next';
import { getPosts, getProfile, toPostCard } from '@/lib/content';
import { absolute } from '@/lib/site';
import { BlogIndex } from '../components/BlogViews';

const description = 'مقالات عملية لأصحاب متاجر سلة وزد: مقاسات الصور، إضافة الفيديو، اختيار الثيم، وتجهيز المتجر قبل الانطلاق.';

export const metadata: Metadata = {
  title: 'المدونة',
  description,
  alternates: { canonical: absolute('/blog/') },
  openGraph: { title: 'مدونة GT-THEMES', description, url: absolute('/blog/') },
};

export default function BlogPage() {
  return <BlogIndex profile={getProfile()} posts={getPosts().map(toPostCard)} />;
}
