'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Loading } from '@/components/loading';
import { WidgetArea } from '@/components/widgets/WidgetArea';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  createdAt: Timestamp;
};

type SiteSettings = {
  siteName?: string;
}

function PublicHeader({ siteName }: { siteName?: string }) {
    return (
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
    )
}

function PublicFooter() {
    return (
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
    )
}

export default function HomePage() {
  const firestore = useFirestore();

  const postsCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'posts'),
      where('status', '==', 'published')
    );
  }, [firestore]);
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'site_settings', 'config');
  }, [firestore]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsCollection);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<SiteSettings>(settingsRef);


  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => {
      const dateA = a.createdAt?.toDate() ?? new Date(0);
      const dateB = b.createdAt?.toDate() ?? new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [posts]);

  const isLoading = isLoadingPosts || isLoadingSettings;

  return (
    <div className="bg-background min-h-screen">
        <PublicHeader siteName={settings?.siteName} />
        <main className="container mx-auto py-8 px-6 max-w-3xl">
            {isLoading && <Loading />}

            {!isLoading && (!sortedPosts || sortedPosts.length === 0) && (
                <div className="text-center py-16">
                    <p className="text-muted-foreground">No thoughts published yet. The silence is golden.</p>
                </div>
            )}

            <div className="space-y-12">
                {sortedPosts.map((post) => (
                    <article key={post.id}>
                        <header>
                             <time className="text-sm text-muted-foreground">
                                {post.createdAt ? format(post.createdAt.toDate(), 'MMMM d, yyyy') : 'N/A'}
                            </time>
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
        </main>
        <PublicFooter />
    </div>
  );
}
