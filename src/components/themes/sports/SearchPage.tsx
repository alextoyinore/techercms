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
import { cn } from '@/lib/utils';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
};

function PostCard({ post, className, titleSize = 'text-xl' }: { post: Post, className?: string, titleSize?: string }) {
    return (
        <div className={cn("group flex flex-col", className)}>
             {post.featuredImageUrl && (
                <Link href={`/${post.slug}`}>
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        <Image
                            src={post.featuredImageUrl}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                </Link>
            )}
            <div className="py-3 flex-grow flex flex-col">
                <h3 className={cn("font-extrabold font-headline leading-tight group-hover:underline", titleSize)}>
                    <Link href={`/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-grow">{post.excerpt}</p>
                <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                    <time className="text-xs text-muted-foreground/80 mt-2 block hover:underline">
                        {format(post.createdAt.toDate(), 'MMM d, yyyy')}
                    </time>
                </Link>
            </div>
        </div>
    )
}

function SearchResults() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !q) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('title', '>=', q),
      where('title', '<=', q + '\uf8ff'),
      orderBy('title'),
      orderBy('createdAt', 'desc')
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {posts?.map((post) => (
              <PostCard key={post.id} post={post} />
          ))}
      </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <ThemeLayout HeaderComponent={PublicHeader} FooterComponent={PublicFooter} className="bg-background text-foreground font-sans">
      <Suspense fallback={<Loading />}>
        <SearchResults />
      </Suspense>
    </ThemeLayout>
  );
}
