'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { PublicHeader, PublicFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImageUrl: string;
  authorId: string;
  createdAt: Timestamp;
};

type User = {
    id: string;
    displayName?: string;
};

export default function AuthorPage() {
  const firestore = useFirestore();
  const params = useParams();
  const authorId = params.id as string;

  const authorRef = useMemoFirebase(() => {
    if (!firestore || !authorId) return null;
    return doc(firestore, 'users', authorId);
  }, [firestore, authorId]);
  const { data: author, isLoading: isLoadingAuthor } = useDoc<User>(authorRef);

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

  if (isLoadingPosts || isLoadingAuthor) {
    return <Loading />;
  }

  return (
    <ThemeLayout HeaderComponent={PublicHeader} FooterComponent={PublicFooter}>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black font-headline tracking-widest uppercase">{author?.displayName || 'Author'}</h1>
      </div>

      {!isLoadingPosts && (!sortedPosts || sortedPosts.length === 0) && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">This author has not published any posts yet.</p>
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
