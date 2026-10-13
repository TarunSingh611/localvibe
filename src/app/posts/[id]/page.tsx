import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getPostById } from '@/lib/posts';
import { getCurrentUser } from '@/lib/session';
import { POST_TYPE_META } from '@/components/posts/postMeta';
import PostDetailClient from './PostDetailClient';

const loadPost = cache(async (id: string) => {
  const viewer = await getCurrentUser();
  return getPostById(id, viewer?._id);
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await loadPost(id);
  if (!post) return { title: 'Post not found' };
  const title = `${POST_TYPE_META[post.type].label} in ${post.place.label}`;
  const description = post.text.slice(0, 160);
  return {
    title,
    description,
    openGraph: { title, description, images: post.images[0] ? [post.images[0]] : undefined, type: 'article' },
  };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await loadPost(id);
  if (!post) notFound();
  return <PostDetailClient initialPost={post} />;
}
