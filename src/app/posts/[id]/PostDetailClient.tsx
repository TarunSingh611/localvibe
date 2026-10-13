'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PostCard } from '@/components/posts/PostCard';
import type { PostDTO } from '@/types';

export default function PostDetailClient({ initialPost }: { initialPost: PostDTO }) {
  const router = useRouter();
  const [post, setPost] = useState(initialPost);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 lg:py-8">
      <Link href="/feed" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to feed
      </Link>
      <PostCard
        post={post}
        defaultShowComments
        onUpdate={(_id, patch) => setPost((prev) => ({ ...prev, ...patch }))}
        onDelete={() => router.replace('/feed')}
      />
    </div>
  );
}
