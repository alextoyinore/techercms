'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { PublicHeader, PublicFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  slug: string;
  featuredImageUrl: string;
  tagIds: string[];
  createdAt: Timestamp;
};

export default function TagPage() {
  const firestore = useFirestore();
  const params = useParams();
  const slug = params.slug as string;

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('tagIds', 'array-contains', slug)
    );
  }, [firestore, slug]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);

  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => (b.createdAt?.toDate() ?? 0) > (a.createdAt?.toDate() ?? 0) ? 1 : -1);
  }, [posts]);

  if (isLoadingPosts) {
    return <Loading />;
  }

  return (
    <ThemeLayout HeaderComponent={PublicHeader} FooterComponent={PublicFooter}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black font-headline tracking-widest uppercase">Tag: {slug}</h1>
      </div>

      {!isLoadingPosts && (!sortedPosts || sortedPosts.length === 0) && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No posts found with this tag.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedPosts?.map((post) => (
          <div key={post.id} className="group">
            <div className="relative aspect-[3/4] bg-muted mb-3">
              <Image src={post.featuredImageUrl} alt={post.title} fill className="object-cover" />
            </div>
            <h4 className="font-semibold text-lg leading-tight group-hover:underline mt-1">
              <Link href={`/${post.slug}`}>{post.title}</Link>
            </h4>
          </div>
        ))}
      </div>
    </ThemeLayout>
  );
}
