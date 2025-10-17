'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';
import { ThemeLayout } from '../ThemeLayout';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  createdAt: Timestamp;
};

export const MinimalistHeader: React.FC<{siteName?: string}> = ({ siteName }) => (
    <header className="py-8 px-6">
        <div className="container mx-auto max-w-3xl flex justify-between items-center">
            <Link href="/" className="text-2xl font-semibold font-headline text-foreground">
                {siteName || 'A Minimalist Blog'}
            </Link>
            <nav>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                    Login
                </Link>
            </nav>
        </div>
    </header>
);

export const MinimalistFooter: React.FC = () => (
    <footer className="py-12 px-6 mt-16 border-t">
        <div className="container mx-auto max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                 <p className="font-semibold font-headline text-foreground">A Minimalist Blog</p>
                 <p className="text-xs text-muted-foreground mt-2">&copy; {new Date().getFullYear()} All rights reserved.</p>
            </div>
            <div className="space-y-4">
                <WidgetArea areaName="Footer Column 1" />
            </div>
        </div>
    </footer>
);

export default function HomePage() {
  const firestore = useFirestore();

  const postsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published')
    );
  }, [firestore]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsCollection);
  
  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => {
      const dateA = a.createdAt?.toDate() ?? new Date(0);
      const dateB = b.createdAt?.toDate() ?? new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [posts]);

  if (isLoadingPosts) {
    return <Loading />;
  }

  return (
    <ThemeLayout HeaderComponent={MinimalistHeader} FooterComponent={MinimalistFooter}>
        <div className="mb-12 space-y-8 max-w-3xl mx-auto">
            <WidgetArea areaName="Homepage Content" />
        </div>

        {(!sortedPosts || sortedPosts.length === 0) && (
            <div className="text-center py-16 max-w-3xl mx-auto">
                <p className="text-muted-foreground">No thoughts published yet. The silence is golden.</p>
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
