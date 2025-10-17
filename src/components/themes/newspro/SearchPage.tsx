'use client';
import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { PublicHeader, PublicFooter } from './HomePage';

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
                <Link href={`/${post.slug}`} className="block sm:w-1/3 shrink-0">
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
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
                <h3 className="font-bold font-headline text-2xl leading-tight">
                    <Link href={`/${post.slug}`} className="hover:underline">{post.title}</Link>
                </h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{post.excerpt}</p>
                 <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                    <time className="text-xs text-muted-foreground/80 mt-2 block hover:underline">
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
  const lowercaseQuery = q.toLowerCase();

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !q) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('title', '>=', q),
      where('title', '<=', q + '\uf8ff')
    );
  }, [firestore, q]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);

  if (isLoadingPosts) {
    return <p className="text-center">Searching...</p>;
  }
  
  return (
    <>
      <div className="mb-8 pb-4 border-b">
          <h1 className="text-3xl font-black font-headline tracking-tight lg:text-4xl">Search Results for: "{q}"</h1>
      </div>

      {!isLoadingPosts && (!posts || posts.length === 0) && (
          <div className="text-center py-16">
              <p className="text-muted-foreground">No posts matched your search term.</p>
          </div>
      )}

      <div className="space-y-6">
          {posts?.map((post) => (
              <PostCard key={post.id} post={post} />
          ))}
      </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <ThemeLayout HeaderComponent={PublicHeader} FooterComponent={PublicFooter}>
      <Suspense fallback={<Loading />}>
        <SearchResults />
      </Suspense>
    </ThemeLayout>
  );
}
