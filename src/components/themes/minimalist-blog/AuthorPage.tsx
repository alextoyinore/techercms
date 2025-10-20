'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { ThemeLayout } from '../ThemeLayout';
import { MinimalistHeader, MinimalistFooter } from './HomePage';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
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
    <ThemeLayout HeaderComponent={MinimalistHeader} FooterComponent={MinimalistFooter}>
        <div className="text-center mb-12 max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold font-headline tracking-tight">Posts by {author?.displayName || 'Author'}</h1>
        </div>

        {!isLoadingPosts && (!sortedPosts || sortedPosts.length === 0) && (
            <div className="text-center py-16 max-w-3xl mx-auto">
                <p className="text-muted-foreground">This author has not published any posts yet.</p>
            </div>
        )}

        <div className="space-y-12 max-w-3xl mx-auto">
            {sortedPosts.map((post) => (
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
    </ThemeLayout>
  );
}
