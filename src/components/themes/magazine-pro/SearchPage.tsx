'use client';
import { useMemo, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

function SearchResults() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const lowercaseQuery = q.toLowerCase();

  // IMPORTANT: Firestore doesn't support native full-text search.
  // This is a simple "starts with" search on the title for demonstration purposes.
  // A real implementation would require a third-party search service like Algolia or Typesense.
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
      <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline tracking-tight lg:text-5xl">Search Results for: "{q}"</h1>
          {posts && posts.length > 0 ? (
              <p className="mt-4 text-lg text-muted-foreground">{posts.length} result{posts.length > 1 ? 's' : ''} found.</p>
          ) : null}
      </div>

      {!isLoadingPosts && (!posts || posts.length === 0) && (
          <div className="text-center py-16">
              <p className="text-muted-foreground">No posts matched your search. Try a different query.</p>
          </div>
      )}

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts?.map((post) => (
              <Card key={post.id} className="flex flex-col overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                   <Link href={`/${post.slug}`} className="block">
                      <div className="relative aspect-video">
                          <Image 
                              src={post.featuredImageUrl || 'https://picsum.photos/seed/placeholder/600/400'} 
                              alt={post.title}
                              fill
                              className="object-cover"
                          />
                      </div>
                  </Link>
                  <CardHeader>
                      <CardTitle className="font-headline text-xl leading-snug">
                          <Link href={`/${post.slug}`}>{post.title}</Link>
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                      <p className="text-muted-foreground line-clamp-3">{post.excerpt}</p>
                  </CardContent>
                  <div className="p-4 pt-0 text-xs text-muted-foreground">
                      <Link href={`/archive/${format(post.createdAt.toDate(), 'yyyy/MM')}`}>
                          <span className="hover:underline">{post.createdAt ? format(post.createdAt.toDate(), 'PP') : 'N/A'}</span>
                      </Link>
                  </div>
              </Card>
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
