import type { Metadata } from 'next';
import { getPost, getPosts, getProfile, toPostCard } from '@/lib/content';
import { absolute } from '@/lib/site';
import { BlogIndex, BlogPost } from '../../components/BlogViews';

export const dynamicParams = false;

/** A site of files needs at least one page here to be built: with no article yet, this one says so. */
const EMPTY = 'soon';

export const generateStaticParams = () => {
  const posts = getPosts();
  return posts.length > 0 ? posts.map((post) => ({ slug: post.slug })) : [{ slug: EMPTY }];
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: 'المدونة', robots: { index: false } };
  const url = absolute(`/blog/${post.slug}/`);
  const images = post.cover ? [{ url: absolute(post.cover), width: post.cover_size?.[0], height: post.cover_size?.[1] }] : undefined;
  return {
    title: post.title.ar,
    description: post.summary.ar,
    alternates: { canonical: url },
    openGraph: { type: 'article', title: post.title.ar, description: post.summary.ar, url, publishedTime: post.date, images },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = getProfile();
  const post = getPost(slug);
  if (!post) return <BlogIndex profile={profile} posts={[]} />;

  // what search engines read about the article
  const about = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title.ar,
    description: post.summary.ar,
    datePublished: post.date,
    inLanguage: 'ar',
    mainEntityOfPage: absolute(`/blog/${post.slug}/`),
    image: post.cover ? [absolute(post.cover)] : undefined,
    author: { '@type': 'Person', name: profile.name.ar },
    publisher: { '@type': 'Organization', name: profile.brand, logo: { '@type': 'ImageObject', url: absolute('/brand/gt-themes-avatar.png') } },
  };
  const more = getPosts()
    .filter((other) => other.slug !== post.slug)
    .slice(0, 2)
    .map(toPostCard);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(about).replace(/</g, '\\u003c') }} />
      <BlogPost profile={profile} post={post} more={more} />
    </>
  );
}
