'use client';
import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { PublicHeader, PublicFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  slug: string;
  featuredImageUrl: string;
  createdAt: Timestamp;
};

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
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black font-headline tracking-widest uppercase">Search Results: "{q}"</h1>
      </div>

      {!isLoadingPosts && (!posts || posts.length === 0) && (
        <div className="text-center py-16">
            <p className="text-muted-foreground">No looks matched your search term.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts?.map((post) => (
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
    </>
  );
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
