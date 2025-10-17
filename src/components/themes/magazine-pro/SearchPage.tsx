'use client';
import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { MagazineProHeader, MagazineProFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
};

function PostCard({ post }: { post: Post }) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 border-b pb-4">
            {post.featuredImageUrl && (
                <Link href={`/${post.slug}`} className="block sm:w-1/4 shrink-0">
                    <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
                        <Image
                            src={post.featuredImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                </Link>
            )}
            <div>
                <h3 className="font-semibold text-lg leading-tight">
                    <Link href={`/${post.slug}`} className="hover:underline">{post.title}</Link>
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                 <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                    <time className="text-xs text-muted-foreground/70 mt-1 block hover:underline">
                        {format(post.createdAt.toDate(), 'PP')}
                    </time>
                </Link>
            </div>
        </div>
    );
}

function SearchResults() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !q) return null;
    const lowercaseQuery = q.toLowerCase();
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('titleKeywords', 'array-contains', lowercaseQuery)
    );
  }, [firestore, q]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);

  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => (b.createdAt?.toDate() ?? 0) > (a.createdAt?.toDate() ?? 0) ? 1 : -1);
  }, [posts]);

  return (
    <>
      <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline tracking-tight lg:text-5xl">Search Results for: "{q}"</h1>
          {!isLoadingPosts && posts && posts.length > 0 ? (
              <p className="mt-4 text-lg text-muted-foreground">{posts.length} result{posts.length > 1 ? 's' : ''} found.</p>
          ) : null}
      </div>

      {isLoadingPosts && <p className="text-center">Searching...</p>}
      
      {!isLoadingPosts && (!sortedPosts || sortedPosts.length === 0) && (
          <div className="text-center py-16">
              <p className="text-muted-foreground">No posts matched your search. Try a different query.</p>
          </div>
      )}

      <div className="space-y-6">
        {sortedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
        ))}
      </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <ThemeLayout HeaderComponent={MagazineProHeader} FooterComponent={MagazineProFooter}>
      <Suspense fallback={<Loading />}>
        <SearchResults />
      </Suspense>
    </ThemeLayout>
  );
}
