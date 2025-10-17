'use client';
import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { MinimalistHeader, MinimalistFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  createdAt: Timestamp;
};

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
    return <p className="text-center text-muted-foreground">Searching...</p>;
  }

  return (
    <>
        <div className="text-center mb-12 max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Search Results for: "{q}"</h1>
        </div>

        {!isLoadingPosts && (!posts || posts.length === 0) && (
            <div className="text-center py-16 max-w-3xl mx-auto">
                <p className="text-muted-foreground">No posts matched your search.</p>
            </div>
        )}

        <div className="space-y-12 max-w-3xl mx-auto">
            {posts?.map((post) => (
                <article key={post.id}>
                    <header>
                         <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                            <time className="text-sm text-muted-foreground hover:underline">
                                {post.createdAt ? format(post.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A'}
                            </time>
                        </Link>
                        <h2 className="text-3xl font-bold font-headline mt-1">
                            <Link href={`/${post.slug}`} className='hover:text-primary transition-colors'>{post.title}</Link>
                        </h2>
                    </header>
                    <div className="mt-4 text-foreground/80">
                        <p>{post.excerpt}</p>
                    </div>
                    <footer className='mt-4'>
                        <Link href={`/${post.slug}`} className='text-sm font-semibold text-primary hover:underline'>
                            Read more &rarr;
                        </Link>
                    </footer>
                </article>
            ))}
        </div>
    </>
  );
}


export default function SearchPage() {
    return (
        <ThemeLayout HeaderComponent={MinimalistHeader} FooterComponent={MinimalistFooter}>
            <Suspense fallback={<Loading />}>
                <SearchResults />
            </Suspense>
        </ThemeLayout>
    );
}
