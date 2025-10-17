'use client';
import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { CreativeHeader, CreativeFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  excerpt: string;
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
        <h1 className="text-4xl font-bold font-headline tracking-tight">Search Results for: "{q}"</h1>
      </div>

      {!isLoadingPosts && (!posts || posts.length === 0) && (
          <div className="text-center py-16">
              <p className="text-muted-foreground">No projects matched your search term.</p>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts?.map((post) => (
          <Link href={`/${post.slug}`} key={post.id}>
            <div className="block relative aspect-square group overflow-hidden rounded-lg">
              <Image 
                src={post.featuredImageUrl || 'https://picsum.photos/seed/placeholder/600/600'} 
                alt={post.title}
                fill
                className="object-cover w-full h-full transition-transform duration-500 ease-in-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors duration-300 flex items-end p-6">
                <div className="text-white">
                  <h2 className="font-headline text-2xl font-bold">{post.title}</h2>
                  <p className="text-sm opacity-80">{post.excerpt}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <ThemeLayout HeaderComponent={CreativeHeader} FooterComponent={CreativeFooter}>
      <Suspense fallback={<Loading />}>
        <SearchResults />
      </Suspense>
    </ThemeLayout>
  );
}
