
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type Post = {
  id: string;
  title: string;
  slug: string;
  featuredImageUrl: string;
  excerpt?: string;
  categoryIds?: string[];
  tagIds?: string[];
};

type RelatedPostsProps = {
  currentPost: {
    id: string;
    categoryIds?: string[];
    tagIds?: string[];
  };
};

export const RelatedPosts = ({ currentPost }: RelatedPostsProps) => {
  const firestore = useFirestore();

  const relatedPostsQuery = useMemoFirebase(() => {
    if (!firestore) return null;

    let q = query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('__name__', '!=', currentPost.id)
    );

    const hasCategories = currentPost.categoryIds && currentPost.categoryIds.length > 0;
    
    if (hasCategories) {
      q = query(q, where('categoryIds', 'array-contains-any', currentPost.categoryIds));
    }
    
    return query(q, orderBy('createdAt', 'desc'), limit(3));

  }, [firestore, currentPost.id, currentPost.categoryIds]);

  const { data: posts, isLoading } = useCollection<Post>(relatedPostsQuery);

  if (isLoading) {
    return (
      <div className="my-8">
        <h3 className="text-2xl font-bold font-headline mb-4">You Might Also Like</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-muted h-64 rounded-md"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="my-12">
      <h3 className="text-3xl font-bold font-headline mb-6 text-center">You Might Also Like</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.map(post => (
          <div key={post.id} className="group">
            <Link href={`/${post.slug}`}>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-3">
                <Image
                  src={post.featuredImageUrl || 'https://picsum.photos/seed/related/600/400'}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h4 className="font-semibold text-lg leading-tight group-hover:underline">
                {post.title}
              </h4>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
              )}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};
