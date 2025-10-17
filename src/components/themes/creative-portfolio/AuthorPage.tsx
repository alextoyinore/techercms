'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { CreativeHeader, CreativeFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  authorId: string;
  createdAt: Timestamp;
};

export default function AuthorPage() {
  const firestore = useFirestore();
  const params = useParams();
  const authorId = params.id as string;
  
  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !authorId) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published'),
      where('authorId', '==', authorId)
    );
  }, [firestore, authorId]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);

  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => (b.createdAt?.toDate() ?? 0) > (a.createdAt?.toDate() ?? 0) ? 1 : -1);
  }, [posts]);

  if (isLoadingPosts) {
    return <Loading />;
  }

  return (
    <ThemeLayout HeaderComponent={CreativeHeader} FooterComponent={CreativeFooter}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline tracking-tight">Posts by Author</h1>
        <p className="text-sm text-muted-foreground mt-2">ID: {authorId}</p>
      </div>

      {!isLoadingPosts && (!sortedPosts || sortedPosts.length === 0) && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">This author has not published any posts yet.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPosts.map((post) => (
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
    </ThemeLayout>
  );
}
